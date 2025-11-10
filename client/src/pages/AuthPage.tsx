import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toast({
            title: "Welcome to StoryNest!",
            description: "Let's set up your child lock preferences.",
          });
          setLocation("/setup");
        }
      })
      .catch((error) => {
        console.error("Auth error:", error);
        toast({
          title: "Sign in failed",
          description: "Please try again.",
          variant: "destructive",
        });
      });
  }, [auth, setLocation, toast]);

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
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
                  Sign in with your Google account to access magical bedtime stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  size="lg"
                  className="w-full rounded-2xl text-lg py-6"
                  onClick={handleGoogleSignIn}
                  data-testid="button-google-signin"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign in with Google
                </Button>
                <p className="text-xs text-center text-muted-foreground">
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
