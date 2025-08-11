from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .simulation_core import run_simulation_from_scenario

app = FastAPI()

# --- CORS 설정 ---
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
    특정 시나리오의 시뮬레이션을 실행하고 그 결과 통계를 반환합니다.
    실제로는 DB에서 scenario_id를 기반으로 설정을 가져와야 하지만,
    여기서는 시연을 위해 고정된 시나리오 설정을 사용합니다.
    """
    # 시뮬레이션을 위한 임시 시나리오 설정
    # 이 데이터는 원래 DB나 프론트엔드에서 받아와야 합니다.
    scenario_config = {
        "entities": {
            "EntryQueue": {"type": "QUEUE", "params": {"capacity": 50}},
            "MachineA": {"type": "RESOURCE", "params": {"processing_time": 5}},
            "MainConveyor": {"type": "CONVEYOR", "params": {"length": 20, "velocity": 2}}
        },
        "process_flow": [
            {"type": "QUEUE", "entity_name": "EntryQueue"},
            {"type": "RESOURCE", "entity_name": "MachineA"},
            {"type": "CONVEYOR", "entity_name": "MainConveyor"}
        ],
        "source": {
            "number_of_loads": 10,
            "interval": 3,
            "simulation_runtime": 100
        }
    }

    # 시뮬레이션 실행
    simulation_results = run_simulation_from_scenario(scenario_config)

    # API 응답 형식에 맞게 결과 가공 (필요시)
    # 현재는 simulation_results 구조가 API가 기대하는 형식과 유사하므로 그대로 반환
    return {
        "scenario_id": scenario_id,
        **simulation_results
    }
