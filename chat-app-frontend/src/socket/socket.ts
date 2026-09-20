import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
});

socket.on("connect_error", (err) => {
    console.log("❌ Socket error:", err.message);
});