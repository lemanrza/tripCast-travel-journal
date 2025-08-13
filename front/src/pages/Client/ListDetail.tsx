import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Users2, MapPin, Pencil, Trash2, MessageSquare, Share2, Settings, Plus, Star, CalendarDays } from "lucide-react";
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


export default function TravelListDetail() {
  const { id: listId } = useParams();
  const [listData, setListData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    imageFile: null as File | null,
    imageUrl: "",
    name: "",
    country: "",
    status: "" as "" | "wishlist" | "planned" | "completed",
    datePlanned: "",
    dateVisited: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);

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
      };

      console.log("Creating destination:", destinationPayload);

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
        console.log("Destination created successfully:", newDestination);
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
      // Upload photos first if any
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

      // Create journal entry
      const journalPayload = {
        title: payload.title,
        content: payload.content,
        destination: payload.destination,
        listId: listId,
        public: payload.public,
        photos: photoUrls,
      };

      const response = await controller.post(endpoints.journals, journalPayload);

      if (response && response.data) {
        // Add to local state
        setJournals(prev => [response.data, ...prev]);
        enqueueSnackbar(`✅ Journal entry "${payload.title}" created successfully!`, { variant: "success" });
      } else {
        throw new Error("Failed to create journal entry");
      }
    } catch (error: any) {
      console.error("Error creating journal:", error);
      enqueueSnackbar(`❌ Failed to create journal: ${error.message || "Unknown error"}`, { variant: "error" });
      throw error; // Re-throw so the dialog can handle it
    }
  };

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
          console.log("Fetched list data:", response.data);
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

  const listTitle = listData?.title || "European Adventure 2024";
  const description = listData?.description || "Exploring the historic cities and beautiful landscapes of Europe";
  const tags = listData?.tags || ["culture", "history", "food"];

  const photos = new Array(8).fill(null);

  const statDestinations = listData?.destinations?.length || 0;
  const statCompleted = listData?.destinations?.filter((d: any) => d.status === "completed")?.length || 0;
  const statMembers = listData?.collaborators?.length || 0;

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
            className="aspect-[16/5] w-full object-cover"
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
            <Button variant="secondary" className="bg-white/90 text-gray-900"><Settings className="mr-2 h-4 w-4" /> Settings</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<MapPin className="h-5 w-5 text-blue-500" />} value={statDestinations} label="Destinations" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} value={statCompleted} label="Completed" />
        <StatCard icon={<Users2 className="h-5 w-5 text-purple-600" />} value={statMembers} label="Members" />
        {/* <StatCard icon={<Pencil className="h-5 w-5 text-orange-500" />} value={statJournals} label="Journal Entries" /> */}
      </div>

      <Members
        collaborators={listData?.collaborators || []}
        onSearchUsers={async (q) => {
          const response = await controller.getAll(`${endpoints.users}/search?q=${encodeURIComponent(q)}`);
          if (response && response.data) {
            return response.data.map((user: any) => ({
              ...user,
              id: user._id || user.id,
              avatarUrl: user.profileImage?.url
            }));
          }
          return [];
        }}
        onInvite={async (userId) => {
          const response = await controller.post(`${endpoints.lists}/${listId}/invite`, {
            userId,
          });
          if (!response || !response.success) {
            throw new Error("Invite failed");
          }
        }}
      />

      {/* Tabs */}
      <Tabs defaultValue="destinations" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        {/* Destinations Tab */}
        <TabsContent value="destinations">
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


          <Card>
            {listData?.destinations?.length > 0 ? (
              listData.destinations.map((d: any) => (
                <div key={d.id || d._id} className="grid grid-cols-2 md:grid-cols-[320px,1fr]">
                  {/* image placeholder */}
                  {d.image?.url ? (
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
                        {d.rating && (
                          <div className="mt-3 flex items-center gap-1">
                            {new Array(5).fill(null).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < (d.rating || 0) ? "fill-current" : "opacity-30"}`} />
                            ))}
                            <span className="ml-1 text-sm text-muted-foreground">({d.rating}/5)</span>
                          </div>
                        )}
                        <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{d.notes}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {d.datePlanned && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Planned: {formatDate(d.datePlanned)}</span>
                          )}
                          {d.dateVisited && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Visited: {formatDate(d.dateVisited)}</span>
                          )}
                          {d.journalCount ? (
                            <span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> {d.journalCount} journal entries</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" aria-label="Edit destination"><Pencil className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Delete destination"><Trash2 className="h-5 w-5" /></Button>
                      </div>
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
            ) : journals.length > 0 ? (
              journals.map((j: any) => (
                <Card key={j.id || j._id}>
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold">{j.title}</h3>
                        <div className="text-sm text-muted-foreground">{formatDate(j.createdAt)}</div>
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
                        <Link to={`/journals/${j.id || j._id}`}>
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
          <div className="mb-4 flex justify-end">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Upload Photos</Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {photos.map((_, i) => (
              <div key={i} className="aspect-[4/3] w-full rounded-lg bg-muted" />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


