import numpy as np
from scipy import stats

class RandomNumberGenerator:
    """
    다양한 통계적 분포에 따른 난수를 생성하는 클래스.
    AutoMod의 '난수 생성' 기능을 모방합니다.
    """
    def __init__(self, seed=None):
        self.rng = np.random.default_rng(seed)

    def uniform(self, low=0.0, high=1.0, size=None):
        """균일 분포 난수 생성."""
        return self.rng.uniform(low, high, size)

    def exponential(self, scale=1.0, size=None):
        """지수 분포 난수 생성 (scale은 평균)."""
        return self.rng.exponential(scale, size)

    def triangular(self, left, mode, right, size=None):
        """삼각 분포 난수 생성."""
        # numpy의 triangular는 [left, right] 범위에서 mode를 가짐
        return self.rng.triangular(left, mode, right, size)

    def normal(self, loc=0.0, scale=1.0, size=None):
        """정규 분포 난수 생성 (loc은 평균, scale은 표준편차)."""
        return self.rng.normal(loc, scale, size)

    def poisson(self, lam=1.0, size=None):
        """푸아송 분포 난수 생성 (lam은 평균 발생 횟수)."""
        return self.rng.poisson(lam, size)

class StatisticalAnalyzer:
    """
    시뮬레이션 결과 데이터에 대한 통계 분석을 수행하는 클래스.
    AutoMod의 'AutoStat' 기능을 모방합니다.
    """
    def __init__(self, data):
        if not isinstance(data, (list, np.ndarray)):
            raise ValueError("Data must be a list or numpy array.")
        self.data = np.array(data)
        if self.data.size == 0:
            raise ValueError("Data cannot be empty.")

    def calculate_mean(self):
        """데이터의 평균을 계산합니다."""
        return np.mean(self.data)

    def calculate_std_dev(self):
        """데이터의 표준 편차를 계산합니다."""
        # ddof=1은 표본 표준편차를 계산 (n-1로 나눔)
        return np.std(self.data, ddof=1)

    def calculate_confidence_interval(self, confidence_level=0.95):
        """
        데이터의 평균에 대한 신뢰 구간을 계산합니다.
        정규 분포를 가정하고 t-분포를 사용합니다.
        """
        mean = self.calculate_mean()
        std_err = stats.sem(self.data) # 표준 오차 (standard error of the mean)
        
        # 데이터 포인트가 하나인 경우 신뢰 구간 계산 불가
        if self.data.size < 2:
            return (mean, mean) # 또는 오류 처리

        # t-분포의 임계값 계산
        # df = degrees of freedom (자유도)
        h = std_err * stats.t.ppf((1 + confidence_level) / 2, self.data.size - 1)
        
        return (mean - h, mean + h)

    def get_summary_statistics(self, confidence_level=0.95):
        """모든 요약 통계량을 반환합니다."""
        try:
            mean = self.calculate_mean()
            std_dev = self.calculate_std_dev()
            conf_interval = self.calculate_confidence_interval(confidence_level)
            
            return {
                "mean": mean,
                "standard_deviation": std_dev,
                "confidence_interval": conf_interval,
                "confidence_level": confidence_level,
                "min": np.min(self.data),
                "max": np.max(self.data),
                "median": np.median(self.data),
                "count": self.data.size
            }
        except ValueError as e:
            return {"error": str(e)}


# --- 사용 예시 ---
if __name__ == "__main__":
    print("--- 난수 생성 예시 ---")
    rng = RandomNumberGenerator(seed=42) # 재현성을 위해 시드 설정

    # 균일 분포 (0에서 10 사이)
    uniform_samples = rng.uniform(low=0, high=10, size=5)
    print(f"균일 분포 샘플: {uniform_samples}")

    # 지수 분포 (평균 2.0)
    exponential_samples = rng.exponential(scale=2.0, size=5)
    print(f"지수 분포 샘플: {exponential_samples}")

    # 삼각 분포 (최소 1, 최빈값 5, 최대 10)
    triangular_samples = rng.triangular(left=1, mode=5, right=10, size=5)
    print(f"삼각 분포 샘플: {triangular_samples}")

    # 정규 분포 (평균 10, 표준편차 2)
    normal_samples = rng.normal(loc=10, scale=2, size=5)
    print(f"정규 분포 샘플: {normal_samples}")

    print("\n--- 통계 분석 예시 ---")
    # 시뮬레이션에서 얻은 가상의 데이터 (예: 부품 처리 시간)
    simulation_data = [
        12.5, 13.1, 11.9, 12.8, 13.5, 12.2, 14.0, 11.5, 13.0, 12.7,
        12.9, 13.3, 12.0, 13.8, 12.6, 11.8, 13.2, 12.4, 13.6, 12.1
    ]

    analyzer = StatisticalAnalyzer(simulation_data)
    summary = analyzer.get_summary_statistics(confidence_level=0.95)
    print(f"시뮬레이션 데이터 요약 통계 (95% 신뢰 수준):\n{summary}")

    # 다른 데이터로 테스트
    empty_data = []
    try:
        analyzer_empty = StatisticalAnalyzer(empty_data)
        print(f"\n빈 데이터 분석: {analyzer_empty.get_summary_statistics()}")
    except ValueError as e:
        print(f"\n빈 데이터 분석 오류: {e}")

    single_data = [10]
    try:
        analyzer_single = StatisticalAnalyzer(single_data)
        print(f"\n단일 데이터 분석: {analyzer_single.get_summary_statistics()}")
    except ValueError as e:
        print(f"\n단일 데이터 분석 오류: {e}")
