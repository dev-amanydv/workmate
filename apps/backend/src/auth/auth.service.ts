import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import type { CookieOptions, Response } from "express";
import type { Profile } from "passport-google-oauth20";

import { PrismaService } from "../prisma/prisma.service";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface TokenPayload {
  sub: string;
  email: string;
}

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  assertGoogleConfigured(): void {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID", "");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET", "");
    const accessSecret = this.config.get<string>("JWT_ACCESS_SECRET", "");
    const refreshSecret = this.config.get<string>("JWT_REFRESH_SECRET", "");

    if (!clientId || !clientSecret || !accessSecret || !refreshSecret) {
      throw new ServiceUnavailableException(
        "Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET in apps/backend/.env.local",
      );
    }
  }

  async validateGoogleUser(profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException("Google account has no verified email");
    }

    const googleId = profile.id;
    const avatarUrl = profile.photos?.[0]?.value ?? null;
    const name = profile.displayName || email.split("@")[0] || "User";

    return this.prisma.user.upsert({
      where: { googleId },
      create: { googleId, email, name, avatarUrl },
      update: { email, name, avatarUrl },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  issueTokens(user: User): AuthTokens {
    const payload: TokenPayload = { sub: user.id, email: user.email };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.config.getOrThrow<number>("JWT_ACCESS_TTL"),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.getOrThrow<number>("JWT_REFRESH_TTL"),
    });

    return { accessToken, refreshToken };
  }

  setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      this.cookieOptions("/"),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      this.cookieOptions("/api/auth"),
    );
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions("/"));
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions("/api/auth"));
  }

  async refreshAccessToken(refreshToken: string | undefined): Promise<User> {
    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    let payload: TokenPayload;
    try {
      payload = this.jwt.verify<TokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    return user;
  }

  private cookieOptions(path: string): CookieOptions {
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    const maxAge =
      path === "/"
        ? this.config.getOrThrow<number>("JWT_ACCESS_TTL") * 1000
        : this.config.getOrThrow<number>("JWT_REFRESH_TTL") * 1000;

    const sameSiteEnv = this.config.get<string>("COOKIE_SAME_SITE");
    const sameSite = (sameSiteEnv as "none" | "lax" | "strict") || (isProd ? "none" : "lax");
    const domain = this.config.get<string>("COOKIE_DOMAIN") || undefined;

    return {
      httpOnly: true,
      secure: isProd || sameSite === "none",
      sameSite,
      domain,
      path,
      maxAge,
    };
  }
}
