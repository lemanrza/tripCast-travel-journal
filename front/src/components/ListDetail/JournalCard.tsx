import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { FaRegComment, FaRegHeart } from "react-icons/fa";
import formatDate from "@/utils/formatDate";
import { Link } from "react-router-dom";
import type { JournalDetail } from "@/types/JournalType";

type Props = {
  j: JournalDetail;
  isMine: boolean;
  onDelete: (j: JournalDetail) => void;
};

export default function JournalCard({ j, isMine, onDelete }: Props) {
  const createdAt = j.createdAt
    ? typeof j.createdAt === "string"
      ? j.createdAt
      : j.createdAt.toISOString()
    : "";

  const likeCount = Array.isArray(j.likes) ? j.likes.length : j.likes ?? 0;
  const commentCount = Array.isArray(j.comments) ? j.comments.length : j.comments ?? 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {/* Header: title/meta + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {j.destination?.name && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                Destination: {j.destination.name}
              </div>
            )}
            <h3 className="mt-0.5 text-lg sm:text-2xl font-semibold truncate">
              {j.title}
            </h3>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatDate(createdAt)}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="secondary"
              className={j.public ? "bg-emerald-600 text-white" : "bg-gray-700 text-white"}
            >
              {j.public ? "Public" : "Private"}
            </Badge>

            {isMine && (
              <Button
                onClick={() => onDelete(j)}
                variant="ghost"
                size="icon"
                aria-label="Delete journal"
                className="hover:bg-destructive/10"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content preview */}
        {j.content && (
          <p className="text-sm text-muted-foreground md:max-w-4xl break-words line-clamp-4 md:line-clamp-6">
            {j.content}
          </p>
        )}

        {/* Photos */}
        {!!j.photos?.length && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {j.photos.slice(0, 12).map((photo: any, i: number) => (
              <div
                key={i}
                className="overflow-hidden rounded-md bg-muted aspect-square"
              >
                {photo?.url ? (
                  <img
                    src={photo.url}
                    alt={`Journal photo ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Footer actions/metrics */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <FaRegHeart /> {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
          <span className="inline-flex items-center gap-2">
            <FaRegComment /> {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>

          <div className="ml-auto">
            <Link to={`/journals/${(j as any).id || (j as any)._id}`}>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Read More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
