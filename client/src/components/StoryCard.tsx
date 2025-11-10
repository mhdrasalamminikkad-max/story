import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Story } from "@shared/schema";

interface StoryCardProps {
  story: Story;
  onRead?: (story: Story) => void;
  onToggleBookmark?: (story: Story) => void;
  showBookmark?: boolean;
}

export function StoryCard({ story, onRead, onToggleBookmark, showBookmark = true }: StoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden rounded-3xl border-2 hover-elevate h-full flex flex-col" data-testid={`card-story-${story.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover"
            data-testid={`img-story-${story.id}`}
          />
          {showBookmark && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 rounded-2xl"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(story);
              }}
              data-testid={`button-bookmark-${story.id}`}
            >
              {story.isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" fill="currentColor" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <CardHeader className="pb-3">
          <h3 className="font-heading text-xl text-card-foreground line-clamp-2" data-testid={`text-story-title-${story.id}`}>
            {story.title}
          </h3>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-story-summary-${story.id}`}>
            {story.summary}
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            onClick={() => onRead?.(story)}
            className="w-full rounded-2xl"
            data-testid={`button-read-${story.id}`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Read Story
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
