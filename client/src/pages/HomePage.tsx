import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { StoryCard } from "@/components/StoryCard";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@shared/schema";
import teddyImage from "@assets/generated_images/Teddy_bear_reading_story_502f26a8.png";
import bunnyImage from "@assets/generated_images/Bunny_on_cloud_e358044b.png";
import owlImage from "@assets/generated_images/Owl_with_lantern_4320ef2c.png";

export default function HomePage() {
  const [, setLocation] = useLocation();
  
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories/preview"],
    enabled: false,
  });

  const previewStories: Story[] = stories.length > 0 ? stories.slice(0, 3) : [
    {
      id: "preview-1",
      title: "The Sleepy Teddy Bear",
      content: "Once upon a time...",
      imageUrl: teddyImage,
      summary: "A gentle tale about a teddy bear who loves bedtime stories",
      createdAt: Date.now(),
    },
    {
      id: "preview-2",
      title: "Bunny's Cloud Adventure",
      content: "High in the sky...",
      imageUrl: bunnyImage,
      summary: "Join a curious bunny on a magical journey through the clouds",
      createdAt: Date.now(),
    },
    {
      id: "preview-3",
      title: "The Wise Owl's Lantern",
      content: "In the forest at night...",
      imageUrl: owlImage,
      summary: "Discover the secrets of the forest with a kind owl friend",
      createdAt: Date.now(),
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-end">
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16 md:py-24"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-16 h-16 text-primary mx-auto" />
            </motion.div>
            
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl mb-6 text-foreground">
              StoryNest
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Stories that grow with your child
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="rounded-2xl text-lg px-8 py-6"
                onClick={() => setLocation("/auth")}
                data-testid="button-parent-login"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Parent Login / Sign Up
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl text-lg px-8 py-6"
                onClick={() => {
                  document.getElementById("stories-preview")?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="button-explore-stories"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Stories
              </Button>
            </div>
          </motion.div>

          <motion.section
            id="stories-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl text-center mb-8 text-foreground">
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {previewStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  showBookmark={false}
                  onRead={() => setLocation("/auth")}
                />
              ))}
            </div>
          </motion.section>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-24 text-center py-8 border-t border-border"
          >
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              Made with <span className="text-pink-500">💛</span> for dreamers and readers.
            </p>
          </motion.footer>
        </main>
      </div>
    </div>
  );
}
