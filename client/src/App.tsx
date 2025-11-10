import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ChildLockSetupPage from "@/pages/ChildLockSetupPage";
import ParentDashboard from "@/pages/ParentDashboard";
import ChildModePage from "@/pages/ChildModePage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/setup" component={ChildLockSetupPage} />
      <Route path="/dashboard" component={ParentDashboard} />
      <Route path="/child-mode" component={ChildModePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
