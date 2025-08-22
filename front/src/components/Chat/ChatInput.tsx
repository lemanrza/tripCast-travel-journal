import { Button } from "@/components/ui/button";
import { Mic, Image as ImageIcon } from "lucide-react";
import ReplyHeader from "./ReplyHeader";

type Props = {
  input: string;
  onChange: (v: string) => void;
  onSend: () => void;

  replyTo: any | null;
  onClearReply: () => void;
  replyPreviewLabel: (m: any) => string;
  getAuthorName: (m: any) => string;

  isRecording: boolean;
  onStartRecording: () => void;
  onCancelRecording: () => void;

  onPickFiles: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ChatInput({
  input,
  onChange,
  onSend,
  replyTo,
  onClearReply,
  replyPreviewLabel,
  getAuthorName,
  isRecording,
  onStartRecording,
  onCancelRecording,
  onPickFiles,
  fileInputRef,
  onFilesSelected,
}: Props) {
  return (
    <div className="border-t p-3">
      {replyTo && (
        <ReplyHeader
          message={replyTo}
          onClear={onClearReply}
          label={replyPreviewLabel}
          authorName={getAuthorName}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
          title="Attach image/video"
          onClick={onPickFiles}
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Type a message…"
        />

        <Button size="sm" onClick={onSend} disabled={isRecording}>
          Send
        </Button>

        <Button
          size="icon"
          variant={isRecording ? "destructive" : "ghost"}
          onClick={() => (isRecording ? onCancelRecording() : onStartRecording())}
          title={isRecording ? "Cancel recording" : "Record voice"}
        >
          <Mic className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple={false}
          className="hidden"
          onChange={onFilesSelected}
        />

      </div>
    </div>
  );
}
