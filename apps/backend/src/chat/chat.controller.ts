import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import type { User } from "@prisma/client";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("conversations")
  async getConversations(@Req() req: Request & { user: User }) {
    return this.chatService.getConversations(req.user.id);
  }

  
  @Post("conversations")
  @HttpCode(HttpStatus.OK)
  async getOrCreateConversation(
    @Req() req: Request & { user: User },
    @Body() body: { recipientId: string },
  ) {
    if (!body.recipientId) {
      throw new BadRequestException("recipientId is required");
    }
    if (body.recipientId === req.user.id) {
      throw new BadRequestException("Cannot create conversation with yourself");
    }
    return this.chatService.getOrCreateConversation(req.user.id, body.recipientId);
  }

  @Get("conversations/:id/messages")
  async getMessages(
    @Req() req: Request & { user: User },
    @Param("id") conversationId: string,
    @Query("cursor") cursor?: string,
    @Query("take") take?: string,
  ) {
    const takeNum = take ? Math.min(parseInt(take, 10), 100) : 50;
    return this.chatService.getMessages(conversationId, req.user.id, cursor, takeNum);
  }

  @Get("follow-status/:userId")
  async getFollowStatus(
    @Req() req: Request & { user: User },
    @Param("userId") targetUserId: string,
  ) {
    return this.chatService.getFollowStatus(req.user.id, targetUserId);
  }
}
