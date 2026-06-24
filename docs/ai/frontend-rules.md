# Frontend Rules For AI Agents

이 문서는 `unsik-fe` 프론트엔드를 수정하는 AI 에이전트가 반드시 참고해야
하는 세부 규칙입니다. `docs/ai/rules.md`가 요약 규칙이라면, 이 파일은
그 규칙을 실제 작업에서 어떻게 적용해야 하는지 설명합니다.

## 1. 이 프로젝트를 웹 프론트엔드로 다룬다

- 이 저장소는 React Native나 Expo 앱이 아니라 Vite 기반 React 웹 앱이다.
- 브라우저에서 실행되는 HTML, CSS, JavaScript 번들을 만든다.
- 네이티브 모바일 의존성, Expo Router, React Native 컴포넌트는 사용하지
  않는다.
- 모바일 앱 같은 화면을 만들더라도 구현 대상은 모바일 브라우저다.

왜 중요한가:

- React Native의 `<View>`, `<Text>`는 브라우저 DOM의 `<div>`, `<p>`,
  `<button>`과 다르다.
- 웹에서는 CSS, semantic HTML, 접근성, 브라우저 viewport 대응이 핵심이다.
- Expo 의존성을 다시 넣으면 빌드 방식과 런타임 전제가 바뀌어 프로젝트가
  불필요하게 복잡해진다.

## 2. 진입점과 앱 구조를 유지한다

- `src/main.tsx`는 React DOM bootstrap 파일로 유지한다.
- `src/App.tsx`는 앱 전체 조합 지점으로 유지한다.
- 화면 단위 컴포넌트는 `src/components` 아래에 둔다.
- 기능이 커지면 `src/components`, `src/hooks`, `src/constants`,
  `src/services`, `src/features`처럼 역할별 폴더를 만들 수 있다.
- 폴더를 만들 때는 실제 중복이나 복잡도가 생긴 뒤에 만든다.

기준:

- 한 화면짜리 앱이면 `App.tsx -> LandingScreen` 정도가 충분하다.
- 라우트가 2개 이상이 되고 URL이 의미를 가지면 라우터 도입을 검토한다.
- 서버 API 호출이 여러 곳에서 반복되면 `src/services`나 feature-local
  API 모듈을 만든다.

## 3. React 컴포넌트는 작고 읽히게 만든다

- 컴포넌트는 한 가지 화면 책임을 갖게 한다.
- JSX가 너무 길어지면 의미 있는 하위 컴포넌트로 나눈다.
- 반복되는 데이터는 배열 상수로 두고 `map`으로 렌더링한다.
- 화면 문구는 컴포넌트 상단 상수나 별도 copy 파일로 모은다.
- 한국어 서비스 문구는 사람이 읽을 수 있는 한글 문자열로 작성한다.

좋은 기준:

```tsx
const COPY = {
  title: '오늘 뭐 먹지?\n운명에게 물어봐.',
  cta: '메뉴 점 보러 가기',
} as const;
```

피해야 할 기준:

```tsx
const COPY = {
  title: '\uC624\uB298 \uBB50 \uBA39\uC9C0?',
} as const;
```

왜 중요한가:

- 화면 문구는 기획과 디자인 변경이 자주 생긴다.
- 사람이 바로 읽을 수 없으면 유지보수 비용이 커진다.
- escape 문자열은 특별한 ASCII-only 정책이 있을 때만 사용한다.

## 4. TypeScript strict 모드를 존중한다

- `any`는 기본적으로 사용하지 않는다.
- API 응답, 컴포넌트 props, 이벤트 핸들러 인자는 가능한 타입을 명시한다.
- null 가능성은 회피하지 말고 코드로 처리한다.
- 타입 에러를 무시하기 위해 `as unknown as` 같은 우회 캐스팅을 남발하지
  않는다.
- 상수 데이터는 필요하면 `as const`를 사용해 의도를 명확히 한다.

API 연결 시 기준:

```ts
type MenuRecommendation = {
  id: string;
  name: string;
  reason: string;
};
```

서버 DTO와 프론트 타입은 비슷하지만 완전히 같은 것은 아니다.

- 서버 DTO는 서버 내부 계약이다.
- 프론트 타입은 브라우저 화면이 실제로 사용하는 데이터 계약이다.
- 필드가 optional인지, 빈 문자열이 올 수 있는지, 날짜가 string인지 등을
  프론트에서 명확히 다룬다.

## 5. CSS는 모바일 브라우저를 먼저 기준으로 작성한다

- 기본 레이아웃은 모바일 폭에서 먼저 자연스럽게 만든다.
- 그 다음 넓은 화면에서 max-width, grid, flex를 조정한다.
- 터치 대상은 최소 44px 정도의 높이를 확보한다.
- 텍스트가 버튼이나 카드 밖으로 튀어나오지 않게 한다.
- viewport height를 쓸 때는 모바일 주소창 변화를 고려한다.

현재 프로젝트에서 중요한 CSS 개념:

- `100dvh`: 모바일 브라우저의 동적 viewport 높이 대응
- `env(safe-area-inset-bottom)`: 아이폰 홈 인디케이터 영역 대응
- `@media`: 화면 폭이나 높이에 따른 조건부 스타일
- `white-space: pre-line`: 문자열의 `\n`을 실제 줄바꿈으로 표시
- `object-fit: contain`: 이미지 비율을 유지하며 영역 안에 맞춤

피해야 할 것:

- 모든 요소를 절대 위치로만 배치하는 방식
- 화면 폭에 따라 폰트 크기를 무리하게 계속 키우는 방식
- 카드 안에 또 카드가 들어가는 과한 중첩
- 한 가지 색만 반복되는 단조로운 팔레트
- 모바일에서 버튼, 텍스트, 이미지가 서로 겹치는 배치

