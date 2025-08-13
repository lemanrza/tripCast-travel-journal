import type { JournalComment, JournalDetail } from '@/pages/Client/JournalDetail';
import React from 'react'
import { Button } from './ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import initials from '@/utils/initials';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';
import formatDate from '@/utils/formatDate';

        function JournalDetailDisplay({
            journal,
            comments = [],
            onBack,
            onToggleLike,
            onAddComment,
        }: {
            journal?: JournalDetail;
            comments?: JournalComment[];
            onBack?: () => void;
            onToggleLike?: (liked: boolean) => Promise<void> | void;
            onAddComment?: (text: string) => Promise<void> | void;
        }) {
            if (!journal) {
                return (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-muted-foreground">Journal not found</p>
                            <Button onClick={() => (onBack ? onBack() : window.history.back())} className="mt-4">
                                Go Back
                            </Button>
                        </div>
                    </div>
                );
            }

            const [liked, setLiked] = React.useState(!!journal.likedByMe);
            const [likesCount, setLikesCount] = React.useState(journal.likesCount ?? 0);
            const [newComment, setNewComment] = React.useState("");

            const trackRef = React.useRef<HTMLDivElement>(null);
            const [activeIdx, setActiveIdx] = React.useState(0);

            React.useEffect(() => {
                const el = trackRef.current;
                if (!el) return;
                const h = () => {
                    const idx = Math.round(el.scrollLeft / el.clientWidth);
                    setActiveIdx(Math.max(0, Math.min(idx, (journal.photos?.length || 1) - 1)));
                };
                el.addEventListener("scroll", h, { passive: true });
                return () => el.removeEventListener("scroll", h as any);
            }, [journal.photos?.length]);

            const scrollBy = (dir: -1 | 1) => {
                const el = trackRef.current;
                if (!el) return;
                el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
            };

            const handleLike = async () => {
                const next = !liked;
                setLiked(next);
                setLikesCount((c) => c + (next ? 1 : -1));
                try {
                    await onToggleLike?.(next);
                } catch {
                    setLiked(!next);
                    setLikesCount((c) => c + (next ? -1 : 1));
                }
            };

            const handleSubmitComment = async () => {
                const text = newComment.trim();
                if (!text) return;
                setNewComment("");
                try {
                    await onAddComment?.(text);
                } catch {
                    // If needed, restore input on failure
                    setNewComment(text);
                }
            };

            return (
                <div className="min-h-screen">
                    {/* Top media slider */}
                    <div className="relative">
                        <div
                            ref={trackRef}
                            className="flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
                        >
                            {(journal.photos?.length ? journal.photos : [undefined]).map((src, i) => (
                                <div key={i} className="relative h-150 w-full object-cover flex-none snap-center">
                                    {src ? (
                                        <img
                                            src={src}
                                            alt={`photo-${i + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                            <span className="text-muted-foreground">No image</span>
                                        </div>
                                    )}

                                    {/* gradient for readability */}
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            ))}
                        </div>

                        {/* Back button (overlay) */}
                        <div className="pointer-events-none absolute left-4 top-4 z-10">
                            <Button
                                className="pointer-events-auto gap-2 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50"
                                variant="secondary"
                                size="sm"
                                onClick={() => (onBack ? onBack() : window.history.back())}
                            >
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </div>

                        {/* Slider controls */}
                        {journal.photos && journal.photos.length > 1 && (
                            <>
                                <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
                                    <Button variant="secondary" size="icon" className="bg-background/70 backdrop-blur" onClick={() => scrollBy(-1)}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
                                    <Button variant="secondary" size="icon" className="bg-background/70 backdrop-blur" onClick={() => scrollBy(1)}>
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Dots */}
                                <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1">
                                    <div className="flex items-center gap-1.5">
                                        {journal.photos.map((_, i) => (
                                            <span
                                                key={i}
                                                className={`h-1.5 w-1.5 rounded-full ${i === activeIdx ? "bg-white" : "bg-white/60"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={journal.author.avatarUrl} />
                                    <AvatarFallback>{initials(journal.author.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl font-semibold leading-tight">{journal.title}</h1>
                                    <p className="text-sm text-muted-foreground">
                                        by <span className="font-medium">{journal.author.name}</span> • {formatDate(journal.createdAt.toString())}
                                    </p>
                                </div>
                            </div>

                            {/* Like */}
                            <div className="flex items-center gap-2">
                                <Button variant={liked ? "default" : "outline"} size="sm" className="gap-2" onClick={handleLike} aria-pressed={liked}>
                                    <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                                    {liked ? "Liked" : "Like"}
                                </Button>
                                <span className="text-sm text-muted-foreground">{likesCount} {likesCount === 1 ? "like" : "likes"}</span>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Notes / Content */}
                        <Card className="shadow-sm">
                            <CardContent className="prose prose-neutral max-w-none p-6 dark:prose-invert">
                                <div className="whitespace-pre-wrap text-base leading-7 text-foreground">{journal.content}</div>
                            </CardContent>
                        </Card>

                        {/* Comments */}
                        <div className="mt-10">
                            <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>

                            {/* New comment */}
                            <Card className="mt-4">
                                <CardContent className="p-4">
                                    <label className="mb-2 block text-sm text-muted-foreground" htmlFor="new-comment">
                                        Add a comment
                                    </label>
                                    <textarea
                                        id="new-comment"
                                        className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        placeholder="Share your thoughts..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <Button size="sm" onClick={handleSubmitComment} disabled={!newComment.trim()}>
                                            Post Comment
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Comment list */}
                            <div className="mt-6 space-y-4">
                                {comments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to share something!</p>
                                ) : (
                                    comments.map((c) => (
                                        <Card key={c.id}>
                                            <CardContent className="flex gap-3 p-4">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={c.author.avatarUrl} />
                                                    <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                                        <span className="font-medium">{c.author.name}</span>
                                                        <span className="text-muted-foreground">• {formatDate(c.createdAt.toString())}</span>
                                                    </div>
                                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{c.content}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }


export default JournalDetailDisplay