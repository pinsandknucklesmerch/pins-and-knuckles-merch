const SITE_NAME = "Pins & Knuckles Merch";

export function normalizeAnalyticsPageTitle(title: string, path: string | null) {
  const sourceTitle = title.trim();
  if (path === "/" || new RegExp(`^${SITE_NAME}\\s*[|–—:-]`, "i").test(sourceTitle)) return "Home";

  const cleanedTitle = sourceTitle
    .replace(new RegExp(SITE_NAME, "gi"), "")
    .replace(/^[\s|–—:-]+|[\s|–—:-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleanedTitle || sourceTitle || "Untitled page";
}
