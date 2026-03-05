import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:oi4x2e5HbL7HXJJ9@db.qmieqbjlckdxkifcdcrl.supabase.co:5432/postgres';

console.log(`Initializing PostgreSQL database connection...`);
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Helper to convert SQLite ? parameters to PostgreSQL $1, $2, etc.
function convertSql(sql: string) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

// Create a wrapper that mimics the synchronous better-sqlite3 API but returns Promises.
// This allows us to easily migrate server.ts by just adding `await` to db calls.
const db = {
  prepare: (sql: string) => {
    const pgSql = convertSql(sql);
    return {
      get: async (...params: any[]) => {
        const res = await pool.query(pgSql, params);
        return res.rows[0];
      },
      all: async (...params: any[]) => {
        const res = await pool.query(pgSql, params);
        return res.rows;
      },
      run: async (...params: any[]) => {
        const res = await pool.query(pgSql, params);
        return { changes: res.rowCount };
      }
    };
  },
  exec: async (sql: string) => {
    return pool.query(sql);
  }
};

// Initialize tables asynchronously
async function initDb() {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        id_number TEXT UNIQUE NOT NULL,
        joined_date TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        card_theme TEXT DEFAULT 'classic',
        avatar_url TEXT,
        bio TEXT,
        skills TEXT,
        google_id TEXT
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        media_url TEXT,
        media_type TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        text TEXT NOT NULL,
        media_url TEXT,
        media_type TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS likes (
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        PRIMARY KEY(user_id, post_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        PRIMARY KEY(follower_id, following_id),
        FOREIGN KEY(follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(following_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        category TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id TEXT NOT NULL,
        news_id TEXT NOT NULL,
        PRIMARY KEY(user_id, news_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(news_id) REFERENCES news(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        member_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS community_members (
        community_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY(community_id, user_id),
        FOREIGN KEY(community_id) REFERENCES communities(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        from_user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        post_id TEXT,
        is_read INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(from_user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Seed communities
    const commCount = await db.prepare('SELECT COUNT(*) as count FROM communities').get() as { count: string | number };
    if (Number(commCount.count) === 0) {
      const insertComm = db.prepare('INSERT INTO communities (id, name, description) VALUES (?, ?, ?)');
      await insertComm.run('c1', 'IEA Developers', 'Official hub for IEA platform developers.');
      await insertComm.run('c2', 'Digital Identity Global', 'Discussing the future of digital sovereignty.');
      await insertComm.run('c3', 'Minimalist Design', 'A space for monochromatic and minimalist enthusiasts.');
    }

    // Seed some news if empty
    const newsCount = await db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: string | number };
    if (Number(newsCount.count) === 0) {
      const insertNews = db.prepare('INSERT INTO news (id, title, summary, category) VALUES (?, ?, ?, ?)');
      await insertNews.run('n1', 'The Rise of Digital Sovereignty', 'How decentralized identity systems are reshaping the global internet landscape.', 'TECHNOLOGY');
      await insertNews.run('n2', 'Global Economic Shift 2026', 'New reports suggest a major pivot in international trade agreements.', 'ECONOMY');
      await insertNews.run('n3', 'Sustainable Architecture Awards', 'Minimalist designs take center stage at the annual design summit.', 'DESIGN');
    }
    
    console.log("PostgreSQL database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL database:", err);
  }
}

initDb();

export default db;
