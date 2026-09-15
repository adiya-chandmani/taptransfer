import type { TransferApp } from "./banks";

/**
 * PRD 10, 11장: 송금 앱 실행.
 *
 * 링크에는 계좌 정보를 일절 담지 않는다. 앱을 켜는 것까지가 이 함수의 역할이다.
 * 계좌번호 복사는 호출하는 쪽에서 먼저 끝낸 뒤 이 함수를 부른다.
 */

/**
 * 안드로이드 Chrome의 intent: URL.
 * 앱이 설치돼 있으면 바로 열리고, 없으면 browser_fallback_url(Play 스토어)로 넘어간다.
 * 커스텀 스킴과 달리 "열 수 없는 주소" 오류창이 뜨지 않는다.
 */
export function androidIntentUrl(app: TransferApp): string {
  const fallback = `https://play.google.com/store/apps/details?id=${app.androidPackage}`;
  return (
    "intent://#Intent" +
    ";package=" + app.androidPackage +
    ";S.browser_fallback_url=" + encodeURIComponent(fallback) +
    ";end"
  );
}

export function iosStoreUrl(app: TransferApp): string {
  return `https://apps.apple.com/kr/app/id${app.iosAppId}`;
}

export function playStoreUrl(app: TransferApp): string {
  return `https://play.google.com/store/apps/details?id=${app.androidPackage}`;
}

export type Platform = "android" | "ios" | "other";

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  // 아이패드는 기본값이 데스크톱 UA라 터치 개수로 구분한다.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "other";
}

/** iOS에서 스킴이 안 먹었을 때 App Store로 넘어가기까지 기다리는 시간. */
const IOS_FALLBACK_MS = 1500;

export function openTransferApp(app: TransferApp): void {
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);

  if (platform === "android") {
    window.location.href = androidIntentUrl(app);
    return;
  }

  if (platform === "ios") {
    const store = iosStoreUrl(app);

    // 스킴을 모르는 앱은 곧장 App Store로 보낸다 (설치돼 있으면 "열기"가 보인다).
    if (!app.iosScheme) {
      window.location.href = store;
      return;
    }

    // 앱이 열리면 이 페이지가 백그라운드로 내려간다. 그때 폴백을 취소한다.
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") window.location.href = store;
    }, IOS_FALLBACK_MS);

    const cancel = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", cancel);
      window.removeEventListener("pagehide", cancel);
    };
    document.addEventListener("visibilitychange", cancel);
    window.addEventListener("pagehide", cancel);

    window.location.href = app.iosScheme;
    return;
  }

  // 데스크톱 등: 앱이 없으니 공식 웹페이지를 연다.
  window.location.href = app.web;
}
