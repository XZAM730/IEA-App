import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./server/db";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "iea-secret-key-2026";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health Check
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Online Users Tracking
  const onlineUsers = new Set<string>();

  // Communities: Search
  app.get("/api/communities/search", async (req, res) => {
    const { q } = req.query;
    const communities = await db.prepare('SELECT * FROM communities WHERE name LIKE ? OR description LIKE ? LIMIT 10').all(`%${q}%`, `%${q}%`);
    res.json(communities);
  });

  // News: Search
  app.get("/api/news/search", async (req, res) => {
    const { q } = req.query;
    const news = await db.prepare('SELECT * FROM news WHERE title LIKE ? OR summary LIKE ? LIMIT 10').all(`%${q}%`, `%${q}%`);
    res.json(news);
  });

  // Online Status: Get
  app.get("/api/users/online", async (req, res) => {
    res.json({ onlineCount: onlineUsers.size, onlineIds: Array.from(onlineUsers) });
  });

  // --- API Routes ---

  // Auth: Google OAuth URL
  app.get("/api/auth/google/url", async (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  // Auth: Google Callback
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenData.access_token) {
        throw new Error("Failed to get access token");
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json();

      let user = await db.prepare('SELECT id FROM users WHERE google_id = ? OR LOWER(email) = ?').get(userData.id, userData.email?.toLowerCase()) as any;
      
      let userId;
      if (!user) {
        userId = uuidv4();
        const idNumber = `IEA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
        
        await db.prepare('INSERT INTO users (id, name, email, password, id_number, joined_date, google_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          userId, userData.name, userData.email?.toLowerCase(), '', idNumber, joinedDate, userData.id, userData.picture
        );
      } else {
        userId = user.id;
        await db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?').run(userData.id, userData.picture, userId);
      }

      const token = jwt.sign({ id: userId }, JWT_SECRET);

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    
    try {
      // Check if user already exists
      const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const idNumber = `IEA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      
      await db.prepare('INSERT INTO users (id, name, email, password, id_number, joined_date) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, name, normalizedEmail, hashedPassword, idNumber, joinedDate
      );
      
      const token = jwt.sign({ id }, JWT_SECRET);
      res.json({ token, user: { id, name, email: normalizedEmail, idNumber, joinedDate, is_verified: 0, card_theme: 'classic', avatar_url: null, bio: null } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await db.prepare('SELECT id, name, email, id_number as idNumber, joined_date as joinedDate, is_verified, card_theme, avatar_url, bio, skills FROM users WHERE id = ?').get(decoded.id) as any;
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    
    try {
      const user = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;
      if (!user) {
        console.log(`Login failed: User not found for email ${normalizedEmail}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Login failed: Password mismatch for email ${normalizedEmail}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      res.json({ token, user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        idNumber: user.id_number, 
        joinedDate: user.joined_date,
        is_verified: user.is_verified,
        card_theme: user.card_theme,
        avatar_url: user.avatar_url,
        bio: user.bio,
        skills: user.skills
      } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Posts: Get for user
  app.get("/api/users/:userId/posts", async (req, res) => {
    const posts = await db.prepare(`
      SELECT p.*, u.name as author, u.avatar_url as authorAvatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.user_id = ?
      ORDER BY p.timestamp DESC
    `).all(req.params.userId);
    res.json(posts);
  });

  // Posts: Get all
  app.get("/api/posts", async (req, res) => {
    const posts = await db.prepare(`
      SELECT p.*, u.name as author, u.avatar_url as authorAvatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.timestamp DESC
    `).all();
    res.json(posts);
  });

  // News: Get all
  app.get("/api/news", async (req, res) => {
    const news = await db.prepare('SELECT * FROM news ORDER BY timestamp DESC').all();
    res.json(news);
  });

  // Users: Search
  app.get("/api/users/search", async (req, res) => {
    const { q } = req.query;
    const users = await db.prepare('SELECT id, name, id_number, avatar_url FROM users WHERE name LIKE ? OR id_number LIKE ? LIMIT 10').all(`%${q}%`, `%${q}%`);
    res.json(users);
  });

  // Users: Get all
  app.get("/api/users", async (req, res) => {
    const users = await db.prepare('SELECT id, name, id_number, avatar_url FROM users').all();
    res.json(users);
  });

  // Messages: Get conversation
  app.get("/api/messages/:userId", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const myId = decoded.id;
      const otherId = req.params.userId;
      
      const messages = await db.prepare(`
        SELECT m.*, u.name as senderName, u.avatar_url as senderAvatar 
        FROM messages m 
        JOIN users u ON m.sender_id = u.id 
        WHERE (m.sender_id = ? AND m.receiver_id = ?) 
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp ASC
      `).all(myId, otherId, otherId, myId);
      
      res.json(messages);
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Profile: Get stats
  app.get("/api/users/:id/stats", async (req, res) => {
    const { id } = req.params;
    const user = await db.prepare('SELECT name, id_number as idNumber, joined_date as joinedDate, is_verified, card_theme, avatar_url, bio, skills FROM users WHERE id = ?').get(id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const posts = await db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(id) as any;
    const followers = await db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(id) as any;
    const following = await db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(id) as any;
    res.json({ ...user, posts: posts.count, followers: followers.count, following: following.count });
  });

  // Profile: Update
  app.put("/api/users/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { name, bio, avatar_url, card_theme, skills } = req.body;
      
      await db.prepare('UPDATE users SET name = ?, bio = ?, avatar_url = ?, card_theme = ?, skills = ? WHERE id = ?')
        .run(name, bio, avatar_url, card_theme, skills, decoded.id);
      
      const user = await db.prepare('SELECT id, name, email, id_number as idNumber, joined_date as joinedDate, is_verified, card_theme, avatar_url, bio, skills FROM users WHERE id = ?').get(decoded.id) as any;
      res.json({ user });
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Comments: Get for post
  app.get("/api/posts/:postId/comments", async (req, res) => {
    const comments = await db.prepare(`
      SELECT c.*, u.name as author 
      FROM comments c JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? ORDER BY c.timestamp ASC
    `).all(req.params.postId);
    res.json(comments);
  });

  // Bookmarks: Get for user
  app.get("/api/users/:userId/bookmarks", async (req, res) => {
    const bookmarks = await db.prepare(`
      SELECT n.* FROM news n JOIN bookmarks b ON n.id = b.news_id WHERE b.user_id = ?
    `).all(req.params.userId);
    res.json(bookmarks);
  });

  // Notifications: Get for user
  app.get("/api/notifications/:userId", async (req, res) => {
    const notifications = await db.prepare(`
      SELECT n.*, u.name as from_name, u.avatar_url as from_avatar_url
      FROM notifications n JOIN users u ON n.from_user_id = u.id 
      WHERE n.user_id = ? ORDER BY n.timestamp DESC LIMIT 20
    `).all(req.params.userId);
    res.json(notifications);
  });

  // Notifications: Mark as read
  app.post("/api/notifications/:userId/read", async (req, res) => {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.params.userId);
    res.json({ success: true });
  });

  // Users: Update theme
  app.post("/api/users/:id/theme", async (req, res) => {
    const { theme } = req.body;
    await db.prepare('UPDATE users SET card_theme = ? WHERE id = ?').run(theme, req.params.id);
    res.json({ success: true });
  });

  // Communities: Get all
  app.get("/api/communities", async (req, res) => {
    const communities = await db.prepare('SELECT * FROM communities').all();
    res.json(communities);
  });

  // Communities: Get members
  app.get("/api/communities/:id/members", async (req, res) => {
    const members = await db.prepare(`
      SELECT u.id, u.name, u.id_number FROM users u 
      JOIN community_members cm ON u.id = cm.user_id 
      WHERE cm.community_id = ?
    `).all(req.params.id);
    res.json(members);
  });

  // Users: Update verified status
  app.post("/api/users/:id/verify", async (req, res) => {
    const { isVerified } = req.body;
    await db.prepare('UPDATE users SET is_verified = ? WHERE id = ?').run(isVerified ? 1 : 0, req.params.id);
    const user = await db.prepare('SELECT id, name, id_number, joined_date, is_verified, card_theme FROM users WHERE id = ?').get(req.params.id);
    io.emit("user:profile_updated", user);
    res.json({ success: true });
  });

  // --- WebSocket Logic ---
  io.on("connection", (socket) => {
    let currentUserId: string | null = null;

    socket.on("user:online", (userId) => {
      currentUserId = userId;
      onlineUsers.add(userId);
      io.emit("user:status_change", { userId, status: "online", onlineCount: onlineUsers.size });
    });

    socket.on("chat:typing", async (data) => {
      const { userId, isTyping } = data;
      socket.broadcast.emit("chat:typing_update", { userId, isTyping });
    });

    console.log("User connected:", socket.id);

    // News: Admin push (simulated)
    socket.on("news:create", async (data) => {
      const { title, summary, category } = data;
      const id = uuidv4();
      await db.prepare('INSERT INTO news (id, title, summary, category) VALUES (?, ?, ?, ?)').run(id, title, summary, category);
      const newsItem = await db.prepare('SELECT * FROM news WHERE id = ?').get(id);
      io.emit("news:new", newsItem);
    });

    socket.on("community:join", async (data) => {
      const { userId, communityId } = data;
      try {
        await db.prepare('INSERT INTO community_members (community_id, user_id) VALUES (?, ?)').run(communityId, userId);
        await db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(communityId);
        const community = await db.prepare('SELECT * FROM communities WHERE id = ?').get(communityId);
        io.emit("community:update", community);
      } catch (e) {
        // Already a member
      }
    });

    socket.on("user:update_profile", async (data) => {
      const { userId, name } = data;
      await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
      const user = await db.prepare('SELECT id, name, id_number, joined_date, is_verified, card_theme FROM users WHERE id = ?').get(userId);
      io.emit("user:profile_updated", user);
    });

    socket.on("post:delete", async (data) => {
      const { userId, postId } = data;
      const post = await db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      if (post && post.user_id === userId) {
        await db.prepare('DELETE FROM likes WHERE post_id = ?').run(postId);
        await db.prepare('DELETE FROM comments WHERE post_id = ?').run(postId);
        await db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
        io.emit("post:deleted", postId);
      }
    });

    socket.on("post:update", async (data) => {
      const { userId, postId, content } = data;
      const post = await db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      if (post && post.user_id === userId) {
        await db.prepare('UPDATE posts SET content = ? WHERE id = ?').run(content, postId);
        const updatedPost = await db.prepare(`
          SELECT p.*, u.name as author, 
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
          FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
        `).get(postId);
        io.emit("post:updated", updatedPost);
      }
    });

    socket.on("post:create", async (data) => {
      const { userId, content, media_url, media_type } = data;
      const id = uuidv4();
      await db.prepare('INSERT INTO posts (id, user_id, content, media_url, media_type) VALUES (?, ?, ?, ?, ?)').run(id, userId, content, media_url || null, media_type || null);
      
      const post = await db.prepare(`
        SELECT p.*, u.name as author, u.avatar_url as authorAvatar, 0 as likes, 0 as comments 
        FROM posts p JOIN users u ON p.user_id = u.id 
        WHERE p.id = ?
      `).get(id);
      
      io.emit("post:new", post);
    });

    socket.on("post:like", async (data) => {
      const { userId, postId } = data;
      const post = await db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      
      try {
        const notifId = uuidv4();
        await db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
        if (post && post.user_id !== userId) {
          await db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, post_id) VALUES (?, ?, ?, ?, ?)').run(
            notifId, post.user_id, userId, 'like', postId
          );
          const notif = await db.prepare(`
            SELECT n.*, u.name as from_name, u.avatar_url as from_avatar_url
            FROM notifications n JOIN users u ON n.from_user_id = u.id 
            WHERE n.id = ?
          `).get(notifId);
          io.emit("notification:new", notif);
        }
      } catch (e) {
        await db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
      }
      const likes = await db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId) as any;
      io.emit("post:like_update", { postId, likes: likes.count });
    });

    socket.on("post:comment", async (data) => {
      const { userId, postId, content } = data;
      const id = uuidv4();
      await db.prepare('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, postId, userId, content);
      
      const comment = await db.prepare(`
        SELECT c.*, u.name as author FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
      `).get(id);
      
      const post = await db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      if (post && post.user_id !== userId) {
        const notifId = uuidv4();
        await db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, post_id) VALUES (?, ?, ?, ?, ?)').run(
          notifId, post.user_id, userId, 'comment', postId
        );
        const notif = await db.prepare(`
          SELECT n.*, u.name as from_name, u.avatar_url as from_avatar_url
          FROM notifications n JOIN users u ON n.from_user_id = u.id 
          WHERE n.id = ?
        `).get(notifId);
        io.emit("notification:new", notif);
      }
      
      io.emit("post:comment_new", { postId, comment });
    });

    socket.on("user:follow", async (data) => {
      const { followerId, followingId } = data;
      try {
        const notifId = uuidv4();
        await db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);
        await db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type) VALUES (?, ?, ?, ?)').run(
          notifId, followingId, followerId, 'follow'
        );
        const notif = await db.prepare(`
          SELECT n.*, u.name as from_name, u.avatar_url as from_avatar_url
          FROM notifications n JOIN users u ON n.from_user_id = u.id 
          WHERE n.id = ?
        `).get(notifId);
        io.emit("notification:new", notif);
      } catch (e) {
        await db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId);
      }
      io.emit("user:follow_update", { followerId, followingId });
    });

    socket.on("news:bookmark", async (data) => {
      const { userId, newsId } = data;
      try {
        await db.prepare('INSERT INTO bookmarks (user_id, news_id) VALUES (?, ?)').run(userId, newsId);
      } catch (e) {
        await db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND news_id = ?').run(userId, newsId);
      }
    });

    socket.on("message:send", async (data) => {
      const { senderId, receiverId, text, media_url, media_type } = data;
      const id = uuidv4();
      await db.prepare('INSERT INTO messages (id, sender_id, receiver_id, text, media_url, media_type) VALUES (?, ?, ?, ?, ?, ?)').run(id, senderId, receiverId, text, media_url || null, media_type || null);
      
      const sender = await db.prepare('SELECT name, avatar_url FROM users WHERE id = ?').get(senderId) as any;
      const msg = { 
        id, 
        senderId, 
        receiverId, 
        text, 
        media_url,
        media_type,
        senderName: sender?.name,
        senderAvatar: sender?.avatar_url,
        timestamp: new Date().toISOString() 
      };
      io.emit("message:new", msg);
    });

    socket.on("live:start", async (data) => {
      // Broadcast that a user started a live stream
      io.emit("live:started", data);
      io.emit("live:viewers", 1); // Mock viewers
    });

    socket.on("live:end", async (data) => {
      io.emit("live:ended", data);
    });

    socket.on("live:message_send", async (data) => {
      io.emit("live:message", data);
    });

    socket.on("disconnect", () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        io.emit("user:status_change", { userId: currentUserId, status: "offline", onlineCount: onlineUsers.size });
      }
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.resolve(__dirname, "dist");
  const hasDist = fs.existsSync(distPath);

  if (!isProduction && !hasDist) {
    console.log("Starting in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Starting in PRODUCTION mode. Serving static files from: ${distPath}`);
    
    if (!hasDist) {
      console.error("CRITICAL ERROR: 'dist' folder not found! Deployment will fail to serve the frontend.");
    }
    
    app.use(express.static(distPath));
    
    // API 404 handler
    app.use("/api/*", (req, res) => {
      res.status(404).json({ error: "API route not found" });
    });

    // SPA fallback
    app.get("*", async (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Frontend build not found. Please ensure 'npm run build' was successful.");
      }
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  console.log(`Attempting to start server on port ${PORT}...`);
  
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`IEA Server is live on http://0.0.0.0:${PORT}`);
  });
  
  return app;
}

startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
