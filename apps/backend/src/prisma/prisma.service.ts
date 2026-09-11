import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    const databaseUrl = config.get<string>("DATABASE_URL", "");
    const connectionString = databaseUrl
      ? databaseUrl.replace(/^mysql:\/\//, "mariadb://")
      : "mariadb://localhost:3306/workmate";
    const adapter = new PrismaMariaDb(connectionString);

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
