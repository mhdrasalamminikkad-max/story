import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Lock, Clock, Maximize } from "lucide-react";
import { useLocation } from "wouter";
import { insertParentSettingsSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ChildLockSetupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [readingTime, setReadingTime] = useState(30);

  const form = useForm({
    resolver: zodResolver(insertParentSettingsSchema),
    defaultValues: {
      pin: "",
      readingTimeLimit: 30,
      fullscreenLockEnabled: true,
      theme: "day" as const,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/parent-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved!",
        description: "Your child lock preferences have been configured.",
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in first.",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-end">
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-100px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <Card className="rounded-3xl border-2">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-heading text-3xl">Child Lock Setup</CardTitle>
                <CardDescription className="text-base">
                  Configure safety settings for your child's reading time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Parent PIN (4 digits)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="Enter 4-digit PIN"
                              className="text-center text-2xl tracking-widest rounded-2xl"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                field.onChange(value);
                              }}
                              data-testid="input-setup-pin"
                            />
                          </FormControl>
                          <FormDescription>
                            This PIN will be required to exit child mode
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="readingTimeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Reading Time Limit
                            </span>
                            <span className="font-heading text-primary">{field.value} minutes</span>
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={10}
                              max={60}
                              step={5}
                              value={[field.value]}
                              onValueChange={(value) => {
                                field.onChange(value[0]);
                                setReadingTime(value[0]);
                              }}
                              className="py-4"
                              data-testid="slider-reading-time"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum reading time per session (10-60 minutes)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullscreenLockEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-6">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2">
                              <Maximize className="w-4 h-4" />
                              Enable Fullscreen Lock
                            </FormLabel>
                            <FormDescription>
                              Prevent accidental exits during story time
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-fullscreen-lock"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-2xl text-lg py-6"
                      disabled={saveMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Settings & Continue"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
