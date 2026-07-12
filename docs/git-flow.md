# WeCanDay Git Flow

WeCanDay는 `main`과 `master`를 사용하지 않는다. 안정 배포 기준은 `production`, 일상 통합 기준은 `develop`이다.

## 브랜치 역할

| 브랜치 | 용도 | 생성 기준 | 병합 대상 |
| --- | --- | --- | --- |
| `production` | Google Play에 배포 가능한 안정 상태 | `develop`의 검증된 릴리스 후보 | 없음. 릴리스 태그만 추가 |
| `develop` | 다음 배포에 들어갈 통합 브랜치 | 상시 유지 | `production`으로 릴리스 시 fast-forward 또는 PR |
| `feature/<task-id>-<slug>` | 하나의 Task 구현 | 최신 `develop` | `develop` |
| `fix/<task-id>-<slug>` | `develop`에서 발견된 버그 수정 | 최신 `develop` | `develop` |
| `release/<version>` | 출시 직전 안정화 | `develop` | `develop`, `production` |
| `hotfix/<slug>` | 이미 배포된 앱의 긴급 수정 | `production` | `production`, `develop` |

## 작업 흐름

1. `develop`을 최신화한다.
2. Task 하나당 `feature/` 또는 `fix/` 브랜치 하나를 만든다.
3. 해당 Task의 코드·테스트·문서만 변경한다.
4. `npm run lint`, `npm run typecheck`, `npm run test`를 통과시킨다.
5. `develop`을 대상으로 PR을 만든다.
6. 병합 뒤 원격 feature/fix 브랜치를 삭제한다.

예시:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/t-301-pixel-foundation
```

## 커밋 규칙

- 형식: `type(scope): 요약`
- 예: `feat(companion): add idle pixel companion`
- 허용 type: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`
- 한 커밋에는 하나의 의도만 담는다.
- 토큰, 키, 이메일, 계획 제목 등 민감 정보는 커밋하지 않는다.
- 공유된 `develop`, `production`에는 force push하지 않는다.

## 릴리스 흐름

1. `develop`에서 `release/<version>`을 만든다.
2. 버전, 스토어 설정, 개인정보·계정 삭제, 실제 Android 검증만 수정한다.
3. `production`과 `develop`에 모두 병합한다.
4. `production`에 `v<version>` 태그를 만든다.
5. 해당 태그 기준으로 Android 배포를 진행한다.

## 현재 전환 상태

- 기존 `feature/auth-profile` 작업 트리에는 아직 커밋되지 않은 기반·인증·루틴·체크인 작업이 있다.
- 이 작업은 먼저 하나의 정리 PR로 `develop`에 병합한다.
- 이후 디자인 기반 Task는 `feature/t-301-pixel-foundation`에서 시작한다.
- 기존 브랜치나 작업 파일을 자동으로 삭제·reset·강제 이동하지 않는다.
