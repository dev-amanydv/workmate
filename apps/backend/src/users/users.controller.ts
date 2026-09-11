import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import type { User } from "@prisma/client";

import { UserResponseDto } from "../auth/dto/user-response.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async me(@CurrentUser() user: User): Promise<{
    data: UserResponseDto & {
      followersCount: number;
      followingCount: number;
      postsCount: number;
      isSelf: boolean;
    };
  }> {
    const counts = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    const base = UserResponseDto.fromUser(user);
    return {
      data: {
        ...base,
        followersCount: counts?._count?.followers ?? 0,
        followingCount: counts?._count?.following ?? 0,
        postsCount: counts?._count?.posts ?? 0,
        isSelf: true,
      },
    };
  }

  @Get("suggested")
  async suggested(@CurrentUser() user: User): Promise<{
    data: Array<{
      id: string;
      name: string;
      role: string;
      avatarUrl: string | null;
      isFollowing: boolean;
    }>;
  }> {
    const users = await this.prisma.user.findMany({
      where: user?.id ? { id: { not: user.id } } : {},
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        ...(user?.id
          ? {
              followers: {
                where: { followerId: user.id },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    return {
      data: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        role: u.bio || "Workmate Member",
        avatarUrl: u.avatarUrl,
        isFollowing: Array.isArray(u.followers) && u.followers.length > 0,
      })),
    };
  }

  @Get(":id")
  async getUserProfile(
    @CurrentUser() currentUser: User,
    @Param("id") id: string,
  ): Promise<{
    data: {
      id: string;
      email: string;
      name: string;
      bio: string | null;
      avatarUrl: string | null;
      createdAt: Date;
      followersCount: number;
      followingCount: number;
      postsCount: number;
      isFollowing: boolean;
      isSelf: boolean;
    };
  }> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
        ...(currentUser?.id
          ? {
              followers: {
                where: { followerId: currentUser.id },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const u = targetUser as any;
    const isFollowing = Array.isArray(u.followers) && u.followers.length > 0;
    const isSelf = currentUser?.id === targetUser.id;

    return {
      data: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        bio: targetUser.bio,
        avatarUrl: targetUser.avatarUrl,
        createdAt: targetUser.createdAt,
        followersCount: targetUser._count?.followers ?? 0,
        followingCount: targetUser._count?.following ?? 0,
        postsCount: targetUser._count?.posts ?? 0,
        isFollowing,
        isSelf,
      },
    };
  }
}

