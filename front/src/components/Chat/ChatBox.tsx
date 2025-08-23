import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { enqueueSnackbar } from "notistack";
import useGroupChat from "@/hooks/useGroupChat";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import RecordingBar from "./RecordingBar";
import ChatInput from "./ChatInput";

import type { Group } from "@/types/GroupType";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GroupInfoDialog from "../ListDetail/GroupInfoDialog";
import type { User } from "@/types/userType";

type Props = { onClose?: () => void; groupId: string; token: string; meId: string };

const isIdEq = (a?: any, b?: any) =>
  (typeof a === "string" ? a : a?._id) === (typeof b === "string" ? b : b?._id);

export default function ChatBox({ onClose, groupId, token, meId }: Props) {
  const { messages, sendVoice, startTyping, stopTyping, markRead, typingUsers } =
    useGroupChat(groupId, token);

  const [input, setInput] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [replyTo, setReplyTo] = useState<any | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const recTimerRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    controller
      .getOne(`${endpoints.groups}/${groupId}`)
      .then((res: any) => {
        if (res?.success) setGroup(res.data);
      })
      .catch((e: any) => console.error("Group load fail:", e));
  }, [groupId]);

  const isAdmin = !!group && (group.admins || []).some((a) => isIdEq(a, meId));

  const getAuthorId = (m: any) => (typeof m.author === "string" ? m.author : m.author?._id);
  const getAuthorName = (m: any) =>
    typeof m.author === "string" ? "Someone" : m.author?.fullName || "Someone";

  const findUserInGroup = (id?: string) => {
    if (!id || !group) return null;
    const byId = (u: any) => isIdEq(u, id);
    return (group.members || []).find(byId) || (group.admins || []).find(byId) || null;
  };

  const getAuthorObj = (m: any) => {
    if (!m) return null;
    if (typeof m.author === "string") return findUserInGroup(m.author);
    return m.author || null;
  };

  const messageTime = (d?: string | Date) =>
    d
      ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const replyPreviewLabel = (m: any) => {
    const b = m?.body || {};
    if (b.text) return b.text.length > 80 ? b.text.slice(0, 80) + "…" : b.text;
    if (b.imageUrl) return "📷 Photo";
    if (b.audioUrl) return "🎙️ Voice message";
    if (b.fileUrl) return `📎 ${b.fileName || "File"}`;
    return "Message";
  };

  const sendText = async (text: string) => {
    const payload: any = { text: text.trim() };
    if (replyTo?._id) payload.replyTo = replyTo._id;

    try {
      await controller.post(`${endpoints.messages}/groups/${groupId}/messages`, payload);
      setInput("");
      setReplyTo(null);
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || e?.message || "Send failed", { variant: "error" });
    }
  };

  const looksLikeImage = (nameOrType: string) =>
    /^(image\/)|\.(png|jpe?g|gif|webp|avif)$/i.test(nameOrType);

  async function uploadImageReturnBody(file: File): Promise<{ imageUrl: string }> {
    if (!looksLikeImage(file.type) && !looksLikeImage(file.name)) {
      throw new Error("Only images are allowed");
    }
    const MAX_MB = 8;
    if (file.size > MAX_MB * 1024 * 1024) {
      throw new Error(`Image is too large. Max ${MAX_MB}MB.`);
    }
    const fd = new FormData();
    fd.append("image", file, file.name);

    const res = await controller.post(`${endpoints.upload}/image`, fd);
    const ok = res?.success !== false;
    const url = res?.data?.url || res?.url;
    if (!ok || !url) throw new Error(res?.message || "Image upload failed");

    return { imageUrl: url };
  }

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    for (const f of files) {
      try {
        const { imageUrl } = await uploadImageReturnBody(f);
        const payload: any = { imageUrl };
        if (replyTo?._id) payload.replyTo = replyTo._id;

        await controller.post(`${endpoints.messages}/groups/${groupId}/messages`, payload);
        setReplyTo(null);
      } catch (err: any) {
        enqueueSnackbar(err?.message || "Failed to send image", { variant: "error" });
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        chunksRef.current = [];

        async function uploadVoiceInline(fileBlob: Blob): Promise<string> {
          const fd = new FormData();
          fd.append("file", fileBlob, "voice.webm");
          const res = await controller.post(`${endpoints.upload}/voice`, fd);
          if (!res?.success) throw new Error(res?.message || "Upload failed");
          const url: string | undefined = res?.data?.url;
          if (!url) throw new Error("Upload did not return URL");
          return url;
        }

        try {
          const url = await uploadVoiceInline(blob);

          if (replyTo?._id) {
            await controller.post(`${endpoints.messages}/groups/${groupId}/messages`, {
              audioUrl: url,
              replyTo: replyTo._id,
            });
            setReplyTo(null);
          } else {
            await sendVoice(url);
          }
        } catch {
          enqueueSnackbar("Voice send failed", { variant: "error" });
        }
      };

      rec.start(100);
      setIsRecording(true);
      setRecTime(0);
      recTimerRef.current = window.setInterval(() => setRecTime((t) => t + 1), 1000);
    } catch {
      enqueueSnackbar("Could not access microphone", { variant: "error" });
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    cleanupRecording();
  };

  const cancelRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      (recorderRef.current as MediaRecorder).onstop = null as any;
      recorderRef.current.stop();
    }
    chunksRef.current = [];
    cleanupRecording();
  };

  const cleanupRecording = () => {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    setRecTime(0);
    setIsRecording(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    recorderRef.current = null;
  };
  useEffect(() => {
    listRef.current?.scrollTo({ top: (listRef.current?.scrollHeight || 0), behavior: "smooth" });
    const unread = messages.filter((m) => getAuthorId(m) !== meId);
    if (unread.length) markRead(unread.map((m: any) => m._id).filter(Boolean));
  }, [messages.length]);

  const onInputChange = (val: string) => {
    setInput(val);
    startTyping();
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => stopTyping(), 1200);
  };

  const onSend = async () => {
    const v = input.trim();
    if (!v) return;
    await sendText(v);
  };

  async function fetchUserFull(userOrId: User | string): Promise<User> {
    const id = typeof userOrId === "string" ? userOrId : userOrId?._id;
    if (!id) return userOrId as any;

    const hasLongForm =
      typeof userOrId === "object" &&
      (userOrId?.email || userOrId?.location || userOrId?.bio);

    if (hasLongForm) return userOrId as User;

    try {
      const res = await controller.getOne(`${endpoints.users}/user/${id}`);
      const data = res?.data ?? res;

      if (!data) return userOrId as any;

      return typeof userOrId === "object"
        ? ({ ...userOrId, ...data } as User)
        : (data as User);
    } catch (e) {
      console.error("Fetch user failed:", e);
      return typeof userOrId === "object" ? (userOrId as User) : ({ _id: id } as User);
    }
  }

  const handleAvatarClick = async (userOrId: any) => {
    const base =
      typeof userOrId === "string" ? findUserInGroup(userOrId) ?? { _id: userOrId } : userOrId;
    setSelectedUser(base);
    const full = await fetchUserFull(base);
    setSelectedUser(full);
  };

  return (
    <>
      <motion.div
        key="chatbox"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="
    fixed inset-x-2 bottom-2 top-16 z-50
    flex flex-col rounded-xl border bg-white shadow-xl
    pb-[env(safe-area-inset-bottom)]
    sm:inset-x-4
    md:inset-auto md:bottom-6 md:right-6 md:h-[78vh] md:w-[36rem]
    lg:h-[80vh] lg:w-[25rem] overflow-hidden
  "
        role="dialog"
        aria-label="Chat window"
      >
        <ChatHeader group={group} onInfo={() => setInfoOpen(true)} onClose={onClose} />

        {/* Scrollable messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
          <MessageList
            messages={messages}
            meId={meId}
            onReply={(m) => setReplyTo(m)}
            onAvatarClick={handleAvatarClick}
            getAuthorId={getAuthorId}
            getAuthorObj={getAuthorObj}
            timeLabel={messageTime}
            preview={replyPreviewLabel}
            listRef={listRef}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 left-0 right-0 z-20 ">
          <div className="h-4 px-3 pt-1 text-xs text-gray-500">
            {typingUsers.length ? `${typingUsers.length} typing…` : null}
          </div>

          <RecordingBar
            visible={isRecording}
            seconds={recTime}
            onCancel={cancelRecording}
            onStop={stopRecording}
          />

          <ChatInput
            input={input}
            onChange={onInputChange}
            onSend={onSend}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            replyPreviewLabel={replyPreviewLabel}
            getAuthorName={getAuthorName}
            isRecording={isRecording}
            onStartRecording={startRecording}
            onCancelRecording={cancelRecording}
            onPickFiles={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onFilesSelected={onFilesSelected}
          />
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
                  className="h-24 w-24 rounded-full object-cover shadow"
                />
                <div className="text-sm text-gray-600">
                  {selectedUser.email && <p className="font-medium">{selectedUser.email}</p>}
                  {selectedUser.location && (
                    <p className="text-gray-500">📍 {selectedUser.location}</p>
                  )}
                  {selectedUser.bio && (
                    <p className="mt-1 italic text-gray-400">“{selectedUser.bio}”</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Group Info / Edit Modal */}
      <GroupInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        group={group}
        isAdmin={isAdmin}
        onSaved={(g: any) => setGroup(g)}
        groupId={groupId}
      />
    </>
  );
}
