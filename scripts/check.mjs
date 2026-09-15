// 설정 점검: 테이블 / 통계 함수 / 관리자 계정이 준비됐는지 확인한다.
// 사용: node scripts/check.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let ok = true;
for (const table of ["merchants", "page_views", "merchant_audit_log", "login_attempts"]) {
  const { error } = await supabase.from(table).select("*").limit(1);
  console.log(`${error ? "✗" : "✓"} 테이블 ${table}${error ? " — " + error.message : ""}`);
  if (error) ok = false;
}

const { error: rpcError } = await supabase.rpc("merchant_stats");
console.log(`${rpcError ? "✗" : "✓"} 함수 merchant_stats()${rpcError ? " — " + rpcError.message : ""}`);
if (rpcError) ok = false;

const { data: users, error: userError } = await supabase.auth.admin.listUsers();
if (userError) {
  console.log(`✗ 관리자 계정 조회 실패 — ${userError.message}`);
  ok = false;
} else {
  console.log(`${users.users.length ? "✓" : "✗"} 관리자 계정 ${users.users.length}개`);
  for (const u of users.users) console.log(`    ${u.email} (이메일 확인됨: ${!!u.email_confirmed_at})`);
  if (!users.users.length) ok = false;
}

console.log(ok ? "\n준비 완료." : "\n아직 준비되지 않은 항목이 있습니다.");
process.exit(ok ? 0 : 1);
