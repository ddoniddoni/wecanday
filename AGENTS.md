# AGENTS.md — WeCanDay 개발 에이전트 지침

이 파일은 Codex를 포함한 개발 에이전트가 WeCanDay 저장소에서 작업할 때 지켜야 할 규칙을 정의한다. 제품 동작은 `PRD.md`, 구현 방식과 품질 기준은 본 문서를 따른다.

---

## 1. 작업 시작 전 필수 순서

1. 저장소 루트의 `PRD.md` 전체를 읽는다.
2. 기존 `package.json`, lockfile, Expo 설정, Supabase 마이그레이션을 확인한다.
3. 이미 존재하는 구현과 테스트를 먼저 파악한다.
4. 요청을 작은 수직 기능 단위로 나눈다.
5. 구현 전에 영향을 받는 제품 규칙과 테스트 항목을 식별한다.
6. 구현 후 lint, typecheck, unit test를 실행한다.
7. 데이터베이스나 네이티브 설정을 바꿨다면 해당 검증까지 수행한다.

제품 요구가 모호할 때는 가장 단순하고 개인정보 보호에 유리하며 `PRD.md`에 부합하는 동작을 선택한다. 중요한 가정은 `docs/decisions/` 아래 ADR로 남긴다. 제품 요구를 코드 편의 때문에 조용히 변경하지 않는다.

---

## 2. 지침 우선순위

충돌 시 다음 순서로 판단한다.

1. 현재 사용자의 명시적 요청
2. `PRD.md`의 제품 요구와 수용 기준
3. 본 `AGENTS.md`의 공학 규칙
4. 저장소의 기존 관례
5. 라이브러리 기본값

보안, 개인정보, 결제 정책, 데이터 손실 위험이 있는 경우 가장 안전한 선택을 우선하고 그 이유를 문서화한다.

---

## 3. 제품의 비협상 규칙

다음 규칙은 명시적 제품 결정 없이는 변경하지 않는다.

- 앱은 Expo 기반 React Native로 구현한다. 핵심 앱을 WebView로 대체하지 않는다.
- iOS와 Android를 모두 지원한다.
- 국가, 언어, 시간대는 독립된 설정이다.
- 사용자에게 보이는 문자열은 전부 번역 키를 사용한다.
- 한국어 인사 원문은 `안녕하세요, 우리 할 수 있어요`다.
- 로그인 제공자는 Google과 Apple이다.
- 신규 계정에는 서버 생성 12자리 Base62 고유 코드가 있어야 한다.
- 무료 사용자는 최대 4개의 활성 루틴 항목만 가질 수 있다.
- 루틴 데이는 사용자의 IANA 시간대와 하루 시작 시각을 기준으로 한다.
- 기본 통계는 주간·월간·연간을 모두 제공한다.
- 친구 검색은 정확한 고유 코드로만 가능하다.
- 픽셀 캐릭터와 테마는 오리지널 디자인이어야 한다.
- 첫 출시에는 강제 광고를 넣지 않는다.
- 디지털 기능 결제는 Apple·Google 인앱 결제와 RevenueCat entitlement를 사용한다.
- 계정 삭제를 앱 안에서 시작할 수 있어야 한다.

---

## 4. 기준 기술 스택

새 프로젝트라면 다음 구성을 기본으로 한다. 기존 프로젝트에 동등한 도구가 이미 있으면 이유 없이 교체하지 않는다.

### 4.1 앱

- Expo 최신 안정 SDK
- React Native
- TypeScript strict mode
- Expo Router
- React Native Reanimated

### 4.2 상태와 폼

- TanStack Query: 서버 상태, 캐시, mutation
- Zustand: 화면 간 짧은 UI 상태와 작성 중 초안
- React Hook Form + Zod: 폼과 런타임 검증

서버 데이터를 Zustand에 복제하지 않는다. 컴포넌트에서 계산 가능한 파생 상태를 전역 저장소에 넣지 않는다.

### 4.3 다국어

- `i18next`
- `react-i18next`
- `expo-localization`

### 4.4 백엔드

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security
- Database Functions / RPC
- Edge Functions

### 4.5 로컬 저장

- `expo-secure-store`: 세션과 작은 민감 값
- `expo-sqlite`: 오프라인 데이터, 체크인 outbox
- 일반 설정은 필요에 따라 AsyncStorage를 사용할 수 있으나 민감 데이터는 금지

### 4.6 알림

