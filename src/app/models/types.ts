export interface User {
  username: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Message {
  sender: 'user' | 'agent' | 'admin';
  content: string;
  timestamp: Date;
  feedback?: 'up' | 'down';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
  vector?: string | null;
  source_format?: string;
  filename?: string | null;
  chunk_count?: number;
  ingestion_status?: string;
}

export interface CreateBookCommand {
  title: string;
  author: string;
  content: string;
}

export interface UpdateBookCommand {
  title?: string;
  author?: string;
  content?: string;
}
