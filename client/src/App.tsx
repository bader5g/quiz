import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { UserProvider } from "./context/UserContext";
import { SiteProvider } from "./context/SiteContext";
import LoginButton from "@/components/auth/LoginButton";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home}/>
      {/* Login and Register routes */}
      <Route path="/login" component={() => (
        <div dir="rtl" className="p-10 text-center">
          <h1 className="text-2xl font-bold mb-6">صفحة تسجيل الدخول</h1>
          <p className="mb-6">هذه صفحة تجريبية لأغراض التطوير. انقر على الزر أدناه لتسجيل الدخول بحساب تجريبي.</p>
          <LoginButton />
        </div>
      )} />
      <Route path="/register" component={() => (
        <div dir="rtl" className="p-10 text-center">
          <h1 className="text-2xl font-bold mb-6">صفحة إنشاء حساب</h1>
          <p className="mb-6">هذه صفحة تجريبية لأغراض التطوير. انقر على الزر أدناه لتسجيل الدخول بحساب تجريبي.</p>
          <LoginButton />
        </div>
      )} />
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
      <SiteProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </UserProvider>
      </SiteProvider>
    </QueryClientProvider>
  );
}

export default App;
