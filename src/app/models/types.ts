export interface User {
  username: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Message {
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
  vector?: string | null;
}

export interface CreateBookCommand {
  title: string;
  author: string;
  content: string;
}
