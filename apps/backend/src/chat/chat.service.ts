import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
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

  /**
   * Check follow relationship between two users.
   * Returns { senderFollowsReceiver, receiverFollowsSender }
   */
  async getFollowStatus(
    senderUserId: string,
    receiverUserId: string,
  ): Promise<{ senderFollowsReceiver: boolean; receiverFollowsSender: boolean }> {
    const [senderFollowsReceiver, receiverFollowsSender] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: senderUserId,
            followingId: receiverUserId,
          },
        },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: receiverUserId,
            followingId: senderUserId,
          },
        },
      }),
    ]);

    return {
      senderFollowsReceiver: !!senderFollowsReceiver,
      receiverFollowsSender: !!receiverFollowsSender,
    };
  }

  /**
   * Get or create a 1-to-1 conversation.
   * Requires that userA follows userB (sender must follow receiver).
   */
  async getOrCreateConversation(
    userAId: string,
    userBId: string,
  ): Promise<{ id: string }> {
    // Check if conversation already exists (receiver accessing their inbox)
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

    // Only allow creation if userA follows userB
    const { senderFollowsReceiver } = await this.getFollowStatus(userAId, userBId);
    if (!senderFollowsReceiver) {
      throw new ForbiddenException(
        "You must follow this user before you can message them",
      );
    }

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

  /**
   * List all conversations for a user, enriched with follow status.
   */
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

    // Fetch follow status for all conversation partners in parallel
    const results = await Promise.all(
      convs.map(async (c) => {
        const otherUser = c.participants[0]?.user ?? null;
        let iFollowThem = false;
        let theyFollowMe = false;

        if (otherUser) {
          const status = await this.getFollowStatus(userId, otherUser.id);
          iFollowThem = status.senderFollowsReceiver;
          theyFollowMe = status.receiverFollowsSender;
        }

        return {
          id: c.id,
          updatedAt: c.updatedAt,
          otherUser,
          lastMessage: c.messages[0] ?? null,
          // Current user can send if they follow the other person
          canSend: iFollowThem,
          // Current user can reply if they follow the sender back
          canReply: iFollowThem && theyFollowMe,
        };
      }),
    );

    return results;
  }

  /** Get paginated messages for a conversation (cursor-based) */
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

  /**
   * Persist a message.
   * Sender must follow the receiver (the other participant).
   */
  async saveMessage(conversationId: string, senderId: string, content: string) {
    // Verify sender is a participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });

    if (!participant) throw new ForbiddenException("Not a participant in this conversation");

    // Find the other participant
    const otherParticipant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: { not: senderId },
      },
      select: { userId: true },
    });

    if (!otherParticipant) throw new BadRequestException("Conversation is incomplete");

    // Sender must follow the receiver
    const { senderFollowsReceiver } = await this.getFollowStatus(
      senderId,
      otherParticipant.userId,
    );

    if (!senderFollowsReceiver) {
      throw new ForbiddenException(
        "You must follow this user before sending messages",
      );
    }

    // Use transaction callback form (Prisma v7 compatible)
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, senderId, content: content.trim() },
        select: MESSAGE_SELECT,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  /** Get conversation details, verifying user is a participant */
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
