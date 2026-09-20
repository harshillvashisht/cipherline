import { Socket } from "socket.io"
import { joinUserRooms } from "./JoinRooms";
import { AuthenticatedSocket } from "./socketTypes";

export const handleConnection = async (socket: Socket) => {

    console.log("socket connected", socket.id, process.env.INSTANCE_ID);

    const authsocket = socket as AuthenticatedSocket;

    await joinUserRooms(authsocket);

}