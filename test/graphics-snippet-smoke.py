"""Exercise notebook-only snippets with the actual Ru GraphicsHost, not a browser."""
import io
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
        else:
            assert [c['op'] for c in events[-1]['commands']] == ['background', 'rect', 'rect', 'text']
finally:
    host.close()
