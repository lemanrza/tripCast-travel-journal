import React from 'react'
import { Button } from './ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageSquarePlus, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import initials from '@/utils/initials';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import formatDate from '@/utils/formatDate';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import timeAgo from '@/utils/timeAgo';
import type { User } from '@/types/userType';
import type { JournalComment, JournalDetail } from '@/types/JournalType';

function JournalDetailDisplay({
    journal,
    comments = [],
    onBack,
    onToggleLike,
    onAddComment,
    user
}: {
    journal?: JournalDetail;
    comments?: JournalComment[];
    onBack?: () => void;
    onToggleLike?: (liked: boolean) => Promise<void> | void;
    onAddComment?: (text: string) => Promise<void> | void;
    user: User | null
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

    // const [liked, setLiked] = React.useState(!!journal.likedByMe);
    const [open, setOpen] = React.useState(false);
    const [content, setContent] = React.useState("");

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
const likedByMe = journal.likes.includes(user?._id ?? "");
    const scrollBy = (dir: -1 | 1) => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
    };

const handleLike = async () => {
    if (!onToggleLike) return;
    await onToggleLike(!likedByMe);
};
    const resetForm = () => {
        setContent("");
    };

    const handleAdd = async () => {
        if (!content.trim()) return;
        
        try {
            await onAddComment?.(content.trim());
            setOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const canSubmit = content.trim().length > 0;

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
                            <AvatarImage src={journal.author.profileImage?.url} />
                            <AvatarFallback>{initials(journal.author.fullName ?? "")}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-semibold leading-tight">{journal.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                by <span className="font-medium">{journal.author.fullName}</span> • {formatDate(journal.createdAt.toString())}
                            </p>
                        </div>
                    </div>

                    {/* Like */}
                    <div className="flex items-center gap-2">
                        <Button variant={likedByMe ? "default" : "outline"} size="sm" className="gap-2" onClick={handleLike} aria-pressed={likedByMe}>
                            <Heart className={`h-4 w-4 ${likedByMe ? "fill-current" : ""}`} />
                            {likedByMe ? "Liked" : "Like"}
                        </Button>
                        <span className="text-sm text-muted-foreground">{journal.likes.length} {journal.likes.length === 1 ? "like" : "likes"}</span>
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
                    <Card className="w-full max-w-5xl mt-3 mx-auto border-muted-foreground/20 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <CardTitle className="text-xl">Comments</CardTitle>

                            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2" size="sm" disabled={!user}>
                                        <MessageSquarePlus className="h-4 w-4" /> Add comment
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Add a comment</DialogTitle>
                                        <DialogDescription>
                                            Share your thoughts. This is just the UI; wire it to your backend as needed.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label htmlFor="author" className="text-sm font-medium">Name</label>
                                            <Input
                                                id="author"
                                                placeholder="Your name"
                                                value={user?.fullName || ""}
                                                readOnly
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="content" className="text-sm font-medium">Comment</label>
                                            <Textarea
                                                id="content"
                                                placeholder="Write your comment..."
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter className="gap-2 sm:gap-3">
                                        <Button variant="ghost" onClick={() => setOpen(false)} className="gap-2">
                                            <X className="h-4 w-4" /> Cancel
                                        </Button>
                                        <Button onClick={handleAdd} disabled={!canSubmit} className="gap-2">
                                            <Send className="h-4 w-4" /> Post
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        <Separator />

                        <CardContent className="p-0">
                            {comments.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">No comments yet.</div>
                            ) : (
                                <ScrollArea className="h-[360px]">
                                    <ul className="divide-y">
                                        {comments.map((c) => (
                                            <li key={c.id} className="p-4 hover:bg-muted/40 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        {c.author.avatarUrl ? (
                                                            <AvatarImage src={c.author.avatarUrl} alt={c.author.name} />
                                                        ) : (
                                                            <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
                                                        )}
                                                    </Avatar>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium leading-none">{c.author.name}</span>
                                                            <span className="text-xs text-muted-foreground">• {timeAgo(c.createdAt.toString())}</span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                            {c.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


export default JournalDetailDisplay