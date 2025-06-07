// أنواع البيانات للأسئلة - نظام مبسط
// filepath: d:\DigitalDashboard\server\types\question-types.ts

export interface SimpleQuestion {
  id?: number;
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  categoryId: number;
  subcategoryId?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionFilters {
  categoryId?: number;
  subcategoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  search?: string;
  isActive?: boolean;
}

export interface QuestionStats {
  total: number;
  byCategory: Record<number, number>;
  byDifficulty: Record<string, number>;
  active: number;
  inactive: number;
}
