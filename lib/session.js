// Erisim kodu yalnizca sunucuda degerlendirilir; istemci paketine hicbir zaman girmez.
// Vercel'de SITE_PASSWORD ortam degiskeni tanimlanirsa asagidaki varsayilanin yerine o gecer.
const DEFAULT_PASSCODE = "1001";

export const COOKIE_NAME = "axln_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export function expectedPasscode() {
  return process.env.SITE_PASSWORD || DEFAULT_PASSCODE;
}

export async function sessionToken(passcode) {
  const bytes = new TextEncoder().encode(`axillaryLN::${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hasValidSession(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const expected = await sessionToken(expectedPasscode());

  // sabit uzunlukta karsilastirma: erken cikis zamanlama bilgisi sizdirmasin
  if (token.length !== expected.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= token.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return mismatch === 0;
}
