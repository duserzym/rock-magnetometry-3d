import { THREE, M, C, box, cylinder, coil, wire, group, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, para, readouts, note } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { simulateLockin, lockinComponents } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay } from './shared.js';
function opamp(parent, pos, name) {
 const g = group(parent,pos), shape = new THREE.Shape(); shape.moveTo(-.07,-.06);shape.lineTo(.08,0);shape.lineTo(-.07,.06);shape.closePath();
 const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:false}),color(C.green));m.rotation.x=Math.PI/2;m.position.y=.022;g.add(m);
 plaque(g,name,[0,.08,.07],.15);return g;
}
export default {
 id:'lockin',title:'VSM preamplifier & lock-in',group:'Component workbenches',icon:'∿',blurb:'Differential gain · I/Q mixers · low-pass filters',
 create(ctx){
  const {app,label}=ctx,root=new THREE.Group(),ex=new Exploder();
  box(root,[2.7,.05,1.45],[.2,.03,0],M.pcb());
  const pickup=coil(root,{radius:.12,height:.07,turns:6,thickness:.008,center:[-.92,.20,0],axis:'x',material:M.copper()});
  tagPart(pickup,'Differential pickup voltage','The specimen motion generates a small AC voltage in a resistive pickup winding. The voltage amplifier senses a difference between its two inputs.');label(pickup,'Coil ε(t)',{offset:[0,.20,0]});
  const amplifier=group(root,[-.42,.15,0]);
  opamp(amplifier,[-.12,.04,-.17],'A1');opamp(amplifier,[-.12,.04,.17],'A2');opamp(amplifier,[.16,.04,0],'A3');
  const rg=tagPart(box(amplifier,[.055,.04,.14],[-.20,.06,0],M.resistorBody()),'Gain resistor Rg','For this three-op-amp example, matched feedback resistors R = 25 kΩ and a unity-gain difference stage give G = 1 + 2R/Rg = 1 + 50 kΩ/Rg. The first stage amplifies a differential input; the final difference stage rejects common-mode voltage.');
  for(const z of [-.17,.17]){box(amplifier,[.15,.035,.035],[.02,.06,z],M.resistorBody());wire(amplifier,[[-.19,.06,z],[-.26,.06,z],[-.26,.06,Math.sign(z)*.07]],M.gold(),.006);}
  wire(amplifier,[[-.05,.08,-.17],[.16,.08,-.17],[.16,.08,-.04]],color(C.green),.005);wire(amplifier,[[-.05,.08,.17],[.16,.08,.17],[.16,.08,.04]],color(C.green),.005);
  const cover=box(amplifier,[.56,.055,.49],[0,.17,0],color(0x273545,{transparent:true,opacity:.15}));
  ex.add(cover,[0,.55,0],{name:'Preamplifier package — ghosted',shell:true,info:'A functional three-op-amp diagram is shown under the package. It is not a die photograph or transistor layout.'});
  tagPart(amplifier,'Instrumentation voltage preamplifier','The two input amplifiers provide high input impedance. Differential gain precedes an ADC and the two phase-sensitive multipliers. Common-mode rejection is idealized in this signal model.');label(amplifier,'Voltage gain G',{offset:[0,.32,.05]});
  const mixI=moduleBox(root,'× √2 cos ωt',[.42,.15,-.29],C.blue,[.40,.08,.28]);
  const mixQ=moduleBox(root,'× −√2 sin ωt',[.42,.15,.29],C.orange,[.40,.08,.28]);
  tagPart(mixI,'In-phase multiplier','Multiplication shifts the component at the reference frequency to DC and to twice the reference frequency. Low-pass filtering retains the DC component. Unit-RMS references give input-referred RMS outputs.');tagPart(mixQ,'Quadrature multiplier','The reference is shifted by 90°. The filtered second output preserves a signal that would vanish from a single-phase detector at a 90° phase error.');
  const filterI=moduleBox(root,'LOW PASS → X',[1.02,.15,-.29],C.blue,[.40,.08,.28]);const filterQ=moduleBox(root,'LOW PASS → Y',[1.02,.15,.29],C.orange,[.40,.08,.28]);
  for(const [g,name]of [[filterI,'X'],[filterQ,'Y']])ex.add(g,[0,.35,name==='X'?-.15:.15],{name:name+' low-pass filter',info:'A first-order low-pass removes the rapidly oscillating product. Larger time constant reduces noise bandwidth but slows settling. The model implements the filter in the time domain.'});
  const reference=moduleBox(root,'DRIVE REFERENCE',[.12,.15,-.57],C.purple,[.48,.06,.18]);tagPart(reference,'Vibration reference','A reference coherent with sample motion sets the detection frequency and phase. The lock-in detects a Fourier component, rather than directly measuring all AC power.');
  wire(root,[[-.85,.20,0],[-.70,.20,-.17],[-.62,.20,-.17]],color(C.green),.007);wire(root,[[-.85,.17,0],[-.70,.17,.17],[-.62,.17,.17]],color(C.green),.007);
  wire(root,[[-.18,.22,0],[.12,.22,0],[.12,.22,-.29],[.22,.22,-.29]],color(C.blue),.007);wire(root,[[.12,.22,0],[.12,.22,.29],[.22,.22,.29]],color(C.orange),.007);
  for(const [z,hex]of [[-.29,C.blue],[.29,C.orange]])arrow(root,[.64,.22,z],[.80,.22,z],hex,.007);
  wire(root,[[.12,.18,-.57],[.42,.18,-.57],[.42,.18,-.40]],color(C.purple),.006);
  plaque(root,'VOLTAGE → MIX → AVERAGE',[.20,.04,.75],1.20);
  let rms=1,phase=35,interference=5,tau=.10,gain=1000,frequency=40,trace;
  const ros=readouts([{id:'x',label:'X · window mean'},{id:'y',label:'Y · window mean'},{id:'r',label:'√(X²+Y²)'},{id:'enbw',label:'Filter ENBW'},{id:'gain',label:'Gain resistor Rg'},{id:'clip',label:'Preamp output'}]);
  const controls=card('Detect a small coherent signal');
  controls.body.append(slider({label:'Signal amplitude at reference',min:0,max:5,value:rms,unit:'µV RMS',onInput:v=>{rms=v;recalc();}}).el,slider({label:'Signal phase relative to reference',min:-180,max:180,value:phase,unit:'°',onInput:v=>{phase=v;recalc();}}).el,slider({label:'Off-frequency interference at 137 Hz',min:0,max:20,value:interference,unit:'µV RMS',onInput:v=>{interference=v;recalc();}}).el,slider({label:'Voltage preamplifier gain',min:100,max:10000,value:gain,log:true,fmt:v=>v.toFixed(0)+' V/V',onInput:v=>{gain=v;recalc();}}).el,slider({label:'Low-pass time constant τ',min:.01,max:1,value:tau,log:true,fmt:v=>v.toFixed(3)+' s',onInput:v=>{tau=v;recalc();}}).el,ros.el);
  const plot=card('Mixing and settling');const chart=new Chart(plot.body,{height:190,xLabel:'Time (s)',yLabel:'Input-referred signal (µV RMS)'});
  const rawPlot=card('The input amplifier sees all of it');const rawChart=new Chart(rawPlot.body,{height:145,xLabel:'Time (s)',yLabel:'Input voltage (µV)',legend:false});
  function recalc(){
   trace=simulateLockin({rms,phase,interference,tau,gain,frequency});
   chart.setSeries([{name:'X',x:trace.t,y:trace.x,color:'#4894cf'},{name:'Y',x:trace.t,y:trace.y,color:'#ce8a32'}]);const ideal=lockinComponents(rms,phase);chart.setMarks([{y:ideal.x,color:'#4894cf',label:'ideal X'},{y:ideal.y,color:'#ce8a32',label:'ideal Y'}]);
   rawChart.setOptions({xMin:0,xMax:.10});rawChart.setSeries([{x:trace.t,y:trace.raw,color:'#9a74c7'}]);
   const indices=trace.t.map((t,i)=>t>=2.5?i:-1).filter(i=>i>=0);const avg=a=>indices.reduce((s,i)=>s+a[i],0)/indices.length;const x=avg(trace.x),y=avg(trace.y);
   ros.x.set(x.toFixed(3)+' µV');ros.y.set(y.toFixed(3)+' µV');ros.r.set(Math.hypot(x,y).toFixed(3)+' µV');ros.enbw.set((1/(4*tau)).toFixed(2)+' Hz');ros.gain.set((50000/(gain-1)).toFixed(2)+' Ω');ros.clip.set(trace.clipped?'CLIPPED ±10 mV':'within ±10 mV',trace.clipped?'bad':'good');
  }
  recalc();statusOverlay(ctx,'Coil voltage → preamp → I / Q → filters','40 Hz reference. All amplitudes and outputs use an explicit RMS convention.');
  return{root,exploder:ex,scale:2.8,camera:{position:[2.8,2.8,3.5],target:[.20,.18,0]},panel:[intro('Amplification and detection do different jobs','First amplify the differential coil voltage. Then multiply it by two coherent references and low-pass the products. Increase the interference or gain to see clipping distort the recovered signal.'),controls.el,plot.el,rawPlot.el,card('Follow the electronics',focusButtons(app,[['Three-op-amp input stage',amplifier],['Gain resistor',rg],['I multiplier',mixI],['Low-pass filter',filterI]]),equation('v = √2 Arms cos(ωt + θ)\nX = Arms cos θ   Y = Arms sin θ\nR = √(X² + Y²)   ENBW = 1/(4τ)'),para('Readouts average 2.5–3.0 s of the simulated output. Large τ may still be settling. Finite filtering leaves some off-frequency ripple; a lock-in cannot repair prior amplifier clipping.'),note('The interference is a deterministic tone, not a broadband noise simulation. The ±10 mV preamplifier limit is deliberately small to make overload visible. A centered axial SQUID magnetometer detects a leading 2f signal; this example is a conventional VSM-style signal at f.'),jump('vsm','Return to conventional VSM pickup coils'),jump('fll','Compare a SQUID flux-locked amplifier')).el,evidence('Dual-phase detection multiplies the signal by coherent quadrature references and averages the products. The generic three-op-amp stage uses matched resistor feedback to set differential gain.', 'The visible IC interior is a functional circuit diagram. Board placement, rails, gain range and filter implementation are teaching choices. The matched 25 kΩ feedback resistors and unity-gain difference stage are assumed circuit values.',[S.lockin,S.ina,S.vsm])],dispose(){chart.dispose();rawChart.dispose();}};
 }
};
