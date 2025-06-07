import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const AdminComponentTester: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentTest, setCurrentTest] = useState<string>("");

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

  const runTest = (testName: string, component: React.ReactNode) => {
    setCurrentTest(testName);
    return component;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Admin Component Tester
        </h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Current Test: {currentTest}</p>
              <div className="space-y-2 mt-4">
                <Button 
                  onClick={() => runTest("API Test", <APITest />)}
                  variant="outline"
                  className="mr-2"
                >
                  Test API
                </Button>
                <Button 
                  onClick={() => runTest("Types Test", <TypesTest />)}
                  variant="outline"
                  className="mr-2"
                >
                  Test Types
                </Button>
                <Button 
                  onClick={() => runTest("FiltersPanel", <FiltersPanelTest />)}
                  variant="outline"
                  className="mr-2"
                >
                  Test FiltersPanel
                </Button>
                <Button 
                  onClick={() => runTest("QuestionForm", <QuestionFormTest />)}
                  variant="outline"
                  className="mr-2"
                >
                  Test QuestionForm
                </Button>
                <Button 
                  onClick={() => runTest("QuestionsTable", <QuestionsTableTest />)}
                  variant="outline"
                  className="mr-2"
                >
                  Test QuestionsTable
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="test-output">
                {currentTest === "API Test" && <APITest />}
                {currentTest === "Types Test" && <TypesTest />}
                {currentTest === "FiltersPanel" && <FiltersPanelTest />}
                {currentTest === "QuestionForm" && <QuestionFormTest />}
                {currentTest === "QuestionsTable" && <QuestionsTableTest />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const APITest: React.FC = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { fetchQuestions, fetchCategories } = require("./questions/api");
    return <div className="text-green-500">✅ API imports successful</div>;
  } catch (error) {
    return <div className="text-red-500">❌ API import failed: {String(error)}</div>;
  }
};

const TypesTest: React.FC = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const types = require("./questions/types");
    return <div className="text-green-500">✅ Types import successful</div>;
  } catch (error) {
    return <div className="text-red-500">❌ Types import failed: {String(error)}</div>;
  }
};

const FiltersPanelTest: React.FC = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FiltersPanel = require("./questions/FiltersPanel").default;
    return <div className="text-green-500">✅ FiltersPanel import successful</div>;
  } catch (error) {
    return <div className="text-red-500">❌ FiltersPanel import failed: {String(error)}</div>;
  }
};

const QuestionFormTest: React.FC = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QuestionForm = require("./questions/QuestionForm").default;
    return <div className="text-green-500">✅ QuestionForm import successful</div>;
  } catch (error) {
    return <div className="text-red-500">❌ QuestionForm import failed: {String(error)}</div>;
  }
};

const QuestionsTableTest: React.FC = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QuestionsTable = require("./questions/QuestionsTable").default;
    return <div className="text-green-500">✅ QuestionsTable import successful</div>;
  } catch (error) {
    return <div className="text-red-500">❌ QuestionsTable import failed: {String(error)}</div>;
  }
};

export default AdminComponentTester;
