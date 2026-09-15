"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { BANKS } from "@/lib/banks";
import { digitsOnly, isValidAccountNumber } from "@/lib/format";
import type { MerchantFormState } from "../actions";

export type MerchantValues = {
  business_name: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
};

type Props = {
  action: (prev: MerchantFormState, formData: FormData) => Promise<MerchantFormState>;
  id?: string;
  initial?: MerchantValues;
  submitLabel: string;
};

const EMPTY: MerchantValues = {
  business_name: "",
  bank_name: "",
  account_number: "",
  account_holder: "",
};

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 flex-1 rounded-xl bg-ink text-base font-bold text-white disabled:opacity-50"
    >
      {pending ? "저장 중…" : label}
    </button>
  );
}

/**
 * PRD 18장: 계좌이체 사고를 예방하기 위해 저장 전 입력값을 요약 화면으로 한 번 더 보여주고
 * 관리자가 확인한 뒤에만 최종 저장한다. PRD 21장에 따라 수정 시에도 같은 절차를 적용한다.
 */
export default function MerchantForm({ action, id, initial, submitLabel }: Props) {
  const [values, setValues] = useState<MerchantValues>(initial ?? EMPTY);
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, formAction] = useActionState<MerchantFormState, FormData>(action, null);

  const set = (key: keyof MerchantValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
  };

  function goConfirm() {
    if (!values.business_name.trim()) return setLocalError("판매자 이름을 입력해주세요.");
    if (!values.bank_name) return setLocalError("은행을 선택해주세요.");
    if (!isValidAccountNumber(values.account_number)) {
      return setLocalError("계좌번호는 숫자 9~16자리여야 합니다. (하이픈은 표시용으로 허용)");
    }
    if (!values.account_holder.trim()) return setLocalError("예금주를 입력해주세요.");
    setLocalError(null);
    setStep("confirm");
  }

  const inputClass = "h-12 w-full rounded-xl border border-line px-4 text-base";
  const error = localError ?? state?.error;

  return (
    <form action={formAction} className="mx-auto max-w-md">
      {id && <input type="hidden" name="id" value={id} />}

      <div hidden={step === "confirm"} className="flex flex-col gap-4">
        <div>
          <label htmlFor="business_name" className="text-sm font-semibold">
            판매자 이름
          </label>
          <input
            id="business_name"
            name="business_name"
            value={values.business_name}
            onChange={set("business_name")}
            placeholder="행궁동 붕어빵"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="bank_name" className="text-sm font-semibold">
            은행
          </label>
          <select
            id="bank_name"
            name="bank_name"
            value={values.bank_name}
            onChange={set("bank_name")}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">선택하세요</option>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="account_number" className="text-sm font-semibold">
            계좌번호
          </label>
          <input
            id="account_number"
            name="account_number"
            inputMode="numeric"
            value={values.account_number}
            onChange={set("account_number")}
            placeholder="123456789012"
            className={`mt-1 ${inputClass} tabular-nums`}
          />
          {/* PRD 8, 9장: 은행마다 자릿수가 달라 하이픈은 표시용 구분자다. 복사는 숫자만 한다. */}
          <p className="mt-1 text-xs text-muted">
            은행 통장에 적힌 그대로 입력하세요. 하이픈을 넣으면 화면에도 그대로 보이고, 복사할
            때는 숫자만 복사됩니다.
            {values.account_number && (
              <>
                <br />
                복사될 값: <span className="tabular-nums">{digitsOnly(values.account_number)}</span>
              </>
            )}
          </p>
        </div>

        <div>
          <label htmlFor="account_holder" className="text-sm font-semibold">
            예금주
          </label>
          <input
            id="account_holder"
            name="account_holder"
            value={values.account_holder}
            onChange={set("account_holder")}
            placeholder="김철수"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      {step === "confirm" && (
        <section className="rounded-2xl border border-line p-5">
          <p className="font-semibold">다음 정보로 저장합니다.</p>
          <dl className="mt-4 flex flex-col gap-2 text-base">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">판매자</dt>
              <dd className="font-semibold">{values.business_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">은행</dt>
              <dd className="font-semibold">{values.bank_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">계좌번호</dt>
              <dd className="font-semibold break-all tabular-nums">{values.account_number}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">예금주</dt>
              <dd className="font-semibold">{values.account_holder}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-red-600">
            계좌번호가 틀리면 고객의 돈이 다른 사람에게 송금됩니다. 통장과 한 글자씩 대조해
            주세요.
          </p>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {step === "edit" ? (
          <>
            <Link
              href="/admin"
              className="h-12 flex-1 rounded-xl border border-line text-center text-base leading-[3rem] font-semibold"
            >
              취소
            </Link>
            <button
              type="button"
              onClick={goConfirm}
              className="h-12 flex-1 rounded-xl bg-ink text-base font-bold text-white"
            >
              다음
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep("edit")}
              className="h-12 flex-1 rounded-xl border border-line text-base font-semibold"
            >
              취소
            </button>
            <ConfirmButton label={submitLabel} />
          </>
        )}
      </div>
    </form>
  );
}
