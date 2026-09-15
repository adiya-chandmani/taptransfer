/** PRD 18장: 판매자 등록 시 선택할 수 있는 은행 목록. */
export const BANKS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "카카오뱅크",
  "토스뱅크",
  "IBK기업은행",
  "새마을금고",
  "신협",
  "기타",
] as const;

/**
 * PRD 10, 11장: 송금 앱 실행 정보.
 *
 * 목적은 "앱을 켜는 것"까지다. 은행/계좌번호/금액을 링크에 담지 않는다.
 * 파라미터가 없으니 링크 규격이 바뀌어도 돈이 엉뚱한 곳으로 갈 수 없다.
 * 실제 송금은 사용자가 앱 안에서 직접 진행한다 (PRD 25장).
 *
 * androidPackage / iosAppId 는 Play 스토어와 App Store 조회로 확인한 값이다.
 * iosScheme 은 원격에서 확인할 수 없어 실기기 테스트가 필요하다. 값이 없으면
 * iOS에서는 App Store 페이지로 보낸다 (설치돼 있으면 "열기" 버튼이 보인다).
 */
export type TransferApp = {
  name: string;
  /** 데스크톱 등 모바일이 아닌 환경에서 열 공식 웹페이지 */
  web: string;
  /** Play 스토어에서 확인한 안드로이드 패키지명 */
  androidPackage: string;
  /** App Store 숫자 id */
  iosAppId: string;
  /** iOS 커스텀 스킴. 실기기 확인 전까지는 토스만 채워 둔다. */
  iosScheme?: string;
};

export const TOSS: TransferApp = {
  name: "토스",
  web: "https://toss.im",
  androidPackage: "viva.republica.toss",
  iosAppId: "839333328",
  iosScheme: "supertoss://",
};

export const BANK_APPS: TransferApp[] = [
  {
    name: "KB스타뱅킹",
    web: "https://www.kbstar.com",
    androidPackage: "com.kbstar.kbbank",
    iosAppId: "373742138",
  },
  {
    name: "신한 SOL",
    web: "https://www.shinhan.com",
    androidPackage: "com.shinhan.sbanking",
    iosAppId: "357484932",
  },
  {
    name: "하나원큐",
    web: "https://www.kebhana.com",
    androidPackage: "com.hanabank.oqf",
    iosAppId: "6743190232",
  },
  {
    name: "우리WON",
    web: "https://www.wooribank.com",
    androidPackage: "com.wooribank.smart.npib",
    iosAppId: "1470181651",
  },
  {
    name: "NH올원뱅크",
    web: "https://banking.nonghyup.com",
    androidPackage: "com.nonghyup.nhallonebank",
    iosAppId: "1641628055",
  },
  {
    name: "카카오뱅크",
    web: "https://www.kakaobank.com",
    androidPackage: "com.kakaobank.channel",
    iosAppId: "1258016944",
  },
  TOSS,
];
