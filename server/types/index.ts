// Database Models
export interface User {
  id: number;
  username: string;
  password: string;
  created_at: Date;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color?: string | null;
  created_at: Date;
  note_count?: number;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content?: string | null;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  is_favorite: boolean;
  tags?: Tag[];
}

export interface NoteTag {
  note_id: number;
  tag_id: number;
  user_id: number;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  completed: boolean;
  due_date?: Date | null;
  priority: 'low' | 'medium' | 'high';
  note_id?: number | null;
  created_at: Date;
  updated_at: Date;
  recurring_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurring_interval: number;
  reminder?: Date | null;
  note_title?: string | null;
}

// Request/Response types
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title: string;
  content?: string;
  tags?: string[];
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  noteId?: number;
  recurringType?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurringInterval?: number;
  reminder?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  noteId?: number;
  recurringType?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurringInterval?: number;
  reminder?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  due_today: number;
  overdue: number;
  upcoming: number;
}

// JWT Payload
export interface JWTPayload {
  id: number;
  username: string;
}

// Express Request with user
export interface AuthenticatedRequest extends Express.Request {
  user: {
    id: number;
    username: string;
  };
}



