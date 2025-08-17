import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InviteUser from "@/components/ListDetail/InviteUser";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { List } from "@/types/ListType";

type Props = {
  listId: string;
  listData: List | null;
  setListData: React.Dispatch<React.SetStateAction<List | null>>;
  currentUserId: string;
  isOwner: boolean;
};

export default function ListSettingsModals({ listId, listData, setListData, currentUserId, isOwner }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editListOpen, setEditListOpen] = useState(false);

  const [listForm, setListForm] = useState({
    title: "",
    description: "",
    tagsText: "",
    isPublic: false,
    coverFile: null as File | null,
    coverPreview: "",
  });

  useEffect(() => {
    if (!editListOpen || !listData) return;
    setListForm({
      title: listData.title ?? "",
      description: listData.description ?? "",
      tagsText: (listData.tags ?? []).join(", "),
      isPublic: !!listData.isPublic,
      coverFile: null,
      coverPreview: listData.coverImage || "",
    });
  }, [editListOpen, listData]);

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setListForm((s) => ({ ...s, coverFile: file, coverPreview: url }));
  }

  async function handleEditList() {
    try {
      let newCover: string | null = null;
      if (listForm.coverFile) {
        const fd = new FormData();
        fd.append("image", listForm.coverFile);
        const uploadRes = await controller.post(`${endpoints.upload}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (!uploadRes?.success || !uploadRes.data?.url) {
          throw new Error("Cover image upload failed");
        }
        newCover = uploadRes.data.url;
      }

      const tags = listForm.tagsText.split(",").map(t => t.trim()).filter(Boolean);
      const patch: Partial<List> = {
        title: listForm.title.trim(),
        description: listForm.description.trim(),
        tags,
        isPublic: !!listForm.isPublic,
        ...(newCover ? { coverImage: newCover } : {}),
      };

      const resp = await controller.update(endpoints.lists, String(listId), patch);
      if (!resp || !resp.data) throw new Error(resp?.message || "Failed to update list");

      setListData(prev => (prev ? { ...prev, ...resp.data } : prev));
      enqueueSnackbar(resp.message || "List updated", { variant: "success" });
      setEditListOpen(false);
    } catch (err: any) {
      console.error("Edit list error:", err);
      enqueueSnackbar(err?.message || "Failed to update list", { variant: "error" });
    }
  }

  return (
    <>
      {isOwner && (
        <Button
          variant="secondary"
          className="bg-white/90 text-gray-900"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
      )}

      {/* SETTINGS */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Button variant="outline" onClick={() => { setSettingsOpen(false); setInviteOpen(true); }}>
              Invite collaborators
            </Button>
            <Button variant="outline" onClick={() => { setSettingsOpen(false); setEditListOpen(true); }}>
              Edit list
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* INVITE */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Invite collaborators</DialogTitle></DialogHeader>
          <InviteUser
            currentUserId={currentUserId}
            collaborators={(listData?.collaborators || []).map((user: any) => ({
              ...user, id: user._id || user.id, avatarUrl: user.profileImage?.url
            }))}
            onSearchUsers={async (q) => {
              const response = await controller.getAll(`${endpoints.users}/search?q=${encodeURIComponent(q)}`);
              if (response && response.data) {
                return response.data.map((u: any) => ({
                  id: u._id || u.id,
                  email: u.email,
                  fullName: u.fullName,
                  avatarUrl: u.profileImage?.url,
                  collaboratorsRequest: u.collaboratorsRequest || [],
                }));
              }
              return [];
            }}
            onInvite={async (collaboratorEmail) => {
              await controller.post(`${endpoints.lists}/${listId}/invite`, { collaboratorEmail });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* EDIT LIST */}
      <Dialog open={editListOpen} onOpenChange={setEditListOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>Update your list’s details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Cover */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Cover</p>
              <div className="flex items-center gap-4">
                <div className="h-20 w-32 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  {listForm.coverPreview ? (
                    <img src={listForm.coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                  ) : (<span className="text-muted-foreground text-xs">No cover</span>)}
                </div>
                <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                  <span>Upload new</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleCoverFileChange} />
                </label>
              </div>
            </div>

            {/* Basics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Title *</p>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={listForm.title}
                  onChange={(e) => setListForm((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tags (comma separated)</p>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. culture, history, food"
                  value={listForm.tagsText}
                  onChange={(e) => setListForm((s) => ({ ...s, tagsText: e.target.value }))}
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3">
              <input
                id="isPublic"
                type="checkbox"
                checked={listForm.isPublic}
                onChange={(e) => setListForm((s) => ({ ...s, isPublic: e.target.checked }))}
              />
              <label htmlFor="isPublic" className="text-sm">Make this list public</label>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Description</p>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={4}
                value={listForm.description}
                onChange={(e) => setListForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditListOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleEditList} disabled={!listForm.title.trim()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
