import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/session";

// Giris formunun kendisi disinda her sey korunur: sayfa, _next paketleri ve
// public altindaki .fis dosyalari dahil. Bu yuzden giris ekrani kendi stilini
// tasir ve disaridan hicbir varlik istemez.
export const config = {
  matcher: ["/((?!api/giris).*)"],
};

function loginPage({ failed }) {
  return `<!doctype html>
<html lang="tr">
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
</style>
</head>
<body>
<form method="post" action="/api/giris">
  <h1>axillaryLN</h1>
  <p>erisim kodu</p>
  <input type="password" name="passcode" inputmode="numeric" autocomplete="off" autofocus aria-label="erisim kodu" />
  <button type="submit">gir</button>
  <span>${failed ? "kod hatali" : "&nbsp;"}</span>
</form>
</body>
</html>`;
}

export async function middleware(request) {
  if (await hasValidSession(request)) {
    return NextResponse.next();
  }

  return new NextResponse(loginPage({ failed: request.nextUrl.searchParams.has("hata") }), {
    status: 401,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
