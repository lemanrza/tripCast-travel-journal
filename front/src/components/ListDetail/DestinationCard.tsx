import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import StatusPill from "@/components/StatusPill";
import formatDate from "@/utils/formatDate";
import type { Destination } from "@/types/DestinationType";

type Props = {
  dest: Destination;
  isOwner: boolean;
  onEdit: (d: Destination) => void;
  onDelete: (d: Destination) => void;
};

export default function DestinationCard({ dest, isOwner, onEdit, onDelete }: Props) {
  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-[320px,1fr]">
        {dest?.image?.url ? (
          <img src={dest.image.url} alt={dest.name || "Destination"} className="h-64 w-full object-cover" />
        ) : (
          <div className="h-64 w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}

        <div className="border-t md:border-l md:border-t-0">
          <div className="flex items-start justify-between p-6">
            <div>
              <h3 className="text-xl font-semibold">{dest.name}</h3>
              <p className="text-muted-foreground">{dest.country}</p>
              <div className="mt-2">
                <StatusPill status={dest.status} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{dest.notes}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {dest.datePlanned && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Planned: {formatDate(dest.datePlanned as any)}
                  </span>
                )}
                {dest.dateVisited && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Visited: {formatDate(dest.dateVisited as any)}
                  </span>
                )}
                {Array.isArray(dest.journals) && dest.journals.length > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> {dest.journals.length} journal entries
                  </span>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button onClick={() => onEdit(dest)} variant="ghost" size="icon" aria-label="Edit destination">
                  <Pencil className="h-5 w-5" />
                </Button>
                <Button onClick={() => onDelete(dest)} variant="ghost" size="icon" aria-label="Delete destination">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
