import { THREE, M, C, box, cylinder, sleeve, coil, loop, wire, group, rock, plaque, arrow, color, tagPart, moduleBox } from '../core/model.js';
import { Exploder } from '../core/explode.js';
import { h, slider, select, toggle, para, readouts, note } from '../core/ui.js';
import { rotateMoment, clamp } from '../physics/magnetometry.js';
import { card, intro, evidence, S, jump, focusButtons, statusOverlay } from './shared.js';
export default {
 id: 'rock', title: 'Automated rock magnetometer', group: 'Instrument gallery', icon: '◈', blurb: '200-cup chain / 100-position X–Y stage',
 create(ctx) {
  const { app, label } = ctx, root = new THREE.Group(), ex = new Exploder();
  const frame = group(root);
  // Illustrative frame proportions; no specific instrument drawing is reproduced.
  for (const x of [-.52, .52]) for (const z of [-.39, .39]) {
   box(frame, [.04, 1.40, .04], [x, .70, z]); cylinder(frame, .045, .035, [x, .02, z], M.black());
  }
  for (const y of [.12, 1.40]) {
   for (const z of [-.39, .39]) box(frame, [1.08, .04, .04], [0, y, z]);
   for (const x of [-.52, .52]) box(frame, [.04, .04, .78], [x, y, 0]);
  }
  const back = -.25;
  for (const x of [-.40, .226]) box(frame, [.04, .74, .04], [x, 1.77, back]);
  box(frame, [.68, .04, .04], [-.087, 2.14, back]);
  for (const x of [-.24 - .075, -.24 + .075]) cylinder(frame, .011, .78, [x, 2.53, 0], M.steelPolished());
  box(frame, [.26, .05, .14], [-.24, 2.92, 0]);
  const motor = tagPart(cylinder(root, .066, .13, [-.24, 2.99, 0], M.black()), 'Vertical drive', 'The long travel guide supports vertical insertion. Frame dimensions and the drive body are illustrative.');
  label(motor, 'Vertical drive', { offset: [0, .09, 0] });
  const carriage = tagPart(box(root, [.22, .075, .10], [-.24, 2.75, 0], M.panel(0x668bb1)), 'Moving carriage', 'A telescoping / pulley mechanism multiplies the carriage travel. The sample motion is slowed for teaching.');
  const snake = group(root), xy = group(root);
  let changer = new URLSearchParams(location.hash.slice(1)).get('changer') === 'snake' ? 'snake' : 'xy';
  snake.visible = changer === 'snake'; xy.visible = changer === 'xy';
  const shape = new THREE.Shape();
  shape.moveTo(-.49, -.35); shape.lineTo(.49, -.35); shape.lineTo(.49, .35); shape.lineTo(-.49, .35); shape.closePath();
  const hole = new THREE.Path(); hole.absarc(-.24, 0, .027, 0, 2 * Math.PI, true); shape.holes.push(hole);
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .014, bevelEnabled: false }), M.aluminium()); plate.rotation.x = Math.PI / 2; plate.position.y = 1.516; snake.add(plate);
  tagPart(snake, '200-cup snake-chain changer', 'This teaching configuration uses a continuous chain of 200 linked specimen cups. A selected specimen is lifted, the chain advances one pitch to an empty cup aperture, and the quartz holder lowers into the bore.');
  const routePoints = [];
  for (let row = 0; row < 9; row++) {
   const z = -.24 + row * .06, first = row % 2 ? .39 : -.39;
   routePoints.push(new THREE.Vector3(first, 0, z), new THREE.Vector3(-first, 0, z));
  }
  routePoints.push(new THREE.Vector3(.45, 0, .31), new THREE.Vector3(-.45, 0, .31), new THREE.Vector3(-.45, 0, -.31));
  const path = new THREE.CurvePath();
  for (let i = 0; i < routePoints.length; i++) path.add(new THREE.LineCurve3(routePoints[i], routePoints[(i + 1) % routePoints.length]));
  const cupTemplateRoot = new THREE.Group();
  const cupTemplate = sleeve(cupTemplateRoot, .0175, .015, .026, [0, 0, 0], M.peek(), false);
  const cupInstances = new THREE.InstancedMesh(cupTemplate.geometry, M.peek(), 200); snake.add(cupInstances); cupInstances.castShadow = true;
  const pinInstances = new THREE.InstancedMesh(new THREE.CylinderGeometry(.002, .002, .034, 6), M.gold(), 200); snake.add(pinInstances);
  const dummy = new THREE.Object3D(); let chainOrigin = 0, bestDistance = Infinity;
  for (let i = 0; i < 2000; i++) { const p = path.getPointAt(i / 2000), d = Math.hypot(p.x + .24, p.z); if (d < bestDistance) { bestDistance = d; chainOrigin = i / 2000; } }
  const selectedPoint = path.getPointAt(chainOrigin), chainOffset = new THREE.Vector3(-.24 - selectedPoint.x, 0, -selectedPoint.z);
  wire(snake, routePoints.map(p => [p.x + chainOffset.x, 1.525, p.z + chainOffset.z]).concat([[routePoints[0].x + chainOffset.x, 1.525, routePoints[0].z + chainOffset.z]]), M.black(), .003);
  function updateChain(shift) {
   for (let i = 0; i < 200; i++) {
    const p = path.getPointAt((chainOrigin + i / 200 + shift / 200) % 1).add(chainOffset);
    dummy.position.set(p.x, 1.555, p.z); dummy.rotation.set(Math.PI / 2, 0, 0); dummy.updateMatrix(); cupInstances.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x, 1.533, p.z); dummy.rotation.set(0, 0, Math.PI / 2); dummy.updateMatrix(); pinInstances.setMatrixAt(i, dummy.matrix);
   }
   cupInstances.instanceMatrix.needsUpdate = pinInstances.instanceMatrix.needsUpdate = true;
  }
  label(snake, '200 linked cups', { offset: [.25, 1.62, .24] });
  // Square crossed stages: machine X/Y are horizontal; rendering uses Y-up.
  for (const z of [-.30, .30]) { box(xy, [1.02, .026, .025], [-.08, 1.425, z], M.steel()); box(xy, [.95, .018, .05], [-.08, 1.406, z], M.black()); }
  cylinder(xy, .007, .95, [-.08, 1.432, .34], M.steel(), 'x');
  const xCarriage = group(xy), yCarriage = group(xCarriage);
  for (const z of [-.28, .28]) box(xCarriage, [.65, .045, .045], [0, 1.46, z], M.panel(0x588bb4));
  for (const x of [-.28, .28]) { box(xCarriage, [.045, .045, .65], [x, 1.46, 0], M.panel(0x588bb4)); cylinder(xCarriage, .009, .83, [x, 1.485, 0], M.steel(), 'z'); }
  cylinder(xCarriage, .006, .80, [.32, 1.48, 0], M.steel(), 'z');
  box(yCarriage, [.61, .018, .61], [0, 1.516, 0], M.aluminium());
  for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) {
   const x = (col - 4.5) * .054, z = (row - 4.5) * .054;
   sleeve(yCarriage, .0175, .0145, .025, [x, 1.537, z], M.peek(), false);
   if ((row * 10 + col) % 13 === 0 && !(row === 3 && col === 5)) rock(yCarriage, [x, 1.552, z], .012);
  }
  const xMotor = tagPart(box(xy, [.08, .065, .065], [.47, 1.43, .34], M.black()), 'Horizontal X drive', 'The lower axis translates the crossed-stage assembly. Drive placement and lead-screw geometry are schematic; motor fields must be kept away from the SQUID sensing region.');
  const yMotor = tagPart(box(xCarriage, [.065, .065, .08], [.32, 1.48, .44], M.black()), 'Horizontal Y drive', 'The upper horizontal axis positions a row of samples beneath the vertical pickup. The display uses Y-up; physical machine Y is the second horizontal axis.');
  tagPart(xy, '100-position square X–Y changer', 'A 10 × 10 illustrative array on two crossed translation axes. The 100 positions and travel are teaching choices; they do not specify a commercial handler.');
  label(xy, 'Square X–Y stage · 100 positions', { offset: [.12, 1.66, .23] });
  arrow(xy, [-.50, 1.38, .40], [-.15, 1.38, .40], C.blue, .004);
  arrow(xy, [.48, 1.38, -.25], [.48, 1.38, .10], C.orange, .004);
  const cold = group(root, [-.24, .94, 0]);
  const shell = sleeve(cold, .21, .19, .71, [0, 0, 0], M.steelBrushed());
  ex.add(shell, [-.60, 0, -.25], { name: 'Cryostat vacuum jacket — cutaway', shell: true, info: 'Thermal insulation separates the cryogenic sensor from the room-temperature pass-through bore. Geometry is an educational cross-section.' });
  const shield = sleeve(cold, .16, .15, .63, [0, 0, 0], M.copper());
  ex.add(shield, [.50, 0, -.30], { order: .3, name: 'Cold shield & sensor enclosure', shell: true, info: 'Magnetic and thermal shielding suppress external fields and heat leaks. Layer materials and spacing here are schematic.' });
  sleeve(cold, .043, .036, .78, [0, 0, 0], M.quartz(), false);
  const pickups = tagPart(group(cold), 'Three-axis superconducting pickups', 'The three colored rings illustrate orthogonal magnetic sensitivity. Actual pickup windings are distributed gradiometers; use the workbench to inspect winding polarity and coupling.');
  for (const [axis, hex] of [['x', C.green], ['y', C.blue], ['z', C.purple]]) {
   const g = loop(pickups, .064, [0, 0, 0], color(hex), axis, .005);
   tagPart(g, axis.toUpperCase() + ' sensitivity channel', 'Orthogonal sensitivity axes are shown symbolically. Real transverse pickup windings are distributed gradiometric coils, not three intersecting ideal rings.');
  }
  label(pickups, 'Three moment components', { offset: [.06, .14, .02], sub: 'orthogonal sensitivity axes' });
  const sensor = moduleBox(cold, 'SQUID', [.105, -.10, .025], C.green, [.10, .02, .07]);
  tagPart(sensor, 'SQUID sensor module', 'Each superconducting pickup circuit couples flux to a SQUID. Open the SQUID and feedback workbenches for the detailed readout.');
  wire(cold, [[.06, 0, 0], [.11, 0, 0], [.11, -.1, .02]], color(C.green), .003);
  const tube = group(root, [-.24, 0, 0]);
  sleeve(tube, .0145, .0128, 1.473, [0, .7365, 0], M.quartz(), false);
  const specimen = rock(root, [-.24, 1.555, 0], .012);
  const moment = arrow(specimen, [0, 0, 0], [.055, .025, .035], C.orange, .002);
  label(specimen, 'Quartz vacuum pickup', { offset: [0, .09, 0] });
  const electronics = moduleBox(root, '3-axis FLL', [.33, .34, .12], C.green, [.27, .13, .22]);
  tagPart(electronics, 'Room-temperature readout', 'Low-noise voltage amplification and flux feedback convert the three SQUID responses to calibrated moment components. The board placement is illustrative.');
  wire(root, [[-.13, .85, 0], [.23, .85, -.25], [.33, .4, .12]], color(C.green), .006);
  plaque(root, 'ROCK MAGNETOMETRY', [0, 1.28, .403], .50);
  let phase = .65, playing = true, timer = 0;
  const status = readouts([{ id: 'step', label: 'Sequence', wide: true }, { id: 'height', label: 'Sample height' }, { id: 'vacuum', label: 'Vacuum grip' }, { id: 'vector', label: 'Instrument moment, normalized', wide: true }]);
  const scrub = slider({ label: 'Cycle position', min: 0, max: 1, value: phase, fmt: v => Math.round(v * 100) + '%', onInput: v => { phase = v; playing = false; play.set(false); updatePose(); } });
  const play = toggle({ label: 'Run sample-handling sequence', value: true, onChange: v => playing = v });
  const changerSelect = select({ label: 'Sample changer design', value: changer, options: [{ value: 'xy', label: 'Square X–Y stage · 100 positions' }, { value: 'snake', label: 'Snake chain · 200 specimen cups' }], onChange: v => { changer = v; xy.visible = v === 'xy'; snake.visible = v === 'snake'; app.select(null); const p = new URLSearchParams(location.hash.slice(1)); p.set('changer', v); history.replaceState(null, '', '#' + p); updatePose(); } });
  const ctl = card('Follow one specimen', changerSelect.el, play.el, scrub.el, status.el, note('Motion is slowed. At the measurement position the sample is stationary while its remanent moment is read. A second physical orientation is a separate handling step.'), focusButtons(app, [['Cryostat & pickups', pickups], ['Quartz pickup', specimen], ['Readout', electronics]], () => { app.state.animate = false; app.onStateSync?.(); app.setExplode(.9); }));
  ctl.body.append(h('button', { class: 'btn', onclick: () => { const part = changer === 'xy' ? xy : snake; app.select(part); app.focusOn(part); } }, 'Focus sample changer'));
  function updatePose() {
   let y, step, grip = true, angle = 0, shift = 0;
   const u = (a, b) => clamp((phase - a) / (b - a), 0, 1), smooth = t => t * t * (3 - 2 * t);
   if (phase < .14) { y = 1.555; step = '01 · Position specimen above bore'; grip = false; }
   else if (phase < .27) { y = 1.555 + .12 * smooth(u(.14, .27)); step = '02 · Vacuum pickup & lift'; }
   else if (phase < .38) { y = 1.675; shift = smooth(u(.27, .38)); step = changer === 'xy' ? '03 · Move stage clear of bore' : '03 · Index an empty cup aperture'; }
   else if (phase < .56) { y = 1.675 - .735 * smooth(u(.38, .56)); shift = 1; step = '04 · Lower into sensing region'; }
   else if (phase < .77) { y = .94; shift = 1; angle = Math.floor(u(.56, .77) * 4) * 90; step = '05 · Settle, measure & rotate'; }
   else if (phase < .89) { y = .94 + .735 * smooth(u(.77, .89)); shift = 1; step = '06 · Withdraw specimen'; }
   else if (phase < .95) { y = 1.675; shift = 1 - smooth(u(.89, .95)); step = '07 · Return the cup'; }
   else { y = 1.675 - .12 * smooth(u(.95, 1)); step = '08 · Lower & release'; grip = phase < .99; }
   updateChain(shift);
   const index = smooth(u(0, .14));
   // Chosen grid pocket (column 6, row 4): +27 mm X, −81 mm Y.
   xCarriage.position.x = -.10 + (-.267 + .10) * index + shift * .64;
   yCarriage.position.z = -.12 + (.081 + .12) * index;
   specimen.position.x = changer === 'xy' && phase < .14 ? xCarriage.position.x + .027 : -.24;
   specimen.position.z = changer === 'xy' && phase < .14 ? yCarriage.position.z - .081 : 0;
   tube.position.y = y + .012; specimen.position.y = y; specimen.rotation.y = -angle * Math.PI / 180;
   carriage.position.y = 2.75 - (1.675 - y) / 2;
   const v = rotateMoment([.6, .3, .7], angle);
   status.step.set(step); status.height.set(y.toFixed(3) + ' m'); status.vacuum.set(grip ? 'ON' : 'released'); status.vector.set(v.map(x => x.toFixed(2)).join(' · '));
  }
  updatePose(); statusOverlay(ctx, 'Rock magnetometer • remanence', 'Switch between the 100-position X–Y stage and 200-cup snake chain.');
  return { root, exploder: ex, scale: 3.1, camera: { position: [3.35, 2.55, 3.75], target: [0, 1.48, 0] }, panel: [intro('Two automated handling designs', 'Choose the 100-position square X–Y stage or the 200-cup snake chain. Both place a specimen beneath the vertical quartz vacuum holder, then clear its path into the superconducting rock magnetometer.'), ctl.el, card('Continue inside', jump('pickups', 'Pickup coil workbench'), jump('squid', 'Inside a DC SQUID'), jump('fll', 'Flux feedback & amplifiers'), jump('rf', 'RF-SQUID readout')).el, evidence('Automated specimen handling combines indexing, vacuum pickup, insertion and orientation. A superconducting pickup circuit couples specimen flux into a SQUID readout.', 'The 100-position square tray and 200-cup chain are illustrative alternatives. Frame dimensions, stage travel, chain routing, cup spacing, cryostat and sensitivity rings are schematic.', [S.handling, S.jj])], update(dt) { timer += dt; if (playing) { phase = (phase + dt / 24) % 1; if (timer > .1) { scrub.set(phase); updatePose(); timer = 0; } } } };
 }
};