- `expo-notifications`
- 서버 푸시는 Expo Push Service를 우선 사용

### 4.7 날짜와 시간대

- `date-fns`
- `@date-fns/tz`
- 필요한 Hermes Intl polyfill

날짜 라이브러리 사용을 한 모듈로 감싸고 앱 전체에서 직접 제각각 호출하지 않는다.

### 4.8 결제

- RevenueCat React Native SDK
- iOS StoreKit 상품
- Google Play Billing 상품

### 4.9 테스트

- Jest + `jest-expo`
- React Native Testing Library
- Maestro E2E
- Supabase SQL/RLS 테스트

### 4.10 패키지 관리자

- 패키지 관리자는 `npm`을 사용한다.
- `package-lock.json`을 유일한 lockfile로 유지하고 의존성 변경 시 함께 갱신한다.
- 로컬 의존성 설치는 `npm install`, CI의 재현 가능한 설치는 `npm ci`를 사용한다.
- Expo 네이티브 모듈은 가능한 한 `npx expo install`로 설치하여 SDK 호환 버전을 사용한다.

---

## 5. 권장 저장소 구조

```text
.
├─ app/                         # Expo Router route와 layout만
│  ├─ (onboarding)/
│  ├─ (auth)/
│  ├─ (tabs)/
│  ├─ plans/
│  ├─ friends/
│  ├─ challenges/
│  ├─ paywall/
│  └─ _layout.tsx
├─ src/
│  ├─ components/              # 재사용 UI
│  ├─ features/
│  │  ├─ onboarding/
│  │  ├─ auth/
│  │  ├─ profile/
│  │  ├─ routine-day/
│  │  ├─ plans/
│  │  ├─ check-ins/
│  │  ├─ streaks/
│  │  ├─ companion/
│  │  ├─ statistics/
│  │  ├─ friends/
│  │  ├─ challenges/
│  │  ├─ notifications/
│  │  └─ billing/
│  ├─ i18n/
│  │  ├─ index.ts
│  │  ├─ types.ts
│  │  └─ locales/
│  │     ├─ en/
│  │     └─ ko/
│  ├─ lib/
│  │  ├─ supabase/
│  │  ├─ query/
│  │  ├─ dates/
│  │  ├─ notifications/
│  │  └─ billing/
│  ├─ local-db/
│  ├─ stores/
│  ├─ theme/
│  ├─ types/
│  └─ test/
├─ assets/
│  ├─ pixel/
│  ├─ icons/
│  └─ fonts/
├─ supabase/
│  ├─ migrations/
│  ├─ functions/
│  ├─ seed.sql
│  └─ tests/
├─ maestro/
├─ docs/
│  └─ decisions/
├─ PRD.md
└─ AGENTS.md
```

### 구조 규칙

- `app/` 파일은 라우팅, 화면 조합, route params 처리에 집중한다.
- 비즈니스 로직을 route 파일에 두지 않는다.
- 기능별 UI, hook, schema, service, query key는 해당 `src/features/<feature>`에 둔다.
- 공통 컴포넌트가 실제로 두 개 이상의 기능에서 사용되기 전에는 성급하게 `components/`로 이동하지 않는다.
- 도메인 로직은 React와 분리된 순수 함수로 작성한다.

---

## 6. TypeScript와 코드 스타일

- `strict: true`를 유지한다.
- 새로운 `any` 사용을 금지한다. 외부 입력은 `unknown`으로 받고 Zod 등으로 좁힌다.
- `@ts-ignore`를 사용하지 않는다. 불가피하면 이유와 제거 조건을 주석으로 남기고 `@ts-expect-error`를 사용한다.
- API 응답, DB row, route params, 번역 키를 타입으로 관리한다.
- Boolean 이름은 `is`, `has`, `can`, `should` 접두사를 선호한다.
- 매직 문자열과 숫자는 명명된 상수 또는 설정으로 올린다.
- 파생 상태를 `useEffect`로 동기화하지 않는다. 계산 가능한 값은 selector 또는 `useMemo` 없이도 단순 계산을 우선한다.
- route 파일 외에는 named export를 기본으로 한다.
- 오류는 사용자 문구가 아니라 안정적인 오류 코드로 도메인 계층에서 전달한다.
- 사용자 문구는 UI 계층에서 번역한다.

---

## 7. 다국어 구현 규칙

### 7.1 필수 규칙

