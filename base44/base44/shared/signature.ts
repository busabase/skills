const toHex = (buffer: ArrayBuffer): string =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const hmacSha256Hex = async (secret: string, body: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
};

/** Constant-time string comparison (length is not secret here: both are 64 hex chars). */
const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Busabase signs the raw request body with HMAC-SHA256 (hex) and sends it as
 * `X-Busabase-Signature`, only when the webhook rule has a secret. There is no timestamp in
 * the scheme, so a captured request can be replayed; the receiver is idempotent for that reason.
 */
export const verifyBusabaseSignature = async (
  rawBody: string,
  header: string | null,
  secret: string,
): Promise<boolean> => {
  if (!header) return false;
  const expected = await hmacSha256Hex(secret, rawBody);
  return safeEqual(expected, header.trim().toLowerCase());
};
