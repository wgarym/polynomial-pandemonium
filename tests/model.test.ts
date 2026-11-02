import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,setDegree,minPoly,evaluate,equation,sliderLimit,serialize,deserialize} from '../src/model.ts';
test('source degree script clears higher coefficients and initializes leading term',()=>{
 const s=initialState();setDegree(s,7);s.coefficients[6]=4;setDegree(s,2);
 assert.deepEqual(s.coefficients,[0,1,1,0,0,0,0,0]);setDegree(s,0);assert.equal(equation(s),'f(x) = 1');
});
test('Min Poly matches x^n for every supported degree',()=>{
 for(let n=0;n<=7;n++){const s=initialState();setDegree(s,n);s.coefficients.fill(4);minPoly(s);assert.equal(evaluate(s,-2),(-2)**n);assert.equal(s.coefficients.filter(v=>v!==0).length,1);}
});
test('Horner evaluation and equation handle negative, fractional and zero coefficients',()=>{
 const s=initialState();setDegree(s,3);s.coefficients=[-1,.5,0,-2,0,0,0,0];assert.equal(evaluate(s,2),-16);assert.equal(equation(s),'f(x) = −2x³ + 0.5x − 1');s.coefficients.fill(0);assert.equal(equation(s),'f(x) = 0');
});
test('slider range follows the source q coefficient formula',()=>{assert.equal(sliderLimit(0),12);assert.equal(sliderLimit(3),12);assert.ok(Math.abs(sliderLimit(4)-28.8)<1e-12);});
test('save/open preserves coefficients, selected degree and viewport, including zero leading coefficient',()=>{
 const s=initialState();setDegree(s,7);s.coefficients[7]=0;s.coefficients[3]=1.23456789;s.bounds=[-2,3,4,-5];assert.deepEqual(deserialize(serialize(s)),s);
});
test('invalid files are rejected before replacing active state',()=>{
 const base=JSON.parse(serialize(initialState()));
 for(const invalid of [null,{}, {...base,version:2},{...base,degree:8},{...base,coefficients:[1]},{...base,coefficients:[0,1,2,0,0,0,0,0]},{...base,bounds:[1,2,1,-2]},{...base,bounds:[0,1,2,null]}])assert.throws(()=>deserialize(JSON.stringify(invalid)));
 assert.throws(()=>deserialize('not JSON'));
});
