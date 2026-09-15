"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BANK_APPS, TOSS, type TransferApp } from "@/lib/banks";
import { openTransferApp } from "@/lib/openApp";

type Props = { publicId: string; accountDigits: string };

/** 복사 성공 안내는 잠시 뒤 사라지고, 실패 안내는 직접 닫을 때까지 남는다. */
type Notice =
  | { kind: "copied" }
  | { kind: "failed"; pendingApp: TransferApp | null }
  | null;

export default function TransferActions({ publicId, accountDigits }: Props) {
  const [notice, setNotice] = useState<Notice>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // PRD 24장 / 32장: 페이지 조회 수 기록.
  // 서버 렌더에서 기록하면 프리페치나 봇 요청까지 조회수로 잡히므로,
  // 실제로 화면이 뜬 시점에 클라이언트에서 한 번만 기록한다.
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("n");
    const source = n === "nfc" || n === "qr" ? n : "direct";
    // 실패해도 사용자 흐름에 영향이 없어야 한다.
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, source }),
      keepalive: true,
    }).catch(() => {});
  }, [publicId]);

  /** PRD 9장: 복사는 하이픈 없는 숫자로 한다. */
  const copy = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(accountDigits);
      return true;
    } catch {
      return false;
    }
  }, [accountDigits]);

  const copyOnly = useCallback(async () => {
    setNotice((await copy()) ? { kind: "copied" } : { kind: "failed", pendingApp: null });
  }, [copy]);

  /**
   * PRD 10, 11장: 계좌번호를 복사한 뒤 송금 앱을 연다.
   * 복사가 실패했는데 앱으로 넘어가면 고객은 번호 없이 송금 화면에 도착한다.
   * 그래서 실패하면 이동을 멈추고 숫자만 남긴 번호를 직접 복사하도록 보여준다.
   */
  const copyAndOpen = useCallback(
    async (app: TransferApp) => {
      if (await copy()) {
        openTransferApp(app);
        return;
      }
      setSheetOpen(false);
      setNotice({ kind: "failed", pendingApp: app });
    },
    [copy],
  );

  // 바텀시트: Esc로 닫기 + 열릴 때 포커스 이동
  useEffect(() => {
    if (!sheetOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  useEffect(() => {
    if (notice?.kind !== "copied") return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <>
      {/* PRD 8장: 버튼은 한 손으로 누르기 쉽게 크게 만든다. */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void copyOnly()}
          className="h-14 w-full rounded-xl bg-ink text-[17px] font-bold text-white active:opacity-80"
        >
          계좌번호 복사
        </button>
        <button
          type="button"
          onClick={() => void copyAndOpen(TOSS)}
          className="h-14 w-full rounded-xl bg-brand text-[17px] font-bold text-white active:opacity-80"
        >
          토스로 송금하기
        </button>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="h-14 w-full rounded-xl border border-line text-[17px] font-bold active:opacity-80"
        >
          다른 은행 앱으로 송금하기
        </button>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        송금은 선택한 은행 앱에서 직접 진행됩니다.
        <br />
        TapTransfer는 송금을 처리하지 않습니다.
      </p>

      {notice?.kind === "copied" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-6 mx-auto max-w-sm rounded-xl bg-ink px-4 py-3 text-center text-sm leading-relaxed text-white"
        >
          계좌번호가 복사되었습니다.
          <br />
          송금 앱에서 붙여넣기 해주세요.
        </div>
      )}

      {/* PRD 9장: 클립보드 API를 지원하지 않는 브라우저 대비 폴백.
          하이픈 없는 숫자만 보여줘서 길게 눌러 그대로 복사할 수 있게 한다. */}
      {notice?.kind === "failed" && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-6 mx-auto max-w-sm rounded-xl bg-ink px-4 py-4 text-center text-white"
        >
          <p className="text-sm leading-relaxed">
            이 브라우저는 자동 복사를 지원하지 않습니다.
            <br />
            아래 번호를 길게 눌러 복사해주세요.
          </p>
          <p className="selectable mt-3 text-xl font-bold break-all tabular-nums">
            {accountDigits}
          </p>
          <div className="mt-4 flex gap-2">
            {notice.pendingApp && (
              <button
                type="button"
                onClick={() => openTransferApp(notice.pendingApp!)}
                className="h-11 flex-1 rounded-lg bg-white text-sm font-bold text-ink"
              >
                {notice.pendingApp.name} 열기
              </button>
            )}
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="h-11 flex-1 rounded-lg border border-white/40 text-sm font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* PRD 11장: 다른 은행 앱 선택 Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="relative mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 pb-8"
          >
            <div className="flex items-center justify-between">
              <h2 id="sheet-title" className="text-base font-bold">
                어떤 앱으로 송금하시나요?
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSheetOpen(false)}
                className="-mr-2 h-10 px-2 text-sm text-muted"
              >
                닫기
              </button>
            </div>
            <ul className="mt-3">
              {BANK_APPS.map((app) => (
                <li key={app.name}>
                  <button
                    type="button"
                    onClick={() => void copyAndOpen(app)}
                    className="h-14 w-full border-b border-line text-left text-[17px] font-semibold active:opacity-60"
                  >
                    {app.name}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              선택하면 계좌번호가 복사된 뒤 해당 앱이 열립니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
