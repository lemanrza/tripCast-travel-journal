import * as React from "react";
import { Button } from "./ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import initials from "@/utils/initials";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import formatDate from "@/utils/formatDate";
import timeAgo from "@/utils/timeAgo";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import type { User } from "@/types/userType";
import type { JournalComment, JournalDetail } from "@/types/JournalType";

type Props = {
  journal?: JournalDetail;
  comments?: JournalComment[];
  onBack?: () => void;
  onToggleLike?: () => Promise<void> | void;
  onAddComment?: (text: string) => Promise<void> | void;
  user: User | null;
};

export default function JournalDetailDisplay({
  journal,
  comments = [],
  onBack,
  onToggleLike,
  onAddComment,
  user,
}: Props) {
  if (!journal) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <p className="text-muted-foreground">Journal not found</p>
          <Button onClick={() => (onBack ? onBack() : window.history.back())} className="mt-3">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const photos = (journal.photos || []).map((p: any) => (typeof p === "string" ? p : p?.url)).filter(Boolean);

  // Like state
  const myId = (user as any)?._id || (user as any)?.id;
  const likesArr = Array.isArray(journal.likes) ? (journal.likes as any[]) : [];
  const likedByMe = myId ? likesArr.some((l) => String(l?.userId?._id ?? l?.userId ?? l) === String(myId)) : false;

  const [content, setContent] = React.useState("");
  const canSubmit = !!user && content.trim().length > 0;
  const handleAdd = async () => {
    if (!canSubmit) return;
    await onAddComment?.(content.trim());
    setContent("");
  };

  // Media slider
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [_, setActiveIdx] = React.useState(0);
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIdx(Math.max(0, Math.min(idx, Math.max(0, photos.length - 1))));
    };
    el.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [photos.length]);

  const scrollBy = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };
//   const jumpTo = (idx: number) => {
//     const el = trackRef.current;
//     if (!el) return;
//     el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
//   };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => (onBack ? onBack() : window.history.back())}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">{formatDate(String(journal.createdAt))}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT: media + content */}
        <div className="lg:col-span-8 space-y-4">
          {/* Title + author chip */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold leading-tight">{journal.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={journal.author?.profileImage?.url} />
                  <AvatarFallback>{initials(journal.author?.fullName ?? "")}</AvatarFallback>
                </Avatar>
                <span className="truncate">
                  by <span className="font-medium text-foreground">{journal.author?.fullName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="relative overflow-hidden rounded-xl border">
            {photos.length > 0 ? (
              <>
                <div
                  ref={trackRef}
                  className="flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
                >
                  {photos.map((src, i) => (
                    <div key={i} className="aspect-video w-full flex-none snap-center bg-black">
                      <img src={src} alt={`photo-${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>

                {photos.length > 1 && (
                  <>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="bg-background/70 backdrop-blur"
                        onClick={() => scrollBy(-1)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="bg-background/70 backdrop-blur"
                        onClick={() => scrollBy(1)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="aspect-video grid place-items-center bg-muted text-sm text-muted-foreground">
                No image for this entry
              </div>
            )}
          </div>

          {/* Content */}
          <Card className="shadow-sm">
            <CardContent className="prose prose-neutral max-w-none p-5 dark:prose-invert">
              <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">
                {journal.content}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Comments</h2>
              <span className="text-xs text-muted-foreground">{comments.length}</span>
            </div>

            {/* Composer */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.profileImage?.url} />
                    <AvatarFallback>{initials(user?.fullName || "U")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder={user ? "Write a comment…" : "Sign in to comment"}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={!user}
                      className="min-h-[88px]"
                    />
                    <div className="mt-2 flex items-center justify-end">
                      <Button size="sm" onClick={handleAdd} disabled={!canSubmit}>
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            {comments.length === 0 ? (
              <div className="rounded-md border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                Be the first to comment.
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[420px]">
                    <ul className="divide-y">
                      {comments.map((c) => (
                        <li key={c.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              {c.author.avatarUrl ? (
                                <AvatarImage src={c.author.avatarUrl} alt={c.author.name} />
                              ) : (
                                <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{c.author.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  • {timeAgo(String(c.createdAt))}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        {/* RIGHT: actions/meta */}
        <div className="lg:col-span-4 mt-20">
          <div className="lg:sticky lg:top-24 space-y-4 ">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant={likedByMe ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    aria-pressed={likedByMe}
                    onClick={() => onToggleLike?.()}
                  >
                    <Heart className={`h-4 w-4 ${likedByMe ? "fill-current" : ""}`} />
                    {likedByMe ? "Liked" : "Like"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {likesArr.length} {likesArr.length === 1 ? "like" : "likes"}
                  </span>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Photos</span>
                    <span className="font-medium">{photos.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatDate(String(journal.createdAt))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
