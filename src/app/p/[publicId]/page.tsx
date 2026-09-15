import type { Metadata } from "next";
import { getActiveMerchant } from "@/lib/merchants";
import { digitsOnly, isValidPublicId } from "@/lib/format";
import TransferActions from "./TransferActions";

// PRD 33장: 계좌정보가 검색엔진에 노출되지 않도록 한다.
export const metadata: Metadata = {
  title: "계좌이체",
  robots: { index: false, follow: false, nocache: true },
};

type Props = { params: Promise<{ publicId: string }> };

/**
 * PRD 22장: 비활성 계좌와 존재하지 않는 ID 모두 같은 화면을 보여준다.
 * 어떤 ID가 실재하는지 구분되지 않아야 전수조사로 판매자 목록을 긁어 가기 어렵다.
 */
function Unavailable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-bold">현재 사용할 수 없는 계좌입니다.</p>
      <p className="mt-2 text-muted">판매자에게 문의해주세요.</p>
    </main>
  );
}

export default async function MerchantPage({ params }: Props) {
  const { publicId } = await params;

  if (!isValidPublicId(publicId)) return <Unavailable />;

  // 캐시는 getActiveMerchant 안에서 처리한다 (PRD 34장, src/lib/merchants.ts 주석 참고).
  const merchant = await getActiveMerchant(publicId);
  if (!merchant) return <Unavailable />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-12 pb-10">
      <h1 className="text-lg font-bold">{merchant.business_name}</h1>
      <p className="mt-1 text-sm text-muted">계좌이체</p>

      {/* PRD 35장 화면 우선순위: 은행명 → 계좌번호 → 예금주 */}
      <section className="mt-8 rounded-2xl border border-line p-6">
        <p className="text-base font-semibold text-muted">{merchant.bank_name}</p>
        <p className="selectable mt-2 text-[30px] leading-tight font-bold tracking-tight break-all">
          {merchant.account_number}
        </p>
        <p className="mt-3 text-base text-muted">예금주 {merchant.account_holder}</p>
      </section>

      <TransferActions
        publicId={merchant.public_id}
        accountDigits={digitsOnly(merchant.account_number)}
      />
    </main>
  );
}
