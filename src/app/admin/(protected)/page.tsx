import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { formatRelativeTime, maskAccountNumber } from "@/lib/format";
import MerchantRowActions from "./MerchantRowActions";

type Merchant = {
  id: string;
  public_id: string;
  business_name: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_active: boolean;
};

type Stat = {
  merchant_id: string;
  today_count: number;
  week_count: number;
  total_count: number;
  last_viewed_at: string | null;
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://taptransfer.kr").replace(/\/$/, "");
}

// PRD 17장: 관리자 대시보드
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const supabase = supabaseAdmin();

  const [{ data: merchants }, { data: rawStats }] = await Promise.all([
    supabase
      .from("merchants")
      .select("id, public_id, business_name, bank_name, account_number, account_holder, is_active")
      .order("created_at", { ascending: false })
      .returns<Merchant[]>(),
    supabase.rpc("merchant_stats"),
  ]);

  const stats = (rawStats ?? []) as Stat[];
  const statById = new Map(stats.map((s) => [s.merchant_id, s]));
  const origin = siteUrl();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">판매자</h1>
        <Link
          href="/admin/new"
          className="h-10 rounded-xl bg-ink px-4 text-sm leading-10 font-semibold text-white"
        >
          새 판매자 추가
        </Link>
      </div>

      {created && (
        <p className="mt-4 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm">
          판매자가 등록되었습니다. 고유 URL:{" "}
          <span className="font-semibold">
            {origin}/p/{created}
          </span>
        </p>
      )}

      {/* PRD 24장: 조회수는 새로고침/재방문을 포함한 단순 페이지뷰 수이며 순 방문자 수(UV)가 아니다. */}
      <p className="mt-4 text-xs text-muted">
        조회수는 새로고침과 재방문을 포함한 누적 페이지뷰이며 순 방문자 수가 아닙니다.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-3 pr-4 font-medium">매장</th>
              <th className="py-3 pr-4 font-medium">은행</th>
              <th className="py-3 pr-4 font-medium">계좌번호</th>
              <th className="py-3 pr-4 font-medium">예금주</th>
              <th className="py-3 pr-4 font-medium">URL</th>
              <th className="py-3 pr-4 font-medium">조회 (오늘/주/전체)</th>
              <th className="py-3 pr-4 font-medium">마지막 접속</th>
              <th className="py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {(merchants ?? []).map((m) => {
              const stat = statById.get(m.id);
              return (
                <tr key={m.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4 font-semibold">
                    {m.business_name}
                    {!m.is_active && (
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted">
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{m.bank_name}</td>
                  {/* PRD 17장: 계좌번호는 가려서 표시한다. */}
                  <td className="py-3 pr-4 tabular-nums">{maskAccountNumber(m.account_number)}</td>
                  <td className="py-3 pr-4">{m.account_holder}</td>
                  <td className="py-3 pr-4 text-muted">/p/{m.public_id}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {stat?.today_count ?? 0} / {stat?.week_count ?? 0} / {stat?.total_count ?? 0}
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {formatRelativeTime(stat?.last_viewed_at ?? null)}
                  </td>
                  <td className="py-3">
                    <MerchantRowActions
                      id={m.id}
                      publicId={m.public_id}
                      businessName={m.business_name}
                      isActive={m.is_active}
                      url={`${origin}/p/${m.public_id}`}
                    />
                  </td>
                </tr>
              );
            })}
            {(merchants ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted">
                  등록된 판매자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
