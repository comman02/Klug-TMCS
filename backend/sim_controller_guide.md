### **SimController 유사 프로젝트 관리 기능 구현 가이드**

**목표:**
*   사용자가 시뮬레이션 프로젝트를 생성, 수정, 삭제할 수 있도록 합니다.
*   각 프로젝트 내에서 시뮬레이션 모델(엔터티 구성, 파라미터)을 저장하고 로드할 수 있도록 합니다.
*   여러 시뮬레이션 실행을 관리하고, 과거 실행 결과를 조회할 수 있도록 합니다.
*   시뮬레이션 결과들을 비교하여 분석할 수 있도록 합니다.

---

### **1. 백엔드 (Python - FastAPI, SQLAlchemy) 개발 접근 방식**

백엔드는 데이터 관리, 시뮬레이션 실행, 결과 처리를 담당합니다.

**1.1. 데이터베이스 모델 확장 및 활용:**

*   **`database_models.py` 활용:**
    *   **`UserModel`:** 사용자 인증 및 권한 관리에 활용됩니다.
    *   **`ScenarioModel` (프로젝트/모델):** 시뮬레이션 프로젝트 또는 모델의 메타데이터(이름, 설명, 생성자)를 저장합니다. 각 `ScenarioModel`은 하나의 시뮬레이션 모델을 나타냅니다.
    *   **`EntityModel`:** `ScenarioModel`에 속하는 개별 시뮬레이션 엔터티(컨베이어, 자원, 큐 등)의 구성 정보(타입, UI 속성, 시뮬레이션 파라미터)를 저장합니다.
    *   **`ResultModel`:** 특정 `ScenarioModel`의 시뮬레이션 실행 결과 요약(실행 시간, 주요 KPI)을 저장합니다.
    *   **`EventLogModel`:** 시뮬레이션 실행 중 발생한 상세 이벤트 로그를 저장합니다.

**1.2. API 엔드포인트 설계 및 구현 (`backend/main.py` 확장):**

FastAPI를 사용하여 다음과 같은 RESTful API 엔드포인트를 구현합니다.

*   **사용자 관리 (인증/인가):**
    *   `POST /api/users/register`: 사용자 등록 (비밀번호 해싱 필요)
    *   `POST /api/users/login`: 사용자 로그인 (JWT 토큰 발급)
    *   `GET /api/users/me`: 현재 로그인된 사용자 정보 조회 (토큰 필요)
    *   **필요 라이브러리:** `passlib` (비밀번호 해싱), `python-jose` (JWT), `fastapi.security` (OAuth2)

*   **시뮬레이션 프로젝트/모델 관리 (`ScenarioModel`):**
    *   `POST /api/scenarios`: 새 시뮬레이션 모델 생성 (사용자 인증 필요)
        *   요청 바디: `name`, `description`
        *   응답: 생성된 `ScenarioModel` 객체
    *   `GET /api/scenarios`: 모든 시뮬레이션 모델 목록 조회 (사용자 인증 필요, 필터링/페이지네이션 고려)
    *   `GET /api/scenarios/{scenario_id}`: 특정 시뮬레이션 모델 상세 조회
    *   `PUT /api/scenarios/{scenario_id}`: 시뮬레이션 모델 업데이트
    *   `DELETE /api/scenarios/{scenario_id}`: 시뮬레이션 모델 삭제 (관련 엔터티, 결과도 함께 삭제되도록 `cascade` 설정)

*   **시뮬레이션 엔터티 관리 (`EntityModel`):**
    *   `POST /api/scenarios/{scenario_id}/entities`: 특정 모델에 엔터티 추가
        *   요청 바디: `name`, `entity_type`, `ui_properties` (JSON), `sim_properties` (JSON)
    *   `GET /api/scenarios/{scenario_id}/entities`: 특정 모델의 모든 엔터티 조회
    *   `PUT /api/entities/{entity_id}`: 엔터티 업데이트 (UI/Sim 파라미터 변경)
    *   `DELETE /api/entities/{entity_id}`: 엔터티 삭제

