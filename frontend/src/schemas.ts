import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Введите корректный email"),
  username: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа")
    .regex(/^[a-zA-Z0-9_]+$/, "Только латиница, цифры и _"),
  full_name: z.string().trim().min(2, "Минимум 2 символа"),
  password: z.string().min(8, "Минимум 8 символов"),
  role: z.enum(["user", "admin"]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type RegisterForm = z.input<typeof registerSchema>;
export type RegisterPayload = z.output<typeof registerSchema>;
export type LoginForm = z.input<typeof loginSchema>;
export type LoginPayload = z.output<typeof loginSchema>;
