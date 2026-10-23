import { THREE, M, C, box, cylinder, sleeve, coil, wire, group, rock, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { slider, select, toggle, para, readouts, note } from '../core/ui.js';
import { Chart } from '../core/chart.js';
import { rackUnit, monitor, casters } from '../core/hardware.js';
import { linspace, gradiometerCoupling, transformerFlux, PHI0 } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, equation, focusButtons, statusOverlay, setSceneParams } from './shared.js';
export default {
 id: 'squid-system', title: 'SQUID magnetometer', group: 'Instrument gallery', icon: '◎', blurb: 'Cabinet · cryostat · DC scan / SQUID-VSM',
 create(ctx) {
  const { app, label } = ctx, root = new THREE.Group(), ex = new Exploder();
  const core = group(root, [0, .05, 0]); core.scale.setScalar(.7);
  box(core, [1.15, .17, 1.0], [0, .10, 0], M.panel(0x94a8ba));
  const jacket = sleeve(core, .47, .445, 1.42, [0, .94, 0], M.panel(0xc9d4df));
  ex.add(jacket, [-.95, .02, -.35], { order: .25, name: 'Vacuum jacket — cutaway', shell: true, info: 'The cryostat’s vacuum space reduces heat transfer to the cold assembly. The drawn sector is removed for viewing.' });
  const radiation = sleeve(core, .38, .368, 1.24, [0, .96, 0], M.aluminium());
  ex.add(radiation, [.90, .03, -.45], { order: .35, name: 'Thermal radiation shield', shell: true, info: 'A cold thermal shield intercepts radiative heating. Exact cryocooler plumbing and shield dimensions depend on the installed cryostat configuration.' });
  const cold = sleeve(core, .29, .275, 1.05, [0, 1.0, 0], color(0x6397ae, { transparent: true, opacity: .55 }));
  ex.add(cold, [0, .12, -1.0], { order: .45, name: 'Cold enclosure', shell: true, info: 'The superconducting sensor and magnet are cold. The variable-temperature sample space has a separate thermal path.' });
  const solenoid = coil(core, { radius: .18, height: .42, turns: 22, thickness: .01, center: [0, 1.08, 0], material: color(C.purple) });
  ex.add(solenoid, [-.55, .2, .02], { order: .65, name: 'Superconducting solenoid', info: 'A superconducting magnet applies an axial field to the sample. The illustrated turn count and winding cross-section are reduced; this is not a field solver.' });
  const magnetLabel = label(solenoid, 'Superconducting magnet', { offset: [-.16, .20, -.04], sub: 'applied field along sample axis' });
  const chamber = sleeve(core, .043, .033, 1.18, [0, 1.17, 0], M.quartz(), false);
  tagPart(chamber, 'Variable-temperature sample chamber', 'The sample environment is thermally separated from the superconducting pickup coils and SQUID. Sample temperature does not equal SQUID temperature.');
  const pickups = tagPart(group(core, [0, 1.08, 0]), 'Superconducting detection gradiometer', 'The axial detection circuit has signed winding weights +1, −2, +1. It couples specimen flux to the superconducting input transformer and rejects uniform fields and linear gradients in the ideal matched-coil limit.');
  for (const [dy, turns, hex] of [[-.12, 1, C.blue], [0, 2, C.orange], [.12, 1, C.blue]]) {
   const c = coil(pickups, { radius: .08, height: turns === 2 ? .018 : 0, turns, thickness: .005, center: [0, dy, 0], material: color(hex), direction: dy === 0 ? -1 : 1 });
   tagPart(c, dy === 0 ? 'Central −2N winding' : 'Outer +N winding', 'The ideal axial second-order gradiometer uses signed turn weights +1, −2, +1. Equal areas and spacing reject uniform fields and linear gradients.');
  }
  const pickupLabel = label(pickups, 'Measurement zone · detection coils', { offset: [.10, -.19, .04], sub: '+1 : −2 : +1' });
  const pod = tagPart(group(core, [.29, .65, .06]), 'Shielded SQUID module', 'The cold input transformer and SQUID sit inside magnetic shielding. The location and shield geometry shown here illustrate separation from the high-field sample region, not proprietary instrument CAD.');
  const can = sleeve(pod, .075, .068, .22, [0, 0, 0], M.steel());
  ex.add(can, [-.10, .0, -.45], { name: 'SQUID magnetic shield', shell: true, info: 'The SQUID and input transformer are shielded from the large applied sample field. Their location here is schematic; the solenoid and detector are distinct circuits.' });
  const squid = moduleBox(pod, 'SQUID', [0, -.02, .01], C.green, [.09, .015, .055]);
  tagPart(squid, 'DC-SQUID & input transformer', 'A superconducting input circuit couples pickup current inductively into the SQUID. A flux-locked readout linearizes its periodic response.');
  wire(core, [[.08, 1.08, -.01], [.24, 1.0, -.02], [.29, .65, .06]], color(C.green), .004);
  const transport = tagPart(cylinder(core, .15, .29, [0, 1.95, 0], M.panel(0x5a8cb9)), 'Sample transport / vibration drive', 'DC scans translate the specimen through the detection coils. SQUID-VSM oscillates it near the coil center.');
  const sample = group(core, [0, 1.08, 0]); rock(sample, [0, 0, 0], .019); cylinder(sample, .005, .80, [0, .42, 0], M.quartz());
  const readout = moduleBox(core, 'FLL / DSP', [.61, .37, .16], C.green, [.36, .16, .28]);
  tagPart(readout, 'Warm flux feedback & DSP', 'The signal leaves the cold SQUID as a voltage. Feedback and digitization produce a flux-proportional record; scan fitting or harmonic detection then estimates magnetic moment.');
  wire(core, [[.29, .65, .06], [.39, 1.5, -.10], [.61, .45, .16]], color(C.green), .005);
  for (const z of [-.025, .025]) arrow(core, [0, .86, z], [0, 1.30, z], C.purple, .003);
  plaque(core, 'AXIAL SQUID DETECTOR', [0, .16, .514], .68);
  // A neutral teaching enclosure with an open rear electronics frame.
  // All cabinet proportions and internal positions are illustrative.
  const cabinet = group(root); casters(cabinet, .43, .32);
  box(cabinet, [1.08, .075, .88], [0, .105, 0], M.panel(0xe1e6eb));
  const back = box(cabinet, [.96, .60, .035], [0, 1.64, -.385], M.panel(0x567f87));
  tagPart(back, 'Generic cabinet & electronics frame', 'A neutral enclosure organizes cryogenic and room-temperature functions. Cabinet proportions, service space and electronics positions are illustrative.');
  // Separate covers park beside/behind the cabinet, leaving the front sightline open.
  // Explode paths illustrate functional layers and keep the measurement zone open.
  const covers = group(cabinet);
  for (const side of [-1, 1]) {
   const door = group(covers, [side * .25, .57, .425]);
   box(door, [.498, .86, .028], [0, 0, 0], M.panel(0xe1e6eb));
   plaque(door, side < 0 ? 'SQUID' : 'MAGNETOMETRY', [0, .07, .018], .40);
   ex.add(door, [side * 1.15, .06, -.85], { rotate: [0, side * Math.PI / 3, 0], name: (side < 0 ? 'Left' : 'Right') + ' front cabinet panel', shell: true, info: 'The cover moves laterally and back in this teaching view to keep the measurement zone visible. This is an illustrative access path, not a disassembly instruction.' });
   const sideCover = box(covers, [.025, .86, .81], [side * .505, .57, .01], M.panel(0xe1e6eb));
   ex.add(sideCover, [side * .85, 0, -1.05], { rotate: [0, side * Math.PI / 5, 0], name: (side < 0 ? 'Left' : 'Right') + ' side cabinet panel', shell: true, info: 'Side covers separate from the cryostat before the inner shields move. The panels are simplified original geometry.' });
  }
  const deckShape = new THREE.Shape(); deckShape.moveTo(-.50, -.40); deckShape.lineTo(.50, -.40); deckShape.lineTo(.50, .40); deckShape.lineTo(-.50, .40); deckShape.closePath();
  const neckOpening = new THREE.Path(); neckOpening.absarc(0, 0, .12, 0, 2 * Math.PI, true); deckShape.holes.push(neckOpening);
  const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(deckShape, { depth: .025, bevelEnabled: false }), M.panel(0xe1e6eb)); deck.rotation.x = Math.PI / 2; deck.position.y = 1.025; covers.add(deck);
  ex.add(deck, [0, 1.05, -1.05], { name: 'Upper cabinet deck', shell: true, info: 'The deck lifts away and parks behind the sample axis so it cannot cap the detector view. The opening and motion are schematic.' });
  const towers = group(cabinet);
  for (const x of [-.47, .47]) box(towers, [.07, .96, .09], [x, 1.50, -.34], M.panel(0x566b7b));
  for (const y of [1.04, 1.96]) box(towers, [1.01, .06, .16], [0, y, -.30], M.panel(0x566b7b));
  const power = rackUnit(towers, 'MAGNET SUPPLY', [-.235, 1.70, -.23], 'The magnet power supply drives the superconducting solenoid. It is a separate electrical circuit from the superconducting pickup loop and SQUID readout.', { width: .35, height: .14, depth: .25, hex: C.purple });
  const control = rackUnit(towers, 'SYSTEM CONTROL', [.235, 1.70, -.23], 'Warm system control and readout electronics coordinate sample motion, thermal control, magnet control and SQUID signal acquisition. Board placement is schematic.', { width: .35, height: .14, depth: .25, hex: C.green });
  cylinder(cabinet, .13, .025, [0, 1.28, 0], M.aluminium());
  const airlock = tagPart(cylinder(cabinet, .047, .12, [0, 1.54, 0], M.black()), 'Sample access & transport', 'The sample rod enters through the upper sample-access assembly. The linear transport performs scans or vibration. The chamber remains thermally separate from the SQUID and detection windings.');
  label(airlock, 'Sample access / transport', { offset: [0, .10, .04] });
  wire(cabinet, [[.49,.75,-.18],[.67,.75,-.18],[.67,1.36,-.18],[.72,1.36,.05]], M.steel(), .018);
  monitor(cabinet, [.84, 1.34, .14], .43); box(cabinet, [.52, .018, .19], [.82, 1.08, .15], M.black());
  const pumps = group(root, [1.05, 0, -.01]); casters(pumps, .24, .28);
  box(pumps, [.61, .53, .71], [0, .375, 0], M.panel(0xd3dce4));
  plaque(pumps, 'PUMP / GAS CONTROL', [0, .42, .361], .52);
  tagPart(pumps, 'Pump & gas-handling console', 'Pumping and gas handling support the sample space. A recondensing configuration also needs cryocooler control. Console dimensions and service routing are illustrative.');
  wire(root, [[.38,.38,-.26],[.67,.24,-.36],[1.05,.24,-.36]], color(C.blue), .014, true);
  const recondensing = group(root);
  const coldHead = tagPart(cylinder(recondensing, .061, .22, [-.23, 1.28, -.17], M.steel()), 'Helium-recondensing cold head', 'The optional pulse-tube cryocooler recondenses helium inside a specialized dewar. It does not make the sample chamber and SQUID share one temperature. Cold-head shape and gas routing are illustrative.');
  cylinder(recondensing, .10, .045, [-.23, 1.17, -.17], M.copper());
  const compressor = group(recondensing, [1.05, 0, -.92]); casters(compressor, .18, .17);
  box(compressor, [.48, .54, .46], [0, .38, 0], M.panel(0x91a6b7));
  plaque(compressor, 'He COMPRESSOR', [0, .43, .236], .42);
  tagPart(compressor, 'Cryocooler helium compressor', 'A separate compressor circulates helium through paired pressure lines to the cold head. Cooling services, dimensions and hose lengths are schematic.');
  for (const dx of [-.035,.035]) wire(recondensing, [[1.05+dx,.55,-.92],[.69+dx,.65,-.65],[.10+dx,1.55,-.50],[-.23+dx,1.40,-.17]], M.steel(), .012, true);
  const configurationNote = para('');
  const views = card('Instrument views');
  const params = new URLSearchParams(location.hash.slice(1));
  let view = params.get('view') === 'exterior' ? 'exterior' : 'cutaway', cooling = params.get('cooling') === 'recondensing' ? 'recondensing' : 'base';
  function setView() { for (const shell of [jacket, radiation, cold, can]) shell.visible = true; magnetLabel.visible = pickupLabel.visible = view === 'cutaway'; covers.visible = view === 'exterior'; recondensing.visible = cooling === 'recondensing'; app.select(null); configurationNote.innerHTML = cooling === 'recondensing' ? 'Helium recondensation adds a pulse-tube cold head and compressor. The bath still contains liquid helium; boil-off is recondensed. Hose routing is schematic.' : 'Base cryostat: nitrogen-jacketed dewar and liquid-helium-cooled magnet. A helium-recondensing configuration can be selected above.'; }
  const viewSelect = select({ label: 'Instrument view', value: view, options: [{ value: 'cutaway', label: 'Cutaway · follow the SQUID signal' }, { value: 'exterior', label: 'Exterior · generic instrument enclosure' }], onChange: v => { view = v; if (view === 'exterior') app.setExplode(0); setView(); setSceneParams({ view, cooling }); } });
  views.body.append(viewSelect.el,
    select({ label: 'Cryogenic configuration', value: cooling, options: [{ value: 'base', label: 'Base system · nitrogen / helium cryostat' }, { value: 'recondensing', label: 'Helium-recondensing cryostat' }], onChange: v => { cooling = v; setView(); setSceneParams({ view, cooling }); } }).el,
    configurationNote, note('Explode clears the cabinet panels first, then separates the cryostat layers. The center stays open for the sample and detection coils. Paths are illustrative, not service instructions.'), focusButtons(app, [['Magnet supply', power], ['System electronics', control], ['Pump console', pumps]]));
  setView();
  let mode = 'vsm', amplitude = 2, center = 0, running = true, time = 0, last = 0;
  const ros = readouts([{ id: 'f', label: 'Leading signal harmonic' }, { id: 'phi', label: 'Current pickup flux' }]);
  const controls = card('Choose how the sample moves');
  const modeInput = select({ label: 'Measurement mode', value: mode, options: [{ value: 'vsm', label: 'SQUID-VSM · oscillate near center' }, { value: 'dc', label: 'DC scan · traverse gradiometer' }, { value: 'static', label: 'Hold stationary · flux stays present' }], onChange: v => { mode = v; recalc(); } });
  controls.body.append(modeInput.el, slider({ label: 'Oscillation amplitude (peak, teaching value)', min: 0, max: 4, value: amplitude, unit: 'mm', onInput: v => { amplitude = v; recalc(); } }).el, slider({ label: 'Axial offset from center', min: -5, max: 5, value: center, unit: 'mm', onInput: v => { center = v; recalc(); } }).el, toggle({ label: 'Show motion (slow playback)', value: true, onChange: v => running = v }).el, ros.el);
  const plot = card('The spatial response becomes a time signal');
  const chart = new Chart(plot.body, { height: 180, xLabel: 'Vibration phase (cycles)', yLabel: 'Δ pickup flux (pWb)', legend: false });
  const explanation = para(''); plot.body.append(explanation);
  function position(p) { return mode === 'dc' ? .022 * Math.sin(p * 2 * Math.PI) + center / 1000 : mode === 'static' ? center / 1000 : (center + amplitude * Math.sin(p * 2 * Math.PI)) / 1000; }
  function recalc() {
   const xs = linspace(mode === 'dc' ? -22 : 0, mode === 'dc' ? 22 : 1, 241);
   const flux = xs.map(x => 1e-8 * gradiometerCoupling(mode === 'dc' ? (x + center) / 1000 : position(x)) * 1e12);
   const mean = flux.reduce((a,b) => a + b, 0) / flux.length;
   chart.setOptions({ xLabel: mode === 'dc' ? 'Sample displacement (mm)' : 'Vibration phase (cycles)', yLabel: mode === 'vsm' ? 'Δ pickup flux (pWb)' : 'Pickup flux (pWb)' });
   chart.setSeries([{ x: xs, y: mode === 'vsm' ? flux.map(x => x - mean) : flux, color: '#b495ed' }]);
   ros.f.set(mode === 'vsm' ? amplitude === 0 ? 'no modulation' : Math.abs(center) < .05 ? '2f (centered)' : 'f + 2f' : mode === 'dc' ? 'spatial fit' : 'static flux');
   explanation.innerHTML = mode === 'vsm' ? 'At the center K(y) is even, so motion at f gives a leading flux modulation at <b>2f</b>. An offset adds a signal at f. The DC offset is removed only in this plot.' : mode === 'dc' ? 'A scan records the dipole response versus position. Calibrated fitting gives moment and center; this graph is the ideal pickup flux before readout gain.' : 'A superconducting pickup circuit can carry a persistent screening current while the specimen is still. A single stationary value does not separate sample, holder and offsets.';
  }
  recalc(); statusOverlay(ctx, 'SQUID magnetometer • axial flux detection', 'Separate sample, superconducting pickup and readout circuits.');
  return { root, exploder: ex, scale: 2.7, camera: { position: [3.3, 2.3, 4.1], target: [.35, .98, 0] }, panel: [intro('Axial SQUID magnetometer', 'Follow the sample, superconducting gradiometer, shielded SQUID and warm readout inside a generic enclosure. Compare a bath cryostat with an illustrative helium-recondensing configuration. The sample has its own thermal path.'), views.el, controls.el, plot.el, card('Look closer', focusButtons(app, [['Detection coils', pickups], ['SQUID enclosure', squid], ['Sample chamber', chamber], ['Sample access', airlock]], part => { view = 'cutaway'; viewSelect.set(view); setView(); app.state.animate = false; app.onStateSync?.(); app.setExplode(.8); if (part === squid) for (const shell of [jacket, radiation, cold, can]) shell.visible = false; setSceneParams({ view, cooling }); }), jump('pickups', 'Flux transformer & background rejection'), jump('squid', 'SQUID loop and tunnel junctions'), jump('fll', 'Feedback electronics')).el, evidence('Superconducting pickups couple flux into a SQUID through an input transformer. An ideal axial +1, −2, +1 gradiometer has an even spatial response: centered oscillation produces a leading 2f modulation, and axial displacement introduces f.', 'Enclosure, cryogenics, electronics, nested shells and offset SQUID pod are illustrative. No dimensions, field rating, temperature range or component positions specify a commercial instrument. Numerical pickup R = 10 mm, spacing = 15 mm and moment = 10⁻⁸ A m² are assumed. Field and temperature effects on sample moment are not simulated.', [S.squid, S.jj])], onExplode() { for (const shell of [jacket, radiation, cold, can]) shell.visible = true; }, update(dt, t) { pickupLabel.visible = view === 'cutaway' || ex.t > .5; if (running) time += dt * .45; const y = position(time); sample.position.y = 1.08 + y * 8; if (t - last > .12) { ros.phi.set((1e-8 * gradiometerCoupling(y) * 1e12).toFixed(3) + ' pWb'); last = t; } }, dispose() { chart.dispose(); } };
 }
};
