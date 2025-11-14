import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      
      toast({
        title: "Welcome to StoryNest!",
        description: "Let's set up your child lock preferences.",
      });
      
      setLocation("/setup");
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Sign in failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="rounded-2xl"
            data-testid="button-back-home"
          >
            ← Back to Home
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-100px)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="w-full max-w-md rounded-3xl border-2">
              <CardHeader className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mx-auto"
                >
                  <Sparkles className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <CardTitle className="font-heading text-3xl">Welcome to StoryNest</CardTitle>
                <CardDescription className="text-base">
                  Sign in with Google to access magical bedtime stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGoogleSignIn}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl text-lg py-6 gap-3"
                  disabled={loading}
                  data-testid="button-google-signin"
                >
                  <SiGoogle className="w-5 h-5" />
                  {loading ? "Signing in..." : "Continue with Google"}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground px-4">
                  By signing in, you agree to create a safe, magical reading environment for your child
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
