// Question Templates Component
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";

interface QuestionTemplatesProps {
  onCreateFromTemplate?: (template: any, variables: any) => void;
}

const QuestionTemplates: React.FC<QuestionTemplatesProps> = ({ onCreateFromTemplate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Templates</CardTitle>
        <CardDescription>
          Pre-defined question templates for quick creation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Templates feature coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default QuestionTemplates;
