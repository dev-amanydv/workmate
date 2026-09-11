import { Injectable, NotFoundException } from "@nestjs/common";
import "multer";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostResponseDto } from "./dto/post-response.dto";

const AUTHOR_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(
    authorId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostResponseDto> {
    let imageUrl: string | null = null;

    if (file) {
      imageUrl = await this.storage.uploadImage(file, "posts");
    }

    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        imageUrl,
        authorId,
      },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
      },
    });

    return PostResponseDto.fromEntity(post);
  }

  async findAll(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ posts: PostResponseDto[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 50);

    const posts = await this.prisma.post.findMany({
      take: limit + 1,
      cursor: params?.cursor ? { id: params.cursor } : undefined,
      skip: params?.cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return {
      posts: posts.map((p) => PostResponseDto.fromEntity(p)),
      nextCursor,
    };
  }

  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return PostResponseDto.fromEntity(post);
  }
}
