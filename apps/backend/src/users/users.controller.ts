import { Controller, Get } from "@nestjs/common";
import type { User } from "@prisma/client";

import { UserResponseDto } from "../auth/dto/user-response.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  me(@CurrentUser() user: User): { data: UserResponseDto } {
    return { data: UserResponseDto.fromUser(user) };
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
}

