import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StoryCard } from "@/components/StoryCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Plus, Play, LogOut, BookmarkCheck, Shield, Clock, CheckCircle, XCircle, FileText, Mic, Square, Trash2, Volume2 } from "lucide-react";
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
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  const { data: mySubmissions = [], isLoading: loadingSubmissions } = useQuery<Story[]>({
    queryKey: ["/api/stories/my-submissions"],
  });

  const { data: bookmarks = [] } = useQuery<string[]>({
    queryKey: ["/api/bookmarks"],
  });

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ 
        title: "Story created as draft!", 
        description: "Your story has been saved. Submit it for review to publish." 
      });
      setShowAddStory(false);
      form.reset();
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Filter out status to prevent parents from changing it
      const { status, ...safeData } = data;
      const res = await apiRequest("PATCH", `/api/stories/${id}`, safeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      toast({ title: "Story updated!", description: "Your draft has been saved." });
      setEditingStory(null);
      form.reset();
    },
  });

  const submitStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/stories/${id}/submit`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      toast({ 
        title: "Story submitted!", 
        description: "Your story has been submitted for admin review." 
      });
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Convert blob to base64 data URL for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          (form.setValue as any)('voiceoverUrl', base64data);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Recording started", description: "Start reading your story!" });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ 
        title: "Microphone error", 
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "Your voiceover has been saved!" });
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    (form.setValue as any)('voiceoverUrl', undefined);
    toast({ title: "Recording deleted" });
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setAudioUrl(story.voiceoverUrl || null);
    form.reset({
      title: story.title,
      content: story.content,
      summary: story.summary,
      imageUrl: story.imageUrl,
      ...(story.voiceoverUrl && { voiceoverUrl: story.voiceoverUrl }),
    });
  };

  const handleFormSubmit = (data: any) => {
    if (editingStory) {
      updateStoryMutation.mutate({ id: editingStory.id, data });
    } else {
      addStoryMutation.mutate(data);
    }
  };

  const getStatusBadge = (story: Story) => {
    // Backend sets rejected stories back to "draft" with rejectionReason
    if (story.status === "draft" && story.rejectionReason) {
      return <Badge variant="destructive" data-testid={`badge-rejected`}><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    
    switch (story.status) {
      case "draft":
        return <Badge variant="secondary" data-testid={`badge-draft`}><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "pending_review":
        return <Badge variant="outline" data-testid={`badge-pending`}><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "published":
        return <Badge variant="default" data-testid={`badge-published`}><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              {adminCheck?.isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/admin")}
                  className="rounded-2xl"
                  data-testid="button-admin"
                >
                  <Shield className="w-4 h-4" />
                </Button>
              )}
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
                onClick={() => {
                  setEditingStory(null);
                  setShowAddStory(true);
                  form.reset({
                    title: "",
                    content: "",
                    summary: "",
                    imageUrl: teddyImage,
                  });
                }}
                className="rounded-2xl"
                data-testid="button-add-story"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Story for Review
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

          <Tabs defaultValue="published" className="space-y-6">
            <TabsList data-testid="tabs-parent-dashboard">
              <TabsTrigger value="published" data-testid="tab-published">
                Published Stories
              </TabsTrigger>
              <TabsTrigger value="yours" data-testid="tab-your-stories">
                Your Stories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="published">
              <div className="mb-4">
                <Button
                  variant={filterBookmarked ? "default" : "outline"}
                  onClick={() => setFilterBookmarked(!filterBookmarked)}
                  className="rounded-2xl"
                  data-testid="button-filter-bookmarks"
                >
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                  {filterBookmarked ? "Show All" : "Bookmarked Only"}
                </Button>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading stories...</p>
                </div>
              ) : displayedStories.length === 0 ? (
                <Card className="rounded-3xl border-2 text-center py-12">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      {filterBookmarked ? "No bookmarked stories yet" : "No published stories yet"}
                    </p>
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
            </TabsContent>

            <TabsContent value="yours">
              {loadingSubmissions ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading your stories...</p>
                </div>
              ) : mySubmissions.length === 0 ? (
                <Card className="rounded-3xl border-2 text-center py-12">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-4">
                      You haven't submitted any stories yet
                    </p>
                    <Button onClick={() => setShowAddStory(true)} className="rounded-2xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Your First Story
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {mySubmissions.map((story) => (
                    <Card key={story.id} className="rounded-3xl" data-testid={`card-story-${story.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{story.title}</CardTitle>
                          <CardDescription className="mt-1">{story.summary}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(story)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(story.createdAt)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {story.status === "draft" && story.rejectionReason && (
                          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-sm text-muted-foreground">{story.rejectionReason}</p>
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {story.status === "draft" && (
                            <>
                              <Button
                                onClick={() => handleEditStory(story)}
                                className="rounded-2xl"
                                data-testid={`button-edit-${story.id}`}
                              >
                                Edit Draft
                              </Button>
                              <Button
                                onClick={() => submitStoryMutation.mutate(story.id)}
                                disabled={submitStoryMutation.isPending}
                                className="rounded-2xl"
                                data-testid={`button-submit-${story.id}`}
                              >
                                Submit for Review
                              </Button>
                            </>
                          )}
                          {story.status === "pending_review" && (
                            <p className="text-sm text-muted-foreground italic">
                              Your story is being reviewed by an admin
                            </p>
                          )}
                          {story.status === "published" && (
                            <Button
                              onClick={() => setLocation(`/child-mode?story=${story.id}`)}
                              className="rounded-2xl"
                              data-testid={`button-read-${story.id}`}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Read Story
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={showAddStory || !!editingStory} onOpenChange={(open) => {
        if (!open) {
          setShowAddStory(false);
          setEditingStory(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-story">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingStory ? "Edit Draft Story" : "Submit Story for Review"}
            </DialogTitle>
            <DialogDescription>
              {editingStory 
                ? "Make changes to your draft story"
                : "Create a magical bedtime story. It will be reviewed by an admin before publishing."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                name={"voiceoverUrl" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice Recording (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {!audioUrl && !isRecording && (
                          <Button
                            type="button"
                            onClick={startRecording}
                            variant="outline"
                            className="rounded-2xl w-full"
                            data-testid="button-start-recording"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording Voiceover
                          </Button>
                        )}
                        
                        {isRecording && (
                          <div className="p-4 border-2 border-primary rounded-2xl bg-primary/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="font-medium">Recording...</span>
                              </div>
                              <Button
                                type="button"
                                onClick={stopRecording}
                                variant="destructive"
                                size="sm"
                                className="rounded-2xl"
                                data-testid="button-stop-recording"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Stop
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {audioUrl && !isRecording && (
                          <div className="p-4 border-2 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-primary" />
                                <span className="font-medium">Voiceover Ready</span>
                              </div>
                              <Button
                                type="button"
                                onClick={deleteRecording}
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl"
                                data-testid="button-delete-recording"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <audio src={audioUrl} controls className="w-full" data-testid="audio-player" />
                            <p className="text-xs text-muted-foreground">
                              Your voiceover will be played when children read this story
                            </p>
                          </div>
                        )}
                      </div>
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
                <Button 
                  type="submit" 
                  className="rounded-2xl" 
                  disabled={addStoryMutation.isPending || updateStoryMutation.isPending} 
                  data-testid="button-submit-story"
                >
                  {editingStory 
                    ? (updateStoryMutation.isPending ? "Saving..." : "Save Draft")
                    : (addStoryMutation.isPending ? "Creating..." : "Create Draft")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
