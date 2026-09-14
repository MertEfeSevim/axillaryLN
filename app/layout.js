import "./globals.css";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";

export const metadata = {
  title: "axillaryLN Fuzzy Workspace",
  description:
    "Verilen FIS ve MAT dosyalarina gore aksiller lenf nodu tutulumunu bulanik mantik ile hesaplayan referans calisma alani. / Reference workspace computing axillary lymph node involvement from the given FIS and MAT files with fuzzy logic.",
};

// Baslangic dili varsayilandir; istemci kayitli secimi okuyunca <html lang> guncellenir.
export default function RootLayout({ children }) {
  return (
    <html lang={DEFAULT_LANGUAGE}>
      <body>{children}</body>
    </html>
  );
}
