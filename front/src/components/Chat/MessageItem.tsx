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
      className={`group relative flex items-end gap-2 overflow-visible ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {/* Left avatar (other user) */}
      {!isMe && (
        <button
          type="button"
          onClick={() => onAvatarClick?.(author ?? m.author)}
          className="mr-1 h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-full ring-1 ring-black/10 overflow-hidden grid place-items-center bg-gray-100 hover:scale-[1.03] transition"
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
        className={`relative max-w-[85%] md:max-w-[70%] rounded-lg p-2 text-sm break-words whitespace-pre-wrap ${
          isMe ? "rounded-br-none bg-blue-600 text-white" : "rounded-bl-none bg-gray-100"
        }`}
      >
        {m?.replyTo && <QuoteBlock replied={m.replyTo} preview={preview} />}

        {hasMedia ? (
          <MediaBubble m={m} />
        ) : (
          <div className="leading-relaxed">{m?.body?.text}</div>
        )}

        {/* timestamp */}
        <div className="mt-1 text-right text-[10px] opacity-70">
          {timeLabel(m?.createdAt)}
        </div>

        {/* ACTIONS: visible on mobile; hover-to-show on md+ */}
        <div
          className={`
            mt-1 flex gap-1
            md:mt-0 md:absolute md:-top-8 ${isMe ? "md:right-2" : "md:left-2"}
            md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:opacity-100
            z-10
          `}
        >
          <button
            type="button"
            onClick={() => onReply(m)}
            title="Reply"
            aria-label="Reply"
            className={`rounded-md border bg-white/90 px-2 py-1 text-xs shadow hover:bg-white
              ${isMe ? "text-gray-700" : "text-gray-700"}`}
          >
            ↩︎ Reply
          </button>
          {/* add more actions here if needed */}
        </div>
      </div>

      {/* Right avatar (me) */}
      {isMe && (
        <button
          type="button"
          className="ml-1 h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-full ring-1 ring-black/10 overflow-hidden grid place-items-center bg-gray-100 hover:scale-[1.03] transition"
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
