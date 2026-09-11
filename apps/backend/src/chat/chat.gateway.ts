import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
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

function toWsException(err: unknown, fallback: string): WsException {
  if (err instanceof WsException) return err;
  if (err instanceof Error) return new WsException(err.message || fallback);
  return new WsException(fallback);
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests from all origins (including https://workmate.amanydv.in)
      callback(null, true);
    },
    credentials: true,
  },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client, next) => {
      try {
        const user = await this.authenticateSocket(client);
        (client as AuthSocket).userId = user.id;
        (client as AuthSocket).userName = user.name;
        client.data.userId = user.id;
        client.data.userName = user.name;
        next();
      } catch (err) {
        this.logger.warn(`Handshake auth failed: ${err instanceof Error ? err.message : String(err)}`);
        next(new Error("Authentication failed"));
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = (client as AuthSocket).userId || client.data?.userId;
    const userName = (client as AuthSocket).userName || client.data?.userName;

    if (userId) {
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);
      this.logger.log(`User ${userName} (${userId}) connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as AuthSocket).userId || client.data?.userId;
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

  private async resolveUser(client: Socket): Promise<{ id: string; name: string }> {
    let userId = (client as AuthSocket).userId || client.data?.userId;
    let userName = (client as AuthSocket).userName || client.data?.userName;

    if (!userId) {
      const user = await this.authenticateSocket(client);
      userId = user.id;
      userName = user.name;
      (client as AuthSocket).userId = user.id;
      (client as AuthSocket).userName = user.name;
      client.data.userId = user.id;
      client.data.userName = user.name;
    }

    return { id: userId, name: userName };
  }

  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = await this.resolveUser(client);
    const userId = user.id;

    try {
      const participant = await this.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: data.conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        throw new WsException("Not a participant in this conversation");
      }

      await client.join(`conversation:${data.conversationId}`);
      this.logger.debug(`${userId} joined room conversation:${data.conversationId}`);
      return { success: true };
    } catch (err) {
      this.logger.error(`handleJoinConversation error:`, err);
      throw toWsException(err, "Cannot join conversation");
    }
  }

  @SubscribeMessage("leave_conversation")
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    void client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const user = await this.resolveUser(client);
    const userId = user.id;

    const content = data.content?.trim();
    if (!content) throw new WsException("Message content is required");
    if (content.length > 4000) throw new WsException("Message too long");

    try {
      const message = await this.chatService.saveMessage(
        data.conversationId,
        userId,
        content,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("new_message", message);

      return { success: true };
    } catch (err) {
      throw toWsException(err, "Failed to send message");
    }
  }

  @SubscribeMessage("typing_start")
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = await this.resolveUser(client);
    const userId = user.id;
    const userName = user.name;

    client.to(`conversation:${data.conversationId}`).emit("typing", {
      conversationId: data.conversationId,
      userId,
      userName,
      isTyping: true,
    });
  }

  @SubscribeMessage("typing_stop")
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = await this.resolveUser(client);
    const userId = user.id;
    const userName = user.name;

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
    const cookieHeader =
      (client.handshake.headers.cookie as string) ||
      (client.handshake.headers.Cookie as string) ||
      "";
    const cookies = parseCookie(cookieHeader);
    const authHeader = client.handshake.headers.authorization as string | undefined;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    const token =
      cookies[ACCESS_TOKEN_COOKIE] ||
      (client.handshake.auth?.token as string | undefined) ||
      bearerToken;

    if (!token) {
      throw new Error(`No auth token found in cookie or handshake`);
    }

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
