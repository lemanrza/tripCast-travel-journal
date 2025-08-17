import { useMemo } from "react";
import AddJournalDialog from "@/components/ListDetail/AddJournal";
import JournalCard from "./JournalCard";
import type { JournalDetail } from "@/types/JournalType";
import type { Destination } from "@/types/DestinationType";
import { getEntityId } from "@/utils/entityId";

type Props = {
  destinations: Destination[];
  journals: JournalDetail[];
  journalsLoading: boolean;
  currentUserId: string;
  onCreate: (payload: any) => Promise<void>;
  onDelete: (j: JournalDetail) => Promise<void> | void;
};

export default function JournalsTab({
  destinations,
  journals,
  journalsLoading,
  currentUserId,
  onCreate,
  onDelete,
}: Props) {
  const visible = useMemo(() => {
    const canSee = (j: any) => {
      const authorId = (j?.author && (j.author._id || j.author.id)) || j?.author;
      return j?.public || String(authorId) === String(currentUserId);
    };
    return journals.filter(canSee);
  }, [journals, currentUserId]);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <AddJournalDialog destinations={destinations || []} onCreate={onCreate} triggerLabel="Write Entry" />
      </div>

      <div className="space-y-4">
        {journalsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading journals...</p>
          </div>
        ) : visible.length > 0 ? (
          visible.map((j) => (
            <JournalCard
              key={getEntityId(j)}
              j={j}
              isMine={String((j as any)?.author?._id) === String(currentUserId)}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No journal entries yet. Click "Write Entry" to get started!</p>
          </div>
        )}
      </div>
    </>
  );
}
