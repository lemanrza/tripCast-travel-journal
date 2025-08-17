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

  return (
    <Card>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Destination: {j.destination?.name}</div>
            <h3 className="text-2xl font-semibold">{j.title}</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">{formatDate(createdAt)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={j.public ? "bg-emerald-600 text-white" : "bg-gray-700 text-white"}>
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

        <p className="max-w-4xl text-muted-foreground">
          {j.content?.substring(0, 300)}
          {j.content?.length > 300 ? "..." : ""}
        </p>

        <div className="flex items-center gap-3">
          {j.photos?.map((photo: any, i: number) => (
            <div key={i} className="h-16 w-16 rounded-md bg-muted overflow-hidden">
              {photo?.url ? (
                <img src={photo.url} alt={`Journal photo ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {j.likes != null && (
            <span className="flex gap-2 items-center">
              <FaRegHeart /> {Array.isArray(j.likes) ? j.likes.length : j.likes} likes
            </span>
          )}
          {j.comments != null && (
            <span className="flex gap-2 items-center">
              <FaRegComment /> {Array.isArray(j.comments) ? j.comments.length : j.comments} comments
            </span>
          )}
          <div className="ml-auto">
            <Link to={`/journals/${(j as any).id || (j as any)._id}`}>
              <Button variant="outline" size="sm">Read More</Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
