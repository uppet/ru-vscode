import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {default: create} = await import(pathToFileURL(process.argv[2]));
const name = process.argv[3];
for (let repeat = 0; repeat < 2; repeat++) {
    const events = []; let now = 100;
    const runtime = create({emit: e => events.push(e), nowSeconds: () => now});
    const scene = () => events.findLast(e => e.type === 'graphics');
    const send = (time, type, extra = {}) => {
        now = time;
        runtime.dispatch({canvas_id: scene().canvas_id, event: {type, ...extra}});
    };
    if (name === '透明颜色') {
        assert.equal(events.filter(e => e.type === 'output').map(e => e.text).join(''), '#ff404080\n#4070ff80\n');
    } else if (name === '如观透明文字') {
        const c = scene().commands;
        assert.deepEqual(c.map(c => c.op), ['background','rect','text','text']);
        assert.equal(c[0].color, '#00000000'); assert.equal(c[1].fill, '#4070ff80');
        assert.deepEqual([c[2].align,c[2].baseline,c[2].color], ['center','middle','#25344a']);
        assert.deepEqual([c[3].align,c[3].baseline,c[3].color], ['right','alphabetic','#25344abf']);
    } else if (name === '如观计时动画') {
        const check = (elapsed, x) => {
            const c = scene().commands;
            assert.deepEqual(c.map(c => c.op), ['background','ellipse','text']);
            assert.equal(c[1].x, x); assert.equal(Number(c[2].text), elapsed);
        };
        send(101, 'frame'); check(1, 20);
        send(101.25, 'frame'); check(1.25, 35);
        send(102, 'mouse_down', {x:12,y:13,button:0}); assert.equal(scene().running, false);
        send(105, 'key_down', {key:'Space'}); assert.equal(scene().running, true);
        send(105.5, 'frame'); check(5.5, 35);
        send(105.75, 'frame'); check(5.75, 50);
        send(106, 'key_down', {key:'Space'});
        send(106.25, 'frame'); check(6.25, 80);
        send(111.25, 'frame'); check(11.25, 100);
    } else if (name === '如观不可变缓存') {
        const event = scene();
        assert.deepEqual(event.commands.map(c => c.op), ['background','image','image']);
        const [first, second] = event.commands.slice(1);
        assert.deepEqual([first.x,first.y,second.x,second.y], [20,20,0,0]);
        assert.equal(first.resource, second.resource);
        assert.equal(event.resources.length, 1);
        const resource = event.resources[0];
        assert.deepEqual([resource.width,resource.height], [80,60]);
        assert.equal(resource.commands[0].op, 'rect');
        assert.equal(resource.commands[0].fill, '#4677ff80');
        const expected = [Math.cos(0.3),Math.sin(0.3),-Math.sin(0.3),Math.cos(0.3),180,80];
        second.transform.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-12));
    } else if (name === '如观形状变换') {
        const c = scene().commands;
        assert.deepEqual(c.map(c => c.op), ['background','polygon','polygon']);
        assert.deepEqual(c[1].points, [[-50,30],[0,-50],[50,30]]);
        assert.deepEqual(c[1].clips, [{x:20,y:20,width:280,height:200,transform:[1,0,0,1,0,0]}]);
        const expected = [Math.cos(0.3)*1.2,Math.sin(0.3)*1.2,-Math.sin(0.3)*0.8,Math.cos(0.3)*0.8,160,120];
        for (const command of c.slice(1))
            command.transform.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-12));
    } else if (name === '如观动画交互') {
        send(101, 'frame'); assert.deepEqual(scene().commands.map(c => c.op), ['background','ellipse']);
        send(102, 'mouse_down', {x:12,y:13,button:0}); assert.equal(scene().running, false);
    } else if (name === '如观弧与扇形') {
        const c = scene().commands;
        assert.deepEqual(c.map(c => c.op), ['background','sector','arc']);
        const [sector, arc] = c.slice(1);
        assert.deepEqual([sector.x,sector.y,sector.width,sector.height,sector.start,sector.sweep], [20,30,120,120,-Math.PI/2,Math.PI/2]);
        assert.deepEqual([arc.x,arc.y,arc.width,arc.height,arc.start,arc.sweep], [200,30,120,120,0,-Math.PI*1.5]);
        assert.equal(sector.fill, '#ffb34780'); assert.equal(arc.fill, '');
        for (const command of [sector, arc]) {
            assert.equal(command.stroke, '#25344a'); assert.equal(command.stroke_width, 4);
            assert.deepEqual(command.transform ?? [1,0,0,1,0,0], [1,0,0,1,0,0]); assert.deepEqual(command.clips ?? [], []);
        }
    } else if (name === '如观折线') {
        const c = scene().commands;
        assert.deepEqual(c.map(c => c.op), ['background','polyline','polyline','rect']);
        assert.deepEqual(c[1].points, [[20,130],[100,40],[200,110],[300,50]]);
        assert.deepEqual(c[2].points, [[20,130],[100,80],[200,110],[300,50]]);
        assert.equal(c[1].stroke, '#4677ff80'); assert.equal(c[2].stroke, '#25865d');
        assert.equal(c[1].fill, ''); assert.equal(c[2].fill, '');
        assert.equal(c[1].stroke_width, 4); assert.equal(c[2].stroke_width, 4);
        assert.equal(c[3].fill, '#ffb34780');
    } else if (name === '如观贝塞尔') {
        const c = scene().commands;
        assert.deepEqual(c.map(c => c.op), ['background','polyline','bezier','bezier']);
        const [guide, upper, lower] = c.slice(1);
        assert.deepEqual(guide.points, [[20,140],[80,20],[240,20],[300,140]]);
        assert.equal(guide.stroke, '#a0a8b880'); assert.equal(guide.stroke_width, 2);
        const coordinates = c => ['x1','y1','cx1','cy1','cx2','cy2','x2','y2'].map(k => c[k]);
        assert.deepEqual(coordinates(upper), [20,140,80,20,240,20,300,140]);
        assert.deepEqual(coordinates(lower), [20,140,80,200,240,200,300,140]);
        assert.equal(upper.stroke, '#4677ff'); assert.equal(lower.stroke, '#25865d');
        assert.equal(upper.fill, ''); assert.equal(lower.fill, '');
        assert.equal(upper.stroke_width, 4); assert.equal(lower.stroke_width, 4);
    } else {
        assert.equal(name, '如观绘图');
        assert.deepEqual(scene().commands.map(c => c.op), ['background','rect','rect','text']);
    }
    assert.deepEqual(events.filter(e => e.type === 'error'), [], 'No runtime error event');
}
