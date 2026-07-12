# WeCanDay

Expo 기반 iOS·Android 목표 완주 앱입니다. 제품 동작은 `PRD.md`, 개발 규칙은
`AGENTS.md`를 기준으로 합니다.

## 현재 구현 범위

M0 기반과 M1의 첫 번째 실행 가능한 온보딩 단위를 포함합니다.

- Expo SDK 57, React Native, TypeScript strict, Expo Router
- 라이트·다크·기본 픽셀 테마와 디자인 토큰
- `i18next`, `react-i18next`, `expo-localization` 기반 한국어·영어 구조
- Jest, `jest-expo`, React Native Testing Library
- 번역 fallback, locale 선택, 번역 키 정합성, 테마 계약, 기반 화면 테스트
- 전체 ISO 국가 검색과 국가 코드 선택
- 한국어·영어 선택, 선택 언어 인사, 온보딩 진행 상태 저장

GitHub Actions CI는 구성했으며, M0의 Supabase 로컬 개발·초기 마이그레이션은 아직 구현하지 않았습니다.
M1의 인증·프로필과 이후 제품 기능은 아직 포함하지 않습니다.

## 실행

```bash
npm install
npm run start
```

Expo 개발 서버에서 iOS, Android 또는 web 대상을 선택할 수 있습니다.

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
