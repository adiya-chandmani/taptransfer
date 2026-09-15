import test from "node:test";
import assert from "node:assert/strict";
import { androidIntentUrl, iosStoreUrl, playStoreUrl, detectPlatform } from "../src/lib/openApp.ts";
import { TOSS, BANK_APPS } from "../src/lib/banks.ts";

test("안드로이드 intent URL은 스킴+패키지+Play 스토어 폴백을 담는다", () => {
  const url = androidIntentUrl(TOSS);
  assert.equal(
    url,
    "intent://#Intent;scheme=supertoss;package=viva.republica.toss;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dviva.republica.toss;end",
  );
  // 스킴이 없으면 Chrome이 BROWSABLE 필터를 못 찾아 앱이 안 열린다.
  assert.ok(url!.includes(";scheme="), "스킴이 빠지면 앱이 열리지 않는다");
  // 폴백 URL은 반드시 인코딩돼야 한다. 날것으로 들어가면 ';'와 '&'에서 intent 파싱이 깨진다.
  assert.ok(!url!.includes("?id=viva"), "폴백 URL이 인코딩되지 않았다");
});

test("스킴을 모르는 앱은 intent를 만들지 않고 Play 스토어로 보낸다", () => {
  const kb = BANK_APPS.find((a) => a.name === "KB스타뱅킹")!;
  assert.equal(kb.scheme, undefined);
  assert.equal(androidIntentUrl(kb), null);
  assert.equal(playStoreUrl(kb), "https://play.google.com/store/apps/details?id=com.kbstar.kbbank");
});

test("iOS App Store URL", () => {
  assert.equal(iosStoreUrl(TOSS), "https://apps.apple.com/kr/app/id839333328");
});

test("detectPlatform", () => {
  assert.equal(detectPlatform("Mozilla/5.0 (Linux; Android 14; SM-S911N)"), "android");
  assert.equal(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "ios");
  // 아이패드는 데스크톱 UA를 보내므로 터치 개수로 구분한다.
  assert.equal(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5), "ios");
  assert.equal(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0), "other");
  assert.equal(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "other");
});

test("모든 송금 앱이 실행에 필요한 값을 갖춘다", () => {
  for (const app of BANK_APPS) {
    assert.ok(app.androidPackage.includes("."), `${app.name}: 패키지명 형식 오류`);
    assert.match(app.iosAppId, /^\d+$/, `${app.name}: App Store id는 숫자여야 한다`);
    assert.match(app.web, /^https:\/\//, `${app.name}: web은 https여야 한다`);
    // 계좌 정보가 링크에 섞여 들어가면 안 된다 (PRD 10장).
    assert.ok(
      !/account|amount|bank=|accountNo/i.test(app.web + (app.scheme ?? "")),
      `${app.name}: 링크에 계좌/금액 파라미터가 들어있다`,
    );
  }
});
