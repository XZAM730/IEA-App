export interface User {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  joinedDate: string;
  avatar?: string;
}

export interface Post {
  id: string;
  author: string;
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
