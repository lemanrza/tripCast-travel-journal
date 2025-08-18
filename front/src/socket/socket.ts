// src/socket/socket.ts
import { io } from "socket.io-client";
let socket: any;

export function getSocket(tokenRaw: string) {
  if (!socket) {
    const token = tokenRaw?.startsWith("Bearer ") ? tokenRaw.slice(7) : tokenRaw; // IMPORTANT
    const base = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
    console.log("[ws] connecting", base, "token?", !!token);

    socket = io(base, {
      path: "/realtime",
      withCredentials: true,
      auth: { token }, // pass bare JWT
    });

    socket.on("connect", () => console.log("[ws] connected", socket.id));
    socket.on("connect_error", (e: any) => console.error("socket connect_error", e));
  }
  return socket;
}
