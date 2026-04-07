import { z } from "zod";

export const bookingCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式無效"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間格式無效"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "時間格式無效"),
  customerName: z.string().min(1, "請輸入姓名").max(50, "姓名過長"),
  customerEmail: z.string().email("請輸入有效的電子信箱"),
  customerPhone: z.string().min(8, "請輸入有效的手機號碼").max(20, "手機號碼過長"),
  numberOfPeople: z.number().int().min(1, "至少 1 人").max(20, "最多 20 人").default(1),
  notes: z.string().max(500, "備註過長").optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "請輸入帳號"),
  password: z.string().min(1, "請輸入密碼"),
});

export const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean(),
});

export const scheduleUpdateSchema = z.object({
  slots: z.array(scheduleSlotSchema),
});

export const holidayCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式無效"),
  description: z.string().max(100).optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
