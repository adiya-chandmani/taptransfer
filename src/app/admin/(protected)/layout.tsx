import Link from "next/link";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <Link href="/admin" className="text-base font-bold">
          TapTransfer 관리자
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm text-muted">
            로그아웃
          </button>
        </form>
      </header>
      <main className="px-5 py-6">{children}</main>
    </div>
  );
}
