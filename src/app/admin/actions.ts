"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin, supabaseAuthClient } from "@/lib/supabase";
import { generatePublicId } from "@/lib/id";
import { isValidAccountNumber } from "@/lib/format";
import { BANKS } from "@/lib/banks";

export type MerchantFormState = { error?: string } | null;

/**
 * PRD 33장: 관리자 API 보호.
 * 서버 액션은 그 자체가 공개 엔드포인트라 middleware만 믿지 않고 여기서 한 번 더 확인한다.
 */
async function requireAdmin() {
  const supabase = await supabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
}

type MerchantInput = {
  business_name: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
};

/** PRD 18장 입력 항목 검증. */
function parseMerchantInput(formData: FormData): MerchantInput | { error: string } {
  const business_name = String(formData.get("business_name") ?? "").trim();
  const bank_name = String(formData.get("bank_name") ?? "").trim();
  const account_number = String(formData.get("account_number") ?? "").trim();
  const account_holder = String(formData.get("account_holder") ?? "").trim();

  if (!business_name) return { error: "판매자 이름을 입력해주세요." };
  if (!(BANKS as readonly string[]).includes(bank_name)) return { error: "은행을 선택해주세요." };
  if (!isValidAccountNumber(account_number)) {
    return { error: "계좌번호는 숫자 9~16자리여야 합니다. (하이픈은 표시용으로 허용)" };
  }
  if (!account_holder) return { error: "예금주를 입력해주세요." };

  return { business_name, bank_name, account_number, account_holder };
}

/** PRD 19장: 랜덤 public_id 발급. 중복이면 다시 뽑는다. */
async function insertWithUniqueId(input: MerchantInput): Promise<string | { error: string }> {
  const supabase = supabaseAdmin();
  for (let i = 0; i < 5; i++) {
    const public_id = generatePublicId();
    const { error } = await supabase.from("merchants").insert({ ...input, public_id });
    if (!error) return public_id;
    // 23505 = unique_violation. 그 외 오류는 재시도해도 소용없다.
    if (error.code !== "23505") return { error: `저장에 실패했습니다: ${error.message}` };
  }
  return { error: "고유 URL 생성에 실패했습니다. 다시 시도해주세요." };
}

export async function createMerchant(
  _prev: MerchantFormState,
  formData: FormData,
): Promise<MerchantFormState> {
  await requireAdmin();

  const parsed = parseMerchantInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const result = await insertWithUniqueId(parsed);
  if (typeof result !== "string") return { error: result.error };

  redirect(`/admin?created=${result}`);
}

export async function updateMerchant(
  _prev: MerchantFormState,
  formData: FormData,
): Promise<MerchantFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const parsed = parseMerchantInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = supabaseAdmin();
  const { data: before, error: readError } = await supabase
    .from("merchants")
    .select("public_id, business_name, bank_name, account_number, account_holder")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { error: `조회에 실패했습니다: ${readError.message}` };
  if (!before) return { error: "존재하지 않는 판매자입니다." };

  const { error: updateError } = await supabase.from("merchants").update(parsed).eq("id", id);
  if (updateError) return { error: `저장에 실패했습니다: ${updateError.message}` };

  // PRD 21장: 변경 전/후 값을 감사 로그로 남긴다.
  const changes = (Object.keys(parsed) as (keyof MerchantInput)[])
    .filter((field) => before[field] !== parsed[field])
    .map((field) => ({
      merchant_id: id,
      changed_field: field,
      old_value: String(before[field]),
      new_value: String(parsed[field]),
    }));
  if (changes.length > 0) await supabase.from("merchant_audit_log").insert(changes);

  // 공개 페이지는 캐시하지 않으므로 저장 즉시 반영된다 (src/lib/merchants.ts 주석 참고).
  redirect("/admin");
}

/** PRD 20, 22장: 판매자 비활성화 / 재활성화. */
export async function setMerchantActive(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!id) return;

  const supabase = supabaseAdmin();
  const { data: before } = await supabase
    .from("merchants")
    .select("public_id, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!before) return;

  await supabase.from("merchants").update({ is_active: isActive }).eq("id", id);
  await supabase.from("merchant_audit_log").insert({
    merchant_id: id,
    changed_field: "is_active",
    old_value: String(before.is_active),
    new_value: String(isActive),
  });

}
