export type Platform = "website" | "instagram" | "twitter";

export type NormalizeResult = { url: string | null; error: string | null };

function safeUrl(u: string): URL | null {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

export function normalizeWebsite(raw: string): NormalizeResult {
  const val = (raw || "").trim();
  if (!val) return { url: null, error: null };
  const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
  const parsed = safeUrl(withProto);
  if (!parsed) return { url: null, error: "Enter a valid URL (e.g., https://example.com)" };
  if (!/^https?:$/.test(parsed.protocol)) return { url: null, error: "Only http/https URLs are allowed" };
  if (!parsed.hostname) return { url: null, error: "Missing hostname" };
  if (withProto.length > 2048) return { url: null, error: "URL is too long" };
  return { url: parsed.toString(), error: null };
}

export function normalizeInstagram(raw: string): NormalizeResult {
  let v = (raw || "").trim();
  if (!v) return { url: null, error: null };

  if (/^https?:\/\//i.test(v)) {
    const u = safeUrl(v);
    if (!u) return { url: null, error: "Invalid Instagram URL" };
    if (!/(\.|^)instagram\.com$/i.test(u.hostname.replace(/^www\./i, "")))
      return { url: null, error: "URL must be on instagram.com" };
    const segs = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (segs.length !== 1) return { url: null, error: "Provide a profile URL (not a post or section)" };
    const handle = segs[0];
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle))
      return { url: null, error: "Invalid username (letters, numbers, dot, underscore; max 30)" };
    return { url: `https://instagram.com/${handle}`, error: null };
  }

  v = v.replace(/^@+/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(v))
    return { url: null, error: "Invalid username (letters, numbers, dot, underscore; max 30)" };
  return { url: `https://instagram.com/${v}`, error: null };
}

export function normalizeTwitter(raw: string): NormalizeResult {
  let v = (raw || "").trim();
  if (!v) return { url: null, error: null };

  if (/^https?:\/\//i.test(v)) {
    const u = safeUrl(v);
    if (!u) return { url: null, error: "Invalid Twitter/X URL" };
    const host = u.hostname.replace(/^www\./i, "");
    if (!/(\.|^)(twitter\.com|x\.com)$/i.test(host))
      return { url: null, error: "URL must be on x.com or twitter.com" };
    const segs = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (segs.length !== 1) return { url: null, error: "Provide a profile URL (not a post or section)" };
    const handle = segs[0];
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle))
      return { url: null, error: "Invalid username (letters, numbers, underscore; max 15)" };
    return { url: `https://x.com/${handle}`, error: null };
  }

  v = v.replace(/^@+/, "");
  if (!/^[A-Za-z0-9_]{1,15}$/.test(v))
    return { url: null, error: "Invalid username (letters, numbers, underscore; max 15)" };
  return { url: `https://x.com/${v}`, error: null };
}

export function normalizeByPlatform(platform: Platform, raw: string): NormalizeResult {
  switch (platform) {
    case "website":
      return normalizeWebsite(raw);
    case "instagram":
      return normalizeInstagram(raw);
    case "twitter":
      return normalizeTwitter(raw);
  }
}
