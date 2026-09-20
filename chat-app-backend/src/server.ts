import app from "./app";
import http from "http";
import { initializeSocket } from "./sockets/socket";

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await initializeSocket(server);

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();