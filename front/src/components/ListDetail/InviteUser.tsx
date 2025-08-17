import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import initials from "@/utils/initials";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { enqueueSnackbar } from "notistack";

type Member = {
    id: string;
    fullName: string;
    profileImage?: { url?: string };
};
type CollabReq = {
    fromUser: string | { _id: string };
    list: string | { _id: string };
};

type User = {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    collaboratorsRequest?: CollabReq[]
};

type MembersProps = {
    collaborators: Member[];
    onSearchUsers: (query: string) => Promise<User[]>;
    onInvite?: (userEmail: string) => Promise<void>;
    currentUserId: string
};

const InviteUser = ({ collaborators, onSearchUsers, onInvite, currentUserId }: MembersProps) => {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<User[]>([]);
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [pendingEmails, setPendingEmails] = useState<Set<string>>(new Set());
    const idOf = (x: any) => String(x?._id ?? x ?? "");

    const hasPendingForThisListFromMe = (
        user: User,
        listId?: string,
        meId?: string
    ) =>
        Array.isArray(user.collaboratorsRequest) &&
        user.collaboratorsRequest.some((r) => {
            const from = idOf(r.fromUser);
            const lst = idOf(r.list);
            return lst === idOf(listId) && from === idOf(meId);
        });


    const { id: listId } = useParams();

    const collaboratorIds = useMemo(
        () => new Set(collaborators.map(c => String(c.id))),
        [collaborators]
    );

    const normEmail = (e?: string) => (e || "").trim().toLowerCase();
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

    const handleInvite = async (user: User) => {
        const emailKey = normEmail(user.email);
        const accepted = collaboratorIds.has(user.id);
        const pendingAlready = hasPendingForThisListFromMe(user, listId, currentUserId);

        if (accepted) {
            enqueueSnackbar("User is already a collaborator", { variant: "info" });
            return;
        }
        if (pendingAlready || pendingEmails.has(emailKey)) {
            // ensure UI shows Pending
            setPendingEmails(prev => new Set(prev).add(emailKey));
            enqueueSnackbar("Invite already sent", { variant: "info" });
            return;
        }
        try {
            setError(null);
            setInvitingId(user.id);

            if (onInvite) {
                await onInvite(user.email);
            } else {
                if (!listId) throw new Error("No list id in URL.");
                const resp = await controller.post(`${endpoints.lists}/${listId}/invite`, {
                    collaboratorEmail: user.email,
                });
                if (!resp || resp.success === false) {
                    throw new Error(resp?.message || "Invite failed");
                }
            }
            setPendingEmails(prev => {
                const next = new Set(prev);
                next.add(emailKey);
                return next;
            });

            enqueueSnackbar("Invitation sent ✅", { variant: "success" });
        } catch (e: any) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;
            const msg = serverMsg || e?.message || "Invite failed";

            if (status === 409 || /invite already sent/i.test(msg)) {
                setPendingEmails(prev => new Set(prev).add(emailKey));
                setError(null);
                enqueueSnackbar("Invite already sent", { variant: "info" });
            } else if (status === 400 && /already a collaborator/i.test(msg)) {
                setError(null);
                enqueueSnackbar("User is already a collaborator", { variant: "info" });
            } else if (status === 404 && /not found/i.test(msg)) {
                setError("User not found");
                enqueueSnackbar("User not found", { variant: "warning" });
            } else if (status === 403) {
                setError("Only the owner can add collaborators");
                enqueueSnackbar("Only the owner can add collaborators", { variant: "error" });
            } else {
                setError(msg);
                enqueueSnackbar(msg, { variant: "error" });
            }
        } finally {
            setInvitingId(null);
        }
    };


    return (

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
                        {results.map((u) => {
                            const accepted = collaboratorIds.has(String(u.id));
                            const pending = pendingEmails.has(normEmail(u.email));
                            const disabled = accepted || pending || invitingId === u.id;
                            let label = "Invite";
                            if (accepted) label = "Accepted";
                            else if (pending) label = "Pending";
                            else if (invitingId === u.id) label = "Inviting…";

                            return (
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
                                        disabled={disabled}
                                        onClick={() => !disabled && handleInvite(u)}
                                    >
                                        {label}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </ScrollArea>
        </div>


    );
};

export default InviteUser;
