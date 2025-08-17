import type { JournalDetail } from "@/types/JournalType";

type Props = {
  journals: JournalDetail[];
};

export default function PhotosTab({ journals }: Props) {
  const publicPhotos = (journals || [])
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
          <img src={photo.url} alt={`Journal photo ${i + 1}`} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
