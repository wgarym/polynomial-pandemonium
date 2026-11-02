import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeLabels,intersects,type LabelBox} from '../src/labels.ts';
test('labels avoid each other and markers in dense and coincident features',()=>{
 const points=Array.from({length:19},(_,i)=>({x:350+(i%3)*5,y:180+(i%4)*3}));
 const boxes=placeLabels(points,800,390);
 assert.ok(boxes.every(Boolean));
 boxes.forEach((b,i)=>{
  assert.ok(b);assert.ok(b.x>=6&&b.y>=6&&b.x+b.width<=794&&b.y+b.height<=384);
  for(const other of boxes.slice(i+1))assert.ok(!intersects(b,other as LabelBox));
  for(const p of points)assert.ok(!intersects(b,{x:p.x-5,y:p.y-5,width:10,height:10}));
 });
});
test('edge labels stay inside the graph; offscreen labels are hidden',()=>{
 const boxes=placeLabels([{x:0,y:0},{x:800,y:390},{x:-10,y:5}],800,390);
 assert.ok(boxes[0]);assert.ok(boxes[1]);assert.equal(boxes[2],null);
});
test('feature labels avoid axis tick labels',()=>{
 const tick={x:100,y:100,width:45,height:18};
 const [label]=placeLabels([{x:110,y:120}],800,390,[tick]);
 assert.ok(label);assert.ok(!intersects(label,tick));
});
test('curve-aware placement keeps a minimum label close and clear of its curve',()=>{
 const curve=Array.from({length:101},(_,i)=>{const x=100+i*2;const y=220-(x-200)**2/100;return {x,y,width:2,height:2};});
 const [box]=placeLabels([{x:200,y:220}],800,390,curve);
 assert.ok(box);
 assert.ok(Math.hypot(box.x+box.width/2-200,box.y+box.height/2-220)<=24);
 assert.ok(curve.every(segment=>!intersects(box,segment)));
});
