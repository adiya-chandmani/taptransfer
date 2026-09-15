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
 *
 * scheme 은 앱이 등록한 커스텀 URL 스킴이다. Android/iOS 모두 이 값으로 앱을 연다.
 * Chrome은 대상 액티비티에 BROWSABLE 카테고리가 있어야만 웹에서 앱을 실행하므로,
 * 패키지명만으로는 부족하고 스킴이 함께 있어야 한다.
 *
 * ponytail: 스킴은 앱 바이너리 안에 있어 원격으로 확인할 수 없다. 실기기에서
 * 직접 눌러 확인해야 하고, 확인된 것만 여기에 채운다. 값이 없으면 앱을 여는 대신
 * 스토어로 보낸다 (설치돼 있으면 "열기" 버튼이 보이므로 탭 한 번이 더 든다).
 */
export type TransferApp = {
  name: string;
  /** 데스크톱 등 모바일이 아닌 환경에서 열 공식 웹페이지 */
  web: string;
  /** Play 스토어에서 확인한 안드로이드 패키지명 */
  androidPackage: string;
  /** App Store 숫자 id */
  iosAppId: string;
  /** 앱이 등록한 커스텀 URL 스킴 (":" 와 "//" 없이). 실기기로 확인된 것만 채운다. */
  scheme?: string;
};

export const TOSS: TransferApp = {
  name: "토스",
  web: "https://toss.im",
  androidPackage: "viva.republica.toss",
  iosAppId: "839333328",
  scheme: "supertoss",
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
