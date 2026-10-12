import pytest
from concurrent.futures import ThreadPoolExecutor
from src.infrastructure.snowflake import SnowflakeGenerator, generate_snowflake_id, generate_trace_id


class TestSnowflakeGenerator:
    def test_should_generate_positive_integer_when_called(self):
        generator = SnowflakeGenerator(worker_id=1)
        id_1 = generator.next_id()
        assert isinstance(id_1, int)
        assert id_1 > 0

    def test_should_be_monotonically_increasing_when_sequential_calls(self):
        generator = SnowflakeGenerator(worker_id=1)
        id_1 = generator.next_id()
        id_2 = generator.next_id()
        assert id_2 > id_1

    def test_should_return_string_format_when_next_id_str_called(self):
        id_str = generate_snowflake_id()
        assert isinstance(id_str, str)
        assert id_str.isdigit()

    def test_should_have_correct_trace_prefix_when_generate_trace_id_called(self):
        trace_id = generate_trace_id()
        assert trace_id.startswith("trc-")
        numeric_part = trace_id.replace("trc-", "")
        assert numeric_part.isdigit()

    def test_should_guarantee_uniqueness_under_high_concurrency(self):
        generator = SnowflakeGenerator(worker_id=2)
        num_ids = 1000

        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(lambda _: generator.next_id(), range(num_ids)))

        unique_ids = set(results)
        assert len(unique_ids) == num_ids, "Ditemukan collision ID pada eksekusi konkuren!"

    def test_should_raise_value_error_when_worker_id_out_of_bounds(self):
        with pytest.raises(ValueError):
            SnowflakeGenerator(worker_id=2048)  # Batas atas 10 bit adalah 1023
