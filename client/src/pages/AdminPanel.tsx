import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { BarChart3, Users, BookOpen, Bookmark, Trash2, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Story } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  totalStories: number;
  totalBookmarks: number;
  averageStoriesPerUser: string;
  recentStoriesCount: number;
}

interface AdminUser {
  userId: string;
  readingTimeLimit: number;
  fullscreenLockEnabled: boolean;
  theme: string;
  storyCount: number;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reviewingStory, setReviewingStory] = useState<Story | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: adminCheck, isLoading: checkingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: allStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/admin/stories"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: pendingStories = [] } = useQuery<Story[]>({
    queryKey: ["/api/admin/pending-stories"],
    enabled: adminCheck?.isAdmin || false,
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: adminCheck?.isAdmin || false,
  });

  if (checkingAdmin) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <header className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="rounded-2xl"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <ThemeToggle />
          </header>
          <main className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-100px)]">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You do not have permission to access the admin panel.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/stories/${storyId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Story deleted",
        description: "The story has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reviewStoryMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }: { id: string; action: "approve" | "reject"; rejectionReason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/review-story/${id}`, { action, rejectionReason });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/my-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: variables.action === "approve" ? "Story approved!" : "Story rejected",
        description: variables.action === "approve" 
          ? "The story is now published and visible to all users." 
          : "The story has been sent back to the author for revision.",
      });
      setReviewingStory(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to review story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="rounded-2xl"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-8">
              <h1 className="font-heading text-4xl mb-2" data-testid="text-admin-title">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, stories, and view platform statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card data-testid="card-stat-users">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-stories">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-stories">{stats?.totalStories || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-bookmarks">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-bookmarks">{stats?.totalBookmarks || 0}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-average">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Stories/User</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-stories">{stats?.averageStoriesPerUser || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="review" className="space-y-4">
              <TabsList data-testid="tabs-admin">
                <TabsTrigger value="review" data-testid="tab-review">
                  Story Review {pendingStories.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{pendingStories.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="stories" data-testid="tab-stories">All Stories</TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value="review">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Story Reviews</CardTitle>
                    <CardDescription>Review and approve or reject stories submitted by parents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingStories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-pending">
                        No stories pending review
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {pendingStories.map((story) => (
                          <Card key={story.id} className="rounded-2xl" data-testid={`card-pending-${story.id}`}>
                            <CardHeader>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-lg">{story.title}</CardTitle>
                                  <CardDescription className="mt-1">{story.summary}</CardDescription>
                                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Submitted {formatDate(story.createdAt)}
                                    </Badge>
                                    <Badge variant="secondary">{story.userId.slice(0, 12)}...</Badge>
                                  </div>
                                </div>
                                <img 
                                  src={story.imageUrl} 
                                  alt={story.title}
                                  className="w-24 h-24 rounded-lg object-cover"
                                />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4 p-3 rounded-lg bg-muted/50 max-h-32 overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap">{story.content}</p>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => reviewStoryMutation.mutate({ id: story.id, action: "approve" })}
                                  disabled={reviewStoryMutation.isPending}
                                  className="rounded-2xl"
                                  data-testid={`button-approve-${story.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve & Publish
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => setReviewingStory(story)}
                                  disabled={reviewStoryMutation.isPending}
                                  className="rounded-2xl"
                                  data-testid={`button-reject-${story.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stories">
                <Card>
                  <CardHeader>
                    <CardTitle>All Stories</CardTitle>
                    <CardDescription>Manage all stories across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {allStories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-stories">
                        No stories yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allStories.map((story) => (
                            <TableRow key={story.id} data-testid={`row-story-${story.id}`}>
                              <TableCell className="font-medium">{story.title}</TableCell>
                              <TableCell className="max-w-xs truncate">{story.summary}</TableCell>
                              <TableCell>{formatDate(story.createdAt)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{story.userId.slice(0, 8)}...</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteStoryMutation.mutate(story.id)}
                                  disabled={deleteStoryMutation.isPending}
                                  data-testid={`button-delete-story-${story.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View all registered users and their settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-users">
                        No users yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Story Count</TableHead>
                            <TableHead>Reading Time</TableHead>
                            <TableHead>Fullscreen Lock</TableHead>
                            <TableHead>Theme</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user, index) => (
                            <TableRow key={user.userId} data-testid={`row-user-${index}`}>
                              <TableCell>
                                <Badge variant="secondary">{user.userId.slice(0, 12)}...</Badge>
                              </TableCell>
                              <TableCell>{user.storyCount}</TableCell>
                              <TableCell>{user.readingTimeLimit} min</TableCell>
                              <TableCell>
                                <Badge variant={user.fullscreenLockEnabled ? "default" : "outline"}>
                                  {user.fullscreenLockEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{user.theme}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>

      <Dialog open={!!reviewingStory} onOpenChange={(open) => {
        if (!open) {
          setReviewingStory(null);
          setRejectionReason("");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-3xl" data-testid="dialog-reject-story">
          <DialogHeader>
            <DialogTitle>Reject Story</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{reviewingStory?.title}". The author will see this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Explain why this story cannot be published..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-2xl min-h-[120px]"
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewingStory(null);
                setRejectionReason("");
              }}
              className="rounded-2xl"
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (reviewingStory) {
                  reviewStoryMutation.mutate({
                    id: reviewingStory.id,
                    action: "reject",
                    rejectionReason: rejectionReason || "Story did not meet quality standards",
                  });
                }
              }}
              disabled={reviewStoryMutation.isPending || !rejectionReason.trim()}
              className="rounded-2xl"
              data-testid="button-confirm-reject"
            >
              {reviewStoryMutation.isPending ? "Rejecting..." : "Reject Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