## 6. 접근성은 나중 일이 아니다

- 버튼은 실제 `<button>`을 사용한다.
- 링크 이동은 `<a>`를 사용한다.
- 클릭 가능한 `<div>`는 피한다.
- 이미지가 의미를 가지면 `alt`를 작성한다.
- 장식용 요소는 `aria-hidden="true"`를 사용한다.
- 키보드 포커스가 보이도록 `:focus-visible` 스타일을 둔다.
- 애니메이션은 `prefers-reduced-motion`을 고려한다.

왜 중요한가:

- 접근성은 스크린리더 사용자만을 위한 것이 아니다.
- 키보드 사용, 모바일 터치, 브라우저 자동완성, SEO, 테스트 안정성에도
  영향을 준다.
- semantic HTML을 쓰면 브라우저 기본 동작을 많이 활용할 수 있다.

## 7. 데이터가 생기면 상태를 네 가지로 나눈다

서버 데이터가 들어가는 화면은 최소한 아래 상태를 고려한다.

- loading: 요청 중
- empty: 성공했지만 보여줄 데이터가 없음
- error: 실패함
- success: 정상 데이터가 있음

예:

- 메뉴 추천 요청 중이면 버튼을 비활성화하고 로딩 표시를 보여준다.
- 추천 결과가 없으면 빈 상태 문구와 다시 시도 버튼을 보여준다.
- 서버 오류가 나면 사용자가 이해할 수 있는 에러와 복구 동선을 제공한다.
- 오프라인이나 타임아웃처럼 네트워크가 불안한 상황도 고려한다.

## 8. 백엔드 API 연결은 경계를 분리한다

- 컴포넌트 안에 긴 `fetch` 로직을 직접 늘어놓지 않는다.
- API 호출이 반복되면 별도 함수로 분리한다.
- API base URL은 `VITE_API_BASE_URL` 같은 환경변수로 둔다.
- `VITE_*` 값은 공개 값으로 간주한다.
- secret, DB 비밀번호, private token은 절대 프론트에 넣지 않는다.

권장 흐름:

```ts
async function fetchRecommendation(): Promise<MenuRecommendation> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recommendations`);

  if (!response.ok) {
    throw new Error('Failed to fetch recommendation');
  }

  return response.json() as Promise<MenuRecommendation>;
}
```

실제 구현에서는 서버 응답 shape 검증, 에러 메시지 정책, 인증 방식이 정해지면
그 기준에 맞춰 보강한다.

## 9. 에셋 위치를 구분한다

- React 코드에서 import하는 이미지는 `assets/`에 둔다.
- favicon, robots.txt, PWA 아이콘처럼 URL로 바로 접근해야 하는 파일은
  `public/`에 둔다.
- 큰 이미지 파일은 용량을 확인하고 필요하면 압축한다.
- 이미지가 화면 핵심이면 흐리거나 잘린 placeholder 대신 실제 의미가
  전달되는 이미지를 사용한다.

## 10. 경로 별칭을 사용한다

- `@/`는 `src/`를 의미한다.
- `@/assets/`는 `assets/`를 의미한다.
- 깊은 상대 경로보다 별칭을 우선 사용한다.

예:

```ts
import { LandingScreen } from '@/components/home/landing-screen';
import mascotImage from '@/assets/images/mascots/landing-mascots.png';
```

왜 중요한가:

- 파일 위치를 옮겨도 import 수정 범위가 줄어든다.
- 긴 `../../../` 경로보다 읽기 쉽다.

## 11. 검증 명령을 변경 범위에 맞게 실행한다

- TypeScript 파일을 바꾸면 `npm.cmd run typecheck`를 실행한다.
- UI 구조나 CSS를 크게 바꾸면 가능하면 브라우저에서 직접 확인한다.
- lint 영향이 있을 만한 변경이면 `npm.cmd run lint`를 실행한다.
- 빌드 설정, asset 처리, 배포 결과에 영향을 주면 `npm.cmd run build`를
  실행한다.
- 마무리 전 전체 확인이 필요하면 `npm.cmd run check`를 실행한다.

Windows PowerShell에서는 `npm` 대신 `npm.cmd`를 우선 사용한다.

## 12. 문서를 같이 갱신한다

아래 변경이 생기면 `docs/ai/*`도 함께 갱신한다.

- 프로젝트 구조 변경
- 새 명령어 추가 또는 기존 명령어 변경
- 환경변수 추가
- API 계약 또는 백엔드 연결 방식 변경
- 디자인 시스템, 접근성, 반응형 기준 변경
- 앱 도메인 가정 변경

학습자용 설명이 필요한 변화라면 `docs/frontend-study-guide.html`도 함께
갱신한다.

## 13. 커밋 메시지

- 커밋 메시지는 `[type]: summary` 형식을 사용한다.
- 예: `[feat]: add recommendation result screen`
- 예: `[docs]: update frontend study guide`
- 예: `[fix]: prevent landing button text overflow`

자주 쓰는 type:

- `feat`: 사용자 기능 추가
- `fix`: 버그 수정
- `docs`: 문서만 변경
- `style`: 동작 변경 없는 스타일 변경
- `refactor`: 동작 변경 없는 코드 구조 개선
- `test`: 테스트 추가 또는 수정
- `chore`: 설정, 정리, 기타 유지보수
- `build`: 빌드 시스템 또는 의존성 변경
- `ci`: CI 설정 변경
- `perf`: 성능 개선
- `revert`: 이전 커밋 되돌림
