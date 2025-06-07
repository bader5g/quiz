import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import MyGamesPage from "./pages/MyGamesPage";
import GameLogPage from "./pages/GameLogPage";
import ProfilePage from "./pages/ProfilePage";
import BuyCardsPage from "./pages/BuyCardsPage";
import LevelPage from "./pages/LevelPage";
import PlayPage from "./pages/PlayPage";
import QuestionPage from "./pages/QuestionPage";
import GameResultPage from "./pages/GameResultPage";
import TestDialogPage from "./pages/TestDialogPage";
import AdminPage from "./pages/admin/AdminPage";
// import AdminPageWithoutQuestions from "./pages/admin/AdminPageWithoutQuestions";
import SimpleAdminTest from "./pages/admin/SimpleAdminTest";
import AdminDebugTest from "./pages/admin/AdminDebugTest";
import AdminPageSimple from "./pages/admin/AdminPageSimple";
import AdminTestNoQuestions from "./pages/admin/AdminTestNoQuestions";
import AdminTestIsolated from "./pages/admin/AdminTestIsolated";
import AdminComponentTester from "./pages/admin/AdminComponentTester";
import AuthPage from "./pages/auth-page";
import { SiteProvider } from "./context/SiteContext";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home} />
      {/* Login and Register routes */}
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/play/:gameId" component={PlayPage} />
      <ProtectedRoute path="/play/:gameId/question/:questionId" component={QuestionPage} />
      <ProtectedRoute path="/game-result/:gameId" component={GameResultPage} />
      <ProtectedRoute path="/categories" component={() => <div dir="rtl" className="p-10 text-center">صفحة الفئات (قيد التطوير)</div>} />
      {/* صفحات الألعاب والتاريخ */}
      <ProtectedRoute path="/my-games" component={MyGamesPage} />
      <ProtectedRoute path="/game-log/:id" component={GameLogPage} />
      <ProtectedRoute path="/test-dialog" component={TestDialogPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/buy-cards" component={BuyCardsPage} />      <ProtectedRoute path="/level" component={LevelPage} />      {/* لوحة تحكم المدير - تتضمن جميع المسارات الفرعية */}      {/* <Route path="/admin-no-questions" component={AdminPageWithoutQuestions} />
      <Route path="/admin-no-questions/:path*" component={AdminPageWithoutQuestions} /> */}<Route path="/admin-test" component={SimpleAdminTest} />      <Route path="/admin-test-no-questions" component={AdminTestNoQuestions} />
      <Route path="/admin-test-isolated" component={AdminTestIsolated} />
      <Route path="/admin-component-tester" component={AdminComponentTester} />
      <Route path="/admin-debug" component={AdminDebugTest} />
      <Route path="/admin-simple" component={AdminPageSimple} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/:path*" component={AdminPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteProvider>        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <SonnerToaster position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </SiteProvider>
    </QueryClientProvider>
  );
}

export default App;
