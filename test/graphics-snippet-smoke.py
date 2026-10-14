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
clock = [100.0]
host = GraphicsHost(interpreter, events.append, now_seconds=lambda: clock[0]) if name == '如观计时动画' else GraphicsHost(interpreter, events.append)

def read_times():
    interpreter.execute(parse('快照值 取 [图 其 经过秒, 图 其 间隔秒].'))
    return interpreter.global_scope.values['快照值']

def timed_event(origin, seconds, event):
    clock[0] = origin + seconds
    host.handle(event)


def check_timed_frame(elapsed, delta, x):
    assert read_times() == [elapsed, delta]
    commands = events[-1]['commands']
    assert [c['op'] for c in commands] == ['background', 'ellipse', 'text']
    assert commands[1]['x'] == x
    assert commands[1]['fill'] == '#4677ff'
    assert float(commands[2]['text']) == elapsed
try:
    # Re-executing a notebook cell must also work without import-name conflicts.
    for repeat in range(2):
        clock[0] = origin = 100.0 + 20 * repeat
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
        elif name == '如观不可变缓存':
            event = events[-1]
            assert [c['op'] for c in event['commands']] == ['background', 'image', 'image']
            first, second = event['commands'][1:]
            assert (first['x'], first['y']) == (20, 20)
            assert (second['x'], second['y']) == (0, 0)
            assert first['resource'] == second['resource']
            assert len(event['resources']) == 1
            resource = event['resources'][0]
            assert (resource['width'], resource['height']) == (80, 60)
            assert resource['commands'][0]['op'] == 'rect'
            assert resource['commands'][0]['fill'] == '#4677ff80'
            expected = [math.cos(0.3), math.sin(0.3), -math.sin(0.3), math.cos(0.3), 180, 80]
            assert all(math.isclose(a, b) for a, b in zip(second['transform'], expected))
            assert interpreter.global_scope.values['底宽'] == 80
            assert interpreter.global_scope.values['底高'] == 60
            assert not host.canvas.stack
            assert tuple(host.canvas.transform) == (1, 0, 0, 1, 0, 0)
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
        elif name == '如观弧与扇形':
            commands = events[-1]['commands']
            assert [c['op'] for c in commands] == ['background', 'sector', 'arc']
            sector, arc = commands[1:]
            assert (sector['x'], sector['y'], sector['width'], sector['height']) == (20, 30, 120, 120)
            assert (sector['start'], sector['sweep']) == (-math.pi / 2, math.pi / 2)
            assert sector['fill'] == '#ffb34780'
            assert (arc['x'], arc['y'], arc['width'], arc['height']) == (200, 30, 120, 120)
            assert (arc['start'], arc['sweep']) == (0, -math.pi * 1.5)
            assert arc['fill'] == ''
            for command in (sector, arc):
                assert command['stroke'] == '#25344a' and command['stroke_width'] == 4
                assert command.get('transform', [1, 0, 0, 1, 0, 0]) == [1, 0, 0, 1, 0, 0] and command.get('clips', []) == []
            assert host.canvas.fill == '#ffb34780'
        elif name == '如观折线':
            commands = events[-1]['commands']
            assert [c['op'] for c in commands] == ['background', 'polyline', 'polyline', 'rect']
            original, changed, rect = commands[1:]
            assert original['points'] == [[20,130],[100,40],[200,110],[300,50]]
            assert changed['points'] == [[20,130],[100,80],[200,110],[300,50]]
            assert original['stroke'] == '#4677ff80' and changed['stroke'] == '#25865d'
            assert original['fill'] == changed['fill'] == ''
            assert original['stroke_width'] == changed['stroke_width'] == 4
            assert rect['fill'] == host.canvas.fill == '#ffb34780'
        elif name == '如观贝塞尔':
            commands = events[-1]['commands']
            assert [c['op'] for c in commands] == ['background', 'polyline', 'bezier', 'bezier']
            guide, upper, lower = commands[1:]
            assert guide['points'] == [[20,140],[80,20],[240,20],[300,140]]
            assert guide['stroke'] == '#a0a8b880' and guide['stroke_width'] == 2
            keys = ('x1','y1','cx1','cy1','cx2','cy2','x2','y2')
            assert [upper[k] for k in keys] == [20,140,80,20,240,20,300,140]
            assert [lower[k] for k in keys] == [20,140,80,200,240,200,300,140]
            assert upper['stroke'] == '#4677ff' and lower['stroke'] == '#25865d'
            assert upper['fill'] == lower['fill'] == ''
            assert upper['stroke_width'] == lower['stroke_width'] == 4
            assert host.canvas.fill == '#ffb34780'
        elif name == '如观透明文字':
            commands = events[-1]['commands']
            assert [c['op'] for c in commands] == ['background', 'rect', 'text', 'text']
            assert commands[0]['color'] == '#00000000'
            assert commands[1]['fill'] == '#4070ff80'
            assert commands[1]['stroke'] == ''
            centered, baseline = commands[2:]
            assert (centered['x'], centered['y'], centered['align'], centered['baseline']) == (160, 80, 'center', 'middle')
            assert centered['color'] == '#25344a'
            assert (baseline['x'], baseline['y'], baseline['align'], baseline['baseline']) == (300, 140, 'right', 'alphabetic')
            assert baseline['color'] == '#25344abf'
            assert not host.canvas.stack
            assert (host.canvas.text_align, host.canvas.text_baseline, host.canvas.fill) == ('center', 'middle', '#25344a')
            # Restored alignment and color survive the callback geometry reset.
            interpreter.execute(parse("图 其 每帧 (作 帧: 图 其 背景 '#ffffff'. 图 其 文字 '保留' 160 80. 为)."))
            host.handle({'type': 'frame'})
            after = events[-1]['commands'][1]
            assert (after['align'], after['baseline'], after['color']) == ('center', 'middle', '#25344a')
            assert (baseline['align'], baseline['baseline'], baseline['color']) == ('right', 'alphabetic', '#25344abf')
        elif name == '如观计时动画':
            assert host.snapshot()['running']
            assert read_times() == [0, 0]
            clock[0] = origin + 0.5
            assert read_times() == [0, 0], 'getters outside a callback do not sample time'
            timed_event(origin, 1, {'type': 'frame'})
            check_timed_frame(1, 0, 20)
            clock[0] = origin + 1.125
            assert read_times() == [1, 0], 'time is frozen between callbacks'
            timed_event(origin, 1.25, {'type': 'frame'})
            check_timed_frame(1.25, 0.25, 35)
            timed_event(origin, 2, {'type': 'mouse_down', 'x': 12, 'y': 13, 'button': 0})
            assert not host.snapshot()['running']
            assert read_times() == [2, 0]
            timed_event(origin, 5, {'type': 'key_down', 'key': 'Space'})
            assert host.snapshot()['running']
            assert read_times() == [5, 0]
            timed_event(origin, 5.5, {'type': 'frame'})
            check_timed_frame(5.5, 0, 35)
            timed_event(origin, 5.75, {'type': 'frame'})
            check_timed_frame(5.75, 0.25, 50)
            # Repeating continue while already running must not reset the frame clock.
            timed_event(origin, 6, {'type': 'key_down', 'key': 'Space'})
            assert read_times() == [6, 0]
            timed_event(origin, 6.25, {'type': 'frame'})
            check_timed_frame(6.25, 0.5, 80)
            # A delayed/hidden frame keeps the full real gap; there is no catch-up loop.
            timed_event(origin, 11.25, {'type': 'frame'})
            check_timed_frame(11.25, 5, 100)
            assert host.canvas.frame == 6
        else:
            assert [c['op'] for c in events[-1]['commands']] == ['background', 'rect', 'rect', 'text']
finally:
    host.close()
