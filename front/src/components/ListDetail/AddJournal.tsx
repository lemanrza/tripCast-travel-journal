import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Destination = { id?: string; _id?: string; name?: string; country?: string };

export type CreateJournalPayload = {
  title: string;
  content: string;
  destination: string;
  public: boolean;
  photos: File[];
};

type Props = {
  destinations: Destination[];
  onCreate: (data: CreateJournalPayload) => Promise<void>;
  triggerLabel?: string;
  showTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type PhotoPreview = { file: File; url: string };

export default function AddJournalDialog({
  destinations,
  onCreate,
  triggerLabel = "Write Entry",
  showTrigger = true,
  open,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);
  const [photos, setPhotos] = React.useState<PhotoPreview[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const actualOpen = isControlled ? open! : internalOpen;
  const setOpen = (v: boolean) => (isControlled ? onOpenChange!(v) : setInternalOpen(v));

  const reset = () => {
    setTitle("");
    setContent("");
    setDestination("");
    setIsPublic(false);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
  };

  const canSubmit = title.trim() && content.trim() && destination.trim();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotos((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ]);
    e.target.value = "";
  };

  const removePhotoAt = (idx: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      try {
        URL.revokeObjectURL(next[idx].url);
      } catch {}
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        content: content.trim(),
        destination,
        public: isPublic,
        photos: photos.map((p) => p.file),
      });
      setOpen(false);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={actualOpen}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          {/* full width on mobile, auto on >= sm */}
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> {triggerLabel}
          </Button>
        </DialogTrigger>
      )}

      {/* Responsive, scrollable dialog */}
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write Journal Entry</DialogTitle>
          <DialogDescription>Share your experience for a destination.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Destination */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Destination *</p>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="" disabled>
                Select destination
              </option>
              {destinations?.map((d) => {
                const val = d.id || d._id || "";
                return (
                  <option key={val} value={val}>
                    {d.name}
                    {d.country ? ` — ${d.country}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Title + Content (stack on mobile, comfy spacing) */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Title *</p>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="e.g., Sunset over the Seine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Content *</p>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={6}
              placeholder="Write your story..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Photos</p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <label className="inline-flex w-full sm:w-auto justify-center sm:justify-start items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={onFiles}
                />
              </label>
              <p className="text-xs text-muted-foreground">{photos.length} selected</p>
            </div>

            {!!photos.length && (
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-md bg-muted aspect-square"
                  >
                    <img
                      src={p.url}
                      alt={`Photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-md bg-background/80 px-2 py-1 text-xs"
                      onClick={() => removePhotoAt(idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Make Public</p>
              <p className="text-xs text-muted-foreground">Allow others to view this entry.</p>
            </div>
            <label className="inline-flex items-center gap-2 self-start sm:self-auto">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="text-sm">Public</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {/* full width buttons on mobile for better tap targets */}
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Saving..." : "Save Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
