import test from "node:test";
import assert from "node:assert/strict";
import {
  digitsOnly,
  isValidAccountNumber,
  maskAccountNumber,
  formatRelativeTime,
  isValidPublicId,
} from "../src/lib/format.ts";
import { generatePublicId } from "../src/lib/id.ts";

// PRD 9장: 표시에는 하이픈이 있어도 복사는 숫자만.
test("digitsOnly는 하이픈과 공백을 제거한다", () => {
  assert.equal(digitsOnly("123-456-789012"), "123456789012");
  assert.equal(digitsOnly("123456-78-901234"), "12345678901234");
  assert.equal(digitsOnly(" 3333 12 3456789 "), "3333123456789");
});

// PRD 18장: 계좌번호 검증. 잘못된 계좌로 저장되면 고객 돈이 남에게 간다.
test("isValidAccountNumber는 9~16자리만 통과시킨다", () => {
  assert.equal(isValidAccountNumber("123456789"), true); // 9자리 (PRD 21장 예시)
  assert.equal(isValidAccountNumber("3333123456789"), true); // 13자리 (PRD 21장 예시)
  assert.equal(isValidAccountNumber("123-456-789012"), true); // 하이픈 허용
  assert.equal(isValidAccountNumber("12345678"), false); // 8자리, 너무 짧음
  assert.equal(isValidAccountNumber("12345678901234567"), false); // 17자리, 너무 김
  assert.equal(isValidAccountNumber("계좌번호없음"), false);
  assert.equal(isValidAccountNumber(""), false);
});

// PRD 17장: 관리자 대시보드에서 계좌번호를 가린다.
test("maskAccountNumber는 앞뒤 4자리만 남긴다", () => {
  assert.equal(maskAccountNumber("123456789012"), "1234••••9012");
  assert.equal(maskAccountNumber("123-456-789012"), "1234••••9012");
  assert.equal(maskAccountNumber("123456789"), "1234••••6789");
  // 8자리 이하는 앞뒤가 겹치므로 전부 가린다.
  assert.equal(maskAccountNumber("12345678"), "••••••••");
});

// PRD 24장: 마지막 접속 표시.
test("formatRelativeTime", () => {
  const now = new Date("2026-09-14T12:00:00Z");
  assert.equal(formatRelativeTime(null, now), "접속 없음");
  assert.equal(formatRelativeTime("2026-09-14T11:59:30Z", now), "방금 전");
  assert.equal(formatRelativeTime("2026-09-14T11:57:00Z", now), "3분 전");
  assert.equal(formatRelativeTime("2026-09-14T09:00:00Z", now), "3시간 전");
  assert.equal(formatRelativeTime("2026-09-11T12:00:00Z", now), "3일 전");
  assert.equal(formatRelativeTime("잘못된 값", now), "접속 없음");
});

// PRD 19장: 순차 ID 금지, 영숫자 8자 이상.
test("generatePublicId는 랜덤 영숫자 8자를 만든다", () => {
  const ids = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const id = generatePublicId();
    assert.equal(id.length, 8);
    assert.ok(isValidPublicId(id), `형식 위반: ${id}`);
    ids.add(id);
  }
  // 500개가 전부 달라야 한다 (순차/고정값이면 여기서 깨진다).
  assert.equal(ids.size, 500);
});

test("isValidPublicId는 8자 미만과 특수문자를 거른다", () => {
  assert.equal(isValidPublicId("k7Fs92ab"), true);
  assert.equal(isValidPublicId("a8fk2"), false); // 5자리
  assert.equal(isValidPublicId("../../etc"), false);
  assert.equal(isValidPublicId("abcdefg-"), false);
});
