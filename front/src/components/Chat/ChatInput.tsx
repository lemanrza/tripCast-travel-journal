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
    <div className="border-t bg-white px-3 py-2">
      {replyTo && (
        <ReplyHeader
          message={replyTo}
          onClear={onClearReply}
          label={replyPreviewLabel}
          authorName={getAuthorName}
        />
      )}

      <div className="flex items-center gap-2">
        {/* Attach */}
        <button
          type="button"
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full border hover:bg-muted"
          title="Attach image/video"
          aria-label="Attach image or video"
          onClick={onPickFiles}
        >
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Input */}
        <input
          className="flex-1 min-w-0 h-10 rounded-full border px-4 text-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                     placeholder:text-gray-400"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isRecording) onSend();
          }}
          placeholder="Type a message…"
          aria-label="Type a message"
        />

        {/* Send (always visible) */}
        <Button
          size="sm"
          onClick={onSend}
          disabled={isRecording}
          className="shrink-0 h-10 rounded-full px-4"
          aria-label="Send message"
        >
          Send
        </Button>

        {/* Mic (toggle recording) */}
        <Button
          type="button"
          size="icon"
          variant={isRecording ? "destructive" : "ghost"}
          onClick={() => (isRecording ? onCancelRecording() : onStartRecording())}
          title={isRecording ? "Cancel recording" : "Record voice"}
          aria-label={isRecording ? "Cancel recording" : "Record voice"}
          className="h-10 w-10 rounded-full"
        >
          <Mic className="h-5 w-5" />
        </Button>

        {/* Hidden file input */}
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
