# Needex Typography

Needex는 데이터·정책 정보를 밀도 있게 보여주는 product UI이지만, 읽기 어려운 Figma 고정 크기를 그대로 사용하지 않는다. 본문은 14–16px, 보조 정보는 최소 12px를 기준으로 하고 크기와 line-height를 항상 하나의 semantic token으로 적용한다.

## 조사 근거

- [Fluent 2 Typography](https://fluent2.microsoft.design/typography)는 웹에서 Caption 12/16, Body 14/20, Subtitle 16/22, Title 24/32 이상의 semantic type ramp를 사용한다.
- [Carbon Typography Type Sets](https://preview.carbondesignsystem.com/building-blocks/foundations/typography/type-sets)는 정보 밀도가 높은 productive UI의 base를 14px로, 일반 web의 expressive base를 16px로 둔다. Productive label/helper는 12/16, body는 14/18–20이다.
- [Tailwind CSS Font Size](https://v3.tailwindcss.com/docs/font-size)는 기본 scale을 `text-xs` 12/16, `text-sm` 14/20, `text-base` 16/24로 제공하며, 반복되는 크기는 arbitrary value 대신 theme scale로 관리할 수 있게 한다.
- [WCAG 2.2 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)는 텍스트를 200%까지 확대해도 내용이나 기능이 손실되지 않아야 한다고 설명한다. [Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)은 확대된 문장을 읽기 위해 viewport 전체를 가로 스크롤하지 않도록 요구한다.
- [Material Design 3 Type Scale Tokens](https://m3.material.io/styles/typography/type-scale-tokens)의 display/headline/title/body/label 역할 구분을 semantic naming에 참고했다.

위 자료의 내용은 라이선스 준수를 위해 요약·재서술했다.

## Product type scale

| Token | CSS class | Size / line-height | 용도 |
|---|---|---:|---|
| Caption | `tv-type-caption` | 12 / 18px | 표 metadata, timestamp, 짧은 보조 상태 |
| Label | `tv-type-label` | 13 / 20px | field label, badge, navigation group |
| Body compact | `tv-type-body-sm` | 14 / 20px | product UI 기본 본문, 버튼, 표 cell |
| Body | `tv-type-body` | 16 / 24px | 설명문, form input, auth·public 본문 |
| Subtitle | `tv-type-subtitle` | 20 / 28px | card 또는 큰 section 제목 |
| Title | `tv-type-title` | 24 / 32px | 화면 내 주요 제목 |
| Heading | `tv-type-heading` | 28 / 36px | product page 제목 |
| Large heading | `tv-type-heading-lg` | 32 / 40px | onboarding·public section 제목 |
| Display | `tv-type-display` | 34–44px / 1.2 | landing hero 전용 fluid heading |

모든 크기는 `rem`으로 구현한다. 표의 숫자처럼 고정된 시각 리듬이 필요한 경우에도 font size와 line-height를 분리하지 않는다.

## 사용 규칙

1. 일반 product 화면은 `tv-type-body-sm`, auth·landing의 읽는 본문은 `tv-type-body`를 기본으로 사용한다.
2. `tv-type-caption`은 독립된 본문이나 중요한 안내에 사용하지 않는다. 두 줄 이상 설명은 최소 `tv-type-body-sm`을 사용한다.
3. 새 코드에 `text-[Npx]`를 추가하지 않는다. 위 semantic class 또는 Tailwind의 `text-xs`, `text-sm`, `text-base`를 사용한다.
4. 크기로만 위계를 만들지 않는다. 제목은 heading element, label은 `label`/`dt`, 상태는 badge처럼 의미와 weight를 함께 맞춘다.
5. 고정 높이 컨테이너 안의 문자는 확대 시 잘릴 수 있으므로, 긴 문구가 있는 card·table row에는 `min-height`와 wrapping을 우선한다.
6. 200% browser zoom에서 텍스트 손실, 겹침, viewport 가로 overflow가 없어야 한다.
7. 한국어 본문은 영문보다 글자 밀도가 높으므로 Caption은 1.5배, Body는 1.43–1.5배 line-height를 유지한다.

## Legacy compatibility

기존 Figma 구현의 arbitrary class는 `app/globals.css`에서 다음과 같이 semantic scale로 승격된다.

| 기존 class | 렌더링 token |
|---|---|
| `text-[7px]`–`text-[10px]` | Caption 12/18 |
| `text-[11px]`–`text-[12px]` | Label 13/20 |
| `text-[13px]`–`text-[14px]` | Body compact 14/20 |
| `text-[15px]`–`text-[16px]` | Body 16/24 |

이 호환 계층은 기존 화면을 한 번에 읽기 가능한 크기로 올리기 위한 안전망이다. 파일을 수정할 때는 legacy class를 해당 semantic class로 교체하고, 새 arbitrary font size는 만들지 않는다.

## Review checklist

- 본문이 14px 미만인가?
- Caption이 중요한 설명이나 action label로 사용됐는가?
- font size와 line-height가 같은 token에서 오는가?
- 320px viewport와 200% zoom에서 잘림·겹침·가로 overflow가 없는가?
- 버튼·입력·badge의 text가 container 안에서 수직으로 잘리지 않는가?
- page title → section title → body → caption의 위계가 일관적인가?
