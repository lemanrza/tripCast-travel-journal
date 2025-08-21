import TravelListCard from "@/components/TravelListCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { List } from "@/types/ListType";

type Props = {
  lists: List[];
  emptyMessage: string;
  showCreateCta?: boolean;
};

function toCard(list: List) {
  return {
    id: list.id,
    title: list.title || "Untitled List",
    desc: list.description || "No description available",
    completed: (list.destinations || []).filter((d: any) => d?.status === "completed").length || 0,
    total: list.destinations?.length || 0,
    tags: list.tags || [],
    user: list.owner,
    coverImage: list.coverImage || "",
    visibility: list.isPublic ? ("Public" as const) : ("Private" as const),
    created: new Date(list.created).toLocaleDateString() || "Unknown",
    collaborators: list.collaborators?.length || 0,
    isNew: false,
  };
}

export default function ListsTab({ lists, emptyMessage, showCreateCta }: Props) {
  const formatted = lists.map(toCard);

  if (!formatted.length) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-sm sm:text-base">{emptyMessage}</p>
        {showCreateCta ? (
          <Link to="/create/list">
            <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              Create Your First List
            </Button>
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="
        grid gap-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        2xl:grid-cols-4
      "
    >
      {formatted.map((l: any) => (
        <TravelListCard key={l.id} {...l} />
      ))}
    </div>
  );
}
