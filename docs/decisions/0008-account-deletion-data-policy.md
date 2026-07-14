# 0008. 계정 삭제는 Auth 사용자 hard delete와 cascade를 사용한다

- 상태: 승인
- 날짜: 2026-07-14

## 맥락

WeCanDay 초기 출시에는 사용자가 앱 안에서 계정 삭제를 시작할 수 있어야 한다. 현재 사용자 데이터는 `auth.users` → `profiles` 외래키와 `on delete cascade` 관계를 기준으로 소유된다.

## 결정

인증된 사용자가 앱의 명시적 2단계 확인을 완료하면 `delete-account` Edge Function이 다음 순서로 처리한다.

1. 해당 사용자의 전역 refresh token을 revoke한다.
2. 서버 전용 admin API로 `auth.users` 행을 hard delete한다.
3. `profiles`에서 이어지는 cascade로 소유 프로필, 공개 코드, 계획, 루틴, 체크인, 상태 이력, 친구·차단 관계, 푸시 토큰, 생성한 챌린지와 그 멤버십을 삭제한다.
4. 앱은 이 기기의 예약 루틴 알림, 오프라인 체크인 대기열, 사용자별 권한 안내 기록, 푸시 설치 식별자를 지운다.

다른 참가자가 소유한 계획과 루틴은 삭제하지 않는다. 삭제된 사용자가 만든 챌린지는 제거되지만, 다른 사용자가 이미 수락하여 만든 자신의 루틴 기록은 그 사용자 데이터이기 때문이다.

## 결과

- 앱 클라이언트에는 service role/secret key가 포함되지 않는다.
- 현재 Access JWT는 Supabase 특성상 만료 전까지 암호학적으로 즉시 무효화할 수 없다. 다만 refresh token을 먼저 revoke하고 profile cascade로 앱 데이터 접근을 즉시 없앤다.
- Supabase Storage 객체는 현재 사용하지 않는다. Storage를 도입하면 계정 삭제 전에 해당 사용자가 소유한 객체를 삭제하는 단계를 추가해야 한다.
