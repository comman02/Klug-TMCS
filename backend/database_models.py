import datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Enum,
)
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import enum

from .config import settings # 설정 파일 임포트

# --- 기본 설정 ---
# 실제 애플리케이션에서는 이 URL을 설정 파일에서 관리해야 합니다.
# DATABASE_URL = "mysql+pymysql://root:1234@localhost/simulation_db"

# 참고: SQLAlchemy의 JSON 타입은 모든 데이터베이스 백엔드에서 네이티브 JSON을 지원하지 않을 수 있습니다.
# MySQL 5.7 이상에서는 JSON 타입이 지원됩니다.

Base = declarative_base()

# --- Enum 정의 ---
class EntityType(enum.Enum):
    RESOURCE = "RESOURCE"
    QUEUE = "QUEUE"
    CONVEYOR = "CONVEYOR"
    SOURCE = "SOURCE"
    SINK = "SINK"

# --- 모델 클래스 정의 ---

class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scenarios = relationship("ScenarioModel", back_populates="owner")

class ScenarioModel(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(String(500))
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("UserModel", back_populates="scenarios")
    entities = relationship("EntityModel", back_populates="scenario", cascade="all, delete-orphan")
    results = relationship("ResultModel", back_populates="scenario", cascade="all, delete-orphan")

class EntityModel(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    name = Column(String(100), nullable=False)
    entity_type = Column(Enum(EntityType), nullable=False)
    # 프론트엔드 UI의 위치, 크기 등 시각적 정보를 저장
    ui_properties = Column(JSON)
    # 시뮬레이션 로직에 사용될 파라미터 (예: {'capacity': 1, 'processing_time': 5})
    sim_properties = Column(JSON)

    scenario = relationship("ScenarioModel", back_populates="entities")

class ResultModel(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    run_started_at = Column(DateTime, default=datetime.datetime.utcnow)
    run_duration_seconds = Column(Float)
    
    # 전체 시뮬레이션 결과 요약 (예: 총 생산량, 평균 대기 시간 등)
    summary_stats = Column(JSON)

    scenario = relationship("ScenarioModel", back_populates="results")
    event_logs = relationship("EventLogModel", back_populates="result", cascade="all, delete-orphan")

class EventLogModel(Base):
    __tablename__ = "event_logs"
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("results.id"), nullable=False)
    timestamp = Column(Float, nullable=False) # SimPy의 env.now 값
    entity_name = Column(String(100))
    event_type = Column(String(50)) # 예: 'ARRIVE', 'START_PROCESSING', 'FINISH_PROCESSING'
    load_name = Column(String(100))
    message = Column(String(500))

    result = relationship("ResultModel", back_populates="event_logs")


# --- 데이터베이스 및 테이블 생성 함수 ---
def create_db_and_tables():
    # 실제 운영 환경에서는 Alembic과 같은 마이그레이션 도구를 사용하는 것이 좋습니다.
    engine = create_engine(settings.DATABASE_URL) # 설정 객체에서 URL 사용
    Base.metadata.create_all(bind=engine)
    print("Database and tables created successfully.")

if __name__ == "__main__":
    # 이 파일을 직접 실행하면 데이터베이스에 테이블이 생성됩니다.
    # 주의: .env 파일에 실제 user, password, db 이름으로 DATABASE_URL을 설정해야 합니다.
    create_db_and_tables()
