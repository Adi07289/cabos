from cabos_core.rng import generator, stream_key


def test_same_seed_and_stream_reproduce() -> None:
    a = generator(7, "worker-1").random(5)
    b = generator(7, "worker-1").random(5)
    assert a.tolist() == b.tolist()


def test_streams_are_independent() -> None:
    assert generator(7, "worker-1").random() != generator(7, "worker-2").random()


def test_stream_key_is_stable_across_processes() -> None:
    # CRC32 is fixed; Python's hash() would change per process.
    assert stream_key("worker-1") == 1010331808
