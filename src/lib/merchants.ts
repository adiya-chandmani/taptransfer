import { supabaseAdmin } from "./supabase";

export type PublicMerchant = {
  public_id: string;
  business_name: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
};

/**
 * 활성 판매자 조회. 없거나 비활성이면 null.
 *
 * ponytail: 계좌 정보는 의도적으로 캐시하지 않는다.
 * Next 16에서 unstable_cache + revalidateTag("max") 를 실제로 측정해 보니 무효화 직후
 * 한 번은 stale 응답이 나갔다(stale-while-revalidate). 계좌번호가 바뀐 직후 그 한 번을 받은
 * 고객은 판매자의 옛 계좌로 송금하게 되고 되돌릴 수 없다.
 * 아낄 수 있는 건 Supabase 왕복 수십 ms뿐이라 맞바꿀 가치가 없다.
 *
 * Next 공식 문서도 같은 성질을 명시한다 (docs/01-app/02-guides/how-revalidation-works.md):
 * "The revalidation system prioritizes availability over strict consistency."
 * 즉 강한 일관성이 필요한 데이터에 쓰라고 만든 계층이 아니다.
 *
 * 실제 배포 후 이 조회가 PRD 34장의 1초 목표를 실제로 깬다고 "측정되면",
 * stale 응답이 0임을 검증한 캐시(예: 수정 시 즉시 purge 되는 CDN)만 도입한다.
 */
export async function getActiveMerchant(publicId: string): Promise<PublicMerchant | null> {
  const { data, error } = await supabaseAdmin()
    .from("merchants")
    .select("public_id, business_name, bank_name, account_number, account_holder")
    .eq("public_id", publicId)
    .eq("is_active", true)
    .maybeSingle();

  // 조회 실패는 "없는 계좌"가 아니다. 구분해서 던진다.
  if (error) throw new Error(`판매자 조회 실패: ${error.message}`);
  return (data as PublicMerchant | null) ?? null;
}
