import { THREE, M, C, box, cylinder, sleeve, coil, wire, group, rock, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, select, toggle, para, readouts, note, table } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { linspace, vsmContributions, gradiometerContributions, gradiometerCoupling, transformerFlux, PHI0 } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay } from './shared.js';
export default {
 id: 'pickups', title: 'Pickup coils & flux transformer', group: 'Component workbenches', icon: '≋', blurb: 'Winding polarity, coupling and field rejection',
 create(ctx) {
  const { app, label } = ctx, root = new THREE.Group(), ex = new Exploder();
  const axial = group(root), copper = group(root); copper.visible = false;
  const coilParts = [];
  sleeve(axial, .12, .10, .85, [0, .57, 0], M.glass(), false);
  for (const [y, turns, hex, sign] of [[.25, 1, C.blue, '+N'], [.55, 2, C.orange, '−2N'], [.85, 1, C.blue, '+N']]) {
   const g = coil(axial, { radius: .20, height: turns === 2 ? .035 : 0, turns, thickness: .013, center: [0, y, 0], material: color(hex), direction: y === .55 ? -1 : 1 });
   ex.add(g, [y === .55 ? -.30 : .25, (y - .55) * .9, 0], { name: sign + ' superconducting winding', info: 'The sign is the electrical winding polarity in the summed flux. Center area and signed turns are balanced against the two outer windings.' });
   label(g, sign, { offset: [.22, .04, 0] }); coilParts.push(g);
  }
  wire(axial, [[.2, .25, 0], [.27, .25, 0], [.27, .85, 0], [.2, .85, 0]], color(C.blue), .006);
  wire(axial, [[.2, .55, 0], [.33, .55, 0], [.33, .18, 0], [.70, .18, 0]], color(C.green), .006);
  const transformer = group(axial, [.75, .20, 0]);
  coil(transformer, { radius: .075, height: .12, turns: 5, thickness: .006, material: color(C.green) });
  const squidLoop = coil(transformer, { radius: .045, height: 0, turns: 1, thickness: .007, center: [.04, .10, .0], material: M.aluminium() });
  tagPart(transformer, 'Superconducting input transformer', 'Pickup flux drives a screening current in the closed superconducting circuit. Its input coil couples a fraction of that flux into the SQUID by mutual inductance.');
  label(transformer, 'Input coil → SQUID', { offset: [0, .23, 0] });
  const axSample = rock(axial, [0, .55, 0], .035); arrow(axSample, [0, -.04, 0], [0, .12, 0], C.green, .004);
  const normalMat = [color(C.blue), color(C.orange)];
  for (const side of [-1, 1]) for (const sign of [1, -1]) {
   const g = coil(copper, { radius: .20, height: .035, turns: 6, thickness: .008, center: [side * .30, .55 + sign * .20, 0], axis: 'x', material: normalMat[sign === 1 ? 0 : 1], direction: sign });
   tagPart(g, (sign > 0 ? '+' : '−') + ' conventional VSM pickup', 'Four ideal loop bundles model opposing upper and lower pickup polarities on the magnet pole faces. The sample moment points horizontally.');
   ex.add(g, [side * .25, sign * .15, 0], { name: (sign > 0 ? 'Upper +' : 'Lower −') + ' VSM coil', info: 'The signed flux is summed before taking its time derivative to obtain the pickup voltage.' });
  }
  const vsSample = rock(copper, [0, .55, 0], .035); arrow(vsSample, [-.06, 0, 0], [.13, 0, 0], C.green, .004);
  wire(copper, [[.30, .75, .20], [.48, .75, .20], [.48, .35, .20], [.73, .35, .20]], color(C.green), .008);
  const amp = moduleBox(copper, 'VOLTAGE INPUT', [.80, .30, .20], C.green, [.35, .09, .24]);
  tagPart(amp, 'VSM voltage input', 'A conventional resistive winding produces an emf from time-varying flux. A stationary dipole has flux coupling but creates no induced voltage.');
  box(root, [1.65, .06, .80], [.25, .02, 0], M.panel(0x70879b)); plaque(root, 'PICKUP / COUPLING', [.25, .08, .415], .70);
  let kind = 'axial', position = 0, inputL = 1, uniform = 1, gradient = .5, balanced = true;
  const status = readouts([{ id: 'coupling', label: 'Signed dipole coupling' }, { id: 'background', label: 'Background residual flux' }, { id: 'current', label: 'Screening current', wide: true }, { id: 'transfer', label: 'Flux transfer |Φs / Φp|', wide: true }]);
  const controls = card('Follow the signed flux');
  controls.body.append(select({ label: 'Pickup circuit', options: [{ value: 'axial', label: 'Axial superconducting +1 : −2 : +1' }, { value: 'vsm', label: 'VSM · copper differential pairs' }], value: kind, onChange: v => { kind = v; axial.visible = v === 'axial'; copper.visible = v === 'vsm'; recalc(); } }).el, slider({ label: 'Sample position along motion axis', min: -25, max: 25, value: position, unit: 'mm', onInput: v => { position = v; recalc(); } }).el, toggle({ label: 'Balanced series-opposition winding', value: true, onChange: v => { balanced = v; recalc(); } }).el, slider({ label: 'Uniform background B₀', min: -5, max: 5, value: uniform, unit: 'µT', onInput: v => { uniform = v; recalc(); } }).el, slider({ label: 'Gradient of measured field along motion', min: -2, max: 2, value: gradient, unit: 'mT/m', onInput: v => { gradient = v; recalc(); } }).el, slider({ label: 'SQUID input-coil inductance Lᵢ', min: .1, max: 4, value: inputL, unit: 'µH', onInput: v => { inputL = v; recalc(); } }).el, status.el);
  const plot = card('Individual windings → summed response'); const chart = new Chart(plot.body, { height: 210, xLabel: 'Sample position (mm)', yLabel: 'Coupling K (µWb / A m²)', legend: true });
  const explanation = para('');
  const maths = card('What travels down the wire?', equation('Φp = m · (Bloop / I)   [reciprocity]'), equation('Ip = −Φp / (Lp + Li)\nΦs = M Ip   [ideal transformer]'), explanation, note('Input inductance alone does not specify coupling. This model sets M = 0.01√(Lᵢ × 0.1 µH), Lp = 1 µH, neglects stray inductance and back-action, and shows magnitude of flux transfer. Maximum transfer occurs near Lᵢ = Lp.'), jump('squid', 'Follow the flux into a SQUID'), jump('lockin', 'Follow VSM voltage into the lock-in'));
  function recalc() {
   const x = linspace(-30, 30, 241), get = kind === 'axial' ? gradiometerContributions : vsmContributions;
   const cs = x.map(y => get(y / 1000));
   const n = cs[0].length, active = balanced ? Array.from({ length: n }, (_, i) => i) : [0];
   chart.setSeries([...Array.from({ length: n }, (_, i) => ({ name: i === 0 ? 'Winding contributions' : '', x, y: cs.map(c => c[i] * 1e6), color: i % 2 === 0 ? '#4c9bd0' : '#d78b36', alpha: .55, dash: [3, 3] })), { name: 'Connected sum', x, y: cs.map(c => active.reduce((a, i) => a + c[i], 0) * 1e6), color: '#159c75', width: 2.5 }]);
   chart.setMarks([{ x: position, color: '#cf6c80', label: 'sample' }]);
   const coupled = get(position / 1000), k = active.reduce((a, i) => a + coupled[i], 0);
   // Equal area loops; VSM upper/lower sign cancels uniform field, but not its gradient.
   const radius = kind === 'axial' ? .01 : .012, turns = kind === 'axial' ? 1 : 100;
   const weights = kind === 'axial' ? [1, -2, 1] : [1, -1, 1, -1];
   const ys = kind === 'axial' ? [-.015, 0, .015] : [.012, -.012, .012, -.012];
   const background = active.reduce((sum, i) => sum + weights[i] * turns * Math.PI * radius ** 2 * (uniform * 1e-6 + gradient * 1e-3 * ys[i]), 0);
   const mutual = .01 * Math.sqrt(inputL * 1e-6 * .1e-6), flux = transformerFlux(k * 1e-8, 1e-6, inputL * 1e-6, mutual);
   status.coupling.set((k * 1e6).toFixed(3) + ' µWb/A m²'); status.background.set((background * 1e12).toFixed(3) + ' pWb', Math.abs(background) < 1e-20 ? 'good' : 'warn');
   status.current.set(kind === 'axial' ? (flux.current * 1e9).toFixed(3) + ' nA · m = 10⁻⁸ A m²' : 'Resistive circuit: ε = −dΦ/dt');
   status.transfer.set(kind === 'axial' ? (Math.abs(mutual / (1e-6 + inputL * 1e-6)) * 100).toFixed(3) + '%' : 'Use voltage preamplifier');
   axSample.position.y = .55 + position / 1000 * 20; vsSample.position.y = .55 + position / 1000 * 17;
   coilParts.forEach((c,i) => { c.visible = balanced || i === 0; });
   explanation.innerHTML = kind === 'axial' ? 'The signed turn weights satisfy ΣN = 0 and ΣNy = 0. Equal-area windings reject an ideal uniform field and its linear axial gradient while retaining sensitivity to a nearby dipole.' : 'The opposing VSM winding pairs cancel a common changing field. Their axial gradient sensitivity is retained: that is what makes a vertically moving horizontal dipole produce a strong first-harmonic signal.';
  }
  recalc(); statusOverlay(ctx, 'Pickup workbench', 'Blue = positive winding · orange = negative winding · green = signal');
  return { root, exploder: ex, scale: 1.6, camera: { position: [2.1, 1.65, 2.5], target: [.20, .53, 0] }, panel: [intro('Coils measure a spatial pattern', 'Slide the dipole through the windings. Electrical polarity adds the nearby sample response while rejecting selected background fields. Removing the series balance reveals what one loop alone sees.'), controls.el, plot.el, maths.el, evidence('The axial example uses a second-order superconducting gradiometer and input transformer. Conventional VSM has opposing pole-face pickup assemblies followed by voltage amplification.', 'Ideal circular loops and point dipoles; no finite-sample correction, coil self-capacitance, resistive circuit dynamics or full SQUID back-action. Winding count, dimensions and transformer values are assumed, as listed in the instrument scenes.', [S.vsm, S.jj])], dispose() { chart.dispose(); } };
 }
};
