import { Share2, Lock, Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type TravelListCardProps = {
  title: string;
  desc: string;
  completed: number;
  total: number;
  tags: string[];
  coverImage: string;
  visibility: "Public" | "Private";
  created: string;
  collaborators: number;
  isNew?: boolean;
};

export default function TravelListCard({
  title,
  desc,
  completed,
  total,
  tags,
  visibility,
  created,
  collaborators,
  coverImage,
  isNew = false,
}: TravelListCardProps) {
  const percentage = (completed / total) * 100;

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      {/* Cover Image */}
      <div className="h-40 bg-muted flex items-center justify-center relative overflow-hidden">
        {visibility === "Public" ? (
          <span className="absolute top-2 right-2 bg-white text-xs px-2 py-0.5 rounded-full shadow z-10">
            <Globe className="inline w-3 h-3 mr-1" /> Public
          </span>
        ) : (
          <span className="absolute top-2 right-2 bg-white text-xs px-2 py-0.5 rounded-full shadow z-10">
            <Lock className="inline w-3 h-3 mr-1" /> Private
          </span>
        )}

        {isNew && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
            New
          </span>
        )}

        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm text-muted-foreground">📷 No Image</span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <Share2 className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="text-sm">
          {completed}/{total} destinations completed
        </div>
        <Progress value={percentage} className="h-2" />

        <div className="flex flex-wrap gap-2 text-xs mt-2">
          {tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-black">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
          <div>{collaborators} collaborator{collaborators !== 1 && "s"}</div>
          <div>Created {created}</div>
        </div>
      </div>
    </div>
  );
}
