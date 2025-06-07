// API functions for Questions Management
const API_BASE_URL = '/api/questions';

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

export interface QuestionDisplay extends Question {
  categoryName?: string;
  subcategoryName?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
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

// Fetch questions with filters
export async function fetchQuestions(filters: QuestionFilters = {}): Promise<{
  questions: QuestionDisplay[];
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch questions');
    }
    
    return {
      questions: result.data || [],
      total: result.total || 0,
      totalPages: result.totalPages || 0,
      hasNext: result.hasNext || false,
      hasPrevious: result.hasPrevious || false,
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}

// Create a new question
export async function createQuestion(questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create question');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

// Update a question
export async function updateQuestion(id: number, questionData: Partial<Question>): Promise<Question> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update question');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
}

// Delete a question
export async function deleteQuestion(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete question');
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
}

// Delete multiple questions
export async function deleteMultipleQuestions(ids: number[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        questionIds: ids,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete questions');
    }
  } catch (error) {
    console.error('Error deleting multiple questions:', error);
    throw error;
  }
}

// Toggle question status
export async function toggleQuestionStatus(id: number): Promise<Question> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to toggle question status');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error toggling question status:', error);
    throw error;
  }
}

// Get questions statistics
export async function getQuestionsStats(): Promise<QuestionStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch question stats');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching question stats:', error);
    throw error;
  }
}

// Fetch categories (assuming they exist in the main system)
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/categories');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Handle different response formats
    if (Array.isArray(result)) {
      return result;
    } else if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array if categories API is not available
    return [];
  }
}

// Get random questions for game
export async function getRandomQuestions(categoryIds: number[], limit: number = 10): Promise<Question[]> {
  try {
    const params = new URLSearchParams();
    categoryIds.forEach(id => params.append('categoryIds', String(id)));
    params.append('limit', String(limit));

    const response = await fetch(`${API_BASE_URL}/random?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch random questions');
    }
    
    return result.data || [];
  } catch (error) {
    console.error('Error fetching random questions:', error);
    throw error;
  }
}
