export interface ScreenPoint { x:number; y:number; labelWidth?:number }
export interface LabelBox { x:number; y:number; width:number; height:number }
export function intersects(a:LabelBox,b:LabelBox,gap=3):boolean {
  return a.x < b.x+b.width+gap && a.x+a.width+gap > b.x && a.y < b.y+b.height+gap && a.y+a.height+gap > b.y;
}
/** Place short labels in screen pixels, avoiding other labels, markers and edges. */
export function placeLabels(points:ScreenPoint[],width:number,height:number,obstacles:LabelBox[]=[]): (LabelBox|null)[] {
  const occupied:LabelBox[]=[...obstacles], markers=points.map(p=>({x:p.x-5,y:p.y-5,width:10,height:10}));
  return points.map(p=>{
    if(p.x<0||p.y<0||p.x>width||p.y>height)return null;
    for(let radius=16;radius<Math.max(width,height);radius+=4) {
      const candidates=Array.from({length:16},(_,i)=>{const angle=-Math.PI/2+i*Math.PI/8;return [radius*Math.cos(angle),radius*Math.sin(angle)];});
      for(const [dx,dy] of candidates) {
        const labelWidth=p.labelWidth??24;
        const box={x:p.x+dx-labelWidth/2,y:p.y+dy-8,width:labelWidth,height:16};
        if(box.x<6||box.y<6||box.x+box.width>width-6||box.y+box.height>height-6)continue;
        if(occupied.some(other=>intersects(box,other))||markers.some(other=>intersects(box,other)))continue;
        occupied.push(box);return box;
      }
    }
    return null;
  });
}
