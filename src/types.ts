export interface User {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  joinedDate: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_verified?: number;
  card_theme?: string;
}

export interface Post {
  id: string;
  author: string;
  authorAvatar?: string | null;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  isSaved?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}
