// Basic Analytics Dashboard Component
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";

interface Question {
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

interface QuestionDisplay extends Question {
  categoryName?: string;
  subcategoryName?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface AnalyticsDashboardProps {
  questions: QuestionDisplay[];
  categories: Category[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ questions, categories }) => {
  const stats = {
    totalQuestions: questions.length,
    activeQuestions: questions.filter(q => q.isActive).length,
    questionsByDifficulty: {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
    },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            Question statistics and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{stats.totalQuestions}</h3>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{stats.activeQuestions}</h3>
              <p className="text-sm text-muted-foreground">Active Questions</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {stats.questionsByDifficulty.easy + stats.questionsByDifficulty.medium + stats.questionsByDifficulty.hard}
              </h3>
              <p className="text-sm text-muted-foreground">Total by Difficulty</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
