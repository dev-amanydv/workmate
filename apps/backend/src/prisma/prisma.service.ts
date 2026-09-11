import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

import type { PoolConfig } from "mariadb";

function buildMariaDbConfig(databaseUrl: string): PoolConfig | string {
  if (!databaseUrl) {
    return "mariadb://localhost:3306/workmate";
  }

  try {
    const parsed = new URL(
      databaseUrl
        .replace(/^mysql:\/\//i, "http://")
        .replace(/^mariadb:\/\//i, "http://"),
    );

    const sslMode = (
      parsed.searchParams.get("ssl-mode") ||
      parsed.searchParams.get("sslmode") ||
      ""
    ).toLowerCase();
    const sslParam = (parsed.searchParams.get("ssl") || "").toLowerCase();
    const sslAccept = (
      parsed.searchParams.get("sslaccept") || ""
    ).toLowerCase();

    const isCloudHost =
      parsed.hostname.includes("aivencloud.com") ||
      parsed.hostname.includes("aws.com") ||
      parsed.hostname.includes("azure.com") ||
      parsed.hostname.includes("render.com") ||
      parsed.hostname.includes("supabase.co");

    const requiresSsl =
      sslMode === "required" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full" ||
      sslParam === "true" ||
      sslParam === "1" ||
      sslAccept === "accept_invalid_certs" ||
      sslAccept === "strict" ||
      isCloudHost;

    const config: PoolConfig = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || "root"),
      password: decodeURIComponent(parsed.password || ""),
      database: decodeURIComponent(
        parsed.pathname.replace(/^\//, "") || "workmate",
      ),
      connectTimeout: 15000,
      prepareCacheLength: 0,
    };

    if (requiresSsl) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }

    return config;
  } catch {
    return databaseUrl.replace(/^mysql:\/\//i, "mariadb://");
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    const databaseUrl = config.get<string>("DATABASE_URL", "");
    const poolOrConfig = buildMariaDbConfig(databaseUrl);
    const adapter = new PrismaMariaDb(poolOrConfig as any);

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.config.get<string>("DATABASE_URL", "");
    if (databaseUrl) {
      try {
        await this.$connect();
      } catch (err) {
        this.logger.warn(
          `Could not connect to database on startup: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
