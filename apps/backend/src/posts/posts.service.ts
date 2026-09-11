import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import "multer";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostResponseDto } from "./dto/post-response.dto";
import { UpdatePostDto } from "./dto/update-post.dto";

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
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    const resolvedImageUrl = await this.storage.resolveImageUrl(post.imageUrl);
    return PostResponseDto.fromEntity({
      ...post,
      imageUrl: resolvedImageUrl,
      likesCount: post._count?.likes ?? 0,
      isLiked: false,
      author: {
        ...post.author,
        isFollowing: false,
      },
    });
  }

  async findAll(
    currentUserId?: string,
    params?: {
      cursor?: string;
      limit?: number;
      authorId?: string;
    },
  ): Promise<{ posts: PostResponseDto[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 50);

    const posts = await this.prisma.post.findMany({
      where: params?.authorId ? { authorId: params.authorId } : undefined,
      take: limit + 1,
      cursor: params?.cursor ? { id: params.cursor } : undefined,
      skip: params?.cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            ...(currentUserId
              ? {
                  followers: {
                    where: { followerId: currentUserId },
                    select: { id: true },
                  },
                }
              : {}),
          },
        },
        _count: {
          select: { likes: true },
        },
        ...(currentUserId
          ? {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id ?? null;
    }

    const resolvedPosts = await Promise.all(
      posts.map(async (p: any) => {
        const presignedUrl = await this.storage.resolveImageUrl(p.imageUrl);
        const isLiked = currentUserId ? (p.likes?.length ?? 0) > 0 : false;
        const isFollowing = currentUserId
          ? p.authorId === currentUserId
            ? false
            : (p.author?.followers?.length ?? 0) > 0
          : false;

        return PostResponseDto.fromEntity({
          ...p,
          imageUrl: presignedUrl,
          likesCount: p._count?.likes ?? 0,
          isLiked,
          author: {
            id: p.author.id,
            name: p.author.name,
            avatarUrl: p.author.avatarUrl,
            isFollowing,
          },
        });
      }),
    );

    return {
      posts: resolvedPosts,
      nextCursor,
    };
  }

  async findOne(id: string, currentUserId?: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            ...(currentUserId
              ? {
                  followers: {
                    where: { followerId: currentUserId },
                    select: { id: true },
                  },
                }
              : {}),
          },
        },
        _count: {
          select: { likes: true },
        },
        ...(currentUserId
          ? {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    const p = post as any;
    const isLiked = currentUserId ? (p.likes?.length ?? 0) > 0 : false;
    const isFollowing = currentUserId
      ? p.authorId === currentUserId
        ? false
        : (p.author?.followers?.length ?? 0) > 0
      : false;

    const resolvedImageUrl = await this.storage.resolveImageUrl(post.imageUrl);
    return PostResponseDto.fromEntity({
      ...post,
      imageUrl: resolvedImageUrl,
      likesCount: p._count?.likes ?? 0,
      isLiked,
      author: {
        id: p.author.id,
        name: p.author.name,
        avatarUrl: p.author.avatarUrl,
        isFollowing,
      },
    });
  }

  async update(
    id: string,
    authorId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const existing = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenException("You can only edit your own posts");
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId: authorId },
          select: { id: true },
        },
      },
    });

    const p = updated as any;
    const resolvedImageUrl = await this.storage.resolveImageUrl(
      updated.imageUrl,
    );
    return PostResponseDto.fromEntity({
      ...updated,
      imageUrl: resolvedImageUrl,
      likesCount: p._count?.likes ?? 0,
      isLiked: (p.likes?.length ?? 0) > 0,
      author: {
        ...p.author,
        isFollowing: false,
      },
    });
  }

  async delete(
    id: string,
    authorId: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Post deleted successfully",
    };
  }

  async like(
    postId: string,
    userId: string,
  ): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    await this.prisma.like.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      create: {
        userId,
        postId,
      },
      update: {},
    });

    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    return {
      success: true,
      isLiked: true,
      likesCount,
    };
  }

  async unlike(
    postId: string,
    userId: string,
  ): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    await this.prisma.like.deleteMany({
      where: {
        userId,
        postId,
      },
    });

    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    return {
      success: true,
      isLiked: false,
      likesCount,
    };
  }
}
