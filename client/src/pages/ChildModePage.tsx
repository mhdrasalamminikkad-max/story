import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PINDialog } from "@/components/PINDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Story, ParentSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChildModePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [showPINDialog, setShowPINDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const speechSynthesis = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: settings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("story");
    if (storyId && stories.length > 0) {
      const index = stories.findIndex(s => s.id === storyId);
      if (index !== -1) {
        setCurrentStoryIndex(index);
      }
    }
  }, [stories]);

  useEffect(() => {
    if (settings?.fullscreenLockEnabled && containerRef.current && !isFullscreen) {
      enterFullscreen();
    }

    return () => {
      if (isReading) {
        stopReading();
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [settings]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error("Failed to exit fullscreen:", err);
    }
  };

  const startReading = () => {
    if (!currentStory) return;

    stopReading();

    const utterance = new SpeechSynthesisUtterance(currentStory.content);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setIsReading(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const stopReading = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsReading(false);
  };

  const handleVerifyPIN = async (pin: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/verify-pin", { pin });
      const response = await res.json();
      if (response.valid) {
        await exitFullscreen();
        setLocation("/dashboard");
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleExit = () => {
    stopReading();
    setShowPINDialog(true);
  };

  const nextStory = () => {
    stopReading();
    setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    stopReading();
    setCurrentStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const twinklingStars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 1,
  }));

  if (!currentStory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No stories available. Please add stories first.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden"
    >
      <div className="fixed inset-0 pointer-events-none">
        {isReading && twinklingStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          >
            <Star className="w-3 h-3 text-yellow-300" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <div className="flex gap-2">
            {stories.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={prevStory}
                  data-testid="button-prev-story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={nextStory}
                  data-testid="button-next-story"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="rounded-2xl"
            onClick={handleExit}
            data-testid="button-exit-child-mode"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <motion.div
                animate={isReading ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <img
                  src={currentStory.imageUrl}
                  alt={currentStory.title}
                  className="w-full max-w-2xl mx-auto rounded-3xl shadow-2xl"
                  data-testid="img-current-story"
                />
              </motion.div>

              <h1 className="font-heading text-3xl md:text-5xl text-center mb-6 text-foreground" data-testid="text-current-story-title">
                {currentStory.title}
              </h1>

              <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 mb-8 max-h-[40vh] overflow-y-auto">
                <p className="text-lg md:text-xl leading-relaxed text-card-foreground whitespace-pre-wrap" data-testid="text-current-story-content">
                  {currentStory.content}
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="rounded-3xl text-xl px-12 py-8"
                  onClick={isReading ? stopReading : startReading}
                  data-testid="button-read-aloud"
                >
                  {isReading ? (
                    <>
                      <VolumeX className="w-6 h-6 mr-3" />
                      Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-6 h-6 mr-3" />
                      Read Aloud
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <PINDialog
        open={showPINDialog}
        onOpenChange={setShowPINDialog}
        onVerify={handleVerifyPIN}
        title="Exit Child Mode"
        description="Enter parent PIN to return to dashboard"
      />
    </div>
  );
}
