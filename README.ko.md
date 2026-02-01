# Electron Test MCP

[![npm version](https://img.shields.io/npm/v/electron-test-mcp.svg)](https://www.npmjs.com/package/electron-test-mcp)
[![npm downloads](https://img.shields.io/npm/dm/electron-test-mcp.svg)](https://www.npmjs.com/package/electron-test-mcp)
[![GitHub stars](https://img.shields.io/github/stars/lazy-dinosaur/electron-test-mcp.svg)](https://github.com/lazy-dinosaur/electron-test-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English Version](README.md)

Playwright를 사용하여 Electron 애플리케이션을 테스트하기 위한 MCP(Model Context Protocol) 서버입니다. Claude와 같은 AI 모델이 Electron 앱과 상호작용하고 테스트할 수 있게 해줍니다.

## 🚀 빠른 시작

```bash
# npx로 바로 실행
npx electron-test-mcp

# 또는 전역 설치
npm install -g electron-test-mcp
electron-test-mcp
```

## 주요 기능

- **두 가지 연결 모드**
  - **CDP 모드**: Chrome DevTools Protocol을 통해 실행 중인 Electron 앱에 연결
  - **Launch 모드**: 테스트용 새 Electron 앱 인스턴스 실행
- **Playwright API 지원**: screenshot, click, fill, type, hover, press, wait, evaluate 등
- **접근성 스냅샷**: 엘리먼트 탐색을 위한 접근성 트리 획득
- **메인 프로세스 접근**: Electron 메인 프로세스에서 코드 실행 (launch 모드만 해당)

## 작동 원리

```
사용자 <--> AI 모델 (Claude) <--> MCP 프로토콜 <--> electron-test-mcp <--> Electron 앱
```

1. **사용자**: "로그인 버튼을 클릭하고 이메일 필드에 입력해줘"
2. **AI 모델**: 사용할 MCP 도구 결정
3. **MCP 프로토콜**: 표준화된 통신
4. **electron-test-mcp**: Electron 앱에서 Playwright 명령 실행
5. **Electron 앱**: 실제 애플리케이션에서 액션 수행

## 설정 방법

### Claude Desktop / MCP 클라이언트

MCP 설정 파일에 추가:

```json
{
  "mcpServers": {
    "electron-test": {
      "command": "npx",
      "args": ["electron-test-mcp"]
    }
  }
}
```

### OpenCode

```json
{
  "mcp": {
    "electron-test": {
      "type": "local",
      "command": ["npx", "electron-test-mcp"],
      "enabled": true
    }
  }
}
```

## 연결 모드

### CDP 모드 (개발 시 권장)

원격 디버깅이 활성화된 실행 중인 Electron 앱에 연결:

```bash
# 디버깅 포트와 함께 Electron 앱 시작
electron your-app --remote-debugging-port=9222

# electron-vite 사용 시
electron-vite dev -- --remote-debugging-port=9222
```

그 다음 `connect` 도구 사용:

```
connect({ port: 9222 })
```

**장점:**

- 기존 개발 워크플로우와 호환
- 테스트 간 앱 상태 유지
- Hot reload 계속 작동

### Launch 모드

새 Electron 앱 인스턴스 실행:

```
launch({ appPath: "./out/main/index.js" })

# CI용 headless 모드
launch({ appPath: "./out/main/index.js", headless: true })
```

**장점:**

- 각 테스트마다 깨끗한 상태
- `evaluateMain`을 통한 메인 프로세스 접근
- 커스텀 환경 변수 전달 가능
- CI/자동화를 위한 headless 모드 지원

## Headless 모드 (CI/자동화)

### Launch 모드

`headless: true`를 전달하면 창 없이 실행:

```
launch({ appPath: "./out/main/index.js", headless: true })
```

### CDP 모드

연결 전에 Electron 앱을 headless 플래그와 함께 시작:

```bash
# 방법 1: Electron headless 플래그 (Electron 28+)
electron your-app --headless=new --remote-debugging-port=9222

# 방법 2: xvfb (Linux) - 가상 프레임버퍼
xvfb-run electron your-app --remote-debugging-port=9222

# 방법 3: xvfb + 특정 디스플레이 (CI 환경)
Xvfb :99 -screen 0 1920x1080x24 &
DISPLAY=:99 electron your-app --remote-debugging-port=9222
```

그 다음 평소대로 연결:

```
connect({ port: 9222 })
```

## 사용 가능한 도구

### 연결

| 도구         | 설명                             |
| ------------ | -------------------------------- |
| `connect`    | CDP를 통해 실행 중인 앱에 연결   |
| `disconnect` | CDP 연결 해제 (앱은 계속 실행됨) |
| `launch`     | 새 Electron 앱 인스턴스 실행     |
| `close`      | 실행된 앱 종료                   |

### 상호작용

| 도구           | 설명                                  |
| -------------- | ------------------------------------- |
| `click`        | 엘리먼트 클릭                         |
| `fill`         | 입력 필드에 텍스트 입력 (먼저 클리어) |
| `type`         | 한 글자씩 텍스트 입력                 |
| `hover`        | 엘리먼트 위에 마우스 올리기           |
| `press`        | 키보드 키 누르기                      |
| `drag`         | 드래그 앤 드롭                        |
| `selectOption` | 드롭다운에서 선택                     |

### 검사

| 도구           | 설명                               |
| -------------- | ---------------------------------- |
| `screenshot`   | 스크린샷 촬영 (base64 이미지 반환) |
| `snapshot`     | 접근성 트리 가져오기               |
| `getText`      | 엘리먼트 텍스트 내용 가져오기      |
| `getAttribute` | 엘리먼트 속성 가져오기             |
| `isVisible`    | 엘리먼트 표시 여부 확인            |
| `count`        | 일치하는 엘리먼트 수 세기          |

### 고급

| 도구           | 설명                                        |
| -------------- | ------------------------------------------- |
| `wait`         | 엘리먼트 상태 대기                          |
| `evaluate`     | 렌더러 프로세스에서 JS 실행                 |
| `evaluateMain` | 메인 프로세스에서 코드 실행 (launch 모드만) |

## 셀렉터

Playwright의 모든 셀렉터 지원:

```
# CSS 셀렉터
[data-testid="submit-btn"]
.my-class
#my-id

# 텍스트 셀렉터
text=제출
text="정확히 일치"

# Role 셀렉터
role=button[name="제출"]

# 조합
.form >> text=제출
```

## 사용 예시

### 기본 테스트 흐름

```
1. connect({ port: 9222 })
2. snapshot()  // 페이지 구조 확인
3. click('[data-testid="login-btn"]')
4. fill('[data-testid="email"]', 'test@example.com')
5. fill('[data-testid="password"]', 'password123')
6. click('text=로그인')
7. wait({ selector: '[data-testid="dashboard"]' })
8. screenshot()
```

### 메인 프로세스 접근 (Launch 모드)

```javascript
// 앱 버전 가져오기
evaluateMain({
  script: "({ app }) => app.getVersion()",
});

// 다이얼로그 표시
evaluateMain({
  script: "({ dialog }) => dialog.showMessageBox({ message: '안녕하세요!' })",
});
```

### AI 어시스턴트와 함께 사용

Claude나 다른 AI 어시스턴트에게 Electron 앱 테스트를 요청할 수 있습니다:

```
포트 9222에서 실행 중인 Electron 앱에 연결해서:
1. 현재 상태의 스크린샷 찍어줘
2. 사이드바의 "설정" 버튼 클릭해줘
3. 테마를 다크 모드로 변경해줘
4. 배경색을 확인해서 테마가 변경됐는지 확인해줘
```

## 테스트 가능한 Electron 앱 만들기 팁

1. **중요한 엘리먼트에 `data-testid` 속성 추가**
2. **개발 시 원격 디버깅 활성화**: `--remote-debugging-port=9222`
3. **시맨틱 HTML 사용**으로 더 나은 접근성 스냅샷 획득
4. **안정적인 셀렉터 유지** - 클래스보다 `data-testid` 선호

## 개발

```bash
# 저장소 클론
git clone https://github.com/lazy-dinosaur/electron-test-mcp.git
cd electron-test-mcp

# 의존성 설치
npm install

# 빌드
npm run build

# 로컬 실행
node dist/index.js
```

## 🤝 기여하기

기여를 환영합니다! Pull Request를 자유롭게 제출해주세요.

## 📄 라이선스

MIT 라이선스로 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

## ❤️ 지원

이 프로젝트가 유용하셨다면 GitHub에서 ⭐️를 눌러주세요!
