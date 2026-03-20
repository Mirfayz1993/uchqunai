import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL majburiy"),

  // Auth
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET kamida 16 belgi bo'lishi kerak"),

  // AI APIs
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY majburiy"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY majburiy"),

  // Admin
  ADMIN_PASSWORD: z.string().min(6, "ADMIN_PASSWORD kamida 6 belgi").optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN majburiy"),

  // Push notifications
  VAPID_PUBLIC_KEY: z.string().min(1, "VAPID_PUBLIC_KEY majburiy"),
  VAPID_PRIVATE_KEY: z.string().min(1, "VAPID_PRIVATE_KEY majburiy"),
  VAPID_SUBJECT: z.string().min(1, "VAPID_SUBJECT majburiy"),

  // Cron
  CRON_SECRET: z.string().min(16, "CRON_SECRET kamida 16 belgi bo'lishi kerak"),

  // Next.js
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Environment variable xatolari:\n${errors}`);
  }
  return result.data;
}

// Validate once at module load (server-side only)
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
