import { THREE, M, C, box, cylinder, sleeve, coil, loop, wire, group, rock, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, select, toggle, para, readouts, note } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { rackUnit, monitor, casters } from '../core/hardware.js';
import { linspace, vsmVoltage } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay, setSceneParams } from './shared.js';
export default {
 id: 'vsm', title: 'Vibrating sample magnetometer', group: 'Instrument gallery', icon: '↕', blurb: 'Electromagnet · vibration drive · inductive pickups',
 create(ctx) {
  const { app, label } = ctx, root = new THREE.Group(), ex = new Exploder();
  const covers = [];
  box(root, [1.65, .12, 1.05], [0, .08, 0], M.panel(0xa9bbc9));
  const yoke = group(root); box(yoke, [1.45, .28, .44], [0, .39, -.22], M.iron());
  for (const side of [-1, 1]) {
   box(yoke, [.27, .70, .44], [side * .60, .78, -.22], M.iron());
   cylinder(yoke, .24, .40, [side * .48, 1.08, 0], M.iron(), 'x');
   const winding = group(root);
   const c = coil(winding, { radius: .265, height: .21, turns: 14, thickness: .013, center: [side * .49, 1.08, 0], axis: 'x', material: M.coil() });
   ex.add(winding, [side * .45, -.55, .75], { order: .25, name: 'Electromagnet excitation winding', info: 'The magnet power supply drives the large copper winding to set the applied field. This winding is separate from the small signal pickup coils.' });
   const windingCover = group(root, [side * .49, 1.08, 0]);
   const insulation = sleeve(windingCover, .284, .268, .215, [0, 0, 0], M.panel(0x8293a0), false); insulation.rotation.set(0, Math.PI / 2, 0);
   // The sleeve helper's origin includes its end offset; recenter before rotation.
   insulation.position.set(-.1075, 0, 0);
   for (const dx of [-.128, .128]) cylinder(winding, .286, .025, [side * .49 + dx, 1.08, 0], M.panel(0xa9bac7), 'x');
   ex.add(windingCover, [side * .85, .15, -1.1], { name: 'Excitation coil insulation', shell: true, info: 'A schematic protective winding cover. Copper turns carry the magnet current; this is separate from the pole-face sense coils. Cooling, insulation and turn count are schematic.' });
   covers.push(windingCover);
   const p = new THREE.Mesh(new THREE.CylinderGeometry(.10, .22, .25, 64), M.pole()); p.rotation.z = side * Math.PI / 2; p.position.set(side * .265, 1.08, 0); root.add(p);
   ex.add(p, [side * .32, 0, 0], { order: .45, name: 'Iron pole & cap', info: 'Opposing pole pieces concentrate the applied field into the specimen gap. The gap and pole dimensions here are illustrative.' });
  }
  tagPart(yoke, 'Magnetic return yoke', 'A low-reluctance iron path returns the applied field. Hysteresis, saturation and fringe fields are not solved by this geometric model.');
  const picks = tagPart(group(root, [0, 1.08, 0]), 'Differential pickup assembly', 'Two pole-face pickup pairs surround the vibrating specimen. Upper and lower winding signs are opposite, so vertical dipole motion adds while common changing fields cancel in the ideal model.');
  for (const side of [-1, 1]) {
   const half = group(picks, [side * .135, 0, 0]);
   for (const [dy, hex] of [[.09, C.blue], [-.09, C.orange]]) {
    const c = coil(half, { radius: .09, height: .018, turns: 5, thickness: .004, center: [0, dy, 0], axis: 'x', material: color(hex), direction: dy > 0 ? 1 : -1 });
    tagPart(c, (dy > 0 ? 'Upper +' : 'Lower −') + ' pickup winding', 'The signal model sums opposite upper and lower winding polarities. The sample moment is parallel to the field, and sample motion is vertical. The visible turn count is reduced for clarity.');
   }
   wire(half, [[0, .09, .09], [0, .09, .15], [0, -.09, .15], [0, -.09, .09]], M.gold(), .003);
   ex.add(half, [side * .30, 0, .32], { order: .65, name: (side < 0 ? 'Left' : 'Right') + ' pickup coil pair', info: 'The two pickup assemblies mount to opposing pole faces. Opposite winding signs reject common changing fields while adding the signal from vertical sample motion.' });
  }
  label(picks, 'Differential pickup coils', { offset: [0, -.18, .12] });
  const sample = group(root, [0, 1.08, 0]); rock(sample, [0, 0, 0], .022);
  cylinder(sample, .006, .70, [0, .37, 0], M.quartz());
  const m = arrow(sample, [-.04, 0, 0], [.09, 0, 0], C.green, .004);
  tagPart(sample, 'Vibrating specimen & rod', 'The drive controls displacement and phase. Conventional VSM pickup voltage scales with moment × amplitude × frequency in the small-displacement regime.');
  const drive = group(root);
  const headCover = box(drive, [.33, .39, .28], [0, 1.91, 0], M.panel(0x619d9a));
  ex.add(headCover, [0, .35, -.50], { name: 'VSM head cover', shell: true, info: 'The head houses controlled vibration, amplitude sensing and sample management. The actuator linkage and internal construction are illustrative.' }); covers.push(headCover);
  cylinder(drive, .056, .14, [0, 1.66, 0], M.black());
  for (const x of [-.10, .10]) cylinder(drive, .008, .27, [x, 1.91, 0], M.steel());
  box(drive, [.21, .035, .07], [0, 1.85, 0], M.aluminium());
  const alignment = tagPart(box(root, [.42, .045, .37], [0, 1.68, -.02], M.aluminium()), 'Head alignment & sample coupling', 'Motorized Z positioning supports sample exchange; manual X/Y alignment centers the sample. The quick-release coupling attaches the rod. Stage and linkage dimensions are schematic.');
  cylinder(root, .055, .025, [0, 1.72, 0], M.steel());

  tagPart(drive, 'Vibration head', 'An actuator and position sensor regulate the motion. The numerical frequency is physical; the displayed motion is slowed and enlarged.');
  label(drive, 'Controlled vibration head', { offset: [0, 2.15, 0] });
  for (const x of [-.73, .73]) box(root, [.045, 1.75, .045], [x, 1.07, -.40]); box(root, [1.5, .06, .10], [0, 1.97, -.40]);
  const isolation = group(root);
  for (const x of [-.87, .87]) {
   wire(isolation, [[x, .09, .38], [x * .8, 1.72, -.40]], M.aluminium(), .035);
   box(isolation, [.075, .07, 1.05], [x, .12, 0], M.aluminium());
   for (const z of [-.48, .48]) cylinder(isolation, .05, .045, [x, .04, z], M.black());
  }
  tagPart(isolation, 'Independent vibration-isolation frame', 'The head support is mechanically isolated from the electromagnet structure to suppress motion in the signal pickup assemblies. The support geometry illustrates this mechanical separation.');
  const console = group(root, [1.35, 0, -.10]); casters(console, .28, .25);
  box(console, [.64, 1.12, .59], [0, .66, 0], M.panel(0x1e2a36));
  box(console, [.79, .035, .68], [0, 1.24, .025], M.aluminium());
  const controller = rackUnit(console, 'SIGNAL CONTROL', [0, .98, .08], 'The signal controller generates the vibration reference, receives the sample signal and head feedback, and performs phase-sensitive processing. Field control is a separate signal path.');
  const headAmp = rackUnit(console, 'VIBRATION DRIVE', [0, .78, .08], 'A power amplifier drives the vibration actuator from the reference command. The small pickup voltage has a separate low-noise preamplifier.');
  const magnetSupply = rackUnit(console, 'MAGNET SUPPLY', [0, .43, .08], 'A bipolar current supply energizes the large electromagnet windings. This power circuit is separate from both the vibration drive and the sensitive pickup readout.', { height: .32, hex: C.purple });
  monitor(console, [0, 1.57, .02], .58); box(console, [.49, .018, .16], [0, 1.27, .25], M.black());
  tagPart(console, 'Control & power console', 'Separate modules illustrate signal processing, vibration power and magnet current. Rack, workstation and cable routing are teaching geometry.');
  label(console, 'Control & power console', { offset: [0, 1.88, 0] });
  wire(root, [[1.08,.78,-.20],[.91,.78,-.47],[.20,1.93,-.47],[.16,1.93,-.1]], color(C.orange), .009);
  wire(root, [[1.08,.43,-.20],[.91,.43,-.50],[.49,1.08,-.31]], color(C.purple), .011);
  const hall = tagPart(box(root, [.025, .09, .04], [.12, 1.08, -.12], M.black()), 'Hall field probe', 'A separate Hall sensor measures the applied magnetic field near the sample. It does not detect the specimen moment.');
  const amp = moduleBox(root, 'PREAMP → LOCK-IN', [.50, .29, .30], C.green, [.58, .13, .28]); tagPart(amp, 'Voltage preamplifier & phase-sensitive detection', 'The differential pickup voltage is amplified, digitized and demodulated against the vibration reference. The drive and signal wiring are separate paths.');
  wire(root, [[.135, .99, .15], [.32, .99, .25], [.50, .38, .30]], color(C.green), .007);
  for (const z of [-.055, .055]) arrow(root, [-.12, 1.08, z], [.12, 1.08, z], C.purple, .003);
  wire(root, [[.77,.35,.30],[.95,.35,.40],[1.12,.98,.20]], color(C.green), .006);
  plaque(root, 'INDUCTIVE VSM', [0, .09, .532], .88);
  let amplitude = 1, frequency = 83, moment = 10, running = true, time = 0;
  const ros = readouts([{ id: 'emf', label: 'Pickup signal RMS' }, { id: 'f', label: 'Detection frequency' }]);
  const controls = card('Motion creates the voltage');
  controls.body.append(slider({ label: 'Vibration amplitude (peak)', min: 0, max: 3, value: amplitude, unit: 'mm', onInput: v => { amplitude = v; recalc(); } }).el, slider({ label: 'Vibration frequency', min: 0, max: 100, value: frequency, unit: 'Hz', onInput: v => { frequency = v; recalc(); } }).el, slider({ label: 'Specified sample moment', min: -30, max: 30, value: moment, unit: 'µA m²', onInput: v => { moment = v; recalc(); } }).el, toggle({ label: 'Animate motion (slow, displacement ×30)', value: true, onChange: v => running = v }).el, ros.el);
  let instrumentView = new URLSearchParams(location.hash.slice(1)).get('view') === 'exterior' ? 'exterior' : 'cutaway';
  const views = card('Instrument views');
  views.body.append(select({ label: 'Instrument view', value: instrumentView, options: [{ value: 'cutaway', label: 'Cutaway · windings & head linkage' }, { value: 'exterior', label: 'Exterior · complete measurement system' }], onChange: value => { instrumentView = value; covers.forEach(o => o.visible = value === 'exterior'); app.select(null); setSceneParams({ view: value }); } }).el,
    focusButtons(app, [['Magnet & detector', yoke], ['Controller console', console], ['Head alignment', alignment]]),
    note('The initial 83 Hz is an illustrative reference. Change frequency to explore induction scaling; the geometry and controls do not specify a commercial instrument.'));
  covers.forEach(o => o.visible = instrumentView === 'exterior');
  const plot = card('Signal during one vibration'); const chart = new Chart(plot.body, { xLabel: 'Vibration phase (cycles)', yLabel: 'Pickup voltage (µV)', height: 190, legend: false });
  function recalc() {
   const phase = linspace(0, 1, 161), volts = phase.map(p => vsmVoltage(frequency ? p / frequency : 0, { amplitude: amplitude / 1000, frequency, moment: moment * 1e-6 }));
   chart.setSeries([{ x: phase, y: volts.map(x => x * 1e6), color: '#169f7a' }]);
   const rms = Math.sqrt(volts.slice(0, -1).reduce((a, b) => a + b * b, 0) / (volts.length - 1)); ros.emf.set((rms * 1e6).toFixed(3) + ' µV'); ros.f.set(frequency.toFixed(1) + ' Hz');
  }
  recalc(); statusOverlay(ctx, 'VSM • induced-voltage detection', '83 Hz reference · separate drive, pickup and magnet-current paths.');
  return { root, exploder: ex, scale: 2.7, camera: { position: [3.6, 2.7, 4.1], target: [.38, 1.02, 0] }, panel: [intro('Vibrating sample magnetometer', 'Explore the electromagnet, isolated vibration head and functional control console. The small pole-face windings sense the moving sample; the large copper windings create the applied field.'), views.el, controls.el, plot.el, card('Inspect the signal chain', equation('ε = −dΦ/dt = −m (dK/dy) Aω cos(ωt)'), focusButtons(app, [['Pickup coils', picks], ['Vibration head', drive], ['Hall probe', hall]], () => { app.state.animate = false; app.onStateSync?.(); app.setExplode(.9); }), jump('pickups', 'Explore winding polarity & coil coupling'), jump('lockin', 'Open the amplifier & lock-in')).el, evidence('A moving magnetic dipole changes linked pickup flux and induces a voltage. The signal model uses reciprocal Biot–Savart coupling for four differential circular loops. The electromagnet and vibration actuator have separate power paths.', 'Exterior, isolation frame, actuator linkage, electronics layout and frequency are teaching choices. Coil R = 12 mm, half-gap = 18 mm, vertical offset = 12 mm and N = 100 are teaching parameters. Only five turns are rendered. Specified moment stays fixed; no material M(H) or magnet FEM is implied.', [S.vsm])], update(dt) { if (running && frequency > 0) time += dt * .65; sample.position.y = 1.08 + amplitude * .001 * 30 * Math.sin(time * Math.PI * 2); }, dispose() { chart.dispose(); } };
 }
};
