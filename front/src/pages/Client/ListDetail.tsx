import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Users2, MapPin, Pencil, Trash2, MessageSquare, Share2, Settings, Plus, CalendarDays } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import formatDate from "@/utils/formatDate";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import Members from "@/components/ListDetail/Members";
import { Dialog, DialogDescription, DialogFooter, DialogTitle, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { enqueueSnackbar } from "notistack";
import AddJournalDialog from "@/components/ListDetail/AddJournal";
import { FaRegComment, FaRegHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import type { List } from "@/types/ListType";
import type { Destination } from "@/types/DestinationType";
import type { JournalDetail } from "@/types/JournalType";
import toYMD from "@/utils/toYMD";
import InviteUser from "@/components/ListDetail/InviteUser";


export default function TravelListDetail() {
  const { id: listId } = useParams();
  const [listData, setListData] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const user = useSelector((state: any) => state.user);
  const isThisListMe = listData?.owner?._id === user.id;
  const [addForm, setAddForm] = useState({
    imageFile: null as File | null,
    imageUrl: "",
    name: "",
    country: "",
    status: "" as "" | "wishlist" | "planned" | "completed",
    datePlanned: "",
    dateVisited: "",
    notes: "",
    journals: [] as JournalDetail[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journals, setJournals] = useState<JournalDetail[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Destination | null>(null);
  const [editForm, setEditForm] = useState({
    imageFile: null as File | null,
    imageUrl: "",
    name: "",
    country: "",
    status: "" as "" | "wishlist" | "planned" | "completed",
    datePlanned: "",
    dateVisited: "",
    notes: "",
  });

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
    if (!listId) return;
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

  function openEdit(dest: Destination) {
    setEditTarget(dest);
    setEditForm({
      imageFile: null,
      imageUrl: dest.image.url || "",
      name: dest.name || "",
      country: dest.country || "",
      status: (dest.status as any) || "",
      datePlanned: toYMD(dest.datePlanned as any),
      dateVisited: toYMD(dest.dateVisited as any),
      notes: dest.notes || "",
    });
    setEditOpen(true);
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditForm((s) => ({ ...s, imageFile: file, imageUrl: url }));
  }

  function handleEditStatusChange(next: "wishlist" | "planned" | "completed") {
    setEditForm((s) => {
      if (next === "wishlist") return { ...s, status: next, datePlanned: "", dateVisited: "" };
      if (next === "planned") return { ...s, status: next, dateVisited: "" };
      return { ...s, status: next };
    });
  }

  function resetAddForm() {
    setAddForm({
      imageFile: null,
      imageUrl: "",
      name: "",
      country: "",
      status: "",
      datePlanned: "",
      dateVisited: "",
      notes: "",
      journals: []
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAddForm((s) => ({ ...s, imageFile: file, imageUrl: url }));
  }

  function handleStatusChange(next: "wishlist" | "planned" | "completed") {
    setAddForm((s) => {
      if (next === "wishlist") return { ...s, status: next, datePlanned: "", dateVisited: "" };
      if (next === "planned") return { ...s, status: next, dateVisited: "" };
      return { ...s, status: next };
    });
  }

  const canSubmit =
    addForm.name.trim() &&
    addForm.country.trim() &&
    addForm.status &&
    ((addForm.status === "wishlist") ||
      (addForm.status === "planned" && addForm.datePlanned) ||
      (addForm.status === "completed" && addForm.datePlanned && addForm.dateVisited));

  async function handleAdd() {
    if (!canSubmit || !listId) return;

    setIsSubmitting(true);

    try {
      let imageData = null;

      if (addForm.imageFile) {
        const formData = new FormData();
        formData.append("image", addForm.imageFile);

        const uploadResponse = await controller.post(`${endpoints.upload}/image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (uploadResponse.success && uploadResponse.data?.url) {
          imageData = {
            url: uploadResponse.data.url,
            public_id: uploadResponse.data.public_id,
          };
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const destinationPayload = {
        name: addForm.name.trim(),
        country: addForm.country.trim(),
        status: addForm.status,
        datePlanned: addForm.datePlanned || null,
        dateVisited: addForm.dateVisited || null,
        notes: addForm.notes.trim() || null,
        image: imageData,
        listId: listId,
        journal: journals,
      };

      const response = await controller.post(endpoints.destinations, destinationPayload);

      if (response && response.data) {
        const newDestination = response.data;
        setListData((prev: any) => {
          const prevDests = prev?.destinations ?? [];
          return { ...prev, destinations: [newDestination, ...prevDests] };
        });

        setAddOpen(false);
        resetAddForm();

        enqueueSnackbar(`✅ Destination "${addForm.name}" created successfully!`, { variant: "success" });
      } else {
        throw new Error("Failed to create destination");
      }
    } catch (error: any) {
      console.error("Error creating destination:", error);
      enqueueSnackbar(`❌ Failed to create destination: ${error.message || "Unknown error"}`, { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCreateJournal = async (payload: any) => {
    if (!listId) throw new Error("No list ID");

    try {
      const photoUrls = [];
      if (payload.photos && payload.photos.length > 0) {
        for (const photoFile of payload.photos) {
          const formData = new FormData();
          formData.append("image", photoFile);

          const uploadResponse = await controller.post(`${endpoints.upload}/image`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (uploadResponse.success && uploadResponse.data?.url) {
            photoUrls.push({
              url: uploadResponse.data.url,
              public_id: uploadResponse.data.public_id,
            });
          }
        }
      }

      const journalPayload = {
        title: payload.title,
        content: payload.content,
        destination: payload.destination,
        listId: listId,
        public: payload.public,
        photos: photoUrls
      };

      const response = await controller.post(endpoints.journals, journalPayload);

      if (response && response.data) {
        setJournals(prev => [response.data, ...prev]);
        setListData(prev => {
          if (!prev) return prev;
          const updatedDestinations = prev.destinations.map(dest => {
            const destId = typeof payload.destination === 'object' ? payload.destination.id : payload.destination;
            if (dest._id === destId) {
              return {
                ...dest,
                journals: [
                  ...(Array.isArray(dest.journals) ? dest.journals : []),
                  response.data
                ]
              };
            }
            return dest;
          });
          return { ...prev, destinations: updatedDestinations };
        });
        enqueueSnackbar(`✅ Journal entry "${payload.title}" created successfully!`, { variant: "success" });
      } else {
        throw new Error("Failed to create journal entry");
      }
    } catch (error: any) {
      console.error("Error creating journal:", error);
      enqueueSnackbar(`❌ Failed to create journal: ${error.message || "Unknown error"}`, { variant: "error" });
      throw error;
    }
  };

  const handleDeleteDestination = async (dest: Destination) => {
    try {
      const resp = await controller.deleteOne(endpoints.destinations, dest._id);

      if (resp && resp.success) {
        setListData((prev: any) => {
          if (!prev) return prev;
          const updatedDestinations = (prev.destinations || []).filter(
            (d: Destination) => d._id !== dest._id
          );
          return { ...prev, destinations: updatedDestinations };
        });
        enqueueSnackbar("Destination deleted successfully", { variant: "success" });

        if (dest.image?.public_id) {
          try {
            const encoded = encodeURIComponent(dest.image.public_id);
            await controller.deleteOne(`${endpoints.upload}/image`, encoded);
          } catch (imgErr) {
            console.warn("Cloudinary image delete failed (non-fatal):", imgErr);
          }
        }
      } else {
        enqueueSnackbar(resp?.message || "Failed to delete destination", { variant: "error" });
      }
    } catch (err: any) {
      console.error("Delete destination error:", err);
      enqueueSnackbar(err?.message || "Failed to delete destination", { variant: "error" });
    }
  };

  const handleEditDestination = async (): Promise<void> => {
    if (!editTarget) return;

    setSavingEdit(true);
    try {
      let newImageData: { url: string; public_id: string } | null = null;
      if (editForm.imageFile) {
        const fd = new FormData();
        fd.append("image", editForm.imageFile);

        const uploadRes = await controller.post(`${endpoints.upload}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!uploadRes?.success || !uploadRes.data?.url) {
          throw new Error("Image upload failed");
        }

        newImageData = {
          url: uploadRes.data.url,
          public_id: uploadRes.data.public_id,
        };
      }

      const patch: Partial<Destination> = {
        name: editForm.name.trim(),
        country: editForm.country.trim(),
        status: editForm.status as any,
        notes: editForm.notes?.trim() ?? "",
        datePlanned:
          editForm.status === "planned" || editForm.status === "completed"
            ? (editForm.datePlanned || undefined)
            : undefined,
        dateVisited:
          editForm.status === "completed"
            ? (editForm.dateVisited || undefined)
            : undefined,
        ...(newImageData ? { image: newImageData } : {}),
      };

      const resp = await controller.update(endpoints.destinations, editTarget._id, patch);
      if (!resp || !resp.data) {
        throw new Error(resp?.message || "Failed to update destination");
      }

      const updated = resp.data;
      setListData((prev: any) => {
        if (!prev) return prev;
        const updatedDestinations = (prev.destinations || []).map((d: Destination) =>
          d._id === editTarget._id ? { ...d, ...updated } : d
        );
        return { ...prev, destinations: updatedDestinations };
      });



      enqueueSnackbar(resp.message || "Destination updated successfully", { variant: "success" });
      setEditOpen(false);
      setEditTarget(null);
    } catch (err: any) {
      console.error("Error updating destination:", err);
      enqueueSnackbar(err?.message || "Failed to update destination", { variant: "error" });
    } finally {
      setSavingEdit(false);
    }
  }

  useEffect(() => {
    const fetchJournals = async () => {
      if (!listId) return;

      setJournalsLoading(true);
      try {
        const response = await controller.getAll(`${endpoints.journals}/list/${listId}`);
        if (response && response.data) {
          setJournals(response.data);
        }
      } catch (error: any) {
        console.error("Error fetching journals:", error);
        enqueueSnackbar(`Failed to fetch journals: ${error.message}`, { variant: "error" });
      } finally {
        setJournalsLoading(false);
      }
    };
    const fetchListData = async () => {
      if (!listId) {
        setError("No list ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await controller.getOne(endpoints.lists, listId);

        if (response && response.data) {
          setListData(response.data);
        } else {
          setError("Failed to fetch list data");
        }
      } catch (err: any) {
        console.error("Error fetching list:", err);
        setError(err.message || "Failed to fetch list data");
      } finally {
        setLoading(false);
      }
    };
    fetchListData();
    fetchJournals();
  }, [listId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading list details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const canSee = (j: any) => {
    const authorId =
      (j?.author && (j.author._id || j.author.id)) || j?.author;
    return j?.public || String(authorId) === String(user.id);
  };

  const visibleJournals = journals.filter(canSee);

  const listTitle = listData?.title || "European Adventure 2024";
  const description = listData?.description || "Exploring the historic cities and beautiful landscapes of Europe";
  const tags = listData?.tags || ["culture", "history", "food"];


  const statDestinations = listData?.destinations?.length || 0;
  const statCompleted = listData?.destinations?.filter((d: any) => d.status === "completed")?.length || 0;
  const statMembers = listData?.collaborators?.length || 0;
  const statJournals = listData?.destinations?.reduce((sum, d) => sum + (Array.isArray(d.journals) ? d.journals.length : 0), 0) || 0;

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16">
      {/* Back */}
      <div className="mb-4 text-sm">
        <Link to={"/dashboard"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">← Back to Dashboard</Link>
      </div>

      {/* Cover / Hero */}
      <div className="relative mb-6 overflow-hidden rounded-xl border bg-muted/60">
        {listData?.coverImage ? (
          <img
            src={listData.coverImage}
            alt={listTitle}
            className="h-180 w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/5] w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">{listTitle}</h1>
          <p className="mt-2 max-w-2xl text-white/90">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t: string) => (
              <Badge key={t} variant="secondary" className="bg-white/90 text-gray-900">#{t}</Badge>
            ))}
          </div>

          <div className="mt-4 flex gap-2 self-end">
            <Button variant="secondary" className="bg-white/90 text-gray-900"><MessageSquare className="mr-2 h-4 w-4" /> Chat</Button>
            <Button variant="secondary" className="bg-white/90 text-gray-900"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            {isThisListMe && (
              <Button
                variant="secondary"
                className="bg-white/90 text-gray-900"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Button>
            )}

          </div>
        </div>
      </div>
      {/* SETTINGS */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Button
              variant="outline"
              onClick={() => { setSettingsOpen(false); setInviteOpen(true); }}
            >
              Invite collaborators
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSettingsOpen(false); setEditListOpen(true); }}
            >
              Edit list
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* INVITE COLLABORATORS */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite collaborators</DialogTitle>
          </DialogHeader>

          <InviteUser
            currentUserId={user.id}
            collaborators={(listData?.collaborators || []).map((user: any) => ({
              ...user,
              id: user._id || user.id,
              avatarUrl: user.profileImage?.url
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
                  ) : (
                    <span className="text-muted-foreground text-xs">No cover</span>
                  )}
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
            <Button variant="secondary" onClick={() => setEditListOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleEditList}
              disabled={!listForm.title.trim()}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<MapPin className="h-5 w-5 text-blue-500" />} value={statDestinations} label="Destinations" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} value={statCompleted} label="Completed" />
        <StatCard icon={<Users2 className="h-5 w-5 text-purple-600" />} value={statMembers} label="Members" />
        <StatCard icon={<Pencil className="h-5 w-5 text-orange-500" />} value={statJournals} label="Journal Entries" />
      </div>
      {listData?.collaborators && listData?.collaborators.length > 0 && (
        <Members
          isThisListMe={isThisListMe}
          currentUserId={user.id}
          collaborators={(listData?.collaborators || []).map((user: any) => ({
            ...user,
            id: user._id || user.id,
            avatarUrl: user.profileImage?.url
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

      )}


      {/* Tabs */}
      <Tabs defaultValue="destinations" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        {/* Destinations Tab */}
        <TabsContent value="destinations">
          {isThisListMe && (
            <div className="mb-4 flex justify-end">
              <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetAddForm(); }}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Destination
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Destination</DialogTitle>
                    <DialogDescription>Fill in the details for the new destination.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    {/* Image */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Image</p>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-32 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                          {addForm.imageUrl ? (
                            <img src={addForm.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-muted-foreground text-xs">No image</span>
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                          <span>Upload</span>
                          <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>

                    {/* Basics */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Name *</p>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          placeholder="e.g., Paris"
                          value={addForm.name}
                          onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Country *</p>
                        <input
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          placeholder="e.g., France"
                          value={addForm.country}
                          onChange={(e) => setAddForm((s) => ({ ...s, country: e.target.value }))}
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-2 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Status *</p>
                        <select
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          value={addForm.status}
                          onChange={(e) => handleStatusChange(e.target.value as any)}
                        >
                          <option value="" disabled>Select status</option>
                          <option value="wishlist">Wishlist</option>
                          <option value="planned">Planned</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Dates (conditional) */}
                    {addForm.status === "planned" && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Planned Date *</p>
                          <input
                            type="date"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={addForm.datePlanned}
                            onChange={(e) => setAddForm((s) => ({ ...s, datePlanned: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    {addForm.status === "completed" && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Planned Date *</p>
                          <input
                            type="date"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={addForm.datePlanned}
                            onChange={(e) => setAddForm((s) => ({ ...s, datePlanned: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Visited Date *</p>
                          <input
                            type="date"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={addForm.dateVisited}
                            onChange={(e) => setAddForm((s) => ({ ...s, dateVisited: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <textarea
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        rows={4}
                        placeholder="Anything important about this destination..."
                        value={addForm.notes}
                        onChange={(e) => setAddForm((s) => ({ ...s, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="secondary" onClick={() => { setAddOpen(false); resetAddForm(); }} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button variant="default" onClick={handleAdd} disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card>
            {listData?.destinations ? (
              listData.destinations.map((d: Destination) => (
                <div key={d._id} className="grid grid-cols-2 md:grid-cols-[320px,1fr]">
                  {/* image placeholder */}
                  {d.image.url ? (
                    <img src={d.image.url} alt={d.name || 'Destination'} className="h-64 w-full object-cover" />
                  ) : (
                    <div className="h-64 w-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  {/* details */}
                  <div className="border-t md:border-l md:border-t-0">
                    <div className="flex items-start justify-between p-6">
                      <div>
                        <h3 className="text-xl font-semibold">{d.name}</h3>
                        <p className="text-muted-foreground">{d.country}</p>
                        <div className="mt-2">
                          <StatusPill status={d.status} />
                        </div>
                        {/* {d.rating && (
                          <div className="mt-3 flex items-center gap-1">
                            {new Array(5).fill(null).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < (d.rating || 0) ? "fill-current" : "opacity-30"}`} />
                            ))}
                            <span className="ml-1 text-sm text-muted-foreground">({d.rating}/5)</span>
                          </div>
                        )} */}
                        <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{d.notes}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {d.datePlanned && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Planned: {formatDate(d.datePlanned)}</span>
                          )}
                          {d.dateVisited && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Visited: {formatDate(d.dateVisited)}</span>
                          )}
                          {d.journals.length > 0 ? (
                            <span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> {d.journals.length} journal entries</span>
                          ) : null}
                        </div>
                      </div>
                      {isThisListMe && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openEdit(d)}
                            variant="ghost"
                            size="icon"
                            aria-label="Edit destination"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteDestination(d)}
                            variant="ghost"
                            size="icon"
                            aria-label="Delete destination"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>No destinations yet. Click "Add Destination" to get started!</p>
              </div>
            )}
          </Card>
          <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditTarget(null); }}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Destination</DialogTitle>
                <DialogDescription>Update details for this destination.</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Image */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Image</p>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-32 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                      {editForm.imageUrl ? (
                        <img src={editForm.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No image</span>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                      <span>Upload new</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={handleEditFileChange} />
                    </label>
                  </div>
                </div>

                {/* Basics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Name *</p>
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={editForm.name}
                      onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Country *</p>
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={editForm.country}
                      onChange={(e) => setEditForm((s) => ({ ...s, country: e.target.value }))}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Status *</p>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={editForm.status}
                      onChange={(e) => handleEditStatusChange(e.target.value as any)}
                    >
                      <option value="" disabled>Select status</option>
                      <option value="wishlist">Wishlist</option>
                      <option value="planned">Planned</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Dates (conditional) */}
                {editForm.status === "planned" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Planned Date *</p>
                      <input
                        type="date"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={editForm.datePlanned}
                        onChange={(e) => setEditForm((s) => ({ ...s, datePlanned: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {editForm.status === "completed" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Planned Date *</p>
                      <input
                        type="date"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={editForm.datePlanned}
                        onChange={(e) => setEditForm((s) => ({ ...s, datePlanned: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Visited Date *</p>
                      <input
                        type="date"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={editForm.dateVisited}
                        onChange={(e) => setEditForm((s) => ({ ...s, dateVisited: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <textarea
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    rows={4}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((s) => ({ ...s, notes: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => { setEditOpen(false); setEditTarget(null); }} disabled={savingEdit}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  disabled={savingEdit || !editTarget || !editForm.name.trim() || !editForm.country.trim() || !editForm.status}
                  onClick={handleEditDestination}
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </TabsContent>

        {/* Journals Tab */}
        <TabsContent value="journals">
          <div className="mb-4 flex justify-end">
            <AddJournalDialog
              destinations={listData?.destinations || []}
              onCreate={handleCreateJournal}
              triggerLabel="Write Entry"
            />
          </div>

          <div className="space-y-4">
            {journalsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading journals...</p>
              </div>
            ) : visibleJournals.length > 0 ? (
              visibleJournals.map((j: JournalDetail) => (
                <Card key={j.id}>
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Destination: {j.destination.name}</div>

                        <h3 className="text-2xl font-semibold">{j.title}</h3>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">{formatDate(j.createdAt ? (typeof j.createdAt === 'string' ? j.createdAt : j.createdAt.toISOString()) : "")}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={j.public ? "bg-emerald-600 text-white" : "bg-gray-700 text-white"}>
                        {j.public ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <p className="max-w-4xl text-muted-foreground">{j.content?.substring(0, 300)}{j.content?.length > 300 ? "..." : ""}</p>
                    <div className="flex items-center gap-3">
                      {j.photos?.map((photo: any, i: number) => (
                        <div key={i} className="h-16 w-16 rounded-md bg-muted overflow-hidden">
                          {photo.url ? (
                            <img src={photo.url} alt={`Journal photo ${i + 1}`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {j.likes != null && <span className="flex gap-2 items-center"><FaRegHeart /> {Array.isArray(j.likes) ? j.likes.length : j.likes} likes</span>}
                      {j.comments != null && <span className="flex gap-2 items-center"><FaRegComment /> {Array.isArray(j.comments) ? j.comments.length : j.comments} comments</span>}
                      <div className="ml-auto">
                        <Link to={`/journals/${j.id}`}>
                          <Button variant="outline" size="sm">Read More</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No journal entries yet. Click "Write Entry" to get started!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          {(() => {
            const publicPhotos = journals
              .filter((j) => j.public && Array.isArray(j.photos) && j.photos.length > 0)
              .flatMap((j) => j.photos);

            if (publicPhotos.length === 0) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  <span>No images to display yet. You can add some by creating a journal entry.</span>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {publicPhotos.map((photo, i) => (
                  <div key={i} className="aspect-[4/3] w-full rounded-lg bg-muted overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`Journal photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </TabsContent>

      </Tabs>
    </div>
  );
}


