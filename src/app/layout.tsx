import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TapTransfer",
  description: "계좌번호 입력하지 마세요. 휴대폰만 대면 됩니다.",
};

// PRD 8, 35장: 모바일 우선. 버튼을 누를 때 확대되지 않도록 한다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
