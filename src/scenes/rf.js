import { THREE, M, C, box, cylinder, coil, wire, group, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, para, readouts, note } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { linspace } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay } from './shared.js';
export default {
 id:'rf',title:'RF-SQUID readout',group:'Component workbenches',icon:'◉',blurb:'One weak link · 20 MHz tank · RF preamplifier',
 create(ctx){
  const {app,label}=ctx,root=new THREE.Group(),ex=new Exploder();
  // Illustrative amplifier enclosure; no specific product dimensions.
  const chassis=group(root);box(chassis,[1.36,.025,1.46],[0,.03,0]);
  for(const x of [-.66,.66])box(chassis,[.025,.483,1.46],[x,.284,0]);box(chassis,[1.36,.483,.025],[0,.284,-.70]);
  ex.add(chassis,[0,-.12,-.3],{name:'RF preamplifier enclosure',shell:true,info:'An illustrative metal enclosure surrounds the warm RF electronics. All proportions, wall thicknesses and board positions are teaching choices.'});
  const lid=box(root,[1.36,.025,1.46],[0,.55,0],M.aluminium());
  ex.add(lid,[0,.75,-.35],{name:'Preamplifier cover',shell:true,info:'The cover separates to reveal the functional RF signal path. Shape and motion are illustrative.'});
  const pcb=box(root,[1.20,.025,1.25],[0,.09,0],M.pcb());
  tagPart(pcb,'Functional RF readout board','This original diagram shows signal-processing blocks. Board dimensions, stage count and routing are illustrative.');
  const oscillator=moduleBox(root,'20 MHz OSC',[-.35,.17,-.38],C.purple,[.46,.07,.24]);tagPart(oscillator,'RF oscillator','An oscillator drives the coupled resonant tank. The initial 20 MHz carrier is a teaching value; slower demodulation and flux feedback occur downstream.');
  const tank=group(root,[-.34,.20,.10]);const inductor=coil(tank,{radius:.09,height:.17,turns:5,thickness:.008,axis:'z',material:M.copper()});
  const capacitor=group(tank,[.15,0,0]);box(capacitor,[.018,.14,.10],[0,0,0],M.aluminium());box(capacitor,[.018,.14,.10],[.045,0,0],M.aluminium());
  tagPart(tank,'Resonant LC tank','A high-Q tank couples inductively to the one-weak-link SQUID. SQUID dissipation changes the tank RF voltage. L, C and damping below are assumed teaching values.');label(tank,'LC tank ↔ SQUID',{offset:[0,.23,0]});
  const amplifiers=[];for(let i=0;i<4;i++){const a=moduleBox(root,'RF '+(i+1),[.28,.16,-.45+i*.22],C.green,[.36,.055,.16]);tagPart(a,'Wideband RF amplifier stage '+(i+1),'This example uses four RF gain stages after the tuned input. Stage count and gain allocation are illustrative. Input-referred amplifier noise contributes to readout noise.');amplifiers.push(a);}
  const detector=moduleBox(root,'ENVELOPE',[.18,.17,.48],C.orange,[.38,.07,.18]);tagPart(detector,'RF envelope detector','The envelope detector extracts amplitude changes from the RF carrier before a low-frequency output stage drives the cable to the feedback electronics.');
  const audio=moduleBox(root,'AUDIO DRIVER',[-.35,.17,.48],C.blue,[.38,.07,.18]);tagPart(audio,'Audio cable-driver amplifier','After envelope detection, a low-frequency amplifier buffers the signal for downstream processing. Its board position and circuit details are schematic.');
  wire(root,[[-.35,.20,-.25],[-.35,.20,-.03]],color(C.purple),.008);wire(root,[[-.18,.20,.1],[-.02,.20,.1],[-.02,.20,-.45],[.10,.20,-.45]],color(C.green),.008);
  for(let i=0;i<3;i++)wire(root,[[.28,.20,-.37+i*.22],[.28,.20,-.31+i*.22]],color(C.green),.007);
  wire(root,[[.28,.20,.30],[.28,.20,.40]],color(C.orange),.008);
  const cold=group(root,[-1.17,.22,.1]);const points=[];for(let i=0;i<=120;i++){const a=.16+i/120*(2*Math.PI-.32);points.push([.17*Math.cos(a),0,.17*Math.sin(a)]);}wire(cold,points,M.aluminium(),.025);
  const weak=box(cold,[.04,.018,.056],[.17,0,0],color(C.orange));tagPart(weak,'Single Josephson weak link','An RF SQUID is a superconducting loop interrupted by one weak link. This symbol does not reconstruct the mechanical contact or microscopic barrier of a particular sensor.');
  coil(cold,{radius:.20,height:.05,turns:2,thickness:.008,center:[0,.07,0],material:color(C.blue)});label(cold,'RF SQUID · one weak link',{offset:[0,.24,0]});
  wire(root,[[-.98,.28,.10],[-.80,.28,.10],[-.43,.28,.10]],color(C.blue),.008);
  tagPart(cold,'Cold RF-SQUID & coupling','RF excitation drives flux transitions in the one-weak-link superconducting loop. Input flux changes the tank response. The sensor and its resonant coupling are shown enlarged outside the warm preamp enclosure.');
  const console=moduleBox(root,'DEMOD / FLUX FEEDBACK',[1.10,.18,.10],C.purple,[.65,.16,.47]);tagPart(console,'Demodulation & feedback electronics','The console processes the preamplifier output with slower amplification, phase-sensitive detection, integration and feedback. The calibrated output follows cancelling feedback flux.');
  wire(root,[[-.01,.21,.48],[-.16,.21,.48]],color(C.orange),.009);
  wire(root,[[-.54,.21,.48],[-.54,.21,.82],[1.1,.21,.82],[1.1,.21,.33]],color(C.blue),.009);wire(root,[[1.1,.15,-.13],[1.1,.15,-.84],[-1.17,.15,-.84],[-1.17,.29,-.10]],color(C.purple),.009);
  plaque(root,'RF-SQUID ARCHITECTURE',[0,.025,.75],1.10);
  let flux=.25,capacitance=63.33,drive=20;
  const ros=readouts([{id:'f0',label:'Tank resonance f₀'},{id:'amplitude',label:'Normalized RF amplitude'}]);
  const controls=card('Tune the resonant readout');controls.body.append(slider({label:'Slow input flux (qualitative response)',min:0,max:2,value:flux,unit:'Φ₀',onInput:v=>{flux=v;recalc();}}).el,slider({label:'Illustrative tank capacitor C',min:30,max:100,value:capacitance,unit:'pF',onInput:v=>{capacitance=v;recalc();}}).el,slider({label:'RF drive frequency',min:15,max:25,value:drive,unit:'MHz',onInput:v=>{drive=v;recalc();}}).el,ros.el);
  const plot=card('RF tank tuning — phenomenological model');const chart=new Chart(plot.body,{height:185,xLabel:'Frequency (MHz)',yLabel:'RF amplitude (normalized)',legend:false});
  function recalc(){const f0=1/(2*Math.PI*Math.sqrt(1e-6*capacitance*1e-12))/1e6,q=30/(1+.25*(1-Math.cos(2*Math.PI*flux))),response=f=>(q/30)/Math.sqrt(1+q*q*(f/f0-f0/f)**2);const x=linspace(12,30,301);chart.setSeries([{x,y:x.map(response),color:'#d8953d'}]);chart.setMarks([{x:drive,color:'#9674c8',label:'drive'}]);ros.f0.set(f0.toFixed(3)+' MHz');ros.amplitude.set(response(drive).toFixed(3));}
  recalc();statusOverlay(ctx,'RF SQUID • resonant readout','One weak link. RF tank coupling. Four RF gain stages and envelope detection.');
  return{root,exploder:ex,defaults:{xray:true},scale:3.1,camera:{position:[3.25,2.7,4.3],target:[.10,.20,0]},panel:[intro('A different SQUID readout architecture','A one-junction SQUID couples to a resonant tank. This illustrative readout combines an RF oscillator, gain stages, envelope detector and low-frequency buffer, followed by demodulation and cancelling flux feedback.'),controls.el,plot.el,card('Inside the RF chain',focusButtons(app,[['Single weak link',cold],['LC resonator',tank],['RF amplifier stage',amplifiers[1]],['Envelope detector',detector]]),equation('f₀ = 1 / (2π√LC)'),note('The chart uses L = 1 µH and an assumed flux-periodic damping term. It demonstrates resonance and a flux-sensitive RF envelope; it does not solve the hysteretic RF-SQUID dynamics or predict a calibrated sensor transfer curve.'),jump('squid','Compare the two-junction DC SQUID'),jump('fll','Explore the cancelling feedback loop')).el,evidence('An RF SQUID has one Josephson weak link and couples inductively to an RF resonator. Flux-dependent loading can be read through changes in the resonator signal.', 'Enclosure dimensions, PCB placement, four gain stages, carrier frequency, L, C and flux-periodic loss are teaching choices. This diagram is a conceptual architecture rather than a particular instrument circuit.',[S.rf])],dispose(){chart.dispose();}};
 }
};