*   **시뮬레이션 실행 및 결과 (`ResultModel`, `EventLogModel`):**
    *   `POST /api/scenarios/{scenario_id}/run`: 시뮬레이션 실행 요청
        *   **로직:**
            1.  `scenario_id`에 해당하는 `EntityModel`들을 데이터베이스에서 로드합니다.
            2.  로드된 엔터티 정보(타입, 파라미터)를 기반으로 `simulation_core.py`의 SimPy 시뮬레이션 환경을 구성합니다.
            3.  SimPy 시뮬레이션을 실행합니다.
            4.  시뮬레이션 실행 중 발생하는 주요 이벤트(예: Load 도착, 작업 시작/종료)를 `EventLogModel` 형태로 수집합니다.
            5.  시뮬레이션 종료 후, 주요 통계(총 처리량, 평균 대기 시간 등)를 계산하여 `ResultModel`에 저장하고, 수집된 `EventLogModel`들도 함께 저장합니다.
            6.  응답: `ResultModel`의 ID 또는 요약 정보.
        *   **비동기 처리 고려:** 시뮬레이션은 시간이 오래 걸릴 수 있으므로, 비동기 작업 큐(Celery + Redis/RabbitMQ)를 사용하여 백그라운드에서 실행하고, 클라이언트에게는 작업 ID를 반환한 후, 나중에 작업 상태를 조회하는 방식으로 구현하는 것이 좋습니다. (초기에는 동기 방식으로 구현 후 확장)
    *   `GET /api/scenarios/{scenario_id}/results`: 특정 모델의 모든 시뮬레이션 결과 목록 조회
    *   `GET /api/results/{result_id}/summary`: 특정 시뮬레이션 결과 요약 조회
    *   `GET /api/results/{result_id}/event_logs`: 특정 시뮬레이션의 상세 이벤트 로그 조회 (페이지네이션 고려)
    *   `GET /api/results/{result_id}/statistics`: 특정 시뮬레이션 결과에 대한 통계 분석 (과제 5에서 구현한 API 확장)
        *   `statistics_module.py`의 `StatisticalAnalyzer`를 활용하여 데이터 가공.

**1.3. 데이터베이스 세션 관리:**

*   FastAPI의 `Depends`를 사용하여 데이터베이스 세션(Session)을 요청마다 생성하고, 요청 처리 후 자동으로 닫히도록 의존성 주입(Dependency Injection) 패턴을 구현합니다.

**1.4. 시뮬레이션 로직 통합:**

*   `simulation_core.py`의 클래스들을 API 엔드포인트에서 임포트하여 사용합니다.
*   `statistics_module.py`의 `StatisticalAnalyzer`를 사용하여 시뮬레이션 결과 데이터를 분석합니다.

---

### **2. 프론트엔드 (React) 개발 접근 방식**

프론트엔드는 사용자 인터페이스를 통해 백엔드 API와 상호작용합니다.

**2.1. 라우팅 및 페이지 구성:**

*   `react-router-dom` 라이브러리를 사용하여 애플리케이션의 페이지를 구성합니다.
    *   `/login`: 로그인 페이지
    *   `/register`: 회원가입 페이지
    *   `/projects`: 시뮬레이션 프로젝트 목록 페이지 (SimController의 메인 화면)
    *   `/projects/{id}/editor`: 시뮬레이션 모델 편집기 (3D 캔버스, 속성 패널)
    *   `/projects/{id}/results`: 시뮬레이션 결과 대시보드 (차트, 통계)
    *   `/projects/{id}/results/{result_id}/detail`: 특정 시뮬레이션 실행의 상세 결과 및 이벤트 로그

**2.2. 상태 관리:**

*   **React Context API 또는 Redux/Zustand:** 전역 상태(예: 로그인된 사용자 정보, 현재 선택된 프로젝트/모델, 캔버스 위의 엔터티 목록)를 효율적으로 관리합니다.
*   **`useState`, `useEffect`:** 각 컴포넌트의 로컬 상태와 API 호출을 관리합니다.

