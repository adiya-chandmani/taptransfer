import { randomInt } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * PRD 19장: 판매자 고유 URL ID.
 * 순차 증가 없이 매번 무작위 생성한다. 8자 x 62글자 = 약 2.2e14 조합이라
 * 전수조사로 다른 판매자의 예금주명을 긁어 가기 어렵다.
 *
 * randomInt는 modulo bias 없이 균등한 난수를 준다(Math.random / % 조합은 쓰지 않는다).
 */
export function generatePublicId(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return out;
}
