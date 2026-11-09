import nerdamer from 'nerdamer';
import {realRoots} from './features';
import {equation,type State,type Bounds} from './model';
const superscripts='⁰¹²³⁴⁵⁶⁷⁸⁹';
export function expandedEquation(state:State):string {
 return 'f(x) = '+state.coefficients.slice(0,state.degree+1).map((a,i)=>({a,i})).reverse().map(({a,i},j)=>(a<0?(j?' − ':'−'):(j?' + ':''))+Math.abs(a)+'x'+superscripts[i]).join('');
}
export function scaleBounds(bounds:Bounds,factor:number,x:boolean,y:boolean):Bounds {
 return [bounds[0]*(x?factor:1),bounds[1]*(y?factor:1),bounds[2]*(x?factor:1),bounds[3]*(y?factor:1)];
}
function pretty(s:string):string {
 return s.replace(/(\d+)\^\(1\/2\)/g,'√($1)').replace(/\^(\d+)/g,(_,power:string)=>[...power].map(n=>superscripts[Number(n)]).join('')).replace(/sqrt\(/g,'√(').replace(/\*/g,'·').replace(/-/g,'−');
}
export function factoredEquation(state:State,precision?:number):string {
 const source=state.coefficients.slice(0,state.degree+1).map((a,i)=>`(${a})*x^${i}`).join('+');
 if(state.coefficients.every(a=>a===0))return '= 0';
 const parts=nerdamer(`polyfactors(${source})`).text().slice(1,-1).split(',').map(s=>s.trim());
 let approximate=false;
 const rounded=(value:number):string=>{
   if(precision===undefined)return String(value);
   const result=Number(value.toFixed(Math.max(0,Math.min(6,precision))));
   if(result!==value)approximate=true;
   return String(Object.is(result,-0)?0:result);
 };
 const numericLinear=(root:number)=>{
   const magnitude=rounded(Math.abs(root));
   return magnitude==='0'?'x':`(x ${root<0?'+':'−'} ${magnitude})`;
 };
 const numericPolynomial=(c:number[])=>equation({...state,degree:c.length-1,coefficients:c.map(v=>Number(rounded(v)))}).slice(7);
 let scalar='1';
 const collectScalar=(value:string|number)=>{scalar=nerdamer(`(${scalar})*(${value})`).text();};
 const factors=parts.map(part=>{
   const c=nerdamer(`coeffs(${part},x)`).text().slice(1,-1).split(',').map(s=>Number(nerdamer(s).evaluate().text({decimal:true,precision:17})));
   if(c.length===1){collectScalar(part);return '';}
   if(c.length===2)collectScalar(c[1]);
   if(c.length===2 && precision!==undefined)return numericLinear(-c[0]/c[1]);
   if(c.length===2) {
     const root=nerdamer(`-(${c[0]})/(${c[1]})`).text();
     const term=c[0]===0?'x':`(x ${c[0]/c[1]<0?'−':'+'} ${pretty(root.replace(/^\-/,''))})`;
     return term;
   }
   if(precision===undefined && /^(?:x|\(.+\))\^\d+$/.test(part))return pretty(part);
   if(c.length===3) {
     const [a0,b,a]=c, d=b*b-4*a*a0;
     if(d>=0)collectScalar(a);
     if(d>=0 && precision!==undefined) {
       const plus=(-b+Math.sqrt(d))/(2*a),minus=(-b-Math.sqrt(d))/(2*a);
       return numericLinear(plus)+(d===0?'²':'·'+numericLinear(minus));
     }
     if(d>=0) {
       const plus=nerdamer(`(-(${b})+sqrt((${b})^2-4*(${a})*(${a0})))/(2*(${a}))`).text();
       const minus=nerdamer(`(-(${b})-sqrt((${b})^2-4*(${a})*(${a0})))/(2*(${a}))`).text();
       const linear=(root:string)=>root==='0'?'x':`(${pretty(nerdamer(`x-(${root})`).text())})`;
       return linear(plus)+(d===0?'²':'·'+linear(minus));
     }
   }
   // Keep exact rational factors whenever possible; otherwise expose real factors numerically.
   if(c.length>3) {
     const roots=realRoots(c);
     if(roots.length) {
       let remaining=[...c];const linear:string[]=[];
       for(const root of roots) {
         while(remaining.length>1) {
           const quotient=Array(remaining.length-1).fill(0);quotient[quotient.length-1]=remaining.at(-1)!;
           for(let i=quotient.length-2;i>=0;i--)quotient[i]=remaining[i+1]+root*quotient[i+1];
           const residual=remaining[0]+root*quotient[0];
           const norm=remaining.reduce((sum,v,i)=>sum+Math.abs(v)*Math.abs(root)**i,0);
           if(Math.abs(residual)>1e-9*Math.max(1,norm))break;
           remaining=quotient;linear.push(precision!==undefined?numericLinear(root):root===0?'x':`(x ${root<0?'+':'−'} ${Math.abs(root).toPrecision(7).replace(/\.?0+$/,'')})`);
         }
       }
       if(linear.length) {
         approximate=true;
         if(remaining.length===1){collectScalar(remaining[0]);return linear.join('·');}
         const residualState={...state,degree:remaining.length-1,coefficients:remaining};
         const residual=precision===undefined?equation(residualState).slice(7):numericPolynomial(remaining);
         return linear.join('·')+(residual==='1'?'':`·(${residual})`);
       }
     }
   }
   return `(${precision===undefined?pretty(part):numericPolynomial(c)})`;
 });
 const terms=factors.filter(Boolean);
 const scalarText=precision===undefined?pretty(scalar):rounded(Number(nerdamer(scalar).evaluate().text({decimal:true,precision:17})));
 if(scalarText!=='1'||terms.length===0)terms.unshift(scalarText);
 return (approximate?'≈ ':'= ')+terms.join('·');
}
