// src/components/ListHero.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Share2 } from "lucide-react";
import ChatBox from "./ChatBox";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import endpoints from "@/services/api";
import controller from "@/services/commonRequest";
import type { List } from "@/types/ListType";

type Props = {
  title: string;
  description: string;
  tags: string[];
  coverImage?: string;
  extraActions?: React.ReactNode;
};

export default function ListHero({ title, description, tags, coverImage, extraActions }: Props) {
  const [showChat, setShowChat] = useState(false);
  const { id: listId } = useParams<{ id: string }>();
  const [list, setList] = useState<List | null>(null);

  const auth = useSelector((s: any) => s.user ?? s);
  const token = localStorage.getItem("token") || "";
  const meId = auth?.id;
  // fetch list
  useEffect(() => {
    if (!listId) return;
    const fetchList = async () => {
      const data = await controller.getOne(endpoints.lists, listId);
      setList(data.data);
    };
    fetchList();
  }, [listId]);

  const ownerId = useMemo(() => {
    if (!list?.owner._id) return undefined;
    return typeof list.owner._id === "string" ? list.owner._id : list.owner._id;
  }, [list]);
  const collaboratorIds = useMemo(
    () => (list?.collaborators || []).map((c: any) => (typeof c === "string" ? c : c._id)),
    [list]
  );

  const hasAtLeastOneCollaborator = (collaboratorIds?.length || 0) >= 1;
  const isOwner = ownerId && meId && String(ownerId) === String(meId);
  const isCollaborator = meId && collaboratorIds?.some((id) => String(id) === String(meId));
  const userHasAccess = Boolean(isOwner || isCollaborator);
  const canUseChat = Boolean(userHasAccess && hasAtLeastOneCollaborator && token && meId);
  const currentGroupId =
    list?.group ? (typeof list.group === "string" ? list.group : list.group._id) : undefined;

  // lazy-create group if needed
  async function ensureGroup(): Promise<string | undefined> {
    if (!listId) return;
    if (currentGroupId) return currentGroupId;

    // controller.post(endpoint, data, headers?)
    const out = await controller.post(`${endpoints.lists}/${list?.id}/enable-chat`, {}); // returns response.data
    const gid: string = out.group;
    setList((prev) => (prev ? ({ ...prev, group: gid } as any) : prev));
    return gid;
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border bg-muted/60">
      {coverImage ? (
        <img src={coverImage} alt={title} className="h-180 w-full object-cover" />
      ) : (
        <div className="aspect-[16/5] w-full bg-muted" />
      )}

      <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
        <h1 className="text-4xl font-semibold text-white drop-shadow-sm">{title}</h1>
        <p className="mt-2 max-w-2xl text-white/90">{description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="bg-white/90 text-gray-900">
              #{t}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex gap-2 self-end">
          <Button
            variant="secondary"
            className="bg-white/90 text-gray-900"
            disabled={!canUseChat}
            title={
              !token
                ? "Please sign in"
                : !meId
                  ? "Missing user id"
                  : !userHasAccess
                    ? "Only owner/collaborators can chat"
                    : !hasAtLeastOneCollaborator
                      ? "Add a collaborator to enable chat"
                      : undefined
            }
            onClick={async () => {
              if (!canUseChat) return;
              const gid = await ensureGroup();
              if (gid) setShowChat(true);
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>

          <Button variant="secondary" className="bg-white/90 text-gray-900">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>

          {extraActions}
        </div>
      </div>

      <AnimatePresence>
        {showChat && token && meId && currentGroupId && (
          <ChatBox
            onClose={() => setShowChat(false)}
            groupId={currentGroupId}
            token={token}
            meId={meId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
