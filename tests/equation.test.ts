import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expandedEquation,factoredEquation,scaleBounds} from '../src/equation.ts';
import {initialState,maxPoly} from '../src/model.ts';
const state=(c:number[])=>({...initialState(),degree:c.length-1,coefficients:c.concat(Array(8-c.length).fill(0))});
test('expanded display preserves zero terms and explicit powers',()=>{
 assert.equal(expandedEquation(state([0,-1,0,1])),'f(x) = 1x³ + 0x² − 1x¹ + 0x⁰');
});
test('independent axes scale around origin and leave unselected bounds unchanged',()=>{
 assert.deepEqual(scaleBounds([-10,8,6,-4],.5,true,false),[-5,8,3,-4]);
 assert.deepEqual(scaleBounds([-10,8,6,-4],2,false,true),[-10,16,6,-8]);
 assert.deepEqual(scaleBounds([-10,8,6,-4],2,false,false),[-10,8,6,-4]);
});
test('factoring handles zero, constants, repeated and irrational quadratic factors',()=>{
 assert.equal(factoredEquation(state([0])),'= 0');
 assert.equal(factoredEquation(state([5])),'= 5');
 assert.match(factoredEquation(state([1,-2,1])),/²/);
 assert.match(factoredEquation(state([-2,0,1])),/√\(2\)/);
 assert.match(factoredEquation(state([1,0,1])),/1\+x²/);
 assert.match(factoredEquation(state([-.2,0,.1])),/1\/10|0\.1/);
});
test('Max Poly yields seven exact linear factors',()=>{
 const s=initialState();s.degree=7;maxPoly(s);
 const expression=factoredEquation(s);
 assert.ok(expression.startsWith('= '));assert.equal((expression.match(/x/g)||[]).length,7);
});
test('factored precision rounds roots without changing coefficients',()=>{
 const s=state([-2,0,1]),original=[...s.coefficients];
 assert.equal(factoredEquation(s,1),'≈ (x − 1.4)·(x + 1.4)');
 assert.equal(factoredEquation(s,3),'≈ (x − 1.414)·(x + 1.414)');
 assert.deepEqual(s.coefficients,original);
 assert.equal(factoredEquation(state([-2,1]),1),'= (x − 2)');
});
test('factored display combines scalar factors before rounding',()=>{
 assert.equal(factoredEquation(state([-9.1,1.4]),1),'= 1.4·(x − 6.5)');
 assert.equal(factoredEquation(state([-9.1,1.4]),0),'≈ (x − 7)');
 assert.equal(factoredEquation(state([9.1,-1.4]),1),'= -1.4·(x − 6.5)');
});
