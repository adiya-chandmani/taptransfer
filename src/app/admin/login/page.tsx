"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-xl bg-ink text-base font-bold text-white disabled:opacity-50"
    >
      {pending ? "로그인 중…" : "로그인"}
    </button>
  );
}

// PRD 16장: 초기 MVP에서는 관리자 계정 하나만 존재한다.
export default function AdminLoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">TapTransfer 관리자</h1>
      <form action={formAction} className="mt-8 flex flex-col gap-3">
        <label className="text-sm font-semibold" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-12 rounded-xl border border-line px-4 text-base"
        />
        <label className="mt-2 text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-xl border border-line px-4 text-base"
        />
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        <div className="mt-3">
          <SubmitButton />
        </div>
      </form>
    </main>
  );
}
