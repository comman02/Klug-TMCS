from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import time

app = FastAPI()

# --- CORS 설정 ---
# 개발 환경에서는 모든 출처를 허용하여 React 개발 서버(localhost:3000)의 요청을 처리합니다.
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/simulation_results/{scenario_id}/statistics")
def get_simulation_statistics(scenario_id: int):
    """
    특정 시나리오의 시뮬레이션 결과 통계를 반환하는 API.
    실제로는 데이터베이스에서 결과를 조회하고 가공해야 하지만,
    여기서는 시연을 위해 실시간으로 랜덤 데이터를 생성합니다.
    """
    # AutoMod의 '비즈니스 그래프'와 유사한 시간대별 재고량(WIP) 데이터 생성
    wip_data = []
    current_wip = 5
    for i in range(20): # 20개의 시간 단위
        timestamp = int(time.time()) + i * 60 # 1분 간격
        current_wip += random.randint(-2, 3)
        if current_wip < 0:
            current_wip = 0
        wip_data.append({"time": timestamp, "wip": current_wip})

    # 리소스 활용률 데이터
    resource_utilization = [
        {"name": "MachineA", "utilization": random.uniform(0.7, 0.95)},
        {"name": "Worker1", "utilization": random.uniform(0.6, 0.85)},
        {"name": "AGV_Robot", "utilization": random.uniform(0.8, 1.0)},
    ]

    return {
        "scenario_id": scenario_id,
        "wip_over_time": wip_data,
        "resource_utilization": resource_utilization,
    }