- 사용자에게 보이는 텍스트를 JSX에 하드코딩하지 않는다.
- 번역 키로 자연어 문장을 사용하지 않는다.
- 문자열을 코드에서 이어 붙여 문장을 만들지 않는다.
- 복수형, 변수 삽입, 성별·문맥은 i18next 기능을 사용한다.
- 날짜, 시간, 숫자는 선택한 locale로 포맷한다.
- 국가와 언어 선택 항목의 접근성 라벨도 번역한다.
- 서버에서 보낸 오류 메시지를 그대로 노출하지 않고 오류 코드를 번역한다.

### 7.2 권장 namespace

```text
common
auth
onboarding
home
plans
statistics
friends
challenges
billing
settings
errors
notifications
```

### 7.3 파일 예시

```text
src/i18n/locales/ko/onboarding.json
src/i18n/locales/en/onboarding.json
```

```json
{
  "greeting": "안녕하세요, 우리 할 수 있어요"
}
```

### 7.4 언어 등록

- 지원 locale 목록을 단일 레지스트리에서 관리한다.
- Expo app config의 `supportedLocales`와 앱 내부 레지스트리가 어긋나지 않도록 테스트한다.
- 한국어와 영어 번역은 P0 기능에서 항상 동시에 추가한다.
- 번역 누락을 검출하는 테스트 또는 스크립트를 유지한다.
- RTL을 막는 고정 `marginLeft`/`marginRight` 사용을 최소화한다.

---

## 8. 루틴 데이와 시간 처리 규칙

시간 처리는 이 제품의 핵심 도메인이다. 화면 컴포넌트에서 직접 날짜 경계를 계산하지 않는다.

### 8.1 단일 도메인 API

`src/features/routine-day/domain/`에 다음과 같은 순수 API를 둔다.

```ts
type RoutineDayConfig = {
  timeZone: string;
  dayStartMinute: number;
};

type RoutineDayWindow = {
  key: string;          // YYYY-MM-DD
  startsAt: string;     // UTC ISO
  endsAt: string;       // UTC ISO, exclusive
};

function getRoutineDayWindow(
  instant: Date,
  config: RoutineDayConfig,
): RoutineDayWindow;
```

실제 이름은 조정할 수 있으나 다음 입력과 출력을 일관되게 제공해야 한다.

- 현재 instant
- IANA time zone
- 하루 시작 분
- `routine_day` 키
- UTC 시작·종료 instant

### 8.2 금지 사항

- 도메인 코드에서 무분별하게 `new Date()`를 호출하지 않는다.
- 기기 기본 시간대를 암묵적으로 사용하지 않는다.
- UTC 날짜의 `YYYY-MM-DD`를 사용자 루틴 데이로 오해하지 않는다.
- 국가 코드로 시간대를 추정하지 않는다.
- 과거 체크인을 현재 설정으로 재분류하지 않는다.

### 8.3 Clock 주입

테스트 가능한 `Clock` 인터페이스를 사용한다.

```ts
interface Clock {
  now(): Date;
}
```

실제 앱은 system clock, 테스트는 fixed clock을 사용한다.

### 8.4 필수 테스트

- 시작 시각 직전과 정확한 시작 시각
- 월말·연말
- 윤년 2월 29일
- UTC 날짜와 현지 날짜가 다른 경우
- 서머타임 시작일과 종료일
- 시간대 변경 전후
- 하루 시작 시각 변경이 다음 구간부터 적용되는지
- `Asia/Seoul`, `America/New_York`, `Europe/London`, `Pacific/Auckland` 등 대표 시간대

서머타임 지역에서는 현지 시작 시각 고정을 우선하며 실제 경과시간이 23/25시간일 수 있다는 PRD 결정을 유지한다.

---

## 9. 스트릭 구현 규칙

- 스트릭은 순수 도메인 함수로 계산한다.
- UI에서 배열 길이만 세어 임의 계산하지 않는다.
- 예정되지 않은 날은 스트릭을 끊지 않는다.
- 예정 항목이 없는 날은 데일리 스트릭을 증가시키거나 끊지 않는다.
- 일시정지 적용 시점 이후의 날만 예정에서 제외한다.
- 스트릭 보호권은 실제 완료 체크인과 별도 이벤트로 저장한다.
- 스트릭 보호권이 완료율이나 챌린지 실제 순위를 바꾸면 안 된다.
- 서버와 클라이언트가 동일한 도메인 규칙을 사용하거나, 서버 결과를 최종 권위로 사용한다.

