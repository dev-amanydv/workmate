import type { User } from "@prisma/client";

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;

  static fromUser(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }
}
