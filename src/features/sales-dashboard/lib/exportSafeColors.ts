export const EXPORT_SAFE_PALETTE = {
  red: "#de3b43",
  cream: "#e1ddba",
  darkGrey: "#333333",
  blue: "#3c7aa3",
} as const;

export const EXPORT_COLOR_PROPERTIES = [
  "color",
  "background-color",
  "border-color",
  "box-shadow",
  "text-shadow",
  "outline-color",
  "fill",
  "stroke",
] as const;

type ExportColorProperty = (typeof EXPORT_COLOR_PROPERTIES)[number];

export type ExportColorDiagnostic = {
  property: ExportColorProperty;
  value: string;
  node: string;
};

export function shirtExportScale(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
}

export function shirtExportTransform(value: string | number): string {
  return `scaleY(${shirtExportScale(value)})`;
}

const UNSUPPORTED_COLOR_FUNCTION = /\b(?:oklab|oklch)\b/i;

export function hasUnsupportedExportColor(value: string): boolean {
  return UNSUPPORTED_COLOR_FUNCTION.test(value);
}

function fallbackFor(property: ExportColorProperty): string {
  switch (property) {
    case "background-color":
      return EXPORT_SAFE_PALETTE.darkGrey;
    case "border-color":
      return "rgba(225, 221, 186, 0.2)";
    case "box-shadow":
    case "text-shadow":
      return "none";
    case "outline-color":
      return EXPORT_SAFE_PALETTE.blue;
    case "fill":
      return EXPORT_SAFE_PALETTE.cream;
    case "stroke":
      return EXPORT_SAFE_PALETTE.blue;
    case "color":
      return EXPORT_SAFE_PALETTE.cream;
  }
}

function describeNode(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const component = element.getAttribute("data-component");
  const classes = typeof element.className === "string"
    ? element.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
    : "";
  return `${tag}${component ? `[data-component=${component}]` : ""}${classes ? `.${classes}` : ""}`;
}

function exportElements(root: Element): Element[] {
  return [root, ...Array.from(root.querySelectorAll("*"))];
}

function normalizeSemanticShirtSvg(root: Element): void {
  for (const element of Array.from(root.querySelectorAll<SVGElement>("[data-export-svg-role]"))) {
    const role = element.getAttribute("data-export-svg-role");
    if (role === "shirt-base") {
      element.style.setProperty("fill", EXPORT_SAFE_PALETTE.darkGrey, "important");
    } else if (role === "shirt-progress") {
      element.style.setProperty("fill", element.getAttribute("data-export-fill-color") || EXPORT_SAFE_PALETTE.red, "important");
      element.style.setProperty("animation", "none", "important");
      element.style.setProperty("transform", shirtExportTransform(element.getAttribute("data-export-fill-scale") || 0), "important");
    } else if (role === "shirt-outline" || role === "shirt-collar") {
      element.style.setProperty("fill", "none", "important");
      element.style.setProperty("stroke", EXPORT_SAFE_PALETTE.cream, "important");
    }
  }
}

export function findUnsupportedExportColors(root: Element): ExportColorDiagnostic[] {
  const view = root.ownerDocument.defaultView;
  if (!view) return [];
  const diagnostics: ExportColorDiagnostic[] = [];
  for (const element of exportElements(root)) {
    const computed = view.getComputedStyle(element);
    for (const property of EXPORT_COLOR_PROPERTIES) {
      const value = computed.getPropertyValue(property);
      if (hasUnsupportedExportColor(value)) diagnostics.push({ property, value, node: describeNode(element) });
    }
  }
  return diagnostics;
}

/** Normalize only the cloned html2canvas subtree; the visible page is untouched. */
export function normalizeExportColors(root: Element): ExportColorDiagnostic[] {
  const view = root.ownerDocument.defaultView;
  if (!view) return [];
  normalizeSemanticShirtSvg(root);
  const semanticSvgElements = new Set(Array.from(root.querySelectorAll("[data-export-svg-role]")));
  const diagnostics: ExportColorDiagnostic[] = [];
  for (const element of exportElements(root)) {
    const computed = view.getComputedStyle(element);
    for (const property of EXPORT_COLOR_PROPERTIES) {
      if (semanticSvgElements.has(element) && (property === "fill" || property === "stroke")) continue;
      const value = computed.getPropertyValue(property);
      if (!hasUnsupportedExportColor(value)) continue;
      const diagnostic = { property, value, node: describeNode(element) };
      diagnostics.push(diagnostic);
      (element as HTMLElement | SVGElement).style.setProperty(property, fallbackFor(property), "important");
    }
  }
  return diagnostics;
}
