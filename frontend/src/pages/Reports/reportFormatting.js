export function formatNumber(value, maximumFractionDigits = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString("en-IN", {
    maximumFractionDigits,
  });
}

export function formatDay(date) {
  if (!date) return "";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}