필수 테스트:

- 매일 3일 성공
- 주중만 수행하고 주말 건너뛰기
- 중간 실패
- 항목 일시정지
- 예정 항목 0개
- 보호권 사용과 실제 완료율 분리

---

## 10. 인증 구현 규칙

### 10.1 일반

- Supabase Auth를 인증의 기준으로 사용한다.
- 앱에 provider client secret이나 service role key를 넣지 않는다.
- 세션은 SecureStore에 적합한 방식으로 보관한다.
- 인증 상태가 결정되기 전에 보호 화면을 잠깐 노출하지 않는다.
- Expo Router protected routes를 사용한다.
- 로그인 취소와 로그인 실패를 구분한다.

### 10.2 Google

- Expo가 권장하는 provider 전용 네이티브 라이브러리 또는 Supabase 공식 Expo 소셜 인증 방식을 사용한다.
- iOS·Android client ID를 분리해 설정한다.
- redirect URI와 앱 scheme을 환경별로 관리한다.

### 10.3 Apple

- iOS는 `expo-apple-authentication` 기반 네이티브 흐름을 우선한다.
- Android는 Supabase Apple OAuth 브라우저 흐름을 사용한다.
- nonce를 검증한다.
- Apple이 최초 로그인에서만 제공하는 이름을 놓치지 않는다.
- 계정 삭제 시 Apple token revoke 요구사항을 처리한다.

### 10.4 프로필 생성

- `auth.users` 생성과 프로필 생성 사이에 반쯤 생성된 상태가 남지 않도록 DB trigger 또는 idempotent server function을 사용한다.
- 공개 코드는 서버에서 생성한다.
- 프로필 생성 재시도는 같은 사용자에 대해 안전해야 한다.

### 10.5 로그 금지

다음을 console, analytics, crash report에 기록하지 않는다.

- access token
- refresh token
- provider ID token
- authorization code
- Apple nonce 원문
- 이메일 전체
- 공개 코드 전체

---

## 11. 공개 코드와 친구 보안

### 11.1 코드 생성

- 정확히 12자리 `[A-Za-z0-9]`를 사용한다.
- `Math.random()`을 사용하지 않는다.
- 서버의 안전한 난수 또는 PostgreSQL crypto 기능을 사용한다.
- DB unique constraint와 충돌 재시도를 함께 사용한다.
- 코드 비교는 대소문자를 구분한다.

### 11.2 코드 조회

- 전체 profiles 테이블을 클라이언트에 열지 않는다.
- 정확 일치 RPC를 사용한다.
- rate limit을 둔다.
- 차단 관계와 자기 자신을 필터링한다.
- 최소 공개 필드만 반환한다.
- 사용자 존재 여부를 무제한 수집할 수 없도록 한다.

### 11.3 친구 관계

- 하나의 사용자 쌍에 중복 관계가 생기지 않도록 canonical pair 또는 고유 인덱스를 사용한다.
- 자기 자신에게 요청할 수 없다.
- 차단이 친구 요청보다 우선한다.
- 친구 삭제와 차단은 서버에서 원자적으로 처리한다.

---

## 12. 무료 4개 제한과 Premium

### 12.1 제한 정의

- 제한 대상은 `status = active`인 루틴 항목이다.
- 보관·완료·일시정지는 제외한다.
- 챌린지에서 생성된 활성 항목도 포함한다.
- 무료 사용자가 5번째를 만들 수 없도록 클라이언트와 서버 양쪽에서 검사한다.
- 서버 검사가 최종 권위다.

### 12.2 구독 만료

- 데이터 삭제 금지
- 기존 항목 체크인 금지 금지
- 4개 이하가 될 때까지 새 생성·재활성화만 막는다.
- 페이월 문구는 상황을 정확히 설명하고 위협적으로 표현하지 않는다.

### 12.3 RevenueCat

- 로그인 후 Supabase user UUID를 RevenueCat app user ID로 사용한다.
- 로그아웃 시 RevenueCat 사용자 전환을 안전하게 처리한다.
- entitlement key는 `premium`으로 통일한다.
- 상품 ID를 코드 여러 곳에 흩뿌리지 않는다.
- Offering과 가격은 RevenueCat/스토어에서 읽는다.
- 구매 복원 기능을 반드시 구현한다.
- 웹훅 서명을 검증하고 entitlement mirror 테이블을 갱신한다.
- 클라이언트 캐시는 UX에 사용하고 서버 entitlement는 권한 검증에 사용한다.

