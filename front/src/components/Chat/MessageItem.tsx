import QuoteBlock from "./QuoteBlock";
import MediaBubble from "./MediaBubble";

type Props = {
  m: any;
  isMe: boolean;
  author: any | null;
  onReply: (m: any) => void;
  onAvatarClick?: (u: any) => void;
  timeLabel: (d?: string | Date) => string;
  preview: (m: any) => string;
};

export default function MessageItem({
  m,
  isMe,
  author,
  onReply,
  onAvatarClick,
  timeLabel,
  preview,
}: Props) {
  const hasMedia =
    m?.body?.imageUrl || m?.body?.videoUrl || m?.body?.audioUrl || m?.body?.fileUrl;

  return (
    <div
      className={`group relative flex items-end overflow-visible ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {!isMe && (
        <button
          type="button"
          onClick={() => onAvatarClick?.(author ?? m.author)}
          className="mr-2 h-6 w-6 shrink-0 cursor-pointer rounded-full ring-1 ring-black/10 overflow-hidden grid place-items-center bg-gray-100 hover:scale-105 transition"
          title={author?.fullName || "Profile"}
        >
          {author?.profileImage?.url ? (
            <img
              src={author.profileImage.url}
              alt={author?.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-medium text-gray-600">
              {(author?.fullName?.[0] || "?").toUpperCase()}
            </span>
          )}
        </button>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[70%] rounded-lg p-2 text-sm ${
          isMe ? "rounded-br-none bg-blue-600 text-white" : "rounded-bl-none bg-gray-100"
        }`}
      >
        {m?.replyTo && <QuoteBlock replied={m.replyTo} preview={preview} />}

        {hasMedia ? <MediaBubble m={m} /> : <div>{m?.body?.text}</div>}

        <div className="mt-1 text-right text-[10px] opacity-70">
          {timeLabel(m?.createdAt)}
        </div>

        <button
          type="button"
          onClick={() => onReply(m)}
          title="Reply"
          aria-label="Reply"
          className={`absolute -top-8 ${isMe ? "right-2" : "left-2"}
            rounded-md border bg-white/90 px-2 py-1 text-xs shadow
            opacity-0 transition-opacity group-hover:opacity-100
            hover:bg-white text-gray-700 z-10`}
        >
          ↩︎ Reply
        </button>
      </div>

      {isMe && (
        <button
          type="button"
          className="ml-2 h-6 w-6 shrink-0 cursor-pointer rounded-full ring-1 ring-black/10 overflow-hidden grid place-items-center bg-gray-100 hover:scale-105 transition"
          title={author?.fullName || "Profile"}
        >
          {author?.profileImage?.url ? (
            <img src={author.profileImage.url} alt="me" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-medium text-gray-600">
              {(author?.fullName?.[0] || "Y").toUpperCase()}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
