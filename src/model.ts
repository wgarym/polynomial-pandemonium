export type Bounds = [number, number, number, number];
export interface State { degree: number; coefficients: number[]; bounds: Bounds }
export const standardBounds: Bounds = [-13.5, 8, 9, -6];
export const initialState = (): State => ({degree: 1, coefficients: [0,1,0,0,0,0,0,0], bounds: [...standardBounds]});
export function setDegree(state: State, degree: number): void {
  if (!Number.isInteger(degree) || degree < 0 || degree > 7) throw new Error('Degree must be an integer from 0 to 7.');
  state.degree = degree;
  state.coefficients.fill(0, degree + 1);
  if (state.coefficients[degree] === 0) state.coefficients[degree] = 1;
}
export function minPoly(state: State): void { state.coefficients.fill(0); state.coefficients[state.degree] = 1; }
export function evaluate(state: State, x: number): number {
  let y = 0;
  for (let i = state.degree; i >= 0; i--) y = y * x + state.coefficients[i];
  return y;
}
export function sourceQ(degree: number): number[] {
  // Source q always includes (x - 1), including at n = 0.
  let c = [-1,1];
  for (let i=2; i<=degree; i++) {
    const next = Array(c.length+1).fill(0) as number[];
    const constant = i % 2 === 0 ? i : -i;
    c.forEach((v,j) => {next[j] += constant*v; next[j+1] += v;});
    c = next;
  }
  return c;
}
export function sliderLimit(degree: number): number {
  return Math.min(144, 1.2 * Math.max(10,...sourceQ(degree).map(Math.abs)));
}
export function maxPoly(state: State): void {
  // button6 reads the first n+1 descending coefficients, including n=0.
  const descending=sourceQ(state.degree).reverse();
  state.coefficients.fill(0);
  for(let i=0;i<=state.degree;i++)state.coefficients[i]=descending[state.degree-i];
}
const powers = ['','x','x²','x³','x⁴','x⁵','x⁶','x⁷'];
export function equation(state: State): string {
  const terms: string[] = [];
  for(let i=state.degree;i>=0;i--) {
    const a=state.coefficients[i]; if(a===0) continue;
    const value=(i>0 && Math.abs(a)===1 ? '' : String(Math.abs(a)))+powers[i];
    terms.push((terms.length ? (a<0 ? ' − ' : ' + ') : (a<0 ? '−' : ''))+value);
  }
  return 'f(x) = '+(terms.join('') || '0');
}
export function serialize(state: State): string { return JSON.stringify({format:'polynomial-pandemonium',version:1,...state},null,2); }
export function deserialize(text: string): State {
  let s;
  try { s=JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  if(!s || s.format!=='polynomial-pandemonium' || s.version!==1) throw new Error('Choose a Polynomial Pandemonium version 1 JSON file.');
  if(!Number.isInteger(s.degree)||s.degree<0||s.degree>7) throw new Error('Invalid degree. Expected 0–7.');
  if(!Array.isArray(s.coefficients)||s.coefficients.length!==8||!s.coefficients.every((v: unknown)=>typeof v==='number'&&Number.isFinite(v))) throw new Error('Expected eight finite coefficients.');
  if(s.coefficients.slice(s.degree+1).some((v:number)=>v!==0)) throw new Error('Coefficients above the selected degree must be zero.');
  if(!Array.isArray(s.bounds)||s.bounds.length!==4||!s.bounds.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v))||s.bounds[0]>=s.bounds[2]||s.bounds[3]>=s.bounds[1]||!Number.isFinite(s.bounds[2]-s.bounds[0])||!Number.isFinite(s.bounds[1]-s.bounds[3])) throw new Error('Invalid graph bounds.');
  return {degree:s.degree,coefficients:[...s.coefficients],bounds:[...s.bounds] as Bounds};
}
