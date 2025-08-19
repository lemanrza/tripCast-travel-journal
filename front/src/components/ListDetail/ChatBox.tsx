import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import useGroupChat from "@/hooks/useGroupChat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = { onClose?: () => void; groupId: string; token: string; meId: string };

export default function ChatBox({ onClose, groupId, token, meId }: Props) {
  const { messages, sendMessage, startTyping, stopTyping, markRead, typingUsers } =
    useGroupChat(groupId, token);

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // profile preview state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const onSend = async () => {
    const v = input.trim();
    if (!v) return;
    setInput("");
    try {
      await sendMessage(v);
    } catch (e: any) {
      setInput(v);
      alert(`Send failed: ${e?.toString?.() || e}`);
    }
  };

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
    const unread = messages.filter(
      (m) =>
        (typeof m.author === "string" ? m.author : m.author._id) !== meId
    );
    if (unread.length)
      markRead(unread.map((m: any) => m._id).filter(Boolean));
  }, [messages.length]);

  const onInputChange = (val: string) => {
    setInput(val);
    startTyping();
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => stopTyping(), 1200);
  };

  return (
    <>
      <motion.div
        key="chatbox"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed bottom-4 right-4 w-100 h-140 rounded-xl border bg-white shadow-xl flex flex-col"
        role="dialog"
        aria-label="Chat window"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="font-semibold">Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 text-sm"
        >
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet…</p>
          ) : (
            messages.map((m, i) => {
              const isMe =
                (typeof m.author === "string"
                  ? m.author
                  : m.author._id) === meId;
              const author =
                typeof m.author === "string" ? null : m.author;

              return (
                <div
                  key={m._id || m.clientId || i}
                  className={`flex items-end ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar (clickable for profile preview) */}
                  {!isMe && author?.profileImage && (
                    <img
                      src={author.profileImage?.url}
                      alt={author.fullName}
                      className="w-6 h-6 rounded-full mr-2 cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedUser(author)}
                    />
                  )}

                  <div
                    className={`max-w-[70%] p-2 rounded-lg text-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-100 rounded-bl-none"
                    }`}
                  >
                    <div>{m.body?.text}</div>
                    <div className="text-[10px] opacity-70 mt-1 text-right">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>

                  {isMe && author?.profileImage && (
                    <img
                      src={author.profileImage.url}
                      alt="me"
                      className="w-6 h-6 rounded-full ml-2"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Typing indicator */}
        <div className="px-3 pb-1 text-xs text-gray-500 h-4">
          {typingUsers.length ? `${typingUsers.length} typing…` : null}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 border-t">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Type a message..."
          />
          <Button size="sm" onClick={onSend}>
            Send
          </Button>
        </div>
      </motion.div>

      {/* Profile preview modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedUser.fullName}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3 text-center">
                <img
                  src={selectedUser.profileImage?.url}
                  alt={selectedUser.fullName}
                  className="w-24 h-24 rounded-full object-cover shadow"
                />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{selectedUser.email}</p>
                  {selectedUser.location && (
                    <p className="text-gray-500">
                      📍 {selectedUser.location}
                    </p>
                  )}
                  {selectedUser.bio && (
                    <p className="italic text-gray-400 mt-1">
                      “{selectedUser.bio}”
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
