import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || 'iea.db';

// Ensure the directory for the database exists
const dbDir = path.dirname(dbPath);
if (dbDir !== '.' && !fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  } catch (err) {
    console.error(`Failed to create database directory ${dbDir}:`, err);
  }
}

console.log(`Initializing database at: ${dbPath}`);
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    id_number TEXT UNIQUE NOT NULL,
    joined_date TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    card_theme TEXT DEFAULT 'classic', -- 'classic', 'mesh', 'geometric'
    avatar_url TEXT,
    bio TEXT
  );
`);

// Migration: Add columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasAvatarUrl = tableInfo.some(col => col.name === 'avatar_url');
const hasBio = tableInfo.some(col => col.name === 'bio');
const hasSkills = tableInfo.some(col => col.name === 'skills');
const hasGoogleId = tableInfo.some(col => col.name === 'google_id');

if (!hasAvatarUrl) {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
}
if (!hasBio) {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
}
if (!hasSkills) {
  db.exec("ALTER TABLE users ADD COLUMN skills TEXT");
}
if (!hasGoogleId) {
  db.exec("ALTER TABLE users ADD COLUMN google_id TEXT");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

const postsTableInfo = db.prepare("PRAGMA table_info(posts)").all() as any[];
const hasMediaUrl = postsTableInfo.some(col => col.name === 'media_url');
const hasMediaType = postsTableInfo.some(col => col.name === 'media_type');

if (!hasMediaUrl) {
  db.exec("ALTER TABLE posts ADD COLUMN media_url TEXT");
}
if (!hasMediaType) {
  db.exec("ALTER TABLE posts ADD COLUMN media_type TEXT");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    text TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
`);

const messagesTableInfo = db.prepare("PRAGMA table_info(messages)").all() as any[];
const hasMessageMediaUrl = messagesTableInfo.some(col => col.name === 'media_url');
const hasMessageMediaType = messagesTableInfo.some(col => col.name === 'media_type');

if (!hasMessageMediaUrl) {
  db.exec("ALTER TABLE messages ADD COLUMN media_url TEXT");
}
if (!hasMessageMediaType) {
  db.exec("ALTER TABLE messages ADD COLUMN media_type TEXT");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    PRIMARY KEY(follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL,
    news_id TEXT NOT NULL,
    PRIMARY KEY(user_id, news_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(news_id) REFERENCES news(id)
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
    FOREIGN KEY(community_id) REFERENCES communities(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'like', 'comment', 'follow'
    post_id TEXT,
    is_read INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(from_user_id) REFERENCES users(id)
  );
`);

// Seed communities
const commCount = db.prepare('SELECT COUNT(*) as count FROM communities').get() as { count: number };
if (commCount.count === 0) {
  const insertComm = db.prepare('INSERT INTO communities (id, name, description) VALUES (?, ?, ?)');
  insertComm.run('c1', 'IEA Developers', 'Official hub for IEA platform developers.');
  insertComm.run('c2', 'Digital Identity Global', 'Discussing the future of digital sovereignty.');
  insertComm.run('c3', 'Minimalist Design', 'A space for monochromatic and minimalist enthusiasts.');
}

// Seed some news if empty
const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number };
if (newsCount.count === 0) {
  const insertNews = db.prepare('INSERT INTO news (id, title, summary, category) VALUES (?, ?, ?, ?)');
  insertNews.run('n1', 'The Rise of Digital Sovereignty', 'How decentralized identity systems are reshaping the global internet landscape.', 'TECHNOLOGY');
  insertNews.run('n2', 'Global Economic Shift 2026', 'New reports suggest a major pivot in international trade agreements.', 'ECONOMY');
  insertNews.run('n3', 'Sustainable Architecture Awards', 'Minimalist designs take center stage at the annual design summit.', 'DESIGN');
}

export default db;
