// PRD 16장: 관리자 계정 1개 생성. .env.local 의 ADMIN_EMAIL / ADMIN_PASSWORD 를 사용한다.
// 사용: node scripts/create-admin.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("ADMIN_EMAIL / ADMIN_PASSWORD 를 .env.local 에 넣어주세요.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // 관리자 1명뿐이라 초대 메일 절차를 건너뛴다.
});

if (error) {
  console.error(`생성 실패: ${error.message}`);
  process.exit(1);
}
console.log(`관리자 계정 생성 완료: ${data.user.email}`);
console.log("계정을 만든 뒤에는 .env.local 에서 ADMIN_EMAIL / ADMIN_PASSWORD 를 지워도 됩니다.");
