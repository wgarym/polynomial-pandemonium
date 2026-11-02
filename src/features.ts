import {type State, type Bounds} from './model';
export type FeatureKind = 'zeros' | 'extrema' | 'inflections' | 'intercept';
export interface Feature { kind: FeatureKind; x: number; y: number }
const value = (c: number[], x: number): number => c.reduceRight((y,a)=>y*x+a,0);
const derivative = (c: number[]): number[] => c.slice(1).map((a,i)=>a*(i+1));
function trim(c: number[]): number[] { const a=[...c]; while(a.length>1 && a.at(-1)===0)a.pop(); return a; }
const distinct = (xs: number[]): number[] => xs.sort((a,b)=>a-b).filter((x,i,a)=>i===0 || Math.abs(x-a[i-1])>1e-8*Math.max(1,Math.abs(x)));
/** Isolate roots on monotonic intervals split by derivative roots. Includes even multiplicities. */
export function realRoots(coefficients: number[]): number[] {
  const raw=trim(coefficients), scale=Math.max(...raw.map(Math.abs));
  if(raw.length<2 || scale===0)return [];
  const c=raw.map(a=>a/scale), n=c.length-1;
  if(n===1)return [-c[0]/c[1]].filter(Number.isFinite);
  // Cauchy's bound encloses all roots, independently of the current viewport.
  const bound=1+Math.max(...c.slice(0,-1).map(a=>Math.abs(a/c[n])));
  if(!Number.isFinite(bound))return [];
  const stationary=realRoots(derivative(c)).filter(x=>x>-bound&&x<bound);
  const cuts=[-bound,...stationary,bound];
  const nearZero=(x:number)=>Math.abs(value(c,x))<=1e-12*Math.max(Number.MIN_VALUE,value(c.map(Math.abs),Math.abs(x)));
  const roots=cuts.filter(nearZero);
  for(let i=1;i<cuts.length;i++) {
    let lo=cuts[i-1],hi=cuts[i],flo=value(c,lo),fhi=value(c,hi);
    if(nearZero(lo)||nearZero(hi)||Math.sign(flo)===Math.sign(fhi))continue;
    for(let j=0;j<200;j++) {
      const mid=lo+(hi-lo)/2,fmid=value(c,mid);
      if(mid===lo||mid===hi)break;
      if(fmid===0){lo=hi=mid;break;}
      if(Math.sign(fmid)===Math.sign(flo)){lo=mid;flo=fmid;}else{hi=mid;fhi=fmid;}
    }
    roots.push(lo+(hi-lo)/2);
  }
  return distinct(roots).filter(Number.isFinite);
}
function signChangingRoots(c:number[]):number[] {
  const roots=realRoots(c);
  return roots.filter((x,i)=>{
    const left=i>0 ? (roots[i-1]+x)/2 : x-Math.max(1,Math.abs(x));
    const right=i<roots.length-1 ? (x+roots[i+1])/2 : x+Math.max(1,Math.abs(x));
    return Math.sign(value(c,left))*Math.sign(value(c,right))<0;
  });
}
export function graphFeatures(state:State):Feature[] {
  const c=state.coefficients.slice(0,state.degree+1), d=derivative(c);
  return [
    ...realRoots(c).map(x=>({kind:'zeros' as const,x,y:0})),
    ...signChangingRoots(d).map(x=>({kind:'extrema' as const,x,y:value(c,x)})),
    ...signChangingRoots(derivative(d)).map(x=>({kind:'inflections' as const,x,y:value(c,x)})),
    {kind:'intercept' as const,x:0,y:c[0]},
  ].filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
}
/** Fit all mathematical features, even when their markers are hidden. */
export function fitBounds(features:Feature[]):Bounds {
  const xs=features.map(p=>p.x),ys=features.map(p=>p.y);
  const left=Math.min(0,...xs),right=Math.max(0,...xs);
  const bottom=Math.min(0,...ys),top=Math.max(0,...ys);
  const dx=Math.max(right-left,4),dy=Math.max(top-bottom,4);
  return [left-dx*.2,top+dy*.2,right+dx*.2,bottom-dy*.2];
}

export interface FeatureGroup { x:number; y:number; kinds:FeatureKind[]; label:string }
/** Merge numerically coincident enabled features, preserving per-kind numbering. */
export function groupFeatures(features:Feature[], enabled:FeatureKind[]):FeatureGroup[] {
  const names:Record<FeatureKind,string>={zeros:'Z',extrema:'E',inflections:'I',intercept:'Y'};
  const counts:Record<FeatureKind,number>={zeros:0,extrema:0,inflections:0,intercept:0};
  const groups:FeatureGroup[]=[];
  const close=(a:number,b:number)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
  for(const p of features) {
    const index=++counts[p.kind];
    if(!enabled.includes(p.kind))continue;
    const label=names[p.kind]+(p.kind==='intercept'?'':index);
    const group=groups.find(g=>close(g.x,p.x)&&close(g.y,p.y));
    if(group){group.kinds.push(p.kind);group.label+='='+label;}
    else groups.push({x:p.x,y:p.y,kinds:[p.kind],label});
  }
  return groups;
}
