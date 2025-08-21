import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Plus, X } from "lucide-react";
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
  collaboratorsRequest?: CollabReq[];
};

type MembersProps = {
  owner: Member;
  collaborators: Member[];
  onSearchUsers: (query: string) => Promise<User[]>;
  onInvite?: (userEmail: string) => Promise<void>;
  onRemoveCollaborator?: (userId: string) => Promise<void>;
  isThisListMe: boolean; 
  currentUserId: string;
};

export default function Members({
  owner,
  collaborators,
  onSearchUsers,
  onInvite,
  onRemoveCollaborator,
  isThisListMe,
  currentUserId,
}: MembersProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<User[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [pendingEmails, setPendingEmails] = useState<Set<string>>(new Set());

  const [localCollabs, setLocalCollabs] = useState<Member[]>(collaborators);
  useEffect(() => setLocalCollabs(collaborators), [collaborators]);

  const { id: listId } = useParams();
  const normEmail = (e?: string) => (e || "").trim().toLowerCase();

  const collaboratorIds = useMemo(
    () => new Set(localCollabs.map((c) => String(c.id))),
    [localCollabs]
  );

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

  const idOf = (x: any) => String(x?._id ?? x ?? "");
  const hasPendingForThisListFromMe = (user: User, listId?: string, meId?: string) =>
    Array.isArray(user.collaboratorsRequest) &&
    user.collaboratorsRequest.some((r) => idOf(r.list) === idOf(listId) && idOf(r.fromUser) === idOf(meId));

  const handleInvite = async (user: User) => {
    const emailKey = normEmail(user.email);
    const accepted = collaboratorIds.has(user.id);
    const pendingAlready = hasPendingForThisListFromMe(user, listId, currentUserId);

    if (accepted) {
      enqueueSnackbar("User is already a collaborator", { variant: "info" });
      return;
    }
    if (pendingAlready || pendingEmails.has(emailKey)) {
      setPendingEmails((prev) => new Set(prev).add(emailKey));
      enqueueSnackbar("Invite already sent", { variant: "info" });
      return;
    }

    try {
      setInvitingId(user.id);
      if (onInvite) {
        await onInvite(user.email);
      } else {
        if (!listId) throw new Error("No list id in URL.");
        const resp = await controller.post(`${endpoints.lists}/${listId}/invite`, {
          collaboratorEmail: user.email,
        });
        if (!resp || resp.success === false) throw new Error(resp?.message || "Invite failed");
      }
      setPendingEmails((prev) => new Set(prev).add(emailKey));
      enqueueSnackbar("Invitation sent ✅", { variant: "success" });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Invite failed";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setInvitingId(null);
    }
  };

  const removeCollaborator = async (uid: string) => {
    const prev = localCollabs;
    setLocalCollabs((p) => p.filter((c) => c.id !== uid));

    try {
      if (onRemoveCollaborator) {
        await onRemoveCollaborator(uid);
      } else {
        if (!listId) throw new Error("No list id in URL.");
        await controller.deleteOne(`${endpoints.lists}/${listId}/collaborators`, uid);
      }
      enqueueSnackbar("Collaborator removed", { variant: "success" });
    } catch (e: any) {
      // rollback
      setLocalCollabs(prev);
      const msg = e?.response?.data?.message || e?.message || "Failed to remove collaborator";
      enqueueSnackbar(msg, { variant: "error" });
    }
  };

  const Chip = ({
    member,
    role,
    removable,
    onRemove,
  }: {
    member: Member;
    role: "Owner" | "Viewer";
    removable?: boolean;
    onRemove?: () => void;
  }) => (
    <div className="relative group inline-flex items-center gap-2 px-3 pr-8 text-sm transition hover:bg-card">
      <Avatar className="h-7 w-7">
        <AvatarImage src={member.profileImage?.url} />
        <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[140px] truncate font-medium text-[16px]">{member.fullName}</span>
        <span className="text-[11px] text-muted-foreground">{role}</span>
      </div>

      {removable && (
        <span
          title="Remove"
          onClick={onRemove}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 w-5 cursor-pointer select-none items-center justify-center rounded-full border bg-background text-muted-foreground/90 hover:text-destructive group-hover:flex"
        >
          <X className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl">Team Members</CardTitle>

        <Dialog open={open} onOpenChange={setOpen}>
          {isThisListMe && (
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Invite
              </Button>
            </DialogTrigger>
          )}

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
                    {results.map((u) => {
                      const accepted = collaboratorIds.has(String(u.id));
                      const pending = pendingEmails.has(normEmail(u.email));
                      const disabled = accepted || pending || invitingId === u.id;
                      let label = "Invite";
                      if (accepted) label = "Accepted";
                      else if (pending) label = "Pending";
                      else if (invitingId === u.id) label = "Inviting…";

                      return (
                        <li key={u.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
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

            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* Single-line row, owner first, then viewers. Scroll if overflow */}
        <div className="overflow-x-auto">
          <div className="inline-flex w-full items-center gap-3 whitespace-nowrap">
            {/* Owner (no remove) */}
            <Chip member={owner} role="Owner" />

            {/* Viewers */}
            {localCollabs.map((m) => (
              <Chip
                key={m.id}
                member={m}
                role="Viewer"
                removable={isThisListMe && m.id !== owner.id}
                onRemove={() => removeCollaborator(m.id)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
