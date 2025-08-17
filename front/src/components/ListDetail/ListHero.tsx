import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Share2 } from "lucide-react";

type Props = {
  title: string;
  description: string;
  tags: string[];
  coverImage?: string;
  extraActions?: React.ReactNode;
};

export default function ListHero({ title, description, tags, coverImage, extraActions }: Props) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border bg-muted/60">
      {coverImage ? (
        <img src={coverImage} alt={title} className="h-180 w-full object-cover" />
      ) : (
        <div className="aspect-[16/5] w-full bg-muted" />
      )}

      <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
        <h1 className="text-4xl font-semibold text-white drop-shadow-sm">{title}</h1>
        <p className="mt-2 max-w-2xl text-white/90">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="bg-white/90 text-gray-900">#{t}</Badge>
          ))}
        </div>

        <div className="mt-4 flex gap-2 self-end">
          <Button variant="secondary" className="bg-white/90 text-gray-900">
            <MessageSquare className="mr-2 h-4 w-4" /> Chat
          </Button>
          <Button variant="secondary" className="bg-white/90 text-gray-900">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>

          {extraActions}
        </div>
      </div>
    </div>
  );
}
