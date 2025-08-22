import MessageItem from "./MessageItem";

type Props = {
  messages: any[];
  meId: string;
  onReply: (m: any) => void;
  onAvatarClick?: (u: any) => void;
  getAuthorId: (m: any) => string | undefined;
  getAuthorObj: (m: any) => any | null;
  timeLabel: (d?: string | Date) => string;
  preview: (m: any) => string;
  listRef: React.RefObject<HTMLDivElement | null>;
};

export default function MessageList({
  messages,
  meId,
  onReply,
  onAvatarClick,
  getAuthorId,
  getAuthorObj,
  timeLabel,
  preview,
  listRef,
}: Props) {
  return (
    <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
      {messages.length === 0 ? (
        <p className="text-gray-500">No messages yet…</p>
      ) : (
        messages.map((m, i) => {
          const isMe = getAuthorId(m) === meId;
          const author = getAuthorObj(m);
          return (
            <MessageItem
              key={m._id || m.clientId || i}
              m={m}
              isMe={isMe}
              author={author}
              onReply={onReply}
              onAvatarClick={onAvatarClick}
              timeLabel={timeLabel}
              preview={preview}
            />
          );
        })
      )}
    </div>
  );
}
