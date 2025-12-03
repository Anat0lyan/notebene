// Database Models
export interface User {
  id: number;
  username: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string | null;
  note_count?: number;
}

export interface Note {
  id: number;
  title: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_favorite: boolean;
  tags?: Tag[];
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  completed: boolean;
  due_date?: string | null;
  priority: 'low' | 'medium' | 'high';
  note_id?: number | null;
  note_title?: string | null;
}

export interface TaskStats {
  total: number;
  completed: number;
  due_today: number;
  overdue: number;
  upcoming: number;
}

// API Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
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

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  noteId?: number | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  noteId?: number | null;
}

// Sort options
export type SortField = 'updated_at' | 'created_at' | 'title';
export type SortOrder = 'ASC' | 'DESC';

// Filter options
export type TaskFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'pending';

