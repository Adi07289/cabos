"""CabOS edge simulator: synthesises machine signals and runs the safety state machines.

P1 provides the clock-driven runtime loop. Signal synthesis and publishing arrive in P2,
and the seatbelt/proximity state machines (from cabos_core.safety) in P4.
"""

__version__ = "0.1.0"
