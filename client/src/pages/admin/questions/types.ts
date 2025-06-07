// Types for Questions Management System

export interface Question {
  id: number;
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  categoryId?: number;
  subcategoryId?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFormData {
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  categoryId: number | null;
  subcategoryId: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
}

export interface QuestionDisplay extends Question {
  categoryName?: string;
  subcategoryName?: string;
  // Add missing properties that might be accessed
  answer?: string;
  imageUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Subcategory {
  id: number;
  name: string;
  parentId: number;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface QuestionFilters {
  categoryId?: number;
  subcategoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
}

export interface QuestionStats {
  totalQuestions: number;
  activeQuestions: number;
  questionsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionsByCategory: Array<{
    categoryId: number | null;
    count: number;
  }>;
}

export interface CreateQuestionData {
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  categoryId?: number;
  subcategoryId?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {
  id: number;
}

export interface BulkOperation {
  action: 'delete' | 'activate' | 'deactivate' | 'update_difficulty' | 'update_category';
  questionIds: number[];
  data?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page?: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchFilters {
  text?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'active' | 'inactive' | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: 'text' | 'difficulty' | 'points' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface FormErrors {
  [key: string]: string | string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}
