import simpy
from collections import deque
import statistics

# --- 기본 엔터티 클래스 ---

class Load:
    """시뮬레이션 내에서 이동하고 처리되는 작업물(부품, 제품 등)을 나타냅니다."""
    def __init__(self, env, name, creation_time):
        self.env = env
        self.name = name
        self.creation_time = creation_time
        self.completion_time = None

    def __str__(self):
        return self.name

class Resource:
    """작업을 수행하는 자원(기계, 작업자 등)을 나타냅니다."""
    def __init__(self, env, name, capacity=1, processing_time=1):
        self.env = env
        self.name = name
        self.capacity = capacity
        self.processing_time = processing_time
        self.simpy_resource = simpy.Resource(env, capacity=capacity)

    def use(self, load):
        print(f"{self.env.now:.2f}: {load}가 {self.name}에 도착하여 작업 대기 시작.")
        with self.simpy_resource.request() as request:
            yield request
            print(f"{self.env.now:.2f}: {load}가 {self.name}에서 작업 시작.")
            yield self.env.timeout(self.processing_time)
            print(f"{self.env.now:.2f}: {load}가 {self.name}에서 작업 완료.")

class Queue:
    """Load들이 Resource 사용이나 이동을 위해 대기하는 장소를 나타냅니다."""
    def __init__(self, env, name, capacity=float('inf')):
        self.env = env
        self.name = name
        self.capacity = capacity
        self.simpy_store = simpy.Store(env, capacity=capacity)

    def put(self, load):
        print(f"{self.env.now:.2f}: {load}가 {self.name} 큐에 들어감.")
        return self.simpy_store.put(load)

    def get(self):
        print(f"{self.env.now:.2f}: {self.name} 큐에서 Load를 꺼내려고 시도.")
        return self.simpy_store.get()

class ConveyorSection:
    """일정한 속도와 길이를 가진 컨베이어의 한 부분을 나타냅니다."""
    def __init__(self, env, name, length=10, velocity=1):
        self.env = env
        self.name = name
        self.travel_time = length / velocity

    def travel(self, load):
        print(f"{self.env.now:.2f}: {load}가 {self.name} 컨베이어에 진입.")
        yield self.env.timeout(self.travel_time)
        print(f"{self.env.now:.2f}: {load}가 {self.name} 컨베이어 끝에 도달.")

# --- 동적 시뮬레이션 실행 로직 ---

def run_load_journey(env, load, process_flow, entities, stats_collector):
    """설정된 프로세스 흐름에 따라 Load의 여정을 시뮬레이션합니다."""
    print(f"--- {env.now:.2f}: {load} 생성됨 ---")

    for step in process_flow:
        entity_name = step["entity_name"]
        entity_type = step["type"]
        entity = entities[entity_name]

        if entity_type == "QUEUE":
            yield entity.put(load)
            yield entity.get()
        elif entity_type == "RESOURCE":
            yield env.process(entity.use(load))
        elif entity_type == "CONVEYOR":
            yield env.process(entity.travel(load))
    
    load.completion_time = env.now
    stats_collector["lead_times"].append(load.completion_time - load.creation_time)
    stats_collector["processed_count"] += 1
    print(f"--- {env.now:.2f}: {load} 전체 공정 완료 ---")

def source(env, number_of_loads, interval, process_flow, entities, stats_collector):
    """설정에 따라 Load를 생성하는 제너레이터"""
    for i in range(number_of_loads):
        load = Load(env, f"Part-{i+1}", env.now)
        env.process(run_load_journey(env, load, process_flow, entities, stats_collector))
        yield env.timeout(interval)

def run_simulation_from_scenario(scenario_config):
    """시나리오 설정을 받아 시뮬레이션을 실행하고 결과를 반환합니다."""
    env = simpy.Environment()
    entities = {}
    stats_collector = {"processed_count": 0, "lead_times": []}

    # 1. 시나리오 설정에 따라 엔터티 생성
    for name, config in scenario_config["entities"].items():
        if config["type"] == "QUEUE":
            entities[name] = Queue(env, name, **config.get("params", {}))
        elif config["type"] == "RESOURCE":
            entities[name] = Resource(env, name, **config.get("params", {}))
        elif config["type"] == "CONVEYOR":
            entities[name] = ConveyorSection(env, name, **config.get("params", {}))

    # 2. Load 생성 프로세스 시작
    source_config = scenario_config["source"]
    process_flow = scenario_config["process_flow"]
    env.process(source(env, 
                       source_config["number_of_loads"], 
                       source_config["interval"], 
                       process_flow, 
                       entities, 
                       stats_collector))

    # 3. 시뮬레이션 실행
    env.run(until=source_config.get("simulation_runtime", 100))

    # 4. 결과 계산 및 반환
    avg_lead_time = statistics.mean(stats_collector["lead_times"]) if stats_collector["lead_times"] else 0
    
    return {
        "total_processed": stats_collector["processed_count"],
        "average_lead_time": round(avg_lead_time, 2),
        "wip_over_time": [], # 이 부분은 상세 로깅이 필요하여 일단 비워둠
        "resource_utilization": [] # 이 부분도 상세 로깅이 필요
    }

