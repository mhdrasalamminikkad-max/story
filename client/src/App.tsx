import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ChildLockSetupPage from "@/pages/ChildLockSetupPage";
import ParentDashboard from "@/pages/ParentDashboard";
import ChildModePage from "@/pages/ChildModePage";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";

function Router() {
  const [, setLocation] = useLocation();
  const [keySequence, setKeySequence] = useState("");

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter") {
        // Check if the sequence matches the admin code
        if (keySequence === "786786") {
          setLocation("/admin");
          setKeySequence("");
        } else {
          setKeySequence("");
        }
      } else if (e.key.length === 1 && /[0-9]/.test(e.key)) {
        // Only track numeric keys
        setKeySequence((prev) => {
          const newSequence = prev + e.key;
          // Keep only last 6 digits
          return newSequence.slice(-6);
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [keySequence, setLocation]);

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/setup" component={ChildLockSetupPage} />
      <Route path="/dashboard" component={ParentDashboard} />
      <Route path="/child-mode" component={ChildModePage} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
