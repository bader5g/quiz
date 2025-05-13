import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { UserProvider } from "./context/UserContext";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home}/>
      {/* TODO: Add Login and Register routes */}
      <Route path="/login" component={() => <div dir="rtl" className="p-10 text-center">صفحة تسجيل الدخول (قيد التطوير)</div>} />
      <Route path="/register" component={() => <div dir="rtl" className="p-10 text-center">صفحة إنشاء حساب (قيد التطوير)</div>} />
      <Route path="/play" component={() => <div dir="rtl" className="p-10 text-center">صفحة اللعب (قيد التطوير)</div>} />
      <Route path="/categories" component={() => <div dir="rtl" className="p-10 text-center">صفحة الفئات (قيد التطوير)</div>} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
