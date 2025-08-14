import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Plus } from "lucide-react";
import initials from "@/utils/initials";
import { useEffect, useState } from "react";

type Member = {
    id: string;
    fullName: string;
    profileImage?: { url?: string };
};

type User = {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
};

type MembersProps = {
    collaborators: Member[];
    onSearchUsers: (query: string) => Promise<User[]>;
    onInvite: (userId: string) => Promise<void>;
    isThisListMe: boolean;
};

const Members = ({ collaborators, onSearchUsers, onInvite, isThisListMe }: MembersProps) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<User[]>([]);
    const [invitingId, setInvitingId] = useState<string | null>(null);
console.log(isThisListMe)
    useEffect(() => {
        if (!open) return;
        if (!q.trim()) {
            setResults([]);
            setError(null);
            return;
        }
        const t = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await onSearchUsers(q.trim());
                setResults(data);
            } catch (e: any) {
                setError(e?.message ?? "Search failed");
            } finally {
                setLoading(false);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [q, open, onSearchUsers]);

    const handleInvite = async (userId: string) => {
        try {
            setInvitingId(userId);
            await onInvite(userId);
            setResults((r) => r.filter((u) => u.id !== userId));
        } catch (e: any) {
            setError(e?.message ?? "Invite failed");
        } finally {
            setInvitingId(null);
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-2xl">Team Members</CardTitle>
                {isThisListMe && (<Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Invite
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Invite collaborators</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Input
                                autoFocus
                                placeholder="Search by email or name…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <Separator />
                            <ScrollArea className="h-64 rounded-md border">
                                <div className="p-2">
                                    {loading && <p className="p-2 text-sm text-muted-foreground">Searching…</p>}
                                    {error && <p className="p-2 text-sm text-destructive">{error}</p>}
                                    {!loading && !error && q.trim() && results.length === 0 && (
                                        <p className="p-2 text-sm text-muted-foreground">No users found</p>
                                    )}

                                    <ul className="space-y-1">
                                        {results.map((u) => (
                                            <li
                                                key={u.id}
                                                className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={u.avatarUrl} />
                                                        <AvatarFallback>{initials(u.fullName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="leading-tight">
                                                        <div className="text-sm font-medium">{u.fullName}</div>
                                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleInvite(u.id)}
                                                    disabled={invitingId === u.id}
                                                >
                                                    {invitingId === u.id ? "Inviting…" : "Invite"}
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Close
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>)}


            </CardHeader>

            <CardContent>
                <div className="flex flex-wrap gap-6">
                    {collaborators.map((m) => (
                        <div key={m.id} className="flex min-w-[200px] items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={m.profileImage?.url} />
                                <AvatarFallback>{initials(m.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{m.fullName}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default Members;
