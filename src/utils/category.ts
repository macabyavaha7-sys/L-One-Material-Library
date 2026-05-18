export type LibraryRoute = {
  type: "category" | "tag";
  value: string;
};

function getAppBase() {
  return window.location.hostname.endsWith("github.io") ? "/L-One-Material-Library" : "";
}

function getRoutePathname() {
  const base = getAppBase();
  const pathname = window.location.pathname;
  return base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
}

export function normalizeCategory(category?: string) {
  if (!category || category === "全部") return "全部";
  return category;
}

export function normalizeTag(tag?: string) {
  return (tag || "").trim();
}

export function categoryToPath(category: string) {
  const base = getAppBase();
  if (normalizeCategory(category) === "全部") return `${base}/`;
  return `${base}/category/${encodeURIComponent(category)}`;
}

export function tagToPath(tag: string) {
  const base = getAppBase();
  const normalized = normalizeTag(tag);
  if (!normalized) return `${base}/`;
  return `${base}/tag/${encodeURIComponent(normalized)}`;
}

export function getRouteFromLocation(): LibraryRoute {
  const pathname = getRoutePathname();
  const tagMatch = pathname.match(/^\/tag\/(.+)$/);
  if (tagMatch) {
    try {
      return { type: "tag", value: decodeURIComponent(tagMatch[1]) };
    } catch {
      return { type: "category", value: "全部" };
    }
  }

  const match = pathname.match(/^\/category\/(.+)$/);
  if (!match) return { type: "category", value: "全部" };

  try {
    return { type: "category", value: decodeURIComponent(match[1]) };
  } catch {
    return { type: "category", value: "全部" };
  }
}

export function getCategoryFromLocation() {
  const route = getRouteFromLocation();
  return route.type === "category" ? route.value : "全部";
}
