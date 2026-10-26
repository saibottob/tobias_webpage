const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");

const dimensionCache = new Map();
const dimensionWarnings = new Set();

function coerceDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/**
 * ISO-8601 with milliseconds, same shape as Date#toISOString().
 * An already formatted fallback is returned unchanged so sitemap
 * lastmod stays identical when `updated` is absent.
 */
function isoDate(value, fallback) {
  const primary = coerceDate(value);
  if (primary) return primary.toISOString();
  if (typeof fallback === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(fallback)) {
    return fallback;
  }
  const secondary = coerceDate(fallback);
  return secondary ? secondary.toISOString() : "";
}

function modifiedDate(item) {
  if (!item || typeof item !== "object") return coerceDate(item) || new Date();
  return coerceDate(item.data && item.data.updated) || coerceDate(item.date) || new Date();
}

function feedUpdated(collection) {
  let newest = null;
  for (const item of collection || []) {
    const current = modifiedDate(item);
    if (!newest || current > newest) newest = current;
  }
  return newest || new Date();
}

function positiveInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const rounded = Math.round(number);
  return rounded > 0 ? rounded : null;
}

function createImageDimensions(inputDir) {
  const root = path.resolve(inputDir);

  return function imageDimensions(src, widthOverride, heightOverride) {
    const width = positiveInt(widthOverride);
    const height = positiveInt(heightOverride);
    if (width && height) return { width, height };
    if (!src || typeof src !== "string") return null;

    let pathname = src.split("#")[0].split("?")[0];
    if (/^https?:\/\//i.test(pathname)) {
      try {
        const absolute = new URL(pathname);
        if (!absolute.pathname.startsWith("/assets/")) return null;
        pathname = absolute.pathname;
      } catch {
        return null;
      }
    }
    if (!pathname.startsWith("/")) return null;

    const relative = pathname.replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    const insideRoot = file === root || file.startsWith(root + path.sep);
    if (!insideRoot) {
      warnOnce(pathname, `[seo] Bildpfad ausserhalb von src ignoriert: ${pathname}`);
      return null;
    }

    let stat = null;
    try {
      const candidate = fs.statSync(file);
      if (candidate.isFile()) stat = candidate;
    } catch {
      stat = null;
    }
    if (!stat) {
      warnOnce(pathname, `[seo] og:image ohne lesbare Datei, Breite/Höhe entfallen: ${pathname}`);
      return null;
    }

    const cached = dimensionCache.get(pathname);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached.result;

    let result = null;
    try {
      const dims = sizeOf(file);
      if (dims && positiveInt(dims.width) && positiveInt(dims.height)) {
        result = { width: dims.width, height: dims.height };
      } else {
        warnOnce(pathname, `[seo] Bildgrösse nicht erkannt: ${pathname}`);
      }
    } catch (error) {
      warnOnce(pathname, `[seo] Bildgrösse nicht lesbar (${pathname}): ${error.message}`);
    }

    dimensionCache.set(pathname, { mtimeMs: stat.mtimeMs, size: stat.size, result });
    return result;
  };
}

function warnOnce(key, message) {
  if (dimensionWarnings.has(key)) return;
  dimensionWarnings.add(key);
  console.warn(message);
}

function warnIncompleteBlogPosts(posts) {
  for (const post of posts || []) {
    const missing = [];
    if (!String(post.data && post.data.description ? post.data.description : "").trim()) {
      missing.push("description");
    }
    if (!String(post.data && post.data.image ? post.data.image : "").trim()) {
      missing.push("image");
    }
    if (missing.length) {
      console.warn(`[seo] Blogpost ohne ${missing.join(" und ")}: ${post.inputPath}`);
    }
  }
}

function sitemapEntries(pages) {
  return (pages || []).filter((page) => {
    const url = page && page.url;
    if (!url) return false;
    if (page.data && page.data.sitemap === false) return false;
    if (url === "/404.html" || url.endsWith("/404.html")) return false;
    if (/\.(xml|json)$/i.test(url)) return false;
    return true;
  });
}

function jsonld(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

module.exports = {
  coerceDate,
  isoDate,
  modifiedDate,
  feedUpdated,
  createImageDimensions,
  warnIncompleteBlogPosts,
  sitemapEntries,
  jsonld,
};
