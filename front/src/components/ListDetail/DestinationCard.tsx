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
    <Card className="overflow-hidden">
      {/* 1 col on mobile, 2 cols on md+ (fixed media column) */}
      <div className="grid lg:grid-cols-2 md:grid-cols-1">
        {/* Media */}
        {dest?.image?.url ? (
          <img
            src={dest.image.url}
            alt={dest.name || "Destination"}
            className="
              w-full object-cover
              aspect-[16/9] md:aspect-auto md:h-70 lg:h-70
            "
          />
        ) : (
          <div
            className="
              w-full bg-muted flex items-center justify-center
              aspect-[16/9] md:aspect-auto md:h-full
            "
          >
            <span className="text-muted-foreground">No image</span>
          </div>
        )}

        {/* Content */}
        <div className="border-t md:border-l md:border-t-0">
          <div className="flex items-start justify-between p-4 md:p-6 gap-3">
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-semibold truncate">{dest.name}</h3>
              <p className="text-muted-foreground">{dest.country}</p>

              <div className="mt-2">
                <StatusPill status={dest.status} />
              </div>

              {/* Notes (clamp on small screens to avoid huge cards) */}
              {dest.notes && (
                <p className="mt-3 text-sm text-muted-foreground md:max-w-3xl line-clamp-3 md:line-clamp-none break-words">
                  {dest.notes}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {dest.datePlanned && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Planned: {formatDate(dest.datePlanned as any)}
                  </span>
                )}
                {dest.dateVisited && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Visited: {formatDate(dest.dateVisited as any)}
                  </span>
                )}
                {Array.isArray(dest.journals) && dest.journals.length > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    {dest.journals.length} journal entries
                  </span>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-1 sm:gap-2 shrink-0">
                <Button
                  onClick={() => onEdit(dest)}
                  variant="ghost"
                  size="icon"
                  aria-label="Edit destination"
                  className="h-9 w-9"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => onDelete(dest)}
                  variant="ghost"
                  size="icon"
                  aria-label="Delete destination"
                  className="h-9 w-9"
                >
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
