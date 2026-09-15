import type { TransferApp } from "./banks";

/**
 * PRD 10, 11장: 송금 앱 실행.
 *
 * 링크에는 계좌 정보를 일절 담지 않는다. 앱을 켜는 것까지가 이 함수의 역할이다.
 * 계좌번호 복사는 호출하는 쪽에서 먼저 끝낸 뒤 이 함수를 부른다.
 */

export function playStoreUrl(app: TransferApp): string {
  return `https://play.google.com/store/apps/details?id=${app.androidPackage}`;
}

export function iosStoreUrl(app: TransferApp): string {
  return `https://apps.apple.com/kr/app/id${app.iosAppId}`;
}

/**
 * 안드로이드 Chrome의 intent: URL.
 *
 * Chrome은 대상 액티비티에 BROWSABLE 카테고리가 있을 때만 웹에서 앱을 실행한다.
 * 앱의 런처 액티비티에는 보통 BROWSABLE이 없으므로 패키지명만으로는 열리지 않는다.
 * 앱이 등록한 스킴을 함께 넘겨야 BROWSABLE 필터에 걸린다.
 *
 * 스킴을 모르면 null을 돌려준다. 그때는 호출부가 Play 스토어로 보낸다.
 * 억지로 intent를 만들어 봐야 폴백만 타면서 지연만 생긴다.
 */
export function androidIntentUrl(app: TransferApp): string | null {
  if (!app.scheme) return null;
  return (
    "intent://#Intent" +
    ";scheme=" + app.scheme +
    ";package=" + app.androidPackage +
    ";S.browser_fallback_url=" + encodeURIComponent(playStoreUrl(app)) +
    ";end"
  );
}

export function iosSchemeUrl(app: TransferApp): string | null {
  return app.scheme ? `${app.scheme}://` : null;
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
    // intent:는 앱 미설치 시 browser_fallback_url로 알아서 넘어간다.
    window.location.href = androidIntentUrl(app) ?? playStoreUrl(app);
    return;
  }

  if (platform === "ios") {
    const store = iosStoreUrl(app);
    const scheme = iosSchemeUrl(app);

    if (!scheme) {
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

    window.location.href = scheme;
    return;
  }

  // 데스크톱 등: 앱이 없으니 공식 웹페이지를 연다.
  window.location.href = app.web;
}
