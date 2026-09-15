"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin, supabaseAuthClient } from "@/lib/supabase";

export type LoginState = { error?: string } | null;

// PRD 16장: 로그인 5회 연속 실패 시 15분 계정 잠금.
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "이메일과 비밀번호를 입력해주세요." };

  const admin = supabaseAdmin();
  const { data: attempt } = await admin
    .from("login_attempts")
    .select("failed_count, locked_until")
    .eq("email", email)
    .maybeSingle();

  const lockedUntil = attempt?.locked_until ? new Date(attempt.locked_until) : null;
  const stillLocked = lockedUntil !== null && lockedUntil.getTime() > Date.now();

  if (stillLocked) {
    const minutes = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000));
    return { error: `로그인 시도가 너무 많습니다. ${minutes}분 후 다시 시도해주세요.` };
  }

  const supabase = await supabaseAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // 잠금이 이미 풀렸다면 카운터를 0부터 다시 센다.
    const previous = lockedUntil ? 0 : (attempt?.failed_count ?? 0);
    const failedCount = previous + 1;
    const reachedLimit = failedCount >= MAX_ATTEMPTS;

    await admin.from("login_attempts").upsert({
      email,
      failed_count: failedCount,
      locked_until: reachedLimit
        ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });

    if (reachedLimit) {
      return { error: `로그인 ${MAX_ATTEMPTS}회 실패로 ${LOCK_MINUTES}분간 잠겼습니다.` };
    }
    // 어떤 계정이 존재하는지 알려주지 않는다.
    return {
      error: `이메일 또는 비밀번호가 올바르지 않습니다. (${failedCount}/${MAX_ATTEMPTS})`,
    };
  }

  await admin.from("login_attempts").delete().eq("email", email);
  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
