export function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return formatDateKey(new Date());
}

export function addDays(dateKey: string, days: number) {
  const date = toDate(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

export function daysBetween(from: string, to: string) {
  const start = toDate(from).getTime();
  const end = toDate(to).getTime();
  return Math.ceil((end - start) / 86400000);
}

export function daysUntil(targetDate: string) {
  return daysBetween(todayKey(), targetDate);
}

export function isSameOrAfter(dateKey: string, targetKey: string) {
  return toDate(dateKey).getTime() >= toDate(targetKey).getTime();
}

export function displayDate(dateKey: string) {
  const date = toDate(dateKey);
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

export function compactDate(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}
