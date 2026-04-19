import "./globals.css";

export const metadata = {
  title: "Klinik Mimar | NodeInsight",
  description:
    "Meme MRG bulgularina gore aksiller lenf nodu tutulumunu bulanık mantik ile yorumlayan klinik karar paneli.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
