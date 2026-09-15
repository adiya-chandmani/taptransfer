"use client";

import Link from "next/link";
import { useState } from "react";
import { setMerchantActive } from "../actions";

type Props = {
  id: string;
  publicId: string;
  businessName: string;
  isActive: boolean;
  url: string;
};

/** 파일 하나를 내려받는다. */
function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function MerchantRowActions({
  id,
  publicId,
  businessName,
  isActive,
  url,
}: Props) {
  const [note, setNote] = useState<string | null>(null);
  const [confirmingOff, setConfirmingOff] = useState(false);

  // PRD 20장: NFC에 넣을 URL 복사
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setNote("URL이 복사되었습니다.");
    } catch {
      setNote(url);
    }
  }

  // PRD 23장: QR에는 해당 판매자의 고유 URL이 들어간다. PNG 또는 SVG 다운로드 지원.
  // qrcode 라이브러리는 관리자 화면에서만 필요하므로 동적 import로 고객 페이지 번들에서 제외한다.
  async function downloadQr(format: "png" | "svg") {
    const QRCode = (await import("qrcode")).default;
    const safeName = businessName.replace(/[^\p{L}\p{N}_-]+/gu, "_") || publicId;

    if (format === "png") {
      const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2 });
      download(dataUrl, `${safeName}_${publicId}.png`);
      return;
    }

    const svg = await QRCode.toString(url, { type: "svg", margin: 2 });
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download(blobUrl, `${safeName}_${publicId}.svg`);
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link href={`/admin/${id}/edit`} className="font-semibold text-brand">
          수정
        </Link>
        <button type="button" onClick={() => void copyUrl()} className="text-muted">
          URL 복사
        </button>
        <button type="button" onClick={() => void downloadQr("png")} className="text-muted">
          QR PNG
        </button>
        <button type="button" onClick={() => void downloadQr("svg")} className="text-muted">
          QR SVG
        </button>

        {isActive ? (
          confirmingOff ? (
            <form action={setMerchantActive} className="flex items-center gap-2">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="is_active" value="false" />
              <span className="text-xs text-muted">비활성화할까요?</span>
              <button type="submit" className="font-semibold text-red-600">
                예
              </button>
              <button
                type="button"
                onClick={() => setConfirmingOff(false)}
                className="text-muted"
              >
                아니오
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingOff(true)}
              className="text-red-600"
            >
              비활성화
            </button>
          )
        ) : (
          <form action={setMerchantActive}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="is_active" value="true" />
            <button type="submit" className="text-brand">
              활성화
            </button>
          </form>
        )}
      </div>
      {note && <p className="text-xs break-all text-muted">{note}</p>}
    </div>
  );
}
