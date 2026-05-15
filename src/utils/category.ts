export function normalizeCategory(category?: string) {
  if (!category || category === "全部") return "全部";
  return category;
}

export function categoryToPath(category: string) {
  if (normalizeCategory(category) === "全部") return "/";
  return `/category/${encodeURIComponent(category)}`;
}

export function getCategoryFromLocation() {
  const match = window.location.pathname.match(/^\/category\/(.+)$/);
  if (!match) return "全部";

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "全部";
  }
}
