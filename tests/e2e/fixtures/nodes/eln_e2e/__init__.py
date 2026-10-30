"""Test-only nodes for the e2e suite: typed links without models, and a Sleep node for runs."""
import time

import torch
from typing_extensions import override

from comfy_api.latest import ComfyExtension, io


class Sleep(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="ELNSleep",
            display_name="ELN Sleep",
            category="eln_e2e",
            inputs=[
                io.Float.Input("seconds", default=1.0, min=0.0, max=60.0, step=0.1),
                io.AnyType.Input("value", optional=True),
            ],
            outputs=[io.AnyType.Output()],
            is_output_node=True,
        )

    @classmethod
    def fingerprint_inputs(cls, **kwargs):
        return float("NaN")

    @classmethod
    def execute(cls, seconds, value=None) -> io.NodeOutput:
        time.sleep(seconds)
        return io.NodeOutput(value)


def typed_node(comfy_type, input_options, constant):
    """Passes its input through, or emits a constant when nothing is connected."""
    name = comfy_type.io_type

    class Typed(io.ComfyNode):
        @classmethod
        def define_schema(cls) -> io.Schema:
            return io.Schema(
                node_id=f"ELN{name.capitalize()}",
                display_name=f"ELN {name}",
                category="eln_e2e",
                inputs=[comfy_type.Input("value", optional=True, **input_options)],
                outputs=[comfy_type.Output()],
            )

        @classmethod
        def execute(cls, value=None) -> io.NodeOutput:
            return io.NodeOutput(constant() if value is None else value)

    return Typed


# Slot order is shared with MIX_TYPES in fixtures/perf.ts. INT, FLOAT and STRING have no palette colour.
MIX_SLOTS = [
    ("image", io.Image, {}),
    ("latent", io.Latent, {}),
    ("model", io.Model, {}),
    ("int", io.Int, {"force_input": True}),
    ("float", io.Float, {"force_input": True}),
    ("string", io.String, {"force_input": True}),
    ("custom", io.Custom("ELN_CUSTOM"), {}),
]


class Mix(io.ComfyNode):
    """One optional input and one output per link type, for the large perf graphs."""

    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="ELNMix",
            display_name="ELN Mix",
            category="eln_e2e",
            inputs=[t.Input(name, optional=True, **options) for name, t, options in MIX_SLOTS],
            outputs=[t.Output(display_name=name) for name, t, _ in MIX_SLOTS],
        )

    @classmethod
    def execute(cls, **kwargs) -> io.NodeOutput:
        return io.NodeOutput(*(kwargs.get(name) for name, _, _ in MIX_SLOTS))


NODES = [
    Sleep,
    Mix,
    typed_node(io.Int, {"force_input": True}, lambda: 0),
    typed_node(io.Float, {"force_input": True}, lambda: 0.0),
    typed_node(io.String, {"force_input": True}, lambda: ""),
    typed_node(io.Image, {}, lambda: torch.zeros(1, 8, 8, 3)),
    typed_node(io.Latent, {}, lambda: {"samples": torch.zeros(1, 4, 8, 8)}),
]


class ElnE2E(ComfyExtension):
    @override
    async def get_node_list(self) -> list[type[io.ComfyNode]]:
        return NODES


async def comfy_entrypoint() -> ElnE2E:
    return ElnE2E()
