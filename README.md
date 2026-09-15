# TapTransfer

NFC 태그나 QR을 통해 판매자의 계좌 정보를 바로 열어주는 웹 서비스. 구현 범위는 [prd.md](./prd.md) MVP 기준.

## 스택

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (PostgreSQL + Auth) · Vercel

## 설치

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## Supabase 준비

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/migration.sql` 실행
3. Authentication > Users > **Add user** 로 관리자 계정 1개 생성 (PRD 16장: 관리자 계정 하나만 존재)
4. Authentication > Providers > Email 에서 **Confirm email** 을 끄거나 초대 메일로 확인 처리
5. Project Settings > API 에서 URL / anon key / service_role key 를 `.env.local` 에 복사

`merchants`, `page_views`, `merchant_audit_log`, `login_attempts` 전부 RLS가 켜져 있고 정책이 하나도 없다.
anon 키로는 아무 행도 읽을 수 없고, service_role 키를 쓰는 서버 코드만 접근한다 (PRD 33장 "DB 직접 접근 금지").

## 사용 흐름

1. `/admin/login` 에서 관리자 로그인
2. **새 판매자 추가** → 이름 / 은행 / 계좌번호 / 예금주 입력 → 요약 확인 → 저장
3. 대시보드에서 **QR PNG** 또는 **QR SVG** 다운로드, **URL 복사**
4. 복사한 URL(`https://<도메인>/p/<public_id>`)을 NTAG215 등 NFC 태그에 기록
5. 고객이 태그를 터치하면 `/p/<public_id>` 가 열린다

계좌가 바뀌면 관리자 화면에서 수정만 하면 된다. URL과 NFC 태그는 그대로 쓴다 (PRD 12, 21장).

## 유입 경로 통계

같은 URL에 쿼리로 경로를 붙이면 NFC/QR을 구분해 집계한다 (PRD 30장).

- NFC 태그에 기록: `/p/a8fk2ZQx?n=nfc`
- QR에 인코딩: `/p/a8fk2ZQx?n=qr`
- 없으면 `direct` 로 기록된다

## 명령

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 + 타입 체크
npm test        # 계좌번호 포맷/검증/ID 생성 단위 테스트
```

## 배포 (Vercel)

프로젝트 연결 후 `.env.example` 의 4개 변수를 Environment Variables에 등록한다.
`NEXT_PUBLIC_SITE_URL` 은 QR/NFC에 들어갈 실제 공개 도메인으로 설정한다.

## MVP에 없는 것

PRD 28장 기준: 금액 입력, 메뉴/주문, 실제 송금 처리, 결제 확인, 판매자 로그인, 구독 결제, POS 연동.
이 서비스는 송금을 처리하지 않는다. 계좌정보 제공 · 복사 · 송금 앱 실행 보조만 한다 (PRD 25장).
