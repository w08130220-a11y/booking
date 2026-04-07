import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy年M月d日 (EEEE)", { locale: zhTW });
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "M/d (EEE)", { locale: zhTW });
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

export function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
