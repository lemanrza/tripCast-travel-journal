import { useEffect, useRef, useState } from "react";
import { X, Mic, Square, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import useGroupChat from "@/hooks/useGroupChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import AudioBubble from "./AudioBubble";
import GroupInfoDialog from "./GroupInfoDialog";
import type { Group } from "@/types/GroupType";

type Props = { onClose?: () => void; groupId: string; token: string; meId: string };


const isIdEq = (a?: any, b?: any) =>
    (typeof a === "string" ? a : a?._id) === (typeof b === "string" ? b : b?._id);

export default function ChatBox({ onClose, groupId, token, meId }: Props) {
    const { messages, sendMessage, sendVoice, startTyping, stopTyping, markRead, typingUsers } =
        useGroupChat(groupId, token);

    const [input, setInput] = useState("");
    const [group, setGroup] = useState<Group | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // profile preview state
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recTime, setRecTime] = useState(0);
    const recTimerRef = useRef<number | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        controller.getOne(`${endpoints.groups}/${groupId}`)
            .then((res: any) => {
                if (res?.success) setGroup(res.data);
            })
            .catch((e: any) => console.error("Group load fail:", e));
    }, [groupId]);

    const isAdmin = !!group && (group.admins || []).some((a) => isIdEq(a, meId));


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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            chunksRef.current = [];

            const mime = MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "";

            const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            recorderRef.current = rec;

            rec.ondataavailable = (e: BlobEvent) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            rec.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
                chunksRef.current = [];

                // Inline upload helper that matches your controller.post shape
                async function uploadVoiceInline(fileBlob: Blob): Promise<string> {
                    const fd = new FormData();
                    fd.append("file", fileBlob, "voice.webm");

                    const res = await controller.post(`${endpoints.upload}/voice`, fd, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    if (!res?.success) {
                        throw new Error(res?.message || "Upload failed");
                    }
                    const url: string | undefined = res?.data?.url;
                    if (!url) throw new Error("Upload did not return URL");
                    return url;
                }

                try {
                    const url = await uploadVoiceInline(blob);
                    await sendVoice(url);
                } catch (err) {
                    console.error("[voice] upload/send failed", err);
                    alert("Voice send failed");
                }
            };


            rec.start(100);
            setIsRecording(true);
            setRecTime(0);
            recTimerRef.current = window.setInterval(() => setRecTime((t) => t + 1), 1000);
        } catch (e) {
            console.error("[voice] mic error", e);
            alert("Could not access microphone");
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
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
        const unread = messages.filter(
            (m) => (typeof m.author === "string" ? m.author : m.author._id) !== meId
        );
        if (unread.length) markRead(unread.map((m: any) => m._id).filter(Boolean));
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
                <div className="p-3 border-b sticky top-0 z-10 bg-white">
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setInfoOpen(true)}
                            title="Open group info"
                        >
                            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-black/10">
                                {group?.profileImage?.url ? (
                                    <img src={group.profileImage.url} alt={group?.name || "Group"} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full grid place-items-center bg-blue-50 text-blue-700 font-semibold">
                                        {group?.name?.[0]?.toUpperCase() || "G"}
                                    </div>
                                )}
                            </div>
                            <div className="leading-tight">
                                <div className="font-semibold">
                                    {group?.name || "Group"}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                                    {group?.description || "Tap to view group info"}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setInfoOpen(true)}
                                aria-label="Group info"
                                title="Group info"
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close chat"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
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
                                (typeof m.author === "string" ? m.author : m.author._id) === meId;
                            const author = typeof m.author === "string" ? null : m.author;
                            const audio = m.body?.audioUrl;

                            return (
                                <div
                                    key={m._id || m.clientId || i}
                                    className={`flex items-end ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    {!isMe && author?.profileImage && (
                                        <img
                                            src={author.profileImage?.url}
                                            alt={author.fullName}
                                            className="w-6 h-6 rounded-full mr-2 cursor-pointer hover:scale-105 transition"
                                            onClick={() => setSelectedUser(author)}
                                        />
                                    )}

                                    <div
                                        className={`max-w-[70%] p-2 rounded-lg text-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-100 rounded-bl-none"
                                            }`}
                                    >
                                        {audio ? (
                                            <AudioBubble src={audio} />
                                        ) : (
                                            <div>{m.body?.text}</div>
                                        )}



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

                {/* Recording bar */}
                {isRecording && (
                    <div className="px-3 py-2 bg-red-50 border-t flex items-center justify-between">
                        <div className="text-sm text-red-800">● Recording… {recTime}s</div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="secondary" onClick={cancelRecording}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={stopRecording}>
                                <Square className="w-4 h-4 mr-1" /> Stop & Send
                            </Button>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="flex items-center gap-2 p-3 border-t">
                    <input
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSend()}
                    />
                    <Button size="sm" onClick={onSend} disabled={isRecording}>
                        Send
                    </Button>
                    <Button
                        size="icon"
                        variant={isRecording ? "destructive" : "ghost"}
                        onClick={() => (isRecording ? cancelRecording() : startRecording())}
                        title={isRecording ? "Cancel recording" : "Record voice"}
                    >
                        <Mic className="w-4 h-4" />
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
                                        <p className="text-gray-500">📍 {selectedUser.location}</p>
                                    )}
                                    {selectedUser.bio && (
                                        <p className="italic text-gray-400 mt-1">“{selectedUser.bio}”</p>
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
                onSaved={(g) => setGroup(g)}
                groupId={groupId}
            />


        </>
    );
}
