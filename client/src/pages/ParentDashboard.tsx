import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StoryCard } from "@/components/StoryCard";
import { motion } from "framer-motion";
import { Plus, Play, LogOut, BookmarkCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Story } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStorySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { fakeAuth } from "@/lib/auth";
import teddyImage from "@assets/generated_images/Teddy_bear_reading_story_502f26a8.png";
import bunnyImage from "@assets/generated_images/Bunny_on_cloud_e358044b.png";
import owlImage from "@assets/generated_images/Owl_with_lantern_4320ef2c.png";
import foxImage from "@assets/generated_images/Fox_reading_by_candlelight_2780dc73.png";

export default function ParentDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddStory, setShowAddStory] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: bookmarks = [] } = useQuery<string[]>({
    queryKey: ["/api/bookmarks"],
  });

  const storiesWithBookmarks = stories.map(story => ({
    ...story,
    isBookmarked: bookmarks.includes(story.id),
  }));

  const displayedStories = filterBookmarked
    ? storiesWithBookmarks.filter(s => s.isBookmarked)
    : storiesWithBookmarks;

  const form = useForm({
    resolver: zodResolver(insertStorySchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      imageUrl: teddyImage,
    },
  });

  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story added!", description: "Your new story is ready to read." });
      setShowAddStory(false);
      form.reset();
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const isBookmarked = bookmarks.includes(storyId);
      if (isBookmarked) {
        const res = await apiRequest("DELETE", `/api/bookmarks/${storyId}`, undefined);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/bookmarks", { storyId });
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
  });

  const handleSignOut = () => {
    fakeAuth.signOut();
    setLocation("/");
  };

  const imageOptions = [
    { url: teddyImage, label: "Teddy Bear" },
    { url: bunnyImage, label: "Bunny" },
    { url: owlImage, label: "Owl" },
    { url: foxImage, label: "Fox" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
            <h1 className="font-heading text-2xl md:text-3xl text-foreground">Parent Dashboard</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-2xl"
                data-testid="button-signout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
          >
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setShowAddStory(true)}
                className="rounded-2xl"
                data-testid="button-add-story"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Story
              </Button>
              <Button
                variant={filterBookmarked ? "default" : "outline"}
                onClick={() => setFilterBookmarked(!filterBookmarked)}
                className="rounded-2xl"
                data-testid="button-filter-bookmarks"
              >
                <BookmarkCheck className="w-4 h-4 mr-2" />
                {filterBookmarked ? "Show All" : "Bookmarked"}
              </Button>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation("/child-mode")}
              className="rounded-2xl"
              data-testid="button-child-mode"
            >
              <Play className="w-5 h-5 mr-2" />
              Enter Child Mode
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading stories...</p>
            </div>
          ) : displayedStories.length === 0 ? (
            <Card className="rounded-3xl border-2 text-center py-12">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  {filterBookmarked ? "No bookmarked stories yet" : "No stories yet. Add your first one!"}
                </p>
                {!filterBookmarked && (
                  <Button onClick={() => setShowAddStory(true)} className="rounded-2xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Story
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onRead={(story) => setLocation(`/child-mode?story=${story.id}`)}
                  onToggleBookmark={(story) => toggleBookmarkMutation.mutate(story.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={showAddStory} onOpenChange={setShowAddStory}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-story">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Add New Story</DialogTitle>
            <DialogDescription>Create a magical bedtime story for your child</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => addStoryMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title</FormLabel>
                    <FormControl>
                      <Input placeholder="The Magical Adventure" className="rounded-2xl" {...field} data-testid="input-story-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Summary</FormLabel>
                    <FormControl>
                      <Input placeholder="A brief description of the story" className="rounded-2xl" {...field} data-testid="input-story-summary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Once upon a time..."
                        className="rounded-2xl min-h-[200px]"
                        {...field}
                        data-testid="input-story-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Image</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        {imageOptions.map((option) => (
                          <button
                            key={option.url}
                            type="button"
                            onClick={() => field.onChange(option.url)}
                            className={`relative rounded-2xl overflow-hidden border-4 transition-all ${
                              field.value === option.url ? "border-primary" : "border-transparent"
                            }`}
                            data-testid={`button-image-${option.label.toLowerCase()}`}
                          >
                            <img src={option.url} alt={option.label} className="w-full aspect-[4/3] object-cover" />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" className="rounded-2xl" disabled={addStoryMutation.isPending} data-testid="button-submit-story">
                  {addStoryMutation.isPending ? "Adding..." : "Add Story"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
