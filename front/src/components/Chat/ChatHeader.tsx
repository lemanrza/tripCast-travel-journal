import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Group } from "@/types/GroupType";

type Props = {
  group: Group | null;
  onInfo: () => void;
  onClose?: () => void;
};

export default function ChatHeader({ group, onInfo, onClose }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b bg-white p-3">
      <div className="flex items-center justify-between">
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={onInfo}
          title="Open group info"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-black/10">
            {group?.profileImage?.url ? (
              <img
                src={group.profileImage.url}
                alt={group?.name || "Group"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-blue-50 font-semibold text-blue-700">
                {group?.name?.[0]?.toUpperCase() || "G"}
              </div>
            )}
          </div>
          <div className="leading-tight">
            <div className="font-semibold">{group?.name || "Group"}</div>
            <div className="max-w-[200px] line-clamp-1 text-xs text-gray-500">
              {group?.description || "Tap to view group info"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onInfo} aria-label="Group info" title="Group info">
            <Info className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat" title="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
