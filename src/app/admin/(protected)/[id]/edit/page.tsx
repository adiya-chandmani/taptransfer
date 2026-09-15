import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/format";
import { updateMerchant } from "../../../actions";
import MerchantForm from "../../MerchantForm";

type Props = { params: Promise<{ id: string }> };

type AuditRow = {
  changed_field: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
};

const FIELD_LABELS: Record<string, string> = {
  business_name: "판매자 이름",
  bank_name: "은행",
  account_number: "계좌번호",
  account_holder: "예금주",
  is_active: "활성 상태",
};

// PRD 21장: 판매자 수정. URL(public_id)은 변경하지 않는다.
export default async function EditMerchantPage({ params }: Props) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const [{ data: merchant }, { data: history }] = await Promise.all([
    supabase
      .from("merchants")
      .select("id, public_id, business_name, bank_name, account_number, account_holder")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("merchant_audit_log")
      .select("changed_field, old_value, new_value, changed_at")
      .eq("merchant_id", id)
      .order("changed_at", { ascending: false })
      .limit(20)
      .returns<AuditRow[]>(),
  ]);

  if (!merchant) notFound();

  return (
    <div>
      <div className="mx-auto mb-6 max-w-md">
        <h1 className="text-xl font-bold">판매자 수정</h1>
        {/* PRD 21장: URL은 변경하지 않는다. NFC 태그를 다시 제작할 필요가 없다. */}
        <p className="mt-1 text-sm text-muted">
          고유 URL <span className="font-semibold">/p/{merchant.public_id}</span> 은 변경되지
          않습니다. NFC 태그를 다시 만들 필요가 없습니다.
        </p>
      </div>

      <MerchantForm
        action={updateMerchant}
        id={merchant.id}
        initial={{
          business_name: merchant.business_name,
          bank_name: merchant.bank_name,
          account_number: merchant.account_number,
          account_holder: merchant.account_holder,
        }}
        submitLabel="확인하고 저장"
      />

      {/* PRD 21장: 변경 이력 */}
      <section className="mx-auto mt-10 max-w-md">
        <h2 className="text-base font-bold">변경 이력</h2>
        {(history ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted">변경 이력이 없습니다.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {(history ?? []).map((h, i) => (
              <li key={i} className="rounded-xl border border-line px-4 py-3">
                <p className="font-semibold">{FIELD_LABELS[h.changed_field] ?? h.changed_field}</p>
                <p className="mt-1 break-all text-muted">
                  {h.old_value || "(없음)"} → {h.new_value || "(없음)"}
                </p>
                <p className="mt-1 text-xs text-muted">{formatRelativeTime(h.changed_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
