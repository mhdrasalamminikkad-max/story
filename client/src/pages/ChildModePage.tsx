import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PINDialog } from "@/components/PINDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, Star, Heart, Circle } from "lucide-react";
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

  const floatingElements = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 90,
    y: Math.random() * 80,
    delay: Math.random() * 3,
    duration: Math.random() * 8 + 12,
    type: ['heart', 'star', 'circle'][i % 3],
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
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 relative overflow-hidden"
    >
      <div className="fixed inset-0 pointer-events-none">
        {twinklingStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          >
            <Star className="w-2 h-2 text-yellow-400 dark:text-yellow-200" fill="currentColor" />
          </motion.div>
        ))}

        {floatingElements.map((elem) => (
          <motion.div
            key={elem.id}
            className="absolute"
            style={{ left: `${elem.x}%` }}
            initial={{ y: "100vh", opacity: 0 }}
            animate={{
              y: "-10vh",
              opacity: [0, 0.7, 0.7, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: elem.duration,
              repeat: Infinity,
              delay: elem.delay,
              ease: "linear",
            }}
          >
            {elem.type === 'heart' && (
              <Heart className="w-6 h-6 text-pink-400 dark:text-pink-300" fill="currentColor" />
            )}
            {elem.type === 'star' && (
              <Star className="w-6 h-6 text-yellow-400 dark:text-yellow-300" fill="currentColor" />
            )}
            {elem.type === 'circle' && (
              <Circle className="w-6 h-6 text-blue-400 dark:text-blue-300" fill="currentColor" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        <header className="p-3 flex justify-between items-center bg-gradient-to-r from-purple-200/30 via-pink-200/30 to-blue-200/30 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 backdrop-blur-sm">
          <div className="flex gap-2">
            {stories.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
                  onClick={prevStory}
                  data-testid="button-prev-story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
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
            className="rounded-full"
            onClick={handleExit}
            data-testid="button-exit-child-mode"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        <main className="flex-1 flex flex-col px-4 py-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col max-w-5xl mx-auto w-full"
            >
              <motion.h1 
                className="font-heading text-4xl md:text-6xl text-center mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent"
                animate={isReading ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                data-testid="text-current-story-title"
              >
                {currentStory.title}
              </motion.h1>

              <div className="flex-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto border-4 border-purple-200 dark:border-purple-800">
                <motion.p 
                  className="text-xl md:text-2xl leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap font-medium"
                  animate={isReading ? { opacity: [0.9, 1, 0.9] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  data-testid="text-current-story-content"
                >
                  {currentStory.content}
                </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                {currentStory.imageUrl && (
                  <motion.img
                    src={currentStory.imageUrl}
                    alt={currentStory.title}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                    animate={{ rotate: isReading ? 360 : 0 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    data-testid="img-current-story"
                  />
                )}
                <Button
                  size="lg"
                  className="rounded-full text-2xl px-10 py-8 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-2xl"
                  onClick={isReading ? stopReading : startReading}
                  data-testid="button-read-aloud"
                >
                  {isReading ? (
                    <>
                      <VolumeX className="w-8 h-8 mr-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-8 h-8 mr-3" />
                      Read to Me
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
