import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { User } from "@prisma/client";
import "multer";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostResponseDto } from "./dto/post-response.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("image"))
  async create(
    @CurrentUser() user: User,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ data: PostResponseDto }> {
    const post = await this.postsService.create(user.id, createPostDto, file);
    return { data: post };
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ): Promise<{
    data: PostResponseDto[];
    meta: { nextCursor: string | null };
  }> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const result = await this.postsService.findAll(user?.id, {
      cursor,
      limit: parsedLimit,
    });
    return {
      data: result.posts,
      meta: { nextCursor: result.nextCursor },
    };
  }

  @Get(":id")
  async findOne(
    @CurrentUser() user: User,
    @Param("id") id: string,
  ): Promise<{ data: PostResponseDto }> {
    const post = await this.postsService.findOne(id, user?.id);
    return { data: post };
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<{ data: PostResponseDto }> {
    const post = await this.postsService.update(id, user.id, updatePostDto);
    return { data: post };
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: User,
    @Param("id") id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.postsService.delete(id, user.id);
  }

  @Post(":id/like")
  async like(
    @CurrentUser() user: User,
    @Param("id") id: string,
  ): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    return this.postsService.like(id, user.id);
  }

  @Delete(":id/like")
  async unlike(
    @CurrentUser() user: User,
    @Param("id") id: string,
  ): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    return this.postsService.unlike(id, user.id);
  }
}
