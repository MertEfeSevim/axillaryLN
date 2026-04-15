import "./globals.css";

export const metadata = {
  title: "AxillaryLN | Bulanik Mantik Arayuzu",
  description:
    "Meme MRG bulgularina gore aksiller lenf nodu tutulumunu tahmin eden bulanık mantık arayüzü.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
