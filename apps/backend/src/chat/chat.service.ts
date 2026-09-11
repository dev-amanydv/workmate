import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  createdAt: true,
  sender: {
    select: { id: true, name: true, avatarUrl: true },
  },
} as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(
    userAId: string,
    userBId: string,
  ): Promise<{ id: string }> {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
      select: { id: true, participants: { select: { userId: true } } },
    });

    if (existing && existing.participants.length === 2) return { id: existing.id };

    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: userAId }, { userId: userBId }],
        },
      },
      select: { id: true },
    });

    return conversation;
  }

  async getConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
        participants: {
          where: { userId: { not: userId } },
          select: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, content: true, senderId: true, createdAt: true },
        },
      },
    });

    return convs.map((c: {
      id: string;
      updatedAt: Date;
      participants: Array<{ user: { id: string; name: string; avatarUrl: string | null } }>;
      messages: Array<{ id: string; content: string; senderId: string; createdAt: Date }>;
    }) => ({
      id: c.id,
      updatedAt: c.updatedAt,
      otherUser: c.participants[0]?.user ?? null,
      lastMessage: c.messages[0] ?? null,
    }));
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    take = 50,
  ) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) throw new ForbiddenException("Not a participant in this conversation");

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: MESSAGE_SELECT,
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return { messages: items.reverse(), nextCursor, hasMore };
  }

  async saveMessage(conversationId: string, senderId: string, content: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });

    if (!participant) throw new ForbiddenException("Not a participant in this conversation");

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, content: content.trim() },
        select: MESSAGE_SELECT,
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participants: {
          select: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });

    if (!conversation) throw new NotFoundException("Conversation not found");

    const isParticipant = conversation.participants.some((p) => p.user.id === userId);
    if (!isParticipant) throw new ForbiddenException("Access denied");

    return conversation;
  }
}