### 12.4 결제 금지 사항

- 모바일 디지털 기능을 외부 Stripe 결제로 우회하지 않는다.
- 가격을 통화 기호와 함께 하드코딩하지 않는다.
- 구매 취소를 실패나 사용자 잘못으로 표현하지 않는다.
- sandbox 상품과 production 상품을 혼동하지 않는다.

---

## 13. 광고 규칙

### 13.1 MVP

- 광고 SDK를 설치하지 않는 것이 기본이다.
- `ads_enabled`와 `rewarded_ads_enabled` 기본값은 `false`다.
- 배너, 앱 오픈 광고, 강제 전면 광고를 추가하지 않는다.

### 13.2 추후 보상형 광고

광고 기능을 명시적으로 요청받아 추가할 때만 다음을 수행한다.

- 사용자의 명시적인 탭으로 시작
- 보상 내용과 광고 시청 사실을 사전에 표시
- 테스트 광고 ID를 개발 환경에서 사용
- 지역별 동의 처리 후에만 광고 요청
- 필요할 경우 Google UMP와 Apple ATT 적용
- 동의 상태를 변경할 수 있는 개인정보 설정 제공
- Premium은 광고를 보지 않음
- 광고 보상이 친구 챌린지 순위를 조작하지 않음

광고 기능을 넣는 PR은 개인정보처리방침, App Store Privacy, Google Play Data Safety 변경 사항도 함께 다뤄야 한다.

---

## 14. 데이터베이스와 Supabase 규칙

### 14.1 마이그레이션

- 모든 스키마 변경은 `supabase/migrations/`에 새 마이그레이션으로 추가한다.
- 이미 적용된 마이그레이션을 수정하지 않는다.
- 테이블, 인덱스, RLS, 정책, 함수, trigger를 같은 기능 단위로 검토 가능하게 작성한다.
- destructive migration은 데이터 보존 계획과 rollback 또는 백업 절차를 문서화한다.

### 14.2 RLS

- 새 테이블은 기본적으로 RLS를 켠다.
- `authenticated` 전체 공개 정책을 편의상 작성하지 않는다.
- own-row 정책, friend 공개 정책, challenge membership 정책을 구분한다.
- 정책 이름은 동작을 명확히 표현한다.
- RLS 테스트 없이 소셜 데이터 테이블을 완료로 간주하지 않는다.

### 14.3 함수

- 사용자 입력을 검증한다.
- `security definer`는 필요한 경우에만 사용한다.
- `search_path`를 고정한다.
- 호출자의 사용자 ID를 payload에서 신뢰하지 않고 JWT의 `auth.uid()`를 사용한다.
- 외부 웹훅 함수는 제공자 서명을 검증한다.

### 14.4 환경 변수

- `.env.example`에는 키 이름만 제공한다.
- 실제 비밀을 커밋하지 않는다.
- 모바일 번들에 들어가는 값과 서버 전용 비밀을 구분한다.
- `EXPO_PUBLIC_*`에는 공개되어도 되는 값만 넣는다.

---

## 15. 오프라인과 동기화 구현 규칙

- 체크인 UX는 offline-first로 구현한다.
- SQLite에 `sync_outbox`를 둔다.
- mutation마다 idempotency key를 생성한다.
- 지수 백오프와 최대 재시도 후 사용자에게 상태를 보여준다.
- 앱 재시작 후에도 outbox가 유지되어야 한다.
- 동일 체크인이 서버에 두 번 생성되지 않아야 한다.
- 민감 토큰은 SQLite에 넣지 않는다.
- 서버와 동기화된 시각, 대기 중, 실패 상태를 UI에서 구분할 수 있어야 한다.

충돌 해결은 문서화된 규칙을 따르고 조용한 데이터 손실을 허용하지 않는다.

---

## 16. 알림 구현 규칙

- 알림 권한은 첫 루틴을 만든 후 요청한다.
- 권한 거절은 정상 상태다.
- 로컬 루틴 알림과 서버 소셜 푸시를 구분한다.
- 알림 콘텐츠는 선택 언어로 만든다.
- 알림 payload에는 안정적인 route와 entity ID를 넣는다.
- 알림 클릭 시 딥링크가 인증·삭제·권한 상태를 안전하게 처리해야 한다.
- 시간대, 하루 시작 시각, 언어, 일정 변경 시 알림을 재예약한다.
- 중복 알림 identifier를 관리한다.
- 이미 완료된 항목에 불필요한 독촉 알림을 보내지 않는다.
- 잠금 화면에 민감한 메모를 넣지 않는다.
- 푸시 토큰은 사용자·기기별로 upsert하고 만료 토큰을 비활성화한다.

