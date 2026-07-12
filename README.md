# WeCanDay

Expo 기반 Android 우선 목표 완주 앱입니다. iOS는 Android 출시 성과를 검토한 뒤 지원합니다. 제품 동작은 `PRD.md`, 개발 규칙은
`AGENTS.md`를 기준으로 합니다.

## 현재 구현 범위

M0 기반과 M1의 온보딩·인증 기반을 포함합니다.

- Expo SDK 57, React Native, TypeScript strict, Expo Router
- 라이트·다크·기본 픽셀 테마와 디자인 토큰
- `i18next`, `react-i18next`, `expo-localization` 기반 한국어·영어 구조
- Jest, `jest-expo`, React Native Testing Library
- 번역 fallback, locale 선택, 번역 키 정합성, 테마 계약, 기반 화면 테스트
- 전체 ISO 국가 검색과 국가 코드 선택
- 한국어·영어 선택, 선택 언어 인사, 온보딩 진행 상태 저장
- Supabase SecureStore 세션과 Google OAuth 기반
- 서버 생성 12자리 Base62 코드, 프로필 trigger, own-row RLS migration

GitHub Actions CI와 Supabase 로컬 설정·초기 프로필 migration이 구성되어 있습니다.
실제 소셜 로그인에는 Supabase 프로젝트와 Google 공급자 설정이 필요합니다.
M1의 시간대·하루 시작 시각과 이후 제품 기능은 아직 포함하지 않습니다.

## 환경 설정

`.env.example`을 참고하여 공개 가능한 Supabase 연결값을 로컬 `.env`에 설정합니다.

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

모바일 앱에 `service_role` 또는 provider client secret을 넣지 않습니다.

### Google 로그인 리다이렉트

Supabase Dashboard의 **Authentication → URL Configuration**에서 앱이 실제로 사용할 콜백 주소를 `Redirect URLs`에 추가해야 합니다. 등록되지 않은 주소는 무시되고 `Site URL`(현재는 `http://localhost:3000`)로 돌아가므로 Android에서는 로그인 완료 후 연결 실패 화면이 나타납니다.

- 웹 로컬 개발: `http://localhost:8081/auth/callback`
- Android development/production build: `wecanday://auth/callback`
- Expo Go로 LAN 개발 중: 실행 중인 Expo 서버가 만든 정확한 주소. 예: `exp://192.168.x.x:8081/--/auth/callback`

웹으로 테스트할 때 `Site URL`은 `http://localhost:8081`로 설정합니다. Expo Go 주소는 네트워크나 포트가 바뀌면 함께 바뀔 수 있습니다. 안정적인 Android 로그인 테스트와 출시 빌드에는 `wecanday://auth/callback`을 사용하는 Android development build를 사용합니다.

## Supabase 로컬 개발

Docker가 실행 중인 환경에서 다음 명령을 사용합니다.

```bash
npm run db:start
npm run db:reset
npm run db:test
```

## 실행

```bash
npm install
npm run start
```

Expo 개발 서버에서 Android 또는 web 대상을 선택할 수 있습니다.

## 품질 게이트

```bash
npm run lint
npm run typecheck
npm run test
npm run test:ci
```

Maestro가 설치된 환경에서는 영어 기기 locale로 온보딩 E2E를 실행할 수 있습니다.

```bash
npm run test:e2e
```
