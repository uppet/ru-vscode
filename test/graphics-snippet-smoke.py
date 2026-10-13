"""Exercise notebook-only snippets with the actual Ru GraphicsHost, not a browser."""
import io
import math
from pathlib import Path
import sys

sys.path.insert(0, sys.argv[1])
from rulang.frontend import parse
from rulang.interpreter import Interpreter
from rulang.graphics_runtime import GraphicsHost

source = Path(sys.argv[2]).read_text(encoding='utf-8')
name = sys.argv[3]
events = []
interpreter = Interpreter(stdout=io.StringIO())
host = GraphicsHost(interpreter, events.append)
try:
    # Re-executing a notebook cell must also work without import-name conflicts.
    for _ in range(2):
        host.begin_execution()
        interpreter.execute(parse(source))
        host.flush()
        assert host.canvas is not None
        if name == '如观动画交互':
            assert host.snapshot()['running']
            host.handle({'type': 'frame'})
            assert [c['op'] for c in events[-1]['commands']] == ['background', 'ellipse']
            host.handle({'type': 'mouse_down', 'x': 12, 'y': 13, 'button': 0})
            assert not host.snapshot()['running']
        elif name == '如观形状变换':
            commands = events[-1]['commands']
            assert [c['op'] for c in commands] == ['background', 'polygon', 'polygon']
            triangle, polygon = commands[1:]
            assert triangle['points'] == [[-50, 30], [0, -50], [50, 30]]
            assert len(polygon['points']) == 4
            expected = [math.cos(0.3)*1.2, math.sin(0.3)*1.2,
                        -math.sin(0.3)*0.8, math.cos(0.3)*0.8, 160, 120]
            for command in (triangle, polygon):
                assert all(math.isclose(a, b) for a, b in zip(command['transform'], expected))
                assert command['clips'] == [{'x': 20, 'y': 20, 'width': 280, 'height': 200,
                                             'transform': [1, 0, 0, 1, 0, 0]}]
                assert command['fill'] == '#4677ff'
            assert not host.canvas.stack
            assert tuple(host.canvas.transform) == (1, 0, 0, 1, 0, 0)
            assert not host.canvas.clips
        else:
            assert [c['op'] for c in events[-1]['commands']] == ['background', 'rect', 'rect', 'text']
finally:
    host.close()
