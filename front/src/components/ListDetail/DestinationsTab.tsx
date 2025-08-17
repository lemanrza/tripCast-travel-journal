// src/components/travel/DestinationsTab.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import DestinationCard from "./DestinationCard";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import toYMD from "@/utils/toYMD";
import { enqueueSnackbar } from "notistack";
import type { Destination } from "@/types/DestinationType";
import type { List } from "@/types/ListType";
import { getEntityId } from "@/utils/entityId";

type Props = {
  listId: string;
  listData: List | null;
  setListData: React.Dispatch<React.SetStateAction<List | null>>;
  isOwner: boolean;
};

export default function DestinationsTab({ listId, listData, setListData, isOwner }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const canSubmit =
    addForm.name.trim() &&
    addForm.country.trim() &&
    addForm.status &&
    ((addForm.status === "wishlist") ||
      (addForm.status === "planned" && addForm.datePlanned) ||
      (addForm.status === "completed" && addForm.datePlanned && addForm.dateVisited));

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

  async function handleAdd() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      let imageData: { url: string; public_id: string } | null = null;
      if (addForm.imageFile) {
        const fd = new FormData();
        fd.append("image", addForm.imageFile);
        const uploadRes = await controller.post(`${endpoints.upload}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (!uploadRes?.success || !uploadRes.data?.url) {
          throw new Error("Failed to upload image");
        }
        imageData = { url: uploadRes.data.url, public_id: uploadRes.data.public_id };
      }

      const payload = {
        name: addForm.name.trim(),
        country: addForm.country.trim(),
        status: addForm.status,
        datePlanned: addForm.datePlanned || null,
        dateVisited: addForm.dateVisited || null,
        notes: addForm.notes.trim() || null,
        image: imageData,
        listId,
        journal: [], 
      };

      const response = await controller.post(endpoints.destinations, payload);
      if (!response?.data) throw new Error("Failed to create destination");

      const newDestination = response.data as Destination;
      setAddOpen(false);
      resetAddForm();

      setListData((prev: any) => {
        const prevDests = prev?.destinations ?? [];
        return { ...prev, destinations: [newDestination, ...prevDests] };
      });

      enqueueSnackbar(`✅ Destination "${addForm.name}" created successfully!`, { variant: "success" });
    } catch (err: any) {
      console.error("Error creating destination:", err);
      enqueueSnackbar(err?.message || "Failed to create destination", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEdit(dest: Destination) {
    setEditTarget(dest);
    setEditForm({
      imageFile: null,
      imageUrl: dest.image?.url || "",
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

  async function handleEditDestination() {
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
        newImageData = { url: uploadRes.data.url, public_id: uploadRes.data.public_id };
      }

      const patch: Partial<Destination> = {
        name: editForm.name.trim(),
        country: editForm.country.trim(),
        status: editForm.status as any,
        notes: editForm.notes?.trim() ?? "",
        datePlanned: editForm.status === "planned" || editForm.status === "completed" ? (editForm.datePlanned || undefined) : undefined,
        dateVisited: editForm.status === "completed" ? (editForm.dateVisited || undefined) : undefined,
        ...(newImageData ? { image: newImageData } : {}),
      };

      const resp = await controller.update(endpoints.destinations, getEntityId(editTarget), patch);
      if (!resp || !resp.data) throw new Error(resp?.message || "Failed to update destination");

      const updated = resp.data as Destination;
      setListData((prev: any) => {
        if (!prev) return prev;
        const updatedDestinations = (prev.destinations || []).map((d: Destination) =>
          getEntityId(d) === getEntityId(editTarget) ? { ...d, ...updated } : d
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

  async function handleDeleteDestination(dest: Destination) {
    try {
      const resp = await controller.deleteOne(endpoints.destinations, getEntityId(dest));
      if (!resp?.success) {
        enqueueSnackbar(resp?.message || "Failed to delete destination", { variant: "error" });
        return;
      }
      setListData((prev: any) => {
        if (!prev) return prev;
        const updatedDestinations = (prev.destinations || []).filter((d: Destination) => getEntityId(d) !== getEntityId(dest));
        return { ...prev, destinations: updatedDestinations };
      });
      enqueueSnackbar("Destination deleted successfully", { variant: "success" });

      const publicId = (dest as any)?.image?.public_id;
      if (publicId) {
        try {
          await controller.deleteOne(`${endpoints.upload}/image`, encodeURIComponent(publicId));
        } catch (imgErr) {
          console.warn("Cloudinary image delete failed (non-fatal):", imgErr);
        }
      }
    } catch (err: any) {
      console.error("Delete destination error:", err);
      enqueueSnackbar(err?.message || "Failed to delete destination", { variant: "error" });
    }
  }

  return (
    <>
      {isOwner && (
        <div className="mb-4 flex justify-end">
          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetAddForm(); }}>
            <Button asChild variant="default" className="gap-2">
              <div><Plus className="h-4 w-4" /> Add Destination</div>
            </Button>

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
                      ) : <span className="text-muted-foreground text-xs">No image</span>}
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

                {/* Dates */}
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
        {Array.isArray(listData?.destinations) && listData!.destinations.length > 0 ? (
          listData!.destinations.map((d: Destination) => (
            <div key={getEntityId(d)} className="border-b last:border-b-0">
              <DestinationCard dest={d} isOwner={isOwner} onEdit={openEdit} onDelete={handleDeleteDestination} />
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <p>No destinations yet. Click "Add Destination" to get started!</p>
          </div>
        )}
      </Card>

      {/* EDIT DESTINATION */}
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
                  ) : (<span className="text-muted-foreground text-xs">No image</span>)}
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

            {/* Dates */}
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
    </>
  );
}
