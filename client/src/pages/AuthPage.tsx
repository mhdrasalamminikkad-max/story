import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { LogIn, Sparkles, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      localStorage.setItem("fakeAuth", "true");
      localStorage.setItem("fakeUser", JSON.stringify({ email }));
      
      toast({
        title: isSignUp ? "Account created!" : "Welcome back!",
        description: "Let's set up your child lock preferences.",
      });
      
      setLoading(false);
      setLocation("/setup");
    }, 500);
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
                  {isSignUp ? "Create an account" : "Sign in"} to access magical bedtime stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-2xl text-lg py-6"
                    disabled={loading}
                  >
                    {loading ? (
                      "Please wait..."
                    ) : isSignUp ? (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Sign Up
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm"
                    >
                      {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    By signing in, you agree to create a safe, magical reading environment for your child
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
