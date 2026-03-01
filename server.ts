import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./server/db";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "iea-secret-key-2026";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- API Routes ---

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    
    try {
      // Check if user already exists
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const idNumber = `IEA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      
      db.prepare('INSERT INTO users (id, name, email, password, id_number, joined_date) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, name, normalizedEmail, hashedPassword, idNumber, joinedDate
      );
      
      const token = jwt.sign({ id }, JWT_SECRET);
      res.json({ token, user: { id, name, email: normalizedEmail, idNumber, joinedDate, is_verified: 0, card_theme: 'classic' } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.prepare('SELECT id, name, email, id_number as idNumber, joined_date as joinedDate, is_verified, card_theme FROM users WHERE id = ?').get(decoded.id) as any;
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
      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;
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
        card_theme: user.card_theme
      } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Posts: Get all
  app.get("/api/posts", (req, res) => {
    const posts = db.prepare(`
      SELECT p.*, u.name as author, 
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
      0 as comments
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.timestamp DESC
    `).all();
    res.json(posts);
  });

  // News: Get all
  app.get("/api/news", (req, res) => {
    const news = db.prepare('SELECT * FROM news ORDER BY timestamp DESC').all();
    res.json(news);
  });

  // Users: Search
  app.get("/api/users/search", (req, res) => {
    const { q } = req.query;
    const users = db.prepare('SELECT id, name, id_number FROM users WHERE name LIKE ? OR id_number LIKE ? LIMIT 10').all(`%${q}%`, `%${q}%`);
    res.json(users);
  });

  // Profile: Get stats
  app.get("/api/users/:id/stats", (req, res) => {
    const { id } = req.params;
    const posts = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(id) as any;
    const followers = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(id) as any;
    const following = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(id) as any;
    res.json({ posts: posts.count, followers: followers.count, following: following.count });
  });

  // Comments: Get for post
  app.get("/api/posts/:postId/comments", (req, res) => {
    const comments = db.prepare(`
      SELECT c.*, u.name as author 
      FROM comments c JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? ORDER BY c.timestamp ASC
    `).all(req.params.postId);
    res.json(comments);
  });

  // Bookmarks: Get for user
  app.get("/api/users/:userId/bookmarks", (req, res) => {
    const bookmarks = db.prepare(`
      SELECT n.* FROM news n JOIN bookmarks b ON n.id = b.news_id WHERE b.user_id = ?
    `).all(req.params.userId);
    res.json(bookmarks);
  });

  // Notifications: Get for user
  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare(`
      SELECT n.*, u.name as from_name 
      FROM notifications n JOIN users u ON n.from_user_id = u.id 
      WHERE n.user_id = ? ORDER BY n.timestamp DESC LIMIT 20
    `).all(req.params.userId);
    res.json(notifications);
  });

  // Notifications: Mark as read
  app.post("/api/notifications/:userId/read", (req, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.params.userId);
    res.json({ success: true });
  });

  // Users: Update theme
  app.post("/api/users/:id/theme", (req, res) => {
    const { theme } = req.body;
    db.prepare('UPDATE users SET card_theme = ? WHERE id = ?').run(theme, req.params.id);
    res.json({ success: true });
  });

  // Communities: Get all
  app.get("/api/communities", (req, res) => {
    const communities = db.prepare('SELECT * FROM communities').all();
    res.json(communities);
  });

  // Communities: Get members
  app.get("/api/communities/:id/members", (req, res) => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.id_number FROM users u 
      JOIN community_members cm ON u.id = cm.user_id 
      WHERE cm.community_id = ?
    `).all(req.params.id);
    res.json(members);
  });

  // Users: Update verified status
  app.post("/api/users/:id/verify", (req, res) => {
    const { isVerified } = req.body;
    db.prepare('UPDATE users SET is_verified = ? WHERE id = ?').run(isVerified ? 1 : 0, req.params.id);
    const user = db.prepare('SELECT id, name, id_number, joined_date, is_verified, card_theme FROM users WHERE id = ?').get(req.params.id);
    io.emit("user:profile_updated", user);
    res.json({ success: true });
  });

  // --- WebSocket Logic ---
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // News: Admin push (simulated)
    socket.on("news:create", (data) => {
      const { title, summary, category } = data;
      const id = uuidv4();
      db.prepare('INSERT INTO news (id, title, summary, category) VALUES (?, ?, ?, ?)').run(id, title, summary, category);
      const newsItem = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
      io.emit("news:new", newsItem);
    });

    socket.on("community:join", (data) => {
      const { userId, communityId } = data;
      try {
        db.prepare('INSERT INTO community_members (community_id, user_id) VALUES (?, ?)').run(communityId, userId);
        db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(communityId);
        const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(communityId);
        io.emit("community:update", community);
      } catch (e) {
        // Already a member
      }
    });

    socket.on("user:update_profile", (data) => {
      const { userId, name } = data;
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
      const user = db.prepare('SELECT id, name, id_number, joined_date, is_verified, card_theme FROM users WHERE id = ?').get(userId);
      io.emit("user:profile_updated", user);
    });

    socket.on("post:delete", (data) => {
      const { userId, postId } = data;
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      if (post && post.user_id === userId) {
        db.prepare('DELETE FROM likes WHERE post_id = ?').run(postId);
        db.prepare('DELETE FROM comments WHERE post_id = ?').run(postId);
        db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
        io.emit("post:deleted", postId);
      }
    });

    socket.on("post:update", (data) => {
      const { userId, postId, content } = data;
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      if (post && post.user_id === userId) {
        db.prepare('UPDATE posts SET content = ? WHERE id = ?').run(content, postId);
        const updatedPost = db.prepare(`
          SELECT p.*, u.name as author, 
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
          FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
        `).get(postId);
        io.emit("post:updated", updatedPost);
      }
    });

    socket.on("post:create", (data) => {
      const { userId, content } = data;
      const id = uuidv4();
      db.prepare('INSERT INTO posts (id, user_id, content) VALUES (?, ?, ?)').run(id, userId, content);
      
      const post = db.prepare(`
        SELECT p.*, u.name as author, 0 as likes, 0 as comments 
        FROM posts p JOIN users u ON p.user_id = u.id 
        WHERE p.id = ?
      `).get(id);
      
      io.emit("post:new", post);
    });

    socket.on("post:like", (data) => {
      const { userId, postId } = data;
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      
      try {
        db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
        if (post && post.user_id !== userId) {
          db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, post_id) VALUES (?, ?, ?, ?, ?)').run(
            uuidv4(), post.user_id, userId, 'like', postId
          );
        }
      } catch (e) {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
      }
      const likes = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId) as any;
      io.emit("post:like_update", { postId, likes: likes.count });
    });

    socket.on("post:comment", (data) => {
      const { userId, postId, content } = data;
      const id = uuidv4();
      db.prepare('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, postId, userId, content);
      
      const comment = db.prepare(`
        SELECT c.*, u.name as author FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
      `).get(id);
      
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as any;
      if (post && post.user_id !== userId) {
        db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type, post_id) VALUES (?, ?, ?, ?, ?)').run(
          uuidv4(), post.user_id, userId, 'comment', postId
        );
      }
      
      io.emit("post:comment_new", { postId, comment });
    });

    socket.on("user:follow", (data) => {
      const { followerId, followingId } = data;
      try {
        db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);
        db.prepare('INSERT INTO notifications (id, user_id, from_user_id, type) VALUES (?, ?, ?, ?)').run(
          uuidv4(), followingId, followerId, 'follow'
        );
      } catch (e) {
        db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId);
      }
      io.emit("user:follow_update", { followerId, followingId });
    });

    socket.on("news:bookmark", (data) => {
      const { userId, newsId } = data;
      try {
        db.prepare('INSERT INTO bookmarks (user_id, news_id) VALUES (?, ?)').run(userId, newsId);
      } catch (e) {
        db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND news_id = ?').run(userId, newsId);
      }
    });

    socket.on("message:send", (data) => {
      const { senderId, receiverId, text } = data;
      const id = uuidv4();
      db.prepare('INSERT INTO messages (id, sender_id, receiver_id, text) VALUES (?, ?, ?, ?)').run(id, senderId, receiverId, text);
      const msg = { id, senderId, receiverId, text, timestamp: new Date().toISOString() };
      io.emit("message:new", msg);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  console.log(`Attempting to start server on port ${PORT}...`);
  
  if (process.env.NODE_ENV !== "production") {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`IEA Server is live on http://0.0.0.0:${PORT}`);
    });
  } else {
    // In production (like Railway), we always listen on the provided PORT
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`IEA Production Server is live on port ${PORT}`);
    });
  }
  
  return app;
}

export default startServer();
