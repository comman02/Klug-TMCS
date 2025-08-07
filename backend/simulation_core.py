import simpy
from collections import deque

# --- 기본 엔터티 클래스 ---

class Load:
    """시뮬레이션 내에서 이동하고 처리되는 작업물(부품, 제품 등)을 나타냅니다."""
    def __init__(self, env, name, creation_time):
        self.env = env
        self.name = name
        self.creation_time = creation_time
        self.last_location_entry_time = creation_time

    def __str__(self):
        return self.name

class Resource:
    """작업을 수행하는 자원(기계, 작업자 등)을 나타냅니다."""
    def __init__(self, env, name, capacity=1, processing_time=1):
        self.env = env
        self.name = name
        self.capacity = capacity
        self.processing_time = processing_time
        # SimPy의 Resource를 내부적으로 사용
        self.simpy_resource = simpy.Resource(env, capacity=capacity)

    def use(self, load):
        """Load가 Resource를 사용하여 작업을 수행하는 과정을 시뮬레이션합니다."""
        print(f"{self.env.now:.2f}: {load}가 {self.name}에 도착하여 작업 대기 시작.")
        with self.simpy_resource.request() as request:
            yield request  # 자원 할당을 기다림
            print(f"{self.env.now:.2f}: {load}가 {self.name}에서 작업 시작.")
            yield self.env.timeout(self.processing_time) # 작업 시간만큼 시뮬레이션 시간 진행
            print(f"{self.env.now:.2f}: {load}가 {self.name}에서 작업 완료.")

class Queue:
    """Load들이 Resource 사용이나 이동을 위해 대기하는 장소를 나타냅니다."""
    def __init__(self, env, name, capacity=float('inf')):
        self.env = env
        self.name = name
        self.capacity = capacity
        # SimPy의 Store를 사용하여 큐를 구현
        self.simpy_store = simpy.Store(env, capacity=capacity)

    def put(self, load):
        """큐에 Load를 추가합니다."""
        print(f"{self.env.now:.2f}: {load}가 {self.name} 큐에 들어감.")
        return self.simpy_store.put(load)

    def get(self):
        """큐에서 Load를 꺼냅니다."""
        print(f"{self.env.now:.2f}: {self.name} 큐에서 Load를 꺼내려고 시도.")
        return self.simpy_store.get()

class ConveyorSection:
    """일정한 속도와 길이를 가진 컨베이어의 한 부분을 나타냅니다."""
    def __init__(self, env, name, length=10, velocity=1):
        self.env = env
        self.name = name
        self.length = length
        self.velocity = velocity
        self.travel_time = length / velocity
        self.loads_on_conveyor = deque() # 컨베이어 위의 Load들을 순서대로 관리

    def travel(self, load):
        """Load가 컨베이어를 따라 이동하는 과정을 시뮬레이션합니다."""
        print(f"{self.env.now:.2f}: {load}가 {self.name} 컨베이어에 진입.")
        self.loads_on_conveyor.append(load)
        yield self.env.timeout(self.travel_time)
        self.loads_on_conveyor.popleft()
        print(f"{self.env.now:.2f}: {load}가 {self.name} 컨베이어 끝에 도달.")


# --- SimPy 실행 예시 ---

def simple_process_flow(env):
    """간단한 프로세스 흐름을 정의하는 제너레이터 함수"""
    # 1. 시스템 구성 요소 생성
    machine_queue = Queue(env, "MachineQueue")
    machine = Resource(env, "MachineA", processing_time=5)
    conveyor = ConveyorSection(env, "Conveyor1", length=20, velocity=2)

    # 2. Load 생성 및 프로세스 시작
    for i in range(3):
        load = Load(env, f"Part-{i+1}", env.now)
        env.process(run_load_journey(env, load, machine_queue, machine, conveyor))
        yield env.timeout(2) # 2초 간격으로 Load 생성

def run_load_journey(env, load, queue, resource, conveyor):
    """개별 Load의 전체 여정을 시뮬레이션합니다."""
    print(f"--- {env.now:.2f}: {load} 생성됨 ---")

    # 큐에 들어가서 자원을 기다림
    yield queue.put(load)
    retrieved_load = yield queue.get()

    # 자원 사용
    yield env.process(resource.use(retrieved_load))

    # 컨베이어로 이동
    yield env.process(conveyor.travel(retrieved_load))

    print(f"--- {env.now:.2f}: {load} 전체 공정 완료 ---")


if __name__ == '__main__':
    # 시뮬레이션 환경 설정 및 실행
    env = simpy.Environment()
    env.process(simple_process_flow(env))
    env.run(until=50) # 50초 동안 시뮬레이션 실행
