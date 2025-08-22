import { X } from "lucide-react";

type Props = {
  message: any;
  onClear: () => void;
  label: (m: any) => string;
  authorName: (m: any) => string;
};

export default function ReplyHeader({ message, onClear, label, authorName }: Props) {
  if (!message) return null;
  return (
    <div className="mb-2 rounded-md border bg-muted/50 px-2 py-1 text-xs">
      Replying to <span className="font-medium">{authorName(message)}</span>:{" "}
      <span className="opacity-80">{label(message)}</span>
      <button className="ml-2 rounded px-1 text-muted-foreground hover:bg-muted" onClick={onClear} title="Cancel reply">
        <X className="inline h-3 w-3" />
      </button>
    </div>
  );
}
