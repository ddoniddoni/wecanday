# Google Play 출시 준비 체크리스트

이 문서는 Android 첫 출시 전 확인할 운영 항목이다. 앱 내 개인정보처리방침과 이용약관은 한국어·영어로 제공되지만, 이 목록의 미확인 항목이 있으면 production 제출을 진행하지 않는다.

## 공개 정보

- [ ] Play Console의 앱 소유자(법인 또는 개인) 이름과 지원 이메일을 확정한다.
- [ ] 공개 HTTPS 개인정보처리방침 URL을 게시하고, 앱 내 방침과 같은 내용을 유지한다.
- [ ] 계정 삭제 요청을 시작할 수 있는 공개 HTTPS URL을 게시한다. 앱 내 경로는 `프로필 → 계정 및 개인정보 → 회원 탈퇴`다.
- [ ] Google Play 스토어 등록의 지원 연락처와 개인정보처리방침 URL이 현재 앱 버전과 일치하는지 확인한다.
- [ ] Google Play Data Safety 양식을 실제 SDK·데이터 흐름에 맞춰 검토한다. 현재 앱은 Google 로그인, Supabase 인증·데이터베이스, Expo 푸시 알림을 사용하며 연락처·정확한 위치·결제 카드 정보를 수집하지 않는다.
- [ ] 만 13세 이상 대상과 출시 국가별 연령·소비자보호 요건을 검토한다.

## 보안과 계정 삭제

- [ ] `delete-account` Edge Function을 production에 배포하고, 인증된 계정에서만 실행되는지 확인한다.
- [ ] 앱 내 삭제 확인 후 Auth 사용자, 프로필, 공개 코드, 루틴, 체크인, 친구 관계, 챌린지, 푸시 토큰이 삭제 또는 정책에 맞게 익명화되는지 production과 같은 환경에서 검증한다.
- [ ] 공개 삭제 URL도 앱을 설치하지 않은 사용자가 요청 방법을 이해할 수 있게 한다.
- [ ] Supabase URL과 publishable key만 모바일 번들에 있고 service role key·RevenueCat webhook secret·Google client secret이 없는지 확인한다.

## 배포 전 확인

- [ ] Google OAuth Android client ID, package name `com.wecanday.app`, SHA-1/SHA-256 인증서 fingerprint, Supabase redirect URL `wecanday://auth/callback`을 production 값으로 확인한다.
- [ ] RevenueCat Android 공개 SDK 키, `premium` entitlement, 현재 Offering의 월간·연간 Google Play 상품을 production 값으로 연결한다.
- [ ] RevenueCat 웹훅 서명 검증과 서버 entitlement mirror 갱신을 배포하고 sandbox 구매·취소·만료·복원을 검증한다.
- [ ] 한국어·영어로 개인정보처리방침, 이용약관, 계정 삭제 흐름을 기기에서 검수한다.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, Supabase migration/RLS test, Android production 또는 internal build를 실행한다.
- [ ] 실제 기기에서 Google 로그인, 첫 루틴 생성, 체크인, 알림 권한 거절, 친구 코드, Premium 구매·복원, 계정 삭제를 확인한다.

## 출시 책임자 확인

이 저장소에는 회사명, 법적 주소, 지원 이메일, 공개 웹 URL을 임의로 넣지 않는다. 출시 책임자가 위 정보를 확정하고 법률 검토를 거친 뒤 Play Console과 공개 정책 페이지에 반영한다.
