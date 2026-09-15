import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isValidPublicId } from "@/lib/format";

/**
 * PRD 24장 / 32장: 페이지 조회 수 기록.
 * PRD 24장에 따라 개인정보(IP, 위치, 단말 식별자 등)는 저장하지 않는다.
 * 기록하는 값은 판매자 id와 유입 경로(nfc/qr/direct)뿐이다.
 *
 * ponytail: 조회수 조작 방지용 rate limit은 넣지 않았다.
 * 통계가 과금이나 정산에 쓰이기 시작하면 그때 IP 해시 기준 제한을 붙인다.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { publicId, source } = (body ?? {}) as { publicId?: string; source?: string };
  if (typeof publicId !== "string" || !isValidPublicId(publicId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const resolvedSource = source === "nfc" || source === "qr" ? source : "direct";
  const supabase = supabaseAdmin();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("public_id", publicId)
    .eq("is_active", true)
    .maybeSingle();

  // 없는 ID여도 존재 여부를 알려주지 않는다 (PRD 22장과 같은 이유).
  if (merchant) {
    await supabase.from("page_views").insert({ merchant_id: merchant.id, source: resolvedSource });
  }

  return NextResponse.json({ ok: true });
}
