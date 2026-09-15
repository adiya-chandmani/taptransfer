import Link from "next/link";

// PRD 26장: 제품의 핵심 메시지.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold tracking-wide text-brand">TapTransfer</p>
      <h1 className="mt-3 text-3xl leading-snug font-bold">
        계좌번호 입력하지 마세요.
        <br />
        휴대폰만 대면 됩니다.
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        매장에 놓인 NFC 태그를 터치하거나 QR을 스캔하면 판매자의 계좌 정보가 바로 열립니다.
      </p>
      <Link
        href="/admin"
        className="mt-10 inline-flex h-12 items-center justify-center rounded-xl border border-line text-sm font-semibold text-muted"
      >
        관리자 페이지
      </Link>
    </main>
  );
}
