import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const AdminTestIsolated: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("كلمة مرور خاطئة");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">تسجيل الدخول - المدير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={handleLogin} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test simple components one by one
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Admin Test - Isolated Components
        </h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test 1: Basic Component</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This basic card renders successfully ✅</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test 2: Try to import QuestionsManagement</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Loading questions management component...</p>
              <TestQuestionsImport />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Separate component to isolate the import test
const TestQuestionsImport: React.FC = () => {
  try {
    // Dynamic import to catch any errors
    const QuestionsManagement = React.lazy(() => import("./questions/QuestionsManagement"));
    
    return (
      <React.Suspense fallback={<div>Loading questions component...</div>}>
        <QuestionsManagement />
      </React.Suspense>
    );
  } catch (error) {
    return (
      <div className="text-red-500">
        Error importing QuestionsManagement: {String(error)}
      </div>
    );
  }
};

export default AdminTestIsolated;