---

## 17. UI와 테마 규칙

### 17.1 디자인 토큰

색상, 간격, radius, shadow, typography, motion duration을 토큰으로 관리한다.

```text
src/theme/
├─ tokens.ts
├─ themes/
│  ├─ light.ts
│  ├─ dark.ts
│  └─ pixel-default.ts
└─ ThemeProvider.tsx
```

컴포넌트에서 임의 hex 색상을 반복 사용하지 않는다.

### 17.2 픽셀 에셋

- 오리지널 에셋만 사용한다.
- 임시 에셋도 타사 캐릭터를 복제하지 않는다.
- 이미지 확대 시 nearest-neighbor 또는 플랫폼에 적합한 crisp 처리 방식을 사용한다.
- 에셋 key와 상태 machine을 분리한다.
- 애니메이션이 완료 처리 로직을 막지 않는다.

### 17.3 가독성

- 픽셀 폰트는 장식용 제목에만 제한적으로 사용한다.
- 본문과 설정은 읽기 쉬운 글꼴을 사용한다.
- Dynamic Type과 글자 확대를 지원한다.
- 긴 번역에서 레이아웃이 깨지지 않도록 고정 폭 텍스트를 피한다.

### 17.4 화면 상태

모든 네트워크 화면에 다음 상태를 고려한다.

- loading
- initial empty
- filtered empty
- offline cached
- recoverable error
- permission denied
- unauthorized
- success

빈 화면에 단순히 “데이터 없음”만 표시하지 말고 다음 행동을 제공한다.

---

## 18. 접근성 규칙

- Pressable, button, input에 `accessibilityRole`과 의미 있는 label을 제공한다.
- 아이콘만 있는 버튼은 반드시 label을 가진다.
- 최소 터치 영역을 확보한다.
- 색상 외에 아이콘·텍스트·모양으로 상태를 표현한다.
- 통계 차트에는 접근 가능한 텍스트 요약을 제공한다.
- 포커스 순서를 확인한다.
- 모달이 열리면 접근성 포커스를 모달 안으로 이동한다.
- 시스템 reduce motion을 읽고 Reanimated 동작을 축소한다.
- 스크린 리더 사용 중 캐릭터 애니메이션이 반복적으로 읽히지 않게 한다.
- `testID`를 접근성 label 대신 사용하지 않는다.

---

## 19. 성능 규칙

- 홈 화면 진입에 필요하지 않은 통계·친구 데이터는 지연 로딩한다.
- 큰 연간 히트맵은 memoized selector와 효율적인 list/grid를 사용한다.
- 픽셀 스프라이트를 지나치게 큰 PNG 여러 장으로 로드하지 않는다.
- 이미지 에셋 크기를 최적화한다.
- React Query key를 기능별 factory로 관리한다.
- 불필요한 refetch와 실시간 subscription을 피한다.
- Realtime은 친구 요청·챌린지처럼 가치가 분명한 곳에만 사용한다.
- 긴 목록은 FlatList/FlashList 등 가상화된 목록을 사용한다.

성능 최적화는 측정 없이 복잡도를 추가하지 않는다.

---

## 20. 테스트 기준

### 20.1 단위 테스트 필수 영역

- 루틴 데이 계산
- DST와 시간대
- 스트릭
- 무료 4개 제한
- Premium 만료 동작
- 공개 코드 형식과 충돌 재시도
- 계획 일정 판정
- 통계 완료율
- 알림 예약 시각
- 번역 fallback 및 locale 선택

### 20.2 컴포넌트 테스트

- 오늘 목록 완료·취소
- 5번째 루틴 페이월 안내
- 온보딩 국가·언어
- 인증 취소 상태
- 친구 코드 입력 검증
- 통계 empty state
- 알림 권한 거절
- 구매 복원 상태

UI 테스트는 구현 세부보다 사용자 행동과 접근 가능한 query를 중심으로 한다. 불안정한 대형 snapshot에 의존하지 않는다.

### 20.3 Supabase 테스트

