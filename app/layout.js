import "./globals.css";

export const metadata = {
  title: "axillaryLN Fuzzy Workspace",
  description:
    "Verilen FIS ve MAT dosyalarina gore aksiller lenf nodu tutulumunu bulanık mantik ile hesaplayan referans calisma alani.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
