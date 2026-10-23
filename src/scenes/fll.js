import { THREE, M, C, box, cylinder, coil, loop, wire, group, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, select, toggle, para, readouts, note, buttons } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { simulateFLL } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay } from './shared.js';
export default {
 id: 'fll', title: 'SQUID amplifiers & flux feedback', group: 'Component workbenches', icon: '↺', blurb: 'Voltage gain · integration · cancelling flux',
 create(ctx) {
  const { app, label } = ctx, root = new THREE.Group(), ex = new Exploder();
  box(root, [2.4, .055, 1.30], [.25, .03, 0], M.pcb());
  const divider = box(root, [.012, .35, 1.32], [-.62, .23, 0], color(C.ice, { transparent: true, opacity: .20 }));
  tagPart(divider, 'Cold / warm boundary', 'The SQUID operates at cryogenic temperature; voltage amplification and the feedback controller are warm electronics. This boundary is a diagram, not a physical thermal break design.');
  plaque(root, 'COLD SENSOR', [-.88, .08, .67], .42); plaque(root, 'WARM READOUT', [.48, .08, .67], .85);
  const squid = group(root, [-.92, .18, 0]);
  const sq = loop(squid, .115, [0, 0, 0], M.aluminium(), 'y', .012);
  for (const x of [-.115, .115]) box(squid, [.025, .025, .045], [x, 0, 0], color(C.orange));
  const feed = coil(squid, { radius: .15, height: .04, turns: 2, thickness: .007, center: [0, .08, 0], material: color(C.purple) });
  tagPart(squid, 'Biased SQUID & feedback winding', 'The residual flux creates a periodic electrical error. The feedback winding applies a cancelling flux to hold the sensor near its chosen operating point.');
  label(squid, 'SQUID + feedback', { offset: [0, .21, 0] });
  const preamp = moduleBox(root, 'VOLTAGE PREAMP', [-.30, .16, -.21], C.green, [.42, .08, .30]);
  ex.add(preamp, [0, .38, -.15], { name: 'Low-noise differential voltage preamplifier', info: 'The preamplifier measures the SQUID voltage difference. Input-referred voltage noise eₙ becomes equivalent flux noise eₙ / |VΦ|; increasing later gain does not remove that noise.' });
  const error = moduleBox(root, 'ERROR DETECTOR', [.25, .16, -.21], C.blue, [.42, .08, .30]);
  ex.add(error, [0, .45, -.1], { name: 'Signed error detector', info: 'A modulation/demodulation or direct-readout scheme produces signed flux error. This simulation uses a sinusoidal periodic error law, not a proprietary SQUID controller.' });
  const integrator = group(root, [.83, .17, -.21]);
  box(integrator, [.42, .08, .30], [0, 0, 0], M.pcb()); box(integrator, [.12, .07, .10], [0, .06, 0], M.black()); plaque(integrator, 'RC INTEGRATOR', [0, .06, .16], .40);
  const cap = group(integrator, [0, .16, -.10]);
  const plate1 = box(cap, [.16, .008, .11], [0, 0, 0], M.aluminium());
  const dielectric = box(cap, [.16, .012, .11], [0, .012, 0], color(C.orange));
  const plate2 = box(cap, [.16, .008, .11], [0, .024, 0], M.aluminium());
  for (const [obj, offset, name, info] of [[plate1,[0,.1,0],'Integrator capacitor electrode','One capacitor electrode stores charge.'],[dielectric,[0,.2,0],'Capacitor dielectric','The insulating dielectric separates the electrodes. No DC conduction crosses it in the ideal capacitor model.'],[plate2,[0,.3,0],'Second capacitor electrode','The voltage changes as feedback current accumulates charge: I = C dV/dt.']]) ex.add(obj, offset, { name, info });
  tagPart(integrator, 'Feedback integrator', 'An op-amp integrator accumulates error on its feedback capacitor. The controller changes its output until the net flux error is small. Its sign must give negative feedback.');
  label(integrator, 'Integrator capacitor', { offset: [0, .38, -.1] });
  const rfb = group(root, [.81, .15, .36]); const resistor = box(rfb, [.23, .065, .08], [0, 0, 0], M.resistorBody());
  for (const x of [-.20, .20]) wire(rfb, [[x, 0, 0], [Math.sign(x) * .11, 0, 0]], M.gold(), .008);
  tagPart(rfb, 'Feedback resistor Rfb', 'For a voltage-driven feedback coil, I_fb ≈ Vout/Rfb, so the cancelling flux is Mfb Vout/Rfb. Calibrating this relation converts controller output to external flux.'); label(rfb, 'Rfb → feedback current', { offset: [0, .14, 0] });
  wire(root, [[-.92, .17, -.10], [-.65, .17, -.24], [-.50, .17, -.24]], color(C.green), .008);
  for (const [x1,x2] of [[-.08,.03],[.47,.61]]) arrow(root, [x1,.21,-.20], [x2,.21,-.20], C.green, .007);
  wire(root, [[1.04,.20,-.20],[1.25,.20,-.20],[1.25,.15,.36],[1.0,.15,.36]], color(C.purple), .009);
  wire(root, [[.61,.15,.36],[-.92,.15,.36],[-.92,.26,.15]], color(C.purple), .009);
  const output = tagPart(cylinder(root, .025, .08, [1.25,.20,-.20], M.gold()), 'Calibrated output', 'When locked, the cancelling feedback follows changes in the input flux. Output sensitivity is set by feedback coupling and feedback resistance, not simply the voltage-preamp gain.');
  label(output, 'Read Vout', { offset: [0,.16,0] });
  let amplitude = .20, waveform = 'sine', bandwidth = 5, slew = 8, closed = true, noise = 4, transfer = 100, trace, playTime = 0, last = 0;
  const ros = readouts([{id:'residual',label:'Residual at end'}, {id:'branch',label:'Flux-period error'}, {id:'noise',label:'Preamp-equivalent flux noise',wide:true}]);
  const controls = card('Close the loop and challenge it');
  const aControl = slider({label:'Input flux amplitude',min:0,max:4,value:amplitude,unit:'Φ₀',onInput:v=>{amplitude=v;recalc();}});
  const waveControl = select({label:'Input waveform',value:waveform,options:[{value:'sine',label:'Slow sine · 0.5 Hz'},{value:'step',label:'Abrupt step at 0.6 s'},{value:'ramp',label:'Linear ramp after 0.6 s'}],onChange:v=>{waveform=v;recalc();}});
  controls.body.append(toggle({label:'Enable negative flux feedback',value:true,onChange:v=>{closed=v;recalc();}}).el,aControl.el,waveControl.el,slider({label:'Ideal small-signal loop bandwidth',min:.2,max:12,value:bandwidth,unit:'Hz',onInput:v=>{bandwidth=v;recalc();}}).el,slider({label:'Maximum feedback slew',min:.1,max:15,value:slew,unit:'Φ₀/s',onInput:v=>{slew=v;recalc();}}).el,buttons([{label:'Track a small step',onClick:()=>preset(.2)},{label:'Jump to a wrong flux period',onClick:()=>preset(1.2)}]).el,ros.el);
  function preset(a){amplitude=a;waveform='step';aControl.set(a);waveControl.set('step');recalc();}
  const plot = card('Input flux and reconstructed flux'); const chart = new Chart(plot.body,{height:190,xLabel:'Time (s)',yLabel:'Flux / Φ₀'});
  const plot2 = card('Residual flux at the SQUID'); const residualChart = new Chart(plot2.body,{height:155,xLabel:'Time (s)',yLabel:'Residual / Φ₀',legend:false});
  const amplifier = card('What does the amplifier add?', slider({label:'Input voltage-noise density eₙ',min:.5,max:10,value:noise,unit:'nV/√Hz',onInput:v=>{noise=v;noiseReadout();}}).el,slider({label:'SQUID voltage slope |VΦ|',min:20,max:200,value:transfer,unit:'µV/Φ₀',onInput:v=>{transfer=v;noiseReadout();}}).el,equation('SΦ,preamp½ = eₙ / |VΦ|'),para('The preamp increases voltage before error detection. The integrator stores the accumulated error; Rfb and the mutual inductance set the flux calibration.'),focusButtons(app,[['Voltage preamplifier',preamp],['Integrator & capacitor',integrator],['Feedback resistor',rfb]]));
  function noiseReadout(){ros.noise.set((noise*1000/transfer).toFixed(1)+' µΦ₀/√Hz');}
  function recalc(){
   trace=simulateFLL({amplitude,waveform,bandwidth,slew,closed});playTime=0;
   chart.setSeries([{name:'Input',x:trace.t,y:trace.input,color:'#d8923d'},{name:'Reconstruction (−feedback flux)',x:trace.t,y:trace.feedback,color:'#159b79'}]);
   residualChart.setSeries([{x:trace.t,y:trace.residual,color:'#8b73c5'}]);
   const r=trace.residual.at(-1),branch=Math.round(r);ros.residual.set(r.toFixed(4)+' Φ₀');ros.branch.set(closed?(branch===0?'0 · initial period':`${branch>0?'+':''}${branch} · wrong period`):'open loop',closed&&branch===0?'good':'warn');noiseReadout();
  }
  recalc();statusOverlay(ctx,'Flux-locked loop • negative feedback','Green = sensor voltage / reconstruction · purple = cancelling flux');
  return {root,exploder:ex,scale:2.5,camera:{position:[2.65,2.45,3.2],target:[.25,.17,0]},panel:[intro('The output is the cancelling command','The SQUID itself is periodic. A flux-locked loop keeps it near a working point by applying opposing flux. Follow the voltage preamp, error detector, capacitor integrator and feedback resistor.'),controls.el,plot.el,plot2.el,amplifier.el,card('Period ambiguity and model scope',equation('r = Φin/Φ₀ − q\ne(r) = sin(2πr)/(2π)\ndq/dt = 2πfc e(r)  [slew/range limited]'),note('A small periodic error can coexist with an incorrect integer flux count. Try the large-step preset. The toy loop has ±5 Φ₀ range and illustrative Hz-scale bandwidth; commercial FLLs can be much faster.'),jump('squid','Return to the two-junction sensor'),jump('lockin','Compare voltage amplification and lock-in detection')).el,evidence('SQUID voltage amplification, signed error detection, integration and mutually coupled flux feedback follow published SQUID readout architectures. Capacitor layers illustrate integration.', 'Board placement, capacitor dimensions and controller dynamics are original teaching models. Noise conversion includes only preamplifier voltage noise; SQUID noise, current noise, drift and modulation details are excluded.',[S.fll,S.squid])],update(dt,t){playTime=(playTime+dt*.6)%4;if(t-last>.15){chart.setMarks([{x:playTime,color:'#8395a8'}]);residualChart.setMarks([{x:playTime,color:'#8395a8'}]);last=t;}},dispose(){chart.dispose();residualChart.dispose();}};
 }
};