- 사용자가 다른 사람의 private plan을 읽지 못함
- 친구 RPC가 최소 공개 필드만 반환
- 차단 사용자가 요청·초대를 보내지 못함
- 무료 사용자가 서버 우회로 5번째 항목을 활성화하지 못함
- 체크인 고유 제약과 idempotency
- entitlement 웹훅 갱신
- 계정 삭제 cascade 또는 익명화

### 20.4 Maestro E2E 최소 흐름

1. 한국어 온보딩 → 테스트 로그인 → 첫 루틴 생성 → 체크인
2. 영어 온보딩 → 언어 전환
3. 하루 시작 시각 설정
4. 무료 4개 생성 → 5번째 제한
5. 친구 코드 요청 → 수락
6. 챌린지 초대 → 수락 → 체크인
7. Premium sandbox 구매 또는 mock entitlement → 제한 해제
8. 구매 복원
9. 로그아웃·재로그인
10. 계정 삭제 확인 흐름

실제 소셜 공급자 UI를 CI에서 직접 자동화하기 어렵다면 테스트 전용 안전한 인증 경로를 개발 빌드에만 제공한다. production 빌드에 테스트 우회가 포함되지 않도록 빌드 플래그와 테스트를 둔다.

---

## 21. 명령어와 품질 게이트

저장소에 다음 script를 제공하는 것을 목표로 한다.

```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:ci": "jest --runInBand --coverage",
    "test:e2e": "maestro test maestro",
    "db:start": "supabase start",
    "db:reset": "supabase db reset",
    "db:test": "supabase test db"
  }
}
```

실제 도구 버전에 따라 명령은 조정할 수 있으나 다음 게이트를 유지한다.

- lint 통과
- TypeScript 오류 0
- 관련 unit/component test 통과
- DB 변경 시 마이그레이션 재적용 성공
- RLS 테스트 통과
- 네이티브 모듈 변경 시 Android 또는 iOS development build 확인

테스트를 실행하지 못한 경우 완료라고 주장하지 말고 실행하지 못한 항목과 이유를 결과에 적는다.

---

## 22. CI/CD 규칙

### Pull Request

- `npm ci`
- lint
- typecheck
- unit/component test
- translation consistency check
- Supabase migration/RLS test

### Preview

- 네이티브 의존성이 바뀌지 않은 경우 EAS Update preview를 사용할 수 있다.
- 네이티브 의존성이 바뀌면 development/preview build를 생성한다.

### Release

- version과 build number 갱신
- production 환경 변수 확인
- TestFlight와 Play Internal Testing
- sandbox가 아닌 production 상품 연결 확인
- account deletion URL/화면 확인
- privacy labels와 Data Safety 검토
- EAS Build 후 EAS Submit

OTA 업데이트로 네이티브 런타임과 호환되지 않는 코드를 배포하지 않는다.

---

## 23. 기능 플래그

기능 플래그는 단일 typed config에서 관리한다.

```ts
type FeatureFlags = {
  socialEnabled: boolean;
  premiumEnabled: boolean;
  adsEnabled: boolean;
  rewardedAdsEnabled: boolean;
  streakProtectionEnabled: boolean;
  advancedStatsEnabled: boolean;
};
```

기본값:

```text
socialEnabled = true
premiumEnabled = true
adsEnabled = false
rewardedAdsEnabled = false
streakProtectionEnabled = false
advancedStatsEnabled = false
```

보안 기능이나 서버 권한을 클라이언트 플래그만으로 보호하지 않는다.

---

## 24. 분석과 로그 규칙

- 이벤트 이름은 snake_case를 사용한다.
- PII를 analytics에 넣지 않는다.
- 계획 제목, 설명, 친구 코드, 토큰을 로그에 넣지 않는다.
- 개발 로그는 production에서 제거하거나 안전한 logger를 사용한다.
- 오류 보고에는 내부 ID를 최소화하고 필요한 경우 해시 또는 익명 ID를 사용한다.
- 광고 SDK가 없는 MVP에서 ATT 권한을 요청하지 않는다.

---

## 25. 오류 처리 규칙

도메인 오류 코드 예시:

```text
ROUTINE_LIMIT_REACHED
INVALID_ROUTINE_DAY_START
PUBLIC_CODE_NOT_FOUND
FRIEND_REQUEST_ALREADY_EXISTS
USER_BLOCKED
CHALLENGE_LIMIT_REACHED
ENTITLEMENT_REQUIRED
PURCHASE_CANCELLED
PURCHASE_PENDING
OFFLINE_QUEUED
SYNC_CONFLICT
```

