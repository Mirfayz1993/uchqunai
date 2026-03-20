import { z } from "zod";

// ─── Chat ─────────────────────────────────────────────────────────────────

export const chatSchema = z.object({
  message: z
    .string()
    .min(1, "Xabar bo'sh bo'lishi mumkin emas")
    .max(5000, "Xabar juda uzun (max 5000 belgi)"),
  botSlug: z
    .string()
    .min(1)
    .max(100),
  conversationId: z.string().optional().nullable(),
  clientMessages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(5000),
      })
    )
    .max(100)
    .optional(),
});

// ─── Auth ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  phone: z
    .string()
    .regex(/^\+998\d{9}$/, "Noto'g'ri telefon raqam (+998XXXXXXXXX)"),
  password: z
    .string()
    .min(6, "Parol kamida 6 belgi bo'lishi kerak")
    .max(128),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(64),
  password: z
    .string()
    .min(1)
    .max(128),
});

// ─── Reminders ────────────────────────────────────────────────────────────

const REMINDER_TYPES = ["wake_up", "meeting", "birthday", "task", "general"] as const;
const RECUR_TYPES = ["daily", "weekly", "yearly"] as const;

export const reminderCreateSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(REMINDER_TYPES),
  remindAt: z.string().datetime({ message: "Noto'g'ri sana formati" }),
  isRecurring: z.boolean().default(false),
  recurType: z.enum(RECUR_TYPES).nullable().optional(),
});

// ─── Admin ────────────────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(6, "Parol kamida 6 belgi").max(128),
});

export const botAdminCreateSchema = z.object({
  botSlug: z.string().min(1).max(100),
  username: z.string().min(1).max(64),
  password: z.string().min(4).max(128),
});

export const botSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug faqat kichik harf, raqam va - bo'lishi kerak"),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(50),
  systemPrompt: z.string().min(1).max(10000),
  category: z.string().min(1).max(100),
  isActive: z.boolean().optional().default(true),
});
