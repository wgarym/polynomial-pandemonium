import {test} from 'node:test';
import assert from 'node:assert/strict';
import {realRoots,graphFeatures,fitBounds} from '../src/features.ts';
import {initialState,sliderLimit} from '../src/model.ts';
const close=(actual:number[],expected:number[])=>{assert.equal(actual.length,expected.length);actual.forEach((x,i)=>assert.ok(Math.abs(x-expected[i])<1e-7,`${x} != ${expected[i]}`));};
const features=(c:number[])=>graphFeatures({...initialState(),degree:c.length-1,coefficients:c.concat(Array(8-c.length).fill(0))});
test('isolates simple, repeated and out-of-view real roots',()=>{
 close(realRoots([-6,11,-6,1]),[1,2,3]);
 close(realRoots([4,-4,1]),[2]);
 close(realRoots([-10000,0,1]),[-100,100]);
 close(realRoots([1,0,1]),[]);
 close(realRoots([0,0,0,0,0,0,0,1]),[0]);
});
test('distinguishes stationary inflections from extrema and excludes non-changing concavity',()=>{
 const cubic=features([0,0,0,1]);
 assert.equal(cubic.filter(p=>p.kind==='extrema').length,0);
 close(cubic.filter(p=>p.kind==='inflections').map(p=>p.x),[0]);
 const quartic=features([0,0,0,0,1]);
 close(quartic.filter(p=>p.kind==='extrema').map(p=>p.x),[0]);
 assert.equal(quartic.filter(p=>p.kind==='inflections').length,0);
});
test('cubic features and fit include all points with margins',()=>{
 const points=features([0,-3,0,1]);
 close(points.filter(p=>p.kind==='extrema').map(p=>p.x),[-1,1]);
 close(points.filter(p=>p.kind==='extrema').map(p=>p.y),[2,-2]);
 const b=fitBounds(points);
 for(const p of points)assert.ok(p.x>b[0]&&p.x<b[2]&&p.y>b[3]&&p.y<b[1]);
});
test('constant and zero polynomials yield usable fit and no isolated roots',()=>{
 for(const c of [[0],[144],[-144]]) {
   const points=features(c);assert.equal(points.length,1);
   const b=fitBounds(points);assert.ok(b.every(Number.isFinite));assert.ok(b[0]<b[2]&&b[3]<b[1]);
 }
});
test('slider ranges never exceed 144',()=>{
 for(let n=0;n<=7;n++)assert.ok(sliderLimit(n)<=144);
 assert.equal(sliderLimit(7),144);
});

test('Max Poly reproduces alternating integer roots with all extrema and inflections',async()=>{
 const {maxPoly,evaluate}=await import('../src/model.ts');
 for(let n=0;n<=7;n++) {
  const state=initialState();state.degree=n;maxPoly(state);
  if(n===0){assert.equal(evaluate(state,9),1);continue;}
  const expected=Array.from({length:n},(_,i)=>(i+1)*(i%2===0?1:-1)).sort((a,b)=>a-b);
  const points=graphFeatures(state);
  close(points.filter(p=>p.kind==='zeros').map(p=>p.x),expected);
  assert.equal(points.filter(p=>p.kind==='extrema').length,n-1);
  assert.equal(points.filter(p=>p.kind==='inflections').length,Math.max(0,n-2));
 }
});

test('coincident feature labels combine and respect visibility',async()=>{
 const {groupFeatures}=await import('../src/features.ts');
 const points=features([0,0,1]);
 const groups=groupFeatures(points,['zeros','extrema','inflections','intercept']);
 assert.equal(groups.length,1);assert.equal(groups[0].label,'Z1=E1=Y');
 assert.equal(groupFeatures(points,['zeros','extrema'])[0].label,'Z1=E1');
 assert.equal(groupFeatures(points,['extrema'])[0].label,'E1');
 assert.equal(groupFeatures(features([0,0,0,1]),['zeros','inflections','intercept'])[0].label,'Z1=I1=Y');
 assert.equal(groupFeatures(features([-1,0,1]),['zeros','extrema']).length,3);
});
