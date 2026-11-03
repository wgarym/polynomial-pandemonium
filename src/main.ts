import JXG from 'jsxgraph';
import '../node_modules/jsxgraph/distrib/jsxgraph.css';
import './style.css';
import {initialState, setDegree, minPoly, maxPoly, evaluate, sliderLimit, equation, serialize, deserialize, standardBounds, type Bounds} from './model';
import {graphFeatures, fitBounds, groupFeatures, type FeatureKind} from './features';
import {placeLabels} from './labels';
import {expandedEquation,scaleBounds} from './equation';
let state = initialState();
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = (message: string) => { el('status').textContent=message; };
const board = JXG.JSXGraph.initBoard('board',{boundingbox: state.bounds,axis:true,grid:true,showCopyright:true,showNavigation:false,keepaspectratio:false,pan:{enabled:true,needShift:false},zoom:{needShift:false,wheel:false}});
// Disable user-coordinate simplification: unequal axis scales can erase visible bends.
board.create('functiongraph',[(x:number)=>evaluate(state,x)],{strokeColor:'#236c60',strokeWidth:3,highlight:false,RDPsmoothing:false,doAdvancedPlot:false,numberPointsHigh:4096,numberPointsLow:4096});
const featureColors: Record<FeatureKind,string> = {zeros:'#1769e0',extrema:'#8b1538',inflections:'#168039',intercept:'#ff7900'};
let markers: JXG.Point[] = [];
const labelLayer=document.createElement('div');labelLayer.className='feature-label-layer';el('board').append(labelLayer);
function updateFeatures() {
  labelLayer.replaceChildren();
  board.suspendUpdate();
  markers.forEach(point=>board.removeObject(point)); markers=[];
  const features=graphFeatures(state);
  const enabled=(Object.keys(featureColors) as FeatureKind[]).filter(kind=>el<HTMLInputElement>(`show-${kind}`).checked);
  const visible=groupFeatures(features,enabled);
  const screenPoints=visible.map(p=>({x:board.origin.scrCoords[1]+p.x*board.unitX,y:board.origin.scrCoords[2]-p.y*board.unitY,labelWidth:Math.max(24,p.label.length*8+4)}));
  const graphRect=el('board').getBoundingClientRect();
  const obstacles=Array.from(el('board').querySelectorAll<HTMLElement>('.JXGtext')).map(node=>{
    const rect=node.getBoundingClientRect();
    return {x:rect.left-graphRect.left,y:rect.top-graphRect.top,width:rect.width,height:rect.height};
  });
  // Reserve the actual curve in screen pixels, not just its feature markers.
  const bounds=board.getBoundingBox();
  let previousY:number|undefined;
  for(let x=0;x<=board.canvasWidth;x+=2) {
    const userX=bounds[0]+x/board.unitX;
    const y=board.origin.scrCoords[2]-evaluate(state,userX)*board.unitY;
    if(previousY!==undefined && Number.isFinite(y) && Number.isFinite(previousY)) {
      const top=Math.max(-10,Math.min(y,previousY)),bottom=Math.min(board.canvasHeight+10,Math.max(y,previousY));
      if(bottom>=top)obstacles.push({x:x-2,y:top,width:2,height:Math.max(1,bottom-top)});
    }
    previousY=y;
  }
  const labels=placeLabels(screenPoints,board.canvasWidth,board.canvasHeight,obstacles);
  const connectors=document.createElementNS('http://www.w3.org/2000/svg','svg');
  connectors.setAttribute('width','100%');connectors.setAttribute('height','100%');labelLayer.append(connectors);
  visible.forEach((point,i)=>{
    const box=labels[i], pixel=screenPoints[i];
    markers.push(board.create('point',[point.x,point.y],{name:point.label,fixed:true,size:3,strokeColor:featureColors[point.kinds[0]],fillColor:featureColors[point.kinds[0]],withLabel:false,highlight:false}));
    if(box) {
      const label=document.createElement('span');label.className='feature-label';label.textContent=point.label;
      label.style.left=`${box.x}px`;label.style.top=`${box.y}px`;label.style.width=`${box.width}px`;
      labelLayer.append(label);
      const endX=Math.max(box.x,Math.min(pixel.x,box.x+box.width));
      const endY=Math.max(box.y,Math.min(pixel.y,box.y+box.height));
      if(Math.hypot(endX-pixel.x,endY-pixel.y)>18) {
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        for(const [key,value] of Object.entries({x1:pixel.x,y1:pixel.y,x2:endX,y2:endY}))line.setAttribute(key,String(value));
        line.setAttribute('stroke',featureColors[point.kinds[0]]);line.setAttribute('stroke-width','1');line.setAttribute('opacity','.65');connectors.append(line);
      }
    }
  });
  const counts=(kind:FeatureKind)=>features.filter(p=>p.kind===kind).length;
  el('feature-summary').textContent=state.coefficients.every(v=>v===0) ? 'Zero polynomial: every x is a zero; no isolated zero markers.' : `${counts('zeros')} zeroes · ${counts('extrema')} extrema · ${counts('inflections')} inflection points`;
  board.unsuspendUpdate();
}
let factorWorker:Worker|undefined;
let factorTimer:ReturnType<typeof setTimeout>|undefined;
let factorId=0;
function updateEquation() {
  el('equation').textContent=el<HTMLInputElement>('simplify').checked?equation(state):expandedEquation(state);
  const output=el('factor-equation');output.hidden=!el<HTMLInputElement>('factored').checked;
  clearTimeout(factorTimer);factorWorker?.terminate();factorWorker=undefined;const id=++factorId;
  if(output.hidden)return;
  output.textContent='Factoring…';
  factorTimer=setTimeout(()=>{
    factorWorker=new Worker(new URL('./factor.worker.ts',import.meta.url),{type:'module'});
    const worker=factorWorker;
    const timeout=setTimeout(()=>{worker.terminate();if(id===factorId)output.textContent='Factoring timed out for these coefficients.';},5000);
    worker.onmessage=({data})=>{clearTimeout(timeout);worker.terminate();if(data.id===factorId)output.textContent=data.text;};
    worker.onerror=()=>{clearTimeout(timeout);worker.terminate();if(id===factorId)output.textContent='Unable to calculate factored form.';};
    worker.postMessage({id,state,precision:Number(el<HTMLInputElement>('precision').value)});
  },150);
}
el('precision').addEventListener('input',()=>{el('precision-value').textContent=el<HTMLInputElement>('precision').value;updateEquation();});
for(const id of ['simplify','factored'])el(id).addEventListener('change',updateEquation);
function updateGraph() {
  updateEquation();
  const actual=state.coefficients.findLastIndex(v=>v!==0);
  el('actual-degree').textContent=actual<0 ? 'Zero polynomial' : `Actual degree ${actual}`;
  updateFeatures();
  board.update();
}
function controls() {
  el<HTMLInputElement>('degree').value=String(state.degree);
  el('degree-value').textContent=String(state.degree);
  const limit=sliderLimit(state.degree);
  el('range-caption').textContent=`Sliders ±${Number(limit.toFixed(1))}`;
  el('coefficients').replaceChildren();
  for(let i=0;i<=state.degree;i++) {
    const row=document.createElement('div'); row.className='coefficient';
    row.innerHTML=`<label for="a${i}">a<sub>${i}</sub></label><input type="range" min="${-limit}" max="${limit}" step="0.1" aria-label="Coefficient a${i} slider"><input id="a${i}" type="number" step="any" aria-label="Coefficient a${i}">`;
    const range=row.querySelector<HTMLInputElement>('input[type=range]')!;
    const number=row.querySelector<HTMLInputElement>('input[type=number]')!;
    number.value=range.value=String(state.coefficients[i]);
    number.addEventListener('input',()=>{
      const value=number.valueAsNumber;
      if(!Number.isFinite(value)) {number.setCustomValidity('Enter a finite number.'); status('Enter a finite coefficient; the graph keeps the last valid value.'); return;}
      number.setCustomValidity(''); state.coefficients[i]=value; range.value=String(value); updateGraph(); status('Polynomial updated.');
    });
    range.addEventListener('input',()=>{state.coefficients[i]=Number(range.value);number.value=range.value;number.setCustomValidity('');updateGraph();status('Polynomial updated.');});
    el('coefficients').append(row);
  }
  updateGraph();
}
for(const kind of Object.keys(featureColors))el(`show-${kind}`).addEventListener('change',updateFeatures);
function fitView() { board.setBoundingBox(fitBounds(graphFeatures(state)),false); updateFeatures(); }
el('fit').addEventListener('click',()=>{fitView();status('View fitted to all graph features.');});
el('max-poly').addEventListener('click',()=>{
  maxPoly(state);
  for(const kind of Object.keys(featureColors))el<HTMLInputElement>(`show-${kind}`).checked=true;
  controls();fitView();status('Max Poly applied; all graph features shown and fitted.');
});
let labelFrame=0;
board.on('boundingbox',()=>{cancelAnimationFrame(labelFrame);labelFrame=requestAnimationFrame(updateFeatures);});
el('degree').addEventListener('input',()=>{setDegree(state,Number(el<HTMLInputElement>('degree').value));controls();status('Degree changed; higher coefficients cleared.');});
el('min-poly').addEventListener('click',()=>{minPoly(state);controls();status(`Min Poly applied: ${equation(state)}.`);});
el('standard').addEventListener('click',()=>{board.setBoundingBox([...standardBounds],false);status('Standard view restored.');});
function zoomSelected(factor:number) {
  const x=el<HTMLInputElement>('scale-x').checked,y=el<HTMLInputElement>('scale-y').checked;
  if(!x&&!y){status('Select X and/or Y to scale.');return;}
  const bounds=scaleBounds(board.getBoundingBox() as Bounds,factor,x,y);
  if(bounds.every(Number.isFinite) && bounds[2]>bounds[0] && bounds[1]>bounds[3])board.setBoundingBox(bounds,false);
  status(`Scaled ${x&&y?'X and Y':x?'X':'Y'} axis.`);
}
el('zoom-in').addEventListener('click',()=>zoomSelected(.5));
el('zoom-out').addEventListener('click',()=>zoomSelected(2));
el('board').addEventListener('wheel',event=>{event.preventDefault();zoomSelected(event.deltaY<0?.8:1.25);},{passive:false});
type SavePicker = (options:object)=>Promise<{name:string;createWritable:()=>Promise<{write:(data:string)=>Promise<void>;close:()=>Promise<void>}>}>;
const saveWindow=window as Window & {showSaveFilePicker?:SavePicker};
let saveText='';
let saveName='polynomial-pandemonium.json';
el('save').addEventListener('click',async()=>{
  state.bounds=board.getBoundingBox() as Bounds;
  saveText=serialize(state);
  const content=saveText;
  if(!saveWindow.showSaveFilePicker){
    el<HTMLInputElement>('save-name').value=saveName;el<HTMLDialogElement>('save-dialog').showModal();return;
  }
  try {
    const handle=await saveWindow.showSaveFilePicker({suggestedName:saveName,types:[{description:'Polynomial JSON',accept:{'application/json':['.json']}}]});
    const writable=await handle.createWritable();await writable.write(content);await writable.close();
    saveName=handle.name;status(`Saved ${saveName}.`);
  }catch(error){status(error instanceof DOMException && error.name==='AbortError'?'Save cancelled.':`Could not save: ${error instanceof Error?error.message:'Unknown error.'}`);}
});
el('save-cancel').addEventListener('click',()=>{el<HTMLDialogElement>('save-dialog').close();status('Save cancelled.');});
el('save-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=el<HTMLInputElement>('save-name');const name=input.value.trim();
  if(!name || /[\\/:*?"<>|]/.test(name)){input.setCustomValidity('Enter a filename without path separators or reserved characters.');input.reportValidity();return;}
  saveName=/\.json$/i.test(name)?name:name+'.json';
  const url=URL.createObjectURL(new Blob([saveText],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=saveName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  el<HTMLDialogElement>('save-dialog').close();status(`Download requested: ${saveName}.`);
});
el('save-name').addEventListener('input',()=>el<HTMLInputElement>('save-name').setCustomValidity(''));
el('open').addEventListener('click',()=>el<HTMLInputElement>('file').click());
el('file').addEventListener('change',async()=>{
  const input=el<HTMLInputElement>('file');const file=input.files?.[0];if(!file)return;
  try {
    if(file.size>100000)throw new Error('File is too large. Choose a trial JSON file under 100 KB.');
    const loaded=deserialize(await file.text());
    state=loaded;board.setBoundingBox(state.bounds,false);controls();status(`Opened ${file.name}.`);
  }catch(error){status(`Could not open: ${error instanceof Error?error.message:'Unreadable file.'}`);}
  finally{input.value='';}
});
controls();

// Fullscreen changes only layout: retain the board and all exploration state.
type FullscreenDocument = Document & {webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void | Promise<void>};
type FullscreenRoot = HTMLElement & {webkitRequestFullscreen?: () => void | Promise<void>};
const fullscreenDocument=document as FullscreenDocument;
const fullscreenRoot=document.documentElement as FullscreenRoot;
const fullscreenButton=el<HTMLButtonElement>('fullscreen');
let expandedFallback=false;
const isNativeFullscreen=()=>Boolean(document.fullscreenElement||fullscreenDocument.webkitFullscreenElement);
function syncFullscreen(){
  const native=isNativeFullscreen(),expanded=native||expandedFallback;
  const wasExpanded=fullscreenRoot.classList.contains('is-expanded');
  fullscreenRoot.classList.toggle('is-expanded',expanded);
  const label=expanded?(native?'Exit full screen':'Exit expanded view'):'Enter full screen';
  fullscreenButton.setAttribute('aria-label',label);
  fullscreenButton.setAttribute('aria-pressed',String(expanded));
  fullscreenButton.title=label;
  fullscreenButton.firstElementChild!.textContent=expanded?'↙':'⛶';
  if(wasExpanded&&!expanded)status('Standard layout restored.');
  if(expandedFallback)status('Expanded view (not native fullscreen). Use the lower-right exit button or Escape to return.');
}
fullscreenButton.addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(fullscreenDocument.webkitFullscreenElement)await fullscreenDocument.webkitExitFullscreen?.();
    else if(expandedFallback)expandedFallback=false;
    else if(fullscreenRoot.requestFullscreen)await fullscreenRoot.requestFullscreen();
    else if(fullscreenRoot.webkitRequestFullscreen)await fullscreenRoot.webkitRequestFullscreen();
    else expandedFallback=true;
  }catch{if(!isNativeFullscreen())expandedFallback=true;}
  syncFullscreen();
});
for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,syncFullscreen);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expandedFallback){expandedFallback=false;syncFullscreen();}});
let resizeFrame=0;
new ResizeObserver(()=>{
  cancelAnimationFrame(resizeFrame);
  resizeFrame=requestAnimationFrame(()=>{
    const bounds=board.getBoundingBox();
    board.resizeContainer(el('board').clientWidth,el('board').clientHeight,true);
    board.setBoundingBox(bounds,false);
    updateFeatures();
  });
}).observe(el('board'));
syncFullscreen();
