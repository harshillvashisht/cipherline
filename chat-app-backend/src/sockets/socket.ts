import { Server } from "socket.io";
import http from "http";
import { socketAuthMiddleware } from "./socketAuth";
import { handleConnection } from "./socket.controller";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

let io: Server;


export const initializeSocket = async (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        },
    });

    io.use(socketAuthMiddleware)

    const pub = createClient({ url: process.env.REDIS_URL });
    const sub = pub.duplicate();

    await Promise.all([pub.connect(), sub.connect()]);

    io.adapter(createAdapter(pub, sub));

    io.on("connection", handleConnection);

    return io;
};



export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }

    return io;
};