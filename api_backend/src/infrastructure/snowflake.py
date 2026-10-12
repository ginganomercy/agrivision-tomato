import time
import threading
import os
from typing import Optional

# Konstanta Konfigurasi Twitter Snowflake
SNOWFLAKE_EPOCH_MS: int = 1704067200000  # Custom Epoch: 2024-01-01 00:00:00 UTC
WORKER_ID_BITS: int = 10                  # 10 bit worker ID (hingga 1024 worker/pod)
SEQUENCE_BITS: int = 12                   # 12 bit sequence (hingga 4096 ID per milidetik)

MAX_WORKER_ID: int = -1 ^ (-1 << WORKER_ID_BITS)
MAX_SEQUENCE: int = -1 ^ (-1 << SEQUENCE_BITS)
WORKER_SHIFT: int = SEQUENCE_BITS
TIMESTAMP_SHIFT: int = SEQUENCE_BITS + WORKER_ID_BITS


class SnowflakeGenerator:
    """
    Generator ID Twitter Snowflake yang thread-safe dan deterministic.
    Menghasilkan 64-bit ID unik berbasis waktu untuk tracing request dan prediksi.
    """
    def __init__(self, worker_id: Optional[int] = None):
        env_worker_id = int(os.getenv("WORKER_NODE_ID", "1"))
        self.worker_id = worker_id if worker_id is not None else env_worker_id

        if self.worker_id < 0 or self.worker_id > MAX_WORKER_ID:
            raise ValueError(f"Worker ID harus berada di rentang [0, {MAX_WORKER_ID}]")

        self.sequence: int = 0
        self.last_timestamp_ms: int = -1
        self._lock = threading.Lock()

    def _get_current_timestamp_ms(self) -> int:
        return int(time.time() * 1000)

    def _wait_for_next_millisecond(self, last_ts: int) -> int:
        ts = self._get_current_timestamp_ms()
        while ts <= last_ts:
            time.sleep(0.0001)
            ts = self._get_current_timestamp_ms()
        return ts

    def next_id(self) -> int:
        """Menghasilkan Snowflake ID 64-bit berikutnya secara thread-safe."""
        with self._lock:
            current_ts = self._get_current_timestamp_ms()

            if current_ts < self.last_timestamp_ms:
                # Clock backwards clock-drift guard
                time_diff_ms = self.last_timestamp_ms - current_ts
                if time_diff_ms < 5:
                    time.sleep(time_diff_ms / 1000.0)
                    current_ts = self._get_current_timestamp_ms()
                else:
                    raise RuntimeError(f"Sistem clock mundur sebesar {time_diff_ms}ms. Generator ditahan.")

            if current_ts == self.last_timestamp_ms:
                self.sequence = (self.sequence + 1) & MAX_SEQUENCE
                if self.sequence == 0:
                    current_ts = self._wait_for_next_millisecond(self.last_timestamp_ms)
            else:
                self.sequence = 0

            self.last_timestamp_ms = current_ts

            id_value = (
                ((current_ts - SNOWFLAKE_EPOCH_MS) << TIMESTAMP_SHIFT)
                | (self.worker_id << WORKER_SHIFT)
                | self.sequence
            )
            return id_value

    def next_id_str(self) -> str:
        """Mengembalikan representasi string dari Snowflake ID."""
        return str(self.next_id())


# Instance singleton global untuk service
snowflake_instance = SnowflakeGenerator()


def generate_snowflake_id() -> str:
    """Fungsi pembantu untuk menghasilkan Snowflake ID string."""
    return snowflake_instance.next_id_str()


def generate_trace_id() -> str:
    """Fungsi pembantu untuk menghasilkan Trace ID unik berbasis Snowflake."""
    return f"trc-{snowflake_instance.next_id_str()}"
