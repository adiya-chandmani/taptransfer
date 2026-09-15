/** 계좌번호 표시/복사/마스킹 관련 순수 함수. 서버/클라이언트 양쪽에서 쓴다. */

/** PRD 9장: 복사할 때는 하이픈 없는 숫자 형태를 사용한다. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * PRD 18장: 계좌번호 입력 검증.
 * 국내 은행 계좌번호는 9~16자리 숫자다(예: 구 계좌 9자리, 카카오뱅크 13자리).
 * 하이픈/공백은 표시용이므로 허용하되 숫자 자릿수로 판단한다.
 */
export function isValidAccountNumber(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 9 && digits.length <= 16;
}

/** PRD 17장: 관리자 대시보드에서 계좌번호를 `1234••••9012` 형태로 가린다. */
export function maskAccountNumber(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length <= 8) return "•".repeat(digits.length);
  return `${digits.slice(0, 4)}••••${digits.slice(-4)}`;
}

/** PRD 24장: 마지막 접속을 "3분 전" 형태로 표시한다. */
export function formatRelativeTime(value: string | Date | null, now: Date = new Date()): string {
  if (!value) return "접속 없음";
  const then = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(then.getTime())) return "접속 없음";

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "방금 전";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

/** PRD 19장: public_id는 영문 대소문자+숫자 8자 이상. */
export function isValidPublicId(value: string): boolean {
  return /^[A-Za-z0-9]{8,32}$/.test(value);
}
