# SmartLEAD+

<div align="center">
   <img src="https://github.com/PortalCube/SmartLEAD-Plus/assets/35104213/6bb7cb48-dba7-4b81-b29d-9f8a235a5591" />
   <img src="https://github.com/PortalCube/SmartLEAD-Plus/assets/35104213/dc2d2b84-a277-428f-9126-c3789739964b" width="360" />
</div>

SmartLEAD에 편리한 기능을 추가하는 크롬 확장프로그램입니다.


# Development

```
npm i
npm run dev
```
위 명령어를 실행한 다음, 생성된 dist 폴더를 크롬 확장프로그램 페이지에 Drag & Drop 하면 설치됩니다.

crxjs의 HMR 기능을 이용하므로, Development Build를 한번 설치하면 개발 서버가 돌아가는 동안에는 모든 수정사항이 즉시 반영됩니다.

참고: 현재 vite의 버그로 인해서 간혹 HMR이 먹통이 되는 오류가 있습니다. 다음 순서대로 해결하면 해결됩니다.
1. ts 파일에 아무 변경사항을 입혀서 저장
2. (그래도 안되면) vite.config.js에 아무 변경사항을 입혀서 저장
3. (그래도 안되면) 개발 서버 종료 후 npm run dev로 처음부터 다시 실행

# Build

```
npm i
npm run build
```
위 명령어를 실행한 다음, 생성된 dist 폴더를 크롬 확장프로그램 페이지에 Drag & Drop 하면 설치됩니다.
