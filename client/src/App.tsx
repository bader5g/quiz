import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MyGamesPage from "@/pages/MyGamesPage";
import GameLogPage from "@/pages/GameLogPage";
import ProfilePage from "@/pages/ProfilePage";
import BuyCardsPage from "@/pages/BuyCardsPage";
import LevelPage from "@/pages/LevelPage";
import PlayPage from "@/pages/PlayPage";
import QuestionPage from "@/pages/QuestionPage";
import GameResultPage from "@/pages/GameResultPage";
import TestDialogPage from "@/pages/TestDialogPage";
import AdminPage from "@/pages/admin/AdminPage";
import AuthPage from "@/pages/auth-page";
import { UserProvider } from "./context/UserContext";
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
      <ProtectedRoute path="/buy-cards" component={BuyCardsPage} />
      <ProtectedRoute path="/level" component={LevelPage} />
      {/* لوحة تحكم المدير - تتضمن جميع المسارات الفرعية */}
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/:path" component={AdminPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SiteProvider>
        <AuthProvider>
          <UserProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </UserProvider>
        </AuthProvider>
      </SiteProvider>
    </QueryClientProvider>
  );
}

export default App;
