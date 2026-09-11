import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { User } from "@prisma/client";
import type { Request, Response } from "express";

import { Public } from "../common/decorators/public.decorator";
import { AuthService, REFRESH_TOKEN_COOKIE } from "./auth.service";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {
    this.auth.assertGoogleConfigured();
  }

  @Public()
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): void {
    const frontendUrl = this.config.getOrThrow<string>("FRONTEND_URL").replace(/\/+$/, "");

    try {
      const tokens = this.auth.issueTokens(req.user);
      this.auth.setAuthCookies(res, tokens);
      res.redirect(
        `${frontendUrl}/auth/callback?token=${encodeURIComponent(tokens.accessToken)}&refresh=${encodeURIComponent(tokens.refreshToken)}`,
      );
    } catch {
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  @Public()
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: { ok: true } }> {
    const user = await this.auth.refreshAccessToken(
      req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined,
    );
    const tokens = this.auth.issueTokens(user);
    this.auth.setAuthCookies(res, tokens);
    return { data: { ok: true } };
  }

  @Public()
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response): { data: { ok: true } } {
    this.auth.clearAuthCookies(res);
    return { data: { ok: true } };
  }
}
