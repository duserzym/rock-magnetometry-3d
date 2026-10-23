import { describe, it, expect } from 'vitest';
import { MU0, PHI0, loopFieldX, axialLoopCoupling, vsmCoupling, vsmVoltage, gradiometerCoupling, gradiometerContributions, transformerFlux, dcSquid, simulateFLL, simulateLockin, lockinComponents, rotateMoment, linspace } from '../src/physics/magnetometry.js';

describe('Coil reciprocity and dipole detection', () => {
 it('reproduces the analytic on-axis circular-loop field', () => {
  for (const x of [0, .007, .04]) {
   const b = loopFieldX([x,0,0],[0,0,0],.012);
   expect(b[0] / axialLoopCoupling(x,.012)).toBeCloseTo(1,10);
   expect(Math.abs(b[1])+Math.abs(b[2])).toBeLessThan(1e-17);
  }
 });
 it('differential VSM flux is odd with a nonzero slope at center', () => {
  expect(Math.abs(vsmCoupling(0))).toBeLessThan(1e-16);
  expect(vsmCoupling(.003)).toBeGreaterThan(0);
  expect(vsmCoupling(-.003)).toBeCloseTo(-vsmCoupling(.003),12);
 });
 it('has no VSM emf at rest, and scales linearly with moment and frequency', () => {
  expect(vsmVoltage(0,{frequency:0})).toBeCloseTo(0,15);
  expect(vsmVoltage(0,{amplitude:0})).toBeCloseTo(0,15);
  const v = vsmVoltage(0,{frequency:40});
  expect(vsmVoltage(0,{frequency:80})/v).toBeCloseTo(2,10);
  expect(vsmVoltage(0,{frequency:40,moment:2e-5})/v).toBeCloseTo(2,10);
 });
 it('preserves a static superconducting flux response and an even axial profile', () => {
  expect(gradiometerCoupling(0)).not.toBe(0);
  expect(gradiometerCoupling(.008)).toBeCloseTo(gradiometerCoupling(-.008),14);
 });
 it('rejects uniform fields and linear gradients for ideal +1:-2:+1 windings', () => {
  const n=[1,-2,1], y=[-.015,0,.015];
  for(const [b0,gradient] of [[3e-6,0],[0,.001],[2e-6,-.001]]) expect(n.reduce((s,v,i)=>s+v*(b0+gradient*y[i]),0)).toBeCloseTo(0,20);
 });
 it('centered SQUID-VSM has zero first harmonic but nonzero second harmonic', () => {
  const phase=linspace(0,1,1001).slice(0,-1);
  const harmonic=(center,n)=>phase.reduce((s,p)=>s+gradiometerCoupling(center+.002*Math.sin(2*Math.PI*p))*Math.cos(n*2*Math.PI*p),0)*2/phase.length;
  const first=phase.reduce((s,p)=>s+gradiometerCoupling(.002*Math.sin(2*Math.PI*p))*Math.sin(2*Math.PI*p),0)*2/phase.length;
  expect(Math.abs(first)).toBeLessThan(1e-18);expect(Math.abs(harmonic(0,1))).toBeLessThan(1e-18);expect(Math.abs(harmonic(0,2))).toBeGreaterThan(1e-6);
  const offCenter=phase.reduce((s,p)=>s+gradiometerCoupling(.003+.002*Math.sin(2*Math.PI*p))*Math.sin(2*Math.PI*p),0)*2/phase.length;
  expect(Math.abs(offCenter)).toBeGreaterThan(1e-6);
 });
 it('transfers pickup flux with the superconducting screening-current sign', () => {
  const a=transformerFlux(1e-12,1e-6,1e-6,1e-8);
  expect(a.current).toBeCloseTo(-5e-7,14);expect(a.squidFlux).toBeCloseTo(-5e-15,22);
 });
});

describe('SQUID interference and feedback', () => {
 it('uses the exact SI Josephson flux quantum',()=>expect(PHI0).toBeCloseTo(2.0678338484619295e-15,27));
 it('has one-flux-quantum periodicity, maximum Ic at integers and zero at half integers',()=>{
  expect(dcSquid(0).critical).toBeCloseTo(1e-5,14);expect(dcSquid(.5).critical).toBeLessThan(1e-19);
  for(const p of [-.3,.12,.77])expect(dcSquid(p).voltage).toBeCloseTo(dcSquid(p+1).voltage,14);
 });
 it('tracks a small step in the initial flux period',()=>{
  const r=simulateFLL({waveform:'step',amplitude:.2});expect(r.feedback.at(-1)).toBeCloseTo(.2,8);expect(r.lost).toBe(false);
 });
 it('demonstrates an undetected integer-period error after a large step',()=>{
  const r=simulateFLL({waveform:'step',amplitude:1.2});expect(r.residual.at(-1)).toBeCloseTo(1,8);expect(Math.abs(r.error.at(-1))).toBeLessThan(1e-10);expect(r.lost).toBe(true);
 });
 it('keeps feedback at zero in open loop',()=>{
  const r=simulateFLL({closed:false,amplitude:.3});expect(r.feedback.every(x=>x===0)).toBe(true);expect(r.residual).toEqual(r.input);
 });
});

describe('Signal amplification and dual-phase detection',()=>{
 it('uses RMS I/Q components and preserves phase-independent magnitude',()=>{
  for(const phase of [-90,0,35,90,160]){const r=lockinComponents(2,phase);expect(Math.hypot(r.x,r.y)).toBeCloseTo(2,12);}
  expect(lockinComponents(2,90).x).toBeCloseTo(0,12);expect(lockinComponents(2,90).y).toBeCloseTo(2,12);
 });
 it('rejects a larger off-frequency tone after finite-time filtering',()=>{
  const r=simulateLockin({rms:1,phase:35,interference:5,tau:.1});
  const mean=a=>a.slice(-166).reduce((s,v)=>s+v,0)/166, expected=lockinComponents(1,35);
  expect(mean(r.x)).toBeCloseTo(expected.x,2);expect(mean(r.y)).toBeCloseTo(expected.y,2);expect(r.clipped).toBe(false);
 });
 it('reports clipping before demodulation for an overloaded preamplifier',()=>{
  expect(simulateLockin({gain:10000,interference:20}).clipped).toBe(true);
 });
 it('preserves vector magnitude under sample rotation',()=>{
  const v=[.3,-.4,.8];for(const angle of [0,45,90,180,360])expect(Math.hypot(...rotateMoment(v,angle))).toBeCloseTo(Math.hypot(...v),14);
 });
});
