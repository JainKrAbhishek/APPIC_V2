import { User } from "@shared/schema";
import { z } from "zod";

// Form schemas
export const userEditSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Must be a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  isAdmin: z.boolean(),
  isActive: z.boolean().default(true),
});

export const userCreateSchema = userEditSchema.extend({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const passwordResetSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Types
export type UserEditFormValues = z.infer<typeof userEditSchema>;
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

// Extended interface for user stats
export interface UserWithStats extends User {
  practiceCompletedCount?: number;
  lastLoginDate?: string;
  topicsCompleted?: number;
  registrationDate?: string;
  accountStatus?: 'active' | 'inactive' | 'suspended';
  isActive?: boolean; // Additional property that may be set manually
}