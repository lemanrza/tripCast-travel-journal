import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";

type Props = {
  visible: boolean;
  seconds: number;
  onCancel: () => void;
  onStop: () => void;
};

export default function RecordingBar({ visible, seconds, onCancel, onStop }: Props) {
  if (!visible) return null;
  return (
    <div className="flex items-center justify-between border-t bg-red-50 px-3 py-2">
      <div className="text-sm text-red-800">● Recording… {seconds}s</div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onStop}>
          <Square className="mr-1 h-4 w-4" /> Stop &amp; Send
        </Button>
      </div>
    </div>
  );
}
