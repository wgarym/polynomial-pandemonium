import {factoredEquation} from './equation';
self.onmessage=({data})=>{
 try {self.postMessage({id:data.id,text:factoredEquation(data.state,data.precision)});}
 catch {self.postMessage({id:data.id,text:'Factored form unavailable for these coefficients.'});}
};
