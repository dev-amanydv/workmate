import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";
import { parse as parseCookie } from "cookie";

import { ChatService } from "./chat.service";
import { PrismaService } from "../prisma/prisma.service";
import { ACCESS_TOKEN_COOKIE } from "../auth/auth.service";

interface AuthSocket extends Socket {
  userId: string;
  userName: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  /** Map of userId -> Set of socketIds (for multi-tab support) */
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticateSocket(client);
      (client as AuthSocket).userId = user.id;
      (client as AuthSocket).userName = user.name;

      // Track online users
      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
      }
      this.onlineUsers.get(user.id)!.add(client.id);

      this.logger.log(`User ${user.name} (${user.id}) connected: ${client.id}`);
    } catch {
      client.emit("error", { message: "Authentication failed" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as AuthSocket).userId;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
        }
      }
      this.logger.log(`User ${userId} disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as AuthSocket).userId;
    if (!userId) throw new WsException("Not authenticated");

    try {
      // Verify user is a participant before allowing join
      await this.chatService.getConversation(data.conversationId, userId);
      await client.join(`conversation:${data.conversationId}`);
      this.logger.debug(`${userId} joined room conversation:${data.conversationId}`);
    } catch {
      throw new WsException("Cannot join conversation");
    }
  }

  @SubscribeMessage("leave_conversation")
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    void client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = (client as AuthSocket).userId;
    if (!userId) throw new WsException("Not authenticated");

    const content = data.content?.trim();
    if (!content) throw new WsException("Message content is required");
    if (content.length > 4000) throw new WsException("Message too long");

    try {
      const message = await this.chatService.saveMessage(
        data.conversationId,
        userId,
        content,
      );

      // Broadcast to everyone in the room (including sender for confirmation)
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("new_message", message);

      return { success: true };
    } catch (err: unknown) {
      throw new WsException(
        err instanceof Error ? err.message : "Failed to send message",
      );
    }
  }

  @SubscribeMessage("typing_start")
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as AuthSocket).userId;
    const userName = (client as AuthSocket).userName;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit("typing", {
      conversationId: data.conversationId,
      userId,
      userName,
      isTyping: true,
    });
  }

  @SubscribeMessage("typing_stop")
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as AuthSocket).userId;
    const userName = (client as AuthSocket).userName;
    if (!userId) return;

    client.to(`conversation:${data.conversationId}`).emit("typing", {
      conversationId: data.conversationId,
      userId,
      userName,
      isTyping: false,
    });
  }

  isUserOnline(userId: string): boolean {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  private async authenticateSocket(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie ?? "";
    const cookies = parseCookie(cookieHeader);
    const token = cookies[ACCESS_TOKEN_COOKIE];

    if (!token) throw new Error("No auth token");

    const secret = this.config.get<string>("JWT_ACCESS_SECRET", "");
    if (!secret) throw new Error("Auth not configured");

    interface TokenPayload { sub: string; email: string }
    let payload: TokenPayload;
    try {
      payload = this.jwt.verify<TokenPayload>(token, { secret });
    } catch {
      throw new Error("Invalid token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new Error("User not found");

    return user;
  }
}
