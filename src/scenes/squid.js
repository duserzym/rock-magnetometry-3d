import { THREE, M, C, box, cylinder, coil, loop, wire, group, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, para, readouts, note } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { linspace, dcSquid, PHI0 } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay } from './shared.js';
export default {
 id: 'squid', title: 'Inside a DC SQUID', group: 'Component workbenches', icon: 'φ', blurb: 'Two Josephson junctions · shunts · flux coupling',
 create(ctx) {
  const { app, label } = ctx, root = new THREE.Group(), ex = new Exploder();
  const substrate = tagPart(box(root, [1.30, .07, 1.05], [0, .06, 0], color(0x344d6a)), 'Chip substrate', 'An insulating substrate supports the superconducting thin-film circuit. The enlarged dimensions are illustrative; this is not a mask layout.');
  ex.add(substrate, [0, -.10, 0], { name: 'Insulating chip substrate', info: substrate.userData.part.info });
  const niobium = group(root, [0, .115, 0]);
  for (const z of [-.25, .25]) box(niobium, [.69, .025, .065], [0, 0, z], M.aluminium());
  for (const x of [-.31, .31]) for (const z of [-.155, .155]) box(niobium, [.065, .025, .15], [x, 0, z], M.aluminium());
  tagPart(niobium, 'Superconducting loop', 'Two Josephson weak links interrupt the loop. Flux quantization constrains their phase difference. The thin-film inductance is neglected in the response model.');
  const junctions = [];
  for (const x of [-.31, .31]) {
   const jj = group(root, [x, .14, 0]);
   const bottom = box(jj, [.09, .018, .16], [0, 0, .035], color(0xa2bfd4));
   const barrier = box(jj, [.075, .012, .065], [0, .018, 0], color(C.orange, { glow: .15 }));
   const top = box(jj, [.09, .018, .16], [0, .038, -.035], color(0xd4ecff));
   wire(jj, [[0, .047, -.11], [0, -.013, -.14]], M.aluminium(), .018);
   wire(jj, [[0, -.009, .11], [0, -.013, .14]], M.aluminium(), .018);
   ex.add(bottom, [0, .14, .03], { name: 'Lower superconducting electrode', info: 'A superconducting electrode on one side of a generic superconductor–insulator–superconductor tunnel junction.', order: .15 });
   ex.add(barrier, [0, .26, 0], { name: 'Tunnel barrier', info: 'The insulating barrier permits Josephson pair tunneling. Its visible thickness is greatly exaggerated; a real tunnel barrier is nanometres thick.', order: .25 });
   ex.add(top, [0, .40, -.03], { name: 'Upper superconducting electrode', info: 'The second superconducting electrode overlaps the first across the insulating barrier. The junction phase difference sets the supercurrent.', order: .35 });
   tagPart(jj, x < 0 ? 'Josephson junction J1' : 'Josephson junction J2', 'A generic SIS overlap junction, enlarged independently of the chip. Explode the assembly to separate both electrodes and the insulating barrier.');
   const r = box(root, [.05, .03, .18], [x + Math.sign(x) * .13, .14, 0], M.resistorBody());
   tagPart(r, 'Resistive junction shunt', 'A resistor wired in parallel with the junction damps phase dynamics. It helps avoid hysteretic switching; it is not the primary flux-to-voltage gain resistor.');
   wire(root, [[x, .12, -.16], [x + Math.sign(x) * .13, .14, -.16], [x + Math.sign(x) * .13, .14, -.09]], M.gold(), .008);
   wire(root, [[x + Math.sign(x) * .13, .14, .09], [x + Math.sign(x) * .13, .14, .16], [x, .12, .16]], M.gold(), .008);
   label(jj, x < 0 ? 'J1 · S / I / S' : 'J2 · S / I / S', { offset: [Math.sign(x) * .06, .16, .02] }); junctions.push(jj);
  }
  const input = coil(root, { radius: .215, height: .035, turns: 3, thickness: .008, center: [0, .25, 0], material: color(C.green) });
  ex.add(input, [0, .65, 0], { name: 'Input coupling coil', info: 'The pickup circuit carries current in an electrically separate input winding. Its magnetic flux couples into the SQUID loop; no direct wire injects the specimen signal into the junctions.' });
  label(input, 'Input coil', { offset: [0, .06, -.16] });
  const feedback = loop(root, .10, [0, .21, -.20], color(C.purple), 'y', .008);
  ex.add(feedback, [.42, .28, -.16], { name: 'Feedback winding', info: 'A calibrated feedback current supplies cancelling flux. The feedback path is distinct from the pickup input winding.' });
  label(feedback, 'Feedback', { offset: [0, .07, -.08] });
  for (const [x, z, txt] of [[-.55, .41, 'Ib+'], [.55, .41, 'V+'], [-.55, -.41, 'Ib−'], [.55, -.41, 'V−']]) {
   box(root, [.13, .015, .11], [x, .112, z], M.gold()); plaque(root, txt, [x, .20, z + .065], .16);
   wire(root, [[x, .12, z], [x * .6, .20, z * .8], [0, .13, Math.sign(z) * .25]], M.gold(), .005, true);
  }
  const fluxArrow = arrow(root, [0, .13, 0], [0, .65, 0], C.blue, .009);
  const amp = moduleBox(root, 'LOW-NOISE V INPUT', [1.02, .10, 0], C.green, [.50, .10, .37]);
  tagPart(amp, 'Voltage preamplifier', 'At constant current bias the SQUID voltage changes periodically with flux. A warm voltage preamplifier senses this voltage; a feedback loop supplies a wider linear measurement range.');
  wire(root, [[.55, .12, .41], [.82, .13, .41], [1.02, .16, .12]], color(C.green), .008);
  plaque(root, 'DC SQUID • TWO JUNCTIONS', [0, .02, .55], .84);
  let flux = .25, biasRatio = 2.2, shuntR = 10;
  const ros = readouts([{ id: 'phi', label: 'Applied loop flux' }, { id: 'ic', label: 'Critical current I꜀' }, { id: 'v', label: 'SQUID voltage' }, { id: 'phase', label: 'Phase difference δ₂ − δ₁' }]);
  const controls = card('Quantum interference → voltage');
  controls.body.append(slider({ label: 'Flux through SQUID loop', min: -1, max: 2, value: flux, unit: 'Φ₀', onInput: v => { flux = v; recalc(); } }).el, slider({ label: 'Bias current / single-junction I₀', min: 2.01, max: 3.5, value: biasRatio, onInput: v => { biasRatio = v; recalc(); } }).el, slider({ label: 'Shunt resistance per junction', min: 1, max: 20, value: shuntR, unit: 'Ω', onInput: v => { shuntR = v; recalc(); } }).el, ros.el, focusButtons(app, [['Junction J1 layers', junctions[0]], ['Junction J2 layers', junctions[1]], ['Input winding', input], ['Voltage preamp', amp]]));
  const plot = card('Periodic voltage–flux response'); const chart = new Chart(plot.body, { height: 190, xLabel: 'Applied flux / Φ₀', yLabel: 'SQUID voltage (µV)', legend: false });
  const text = card('Why two junctions?', equation('Iⱼ = I₀ sin δⱼ\nδ₂ − δ₁ = 2πΦ / Φ₀\nI꜀(Φ) = 2I₀ |cos(πΦ/Φ₀)|'), para('At integer flux quanta the two junction supercurrents can add. At half-integer flux quanta they interfere destructively in the ideal symmetric, low-inductance limit.'), equation('V ≈ (Rsh / 2) √[Ib² − I꜀(Φ)²]'), note('This is an overdamped RSJ approximation with negligible loop inductance, equal junctions and bias above 2I₀. It omits thermal noise, junction capacitance and phase dynamics. I₀ = 5 µA. Φ₀ = h/2e ≈ 2.068 × 10⁻¹⁵ Wb.'), jump('fll', 'How feedback removes the flux ambiguity'), jump('rf', 'Compare a one-junction RF SQUID'));
  function recalc() {
   const options = { biasRatio, shuntR }, r = dcSquid(flux, options), x = linspace(-1, 2, 301);
   chart.setSeries([{ x, y: x.map(p => dcSquid(p, options).voltage * 1e6), color: '#4c95ce', width: 2 }]); chart.setMarks([{ x: flux, color: '#d28b3b', label: 'applied' }]);
   ros.phi.set(flux.toFixed(3) + ' Φ₀'); ros.ic.set((r.critical * 1e6).toFixed(2) + ' µA'); ros.v.set((r.voltage * 1e6).toFixed(2) + ' µV'); ros.phase.set((flux * 2).toFixed(2) + ' π');
   fluxArrow.scale.y = .6 + Math.abs(flux) * .5;
  }
  recalc(); statusOverlay(ctx, 'DC SQUID • microscopic circuit enlarged', 'Explode reveals the two electrodes and barrier of each Josephson junction.');
  return { root, exploder: ex, scale: 1.8, camera: { position: [2.1, 2.35, 2.7], target: [.28, .18, 0] }, panel: [intro('A SQUID is a flux-to-voltage transducer', 'The superconducting loop is interrupted by two shunted Josephson junctions. Separate input and feedback windings couple magnetic flux into the loop. Follow the current-bias pads and voltage-sense pads.'), controls.el, plot.el, text.el, evidence('Two Josephson junctions, parallel resistive shunts, current bias, periodic voltage response and independent coupling coils follow published DC-SQUID circuit descriptions.', 'Generic thin-film arrangement. Junction layers, chip outline, wire bonds, coil dimensions and resistor placement are enlarged teaching geometry, not a commercial SQUID layout. No brand-specific chip materials are inferred.', [S.squid, S.jj])], dispose() { chart.dispose(); } };
 }
};