- 서버 원문 오류를 사용자에게 노출하지 않는다.
- 오류 코드를 i18n 키로 매핑한다.
- 복구 가능한 오류에는 재시도 또는 다음 행동을 제공한다.
- 구매 취소는 중립적 상태로 처리한다.
- 인증 창 취소도 불필요한 오류 경고를 띄우지 않는다.
- 오프라인 큐 저장 성공은 “실패”가 아니라 “동기화 대기”다.

---

## 26. 정의 완료(Definition of Done)

기능은 다음 조건을 모두 충족해야 완료다.

- PRD 수용 기준 충족
- Android와 iOS 차이 검토
- 한국어와 영어 번역 추가
- loading, empty, error, offline 상태 구현
- 접근성 label과 터치 영역 확인
- 관련 unit/component test 추가
- 핵심 흐름이면 Maestro test 추가 또는 갱신
- DB 변경이면 migration, index, RLS, test 포함
- 민감 정보 로그 없음
- lint와 typecheck 통과
- 기능 플래그와 환경 설정 문서화
- 사용자 데이터 손실 경로 검토
- 필요한 README 또는 ADR 갱신

---

## 27. 에이전트가 하지 말아야 할 것

- PRD를 읽지 않고 화면부터 대량 생성
- 모든 기능을 한 번에 거대한 PR로 구현
- `any`, 임시 mock, TODO를 남기고 완료라고 주장
- route 컴포넌트에 DB·시간대·스트릭 로직 집중
- 사용자 문자열 하드코딩
- UTC 날짜를 루틴 데이로 사용
- country code로 timezone 추정
- 공개 코드 목록 전체 노출
- service role key를 앱에 추가
- UI에서만 무료 제한 처리
- 구독 만료 시 데이터 삭제
- Stripe 외부 결제로 모바일 Premium 우회
- 광고를 사용자의 동의 전에 초기화
- 타마고치나 듀오링고의 디자인·문구·캐릭터 복제
- 앱 심사 계정이나 실결제 자격증명을 커밋
- 테스트 실패를 숨기거나 실행하지 않은 테스트를 통과했다고 보고

---

## 28. 권장 구현 순서

Codex는 가능한 한 아래 수직 순서를 따른다.

1. 프로젝트·테마·i18n·테스트 기반
2. 국가·언어·인사 온보딩
3. 인증·프로필·고유 코드
4. 시간대·하루 시작 시각 도메인과 테스트
5. 계획·루틴·무료 제한
6. 오늘 목록·체크인·오프라인 outbox
7. 스트릭
8. 알림
9. 기본 동반자와 테마
10. 주·월·연 통계
11. 친구·차단
12. 챌린지
13. RevenueCat 및 서버 entitlement
14. 계정 삭제·개인정보·스토어 출시 준비

각 단계는 실행 가능한 앱과 통과하는 테스트를 남겨야 한다.

---

## 29. 작업 결과 보고 형식

에이전트의 최종 보고는 다음 내용을 짧고 정확하게 포함한다.

```text
변경한 내용
- ...

중요한 결정
- ...

검증
- npm run lint: 통과/미실행
- npm run typecheck: 통과/미실행
- npm run test: 통과/미실행
- DB/RLS test: 통과/미실행
- Android/iOS build: 통과/미실행

남은 위험 또는 후속 작업
- ...
```

실행하지 않은 검증을 실행한 것처럼 표현하지 않는다.

---

## 30. 공식 문서 우선 원칙

라이브러리 사용법이나 스토어 정책이 바뀔 수 있으므로, 구현 당시 다음 공식 문서를 우선 확인한다.

- Expo: https://docs.expo.dev/
- React Native: https://reactnative.dev/docs/getting-started
- i18next: https://www.i18next.com/
- Supabase: https://supabase.com/docs
- RevenueCat: https://www.revenuecat.com/docs
- Apple App Review: https://developer.apple.com/app-store/review/guidelines/
- Google Play 정책: https://support.google.com/googleplay/android-developer/

블로그 예제보다 공식 문서와 현재 설치된 버전의 타입 정의를 우선한다. 최신 API가 불명확하면 의존성을 임의로 추측하지 말고 package version과 공식 migration guide를 확인한다.
