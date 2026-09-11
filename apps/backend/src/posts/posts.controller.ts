import {
  Body,
  Controller,
  Get,
  Param,
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
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ): Promise<{
    data: PostResponseDto[];
    meta: { nextCursor: string | null };
  }> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const result = await this.postsService.findAll({
      cursor,
      limit: parsedLimit,
    });
    return {
      data: result.posts,
      meta: { nextCursor: result.nextCursor },
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<{ data: PostResponseDto }> {
    const post = await this.postsService.findOne(id);
    return { data: post };
  }
}
