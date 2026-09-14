import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MAX_AGE, expectedPasscode, sessionToken } from "@/lib/session";

export async function POST(request) {
  const form = await request.formData();
  const submitted = String(form.get("passcode") || "");
  const passcode = expectedPasscode();

  // Tek sayfalik uygulama: giris sonrasi her zaman koke doneriz, acik yonlendirme riski kalmaz.
  if (submitted !== passcode) {
    return NextResponse.redirect(new URL("/?hata=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set(COOKIE_NAME, await sessionToken(passcode), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
