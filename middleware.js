import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_MAX_AGE,
  LANGUAGES,
  loginCopy,
  normalizeLanguage,
} from "@/lib/i18n";

// Giris formunun kendisi disinda her sey korunur: sayfa, _next paketleri ve
// public altindaki .fis dosyalari dahil. Bu yuzden giris ekrani kendi stilini
// tasir ve disaridan hicbir varlik istemez.
export const config = {
  matcher: ["/((?!api/giris).*)"],
};

function loginPage({ failed, language, copy, languageLinks }) {
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>axillaryLN</title>
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  body {
    margin: 0; min-height: 100vh; display: grid; place-content: center; justify-items: center;
    padding: 24px; background: #f6f8fa; color: #10283f;
    font: 14px/1.5 "Avenir Next", "Segoe UI", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  form {
    display: grid; gap: 10px; justify-items: center; width: min(272px, 100%);
    padding: 30px 26px 20px; border: 1px solid rgba(16,40,66,.09); border-radius: 14px;
    background: #fff; text-align: center;
  }
  h1 { margin: 0; font-size: 1.15rem; font-weight: 700; letter-spacing: -.02em }
  p { margin: 0 0 6px; color: #8ea0b2; font-size: .76rem }
  input {
    width: 100%; padding: 9px 12px; border: 1px solid ${failed ? "#c2540c" : "rgba(16,40,66,.2)"};
    border-radius: 9px; background: #fff; color: inherit; text-align: center;
    font-family: "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
    font-size: 1rem; letter-spacing: .32em;
  }
  input:focus { outline: none; border-color: #1d5f9e; box-shadow: 0 0 0 3px rgba(29,95,158,.12) }
  button {
    width: 100%; padding: 7px 16px; border: 1px solid #10283f; border-radius: 999px;
    background: #10283f; color: #fff; font: inherit; font-size: .78rem; cursor: pointer;
  }
  button:hover { opacity: .84 }
  span { min-height: 1em; font-size: .72rem; color: ${failed ? "#c2540c" : "#8ea0b2"} }
  .lang { display: flex; gap: 4px }
  .lang a {
    padding: 3px 9px; border-radius: 999px; color: #8ea0b2; text-decoration: none;
    font-family: "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
    font-size: .68rem; letter-spacing: .04em;
  }
  .lang a:hover { color: #10283f }
  .lang a[aria-current="true"] { background: rgba(16,40,66,.06); color: #10283f; font-weight: 600 }
</style>
</head>
<body>
<form method="post" action="/api/giris">
  <h1>axillaryLN</h1>
  <p>${copy.prompt}</p>
  <input type="password" name="passcode" inputmode="numeric" autocomplete="off" autofocus aria-label="${copy.prompt}" />
  <button type="submit">${copy.submit}</button>
  <span>${failed ? copy.failed : "&nbsp;"}</span>
  <div class="lang">${languageLinks}</div>
</form>
</body>
</html>`;
}

// Dil secimi cerezde tasinir; giris ekraninda henuz JavaScript calismadigi icin
// secim ?lang= ile gelir ve ayni yanitta cereze yazilir.
function resolveLanguage(request) {
  const requested = request.nextUrl.searchParams.get("lang");

  if (requested) {
    return { language: normalizeLanguage(requested), persist: true };
  }

  return {
    language: normalizeLanguage(request.cookies.get(LANGUAGE_COOKIE)?.value),
    persist: false,
  };
}

function buildLanguageLinks(request, language) {
  return LANGUAGES.map((option) => {
    const url = request.nextUrl.clone();
    url.searchParams.set("lang", option.code);

    return `<a href="${url.pathname}${url.search}" aria-current="${
      option.code === language
    }" aria-label="${option.name}">${option.short}</a>`;
  }).join("");
}

export async function middleware(request) {
  if (await hasValidSession(request)) {
    return NextResponse.next();
  }

  const { language, persist } = resolveLanguage(request);

  const response = new NextResponse(
    loginPage({
      failed: request.nextUrl.searchParams.has("hata"),
      language,
      copy: loginCopy(language),
      languageLinks: buildLanguageLinks(request, language),
    }),
    {
      status: 401,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );

  if (persist) {
    response.cookies.set(LANGUAGE_COOKIE, language, {
      sameSite: "lax",
      path: "/",
      maxAge: LANGUAGE_MAX_AGE,
    });
  }

  return response;
}