**2.3. UI 컴포넌트 구현 및 통합:**

*   **`Login/RegisterForm`:** 사용자 인증을 위한 폼.
*   **`ProjectList`:** `ScenarioModel` 목록을 표시하고, 새 프로젝트 생성, 기존 프로젝트 열기/삭제 기능을 제공합니다.
    *   테이블 또는 카드 형태로 프로젝트 목록 표시.
    *   "새 프로젝트" 버튼 클릭 시 모달 또는 새 페이지로 이동하여 프로젝트 정보 입력.
*   **`SimulationEditor` (과제 2의 UI 확장):**
    *   **Toolbox:** 드래그 가능한 엔터티 목록 (컨베이어, 자원, 큐 등).
    *   **3D Canvas:** `react-three-fiber`를 사용하여 엔터티를 배치하고 조작합니다.
        *   드래그 앤 드롭 이벤트 처리: `Toolbox`에서 드롭 시 `EntityModel` 생성 API 호출.
        *   3D 객체 선택 시 `PropertiesPanel`에 정보 표시.
        *   **모델 저장/로드:** "저장" 버튼 클릭 시 현재 캔버스 위의 모든 엔터티 정보를 `EntityModel` API를 통해 백엔드에 저장. "로드" 시 특정 `ScenarioModel`의 `EntityModel`들을 불러와 캔버스에 렌더링.
    *   **PropertiesPanel:** 선택된 엔터티의 `sim_properties`를 수정하고, 변경 시 `EntityModel` 업데이트 API 호출.
    *   **"시뮬레이션 실행" 버튼:** 클릭 시 `POST /api/scenarios/{scenario_id}/run` API 호출.
*   **`ResultsDashboard` (과제 5의 UI 확장):**
    *   `ResultModel` 목록을 표시하고, 각 결과에 대한 요약 통계 및 상세 이벤트 로그를 조회할 수 있도록 합니다.
    *   `statistics_module.py`에서 제공하는 통계 분석 결과를 시각화합니다.
    *   **결과 비교:** 여러 `ResultModel`을 선택하여 차트나 통계표에서 비교할 수 있는 UI를 구현합니다.

**2.4. API 통신:**

*   `fetch` API 또는 `axios` 라이브러리를 사용하여 백엔드 API와 통신합니다.
*   인증이 필요한 API 호출에는 JWT 토큰을 HTTP 헤더에 포함하여 전송합니다.

**2.5. 실시간 업데이트 (WebSocket 고려):**

*   시뮬레이션 실행 상태나 진행률을 실시간으로 클라이언트에게 전달해야 하는 경우, `WebSocket`을 사용합니다.
*   백엔드 FastAPI에서 `WebSocket` 엔드포인트를 구현하고, 프론트엔드에서는 `WebSocket` 클라이언트(예: `ws` 또는 `socket.io-client`)를 사용하여 연결하고 메시지를 수신합니다.
*   수신된 메시지를 기반으로 UI를 업데이트합니다 (예: 진행률 바, 실시간 그래프).

---

**개발 워크플로우 제안:**

1.  **백엔드 API 우선 개발:** 각 API 엔드포인트를 먼저 구현하고 Postman이나 Insomnia 같은 툴로 테스트하여 정상 작동하는지 확인합니다.
2.  **프론트엔드 UI 개발:** 백엔드 API가 준비되면, 프론트엔드에서 해당 API를 호출하여 데이터를 가져오고 UI를 구성합니다.
3.  **점진적 통합:** 작은 기능 단위로 백엔드와 프론트엔드를 통합하고 테스트합니다. (예: 사용자 로그인 -> 프로젝트 목록 -> 프로젝트 생성 -> 엔터티 추가 -> 시뮬레이션 실행 -> 결과 조회)

이 가이드는 SimController와 유사한 프로젝트 관리 기능을 구현하기 위한 포괄적인 접근 방식을 제공합니다. 각 단계는 독립적인 과제로 세분화하여 진행할 수 있습니다.