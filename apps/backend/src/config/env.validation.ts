import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().default(""),
  JWT_REFRESH_SECRET: z.string().default(""),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(1209600),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default("http://localhost:4000/api/auth/google/callback"),
  R2_ACCOUNT_ID: z.string().default("placeholder_account_id"),
  R2_ACCESS_KEY_ID: z.string().default("placeholder_access_key"),
  R2_SECRET_ACCESS_KEY: z.string().default("placeholder_secret_key"),
  R2_BUCKET_NAME: z.string().default("workmate"),
  R2_PUBLIC_URL: z.string().default("https://pub-workmate.r2.dev"),
  UPLOADS_DIR: z.string().default("./uploads"),
  LOCAL_STORAGE_BASE_URL: z.string().default("http://localhost:4000"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
      )
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
