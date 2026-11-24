export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}