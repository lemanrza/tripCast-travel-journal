import endpoints from "@/services/api";
import controller from "@/services/commonRequest";
import { getSocket } from "@/socket/socket";
import type { User } from "@/types/userType";
import { useEffect, useMemo, useRef, useState } from "react";

export type ChatMessage = {
  _id?: string;
  clientId?: string;
  group: string;
  author: User;
  body?: { text?: string };
  createdAt?: Date;
};

export default function useGroupChat(groupId: string, token: string) {
  const socket = useMemo(() => getSocket(token), [token]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingMap = useRef<Record<string, number>>({}); // userId -> timeoutId

  // Load chat history once on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await controller.getAll(
          `${endpoints.messages}/groups/${groupId}/messages`
        );
        setMessages(res.items || []);
      } catch (e) {
        console.error("[chat] history fetch failed", e);
      }
    }
    loadHistory();
  }, [groupId, token]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("group:join", { groupId }, (ack: any) => {
      console.log("[ws] join ack", ack);
      if (!ack?.ok) console.error("[ws] join failed:", ack?.error);
    });

    // Handle new messages
    const onNew = (m: ChatMessage) => {
      console.log("[ws] message:new", m);
      setMessages((prev) => {
        if (
          prev.some(
            (msg) => msg._id === m._id || (m.clientId && msg.clientId === m.clientId)
          )
        ) {
          return prev;
        }
        return [...prev, m];
      });
    };
    socket.on("message:new", onNew);

    const onTyping = ({
      userId,
      typing,
    }: {
      userId: string;
      typing: boolean;
    }) => {
      if (typing) {
        setTypingUsers((prev) =>
          prev.includes(userId) ? prev : [...prev, userId]
        );
        clearTimeout(typingMap.current[userId]);
        typingMap.current[userId] = window.setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== userId));
        }, 2500);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== userId));
      }
    };
    socket.on("typing:update", onTyping);

    return () => {
      socket.emit("group:leave", { groupId });
      socket.off("message:new", onNew);
      socket.off("typing:update", onTyping);
      Object.values(typingMap.current).forEach(clearTimeout);
    };
  }, [socket, groupId]);

  const sendMessage = (text: string) =>
    new Promise((resolve, reject) => {
      const clientId = crypto.randomUUID();
      socket.emit("message:send", { groupId, text, clientId }, (ack: any) => {
        console.log("[ws] send ack", ack);
        if (!ack?.ok) return reject(ack?.error || "send failed");
        resolve(ack.message);
      });
    });

  const startTyping = () => {
    socket.emit("typing:start", { groupId });
  };

  const stopTyping = () => {
    socket.emit("typing:stop", { groupId });
  };

  const markRead = (ids: string[]) => {
    socket.emit("message:read", { groupId, messageIds: ids });
  };

  return { messages, sendMessage, startTyping, stopTyping, markRead, typingUsers };
}
