# ADR 0001: Android 우선 출시와 Google 로그인

- 상태: 승인됨
- 날짜: 2026-07-12

## 배경

초기 단계에서 Apple Developer Program의 연간 비용과 iOS 배포·Apple 로그인 운영 부담을 피하고, 핵심 루틴 경험의 수요를 먼저 검증한다.

## 결정

- 첫 정식 출시는 Android와 Google 로그인만 지원한다.
- Android 앱에서는 Apple 로그인 UI, Apple provider 설정, Apple 전용 네이티브 SDK를 포함하지 않는다.
- Supabase의 사용자 ID와 프로필 데이터 모델은 OAuth 제공자에 종속시키지 않는다.
- iOS 지원, Apple 로그인, App Store 결제와 TestFlight는 Android 출시 성과를 검토한 뒤 별도 제품 결정으로 추가한다.

## 결과

- Google Play 전체 배포에는 개발자 등록 절차와 1회성 비용이 필요하다.
- iOS 출시 시 Apple 로그인, Apple 계정 삭제 token revoke, StoreKit/RevenueCat 설정, TestFlight 검증을 다시 범위화해야 한다.
- 현재 Android 출시에서 계정·프로필·루틴 데이터는 Apple 로그인 추가 후에도 유지될 수 있도록 Supabase user UUID를 기준으로 관리한다.
