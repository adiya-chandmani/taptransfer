import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name} 가 설정되지 않았습니다. .env.example 참고.`);
  return value;
}

/**
 * service_role 키를 사용하는 서버 전용 클라이언트.
 * RLS를 우회하므로 서버 컴포넌트/서버 액션/route handler 안에서만 호출한다.
 * PRD 33장의 "DB 직접 접근 금지"는 이 클라이언트만 DB에 닿는다는 뜻이다.
 */
export function supabaseAdmin(): SupabaseClient {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 관리자 로그인 세션(쿠키) 전용 클라이언트. */
export async function supabaseAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 middleware가 담당한다.
          try {
            for (const { name, value, options } of list) cookieStore.set(name, value, options);
          } catch {
            /* noop */
          }
        },
      },
    },
  );
}
