import * as THREE from 'three';
import { M } from './materials.js';
import { tagPart } from './explode.js';
export const C = { blue: 0x63b9ff, orange: 0xffb65b, green: 0x55dfb2, purple: 0xb9a0ff, red: 0xff7b87, ice: 0xb6e7fa };
export const color = (hex, { glow = 0, transparent = false, opacity = 1 } = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: .38, metalness: .25, emissive: hex, emissiveIntensity: glow, transparent, opacity });
export function mesh(parent, geometry, material, position = [0, 0, 0]) {
  const obj = new THREE.Mesh(geometry, material); obj.position.set(...position); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
}
export const box = (p, size, pos, mat = M.aluminium()) => mesh(p, new THREE.BoxGeometry(...size), mat, pos);
export function cylinder(p, radius, height, pos, mat = M.steel(), axis = 'y') {
  const obj = mesh(p, new THREE.CylinderGeometry(radius, radius, height, 48), mat, pos);
  if (axis === 'x') obj.rotation.z = Math.PI / 2; if (axis === 'z') obj.rotation.x = Math.PI / 2; return obj;
}
export function ball(p, r, pos, mat) { return mesh(p, new THREE.SphereGeometry(r, 24, 16), mat, pos); }
export function group(p, pos = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...pos); p.add(g); return g; }
export function wire(p, points, mat = M.copper(), radius = .008, smooth = false) {
  const pts = points.map(a => new THREE.Vector3(...a));
  const curve = smooth ? new THREE.CatmullRomCurve3(pts) : new THREE.CurvePath();
  if (!smooth) for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return mesh(p, new THREE.TubeGeometry(curve, Math.max(12, points.length * 3), radius, 6, false), mat);
}
export function coil(p, { radius = .2, height = .1, turns = 5, thickness = .006, center = [0, 0, 0], axis = 'y', material = M.copper(), direction = 1 } = {}) {
  const g = group(p, center), points = [];
  for (let i = 0; i <= turns * 48; i++) { const u = i / (turns * 48), a = direction * u * turns * Math.PI * 2; points.push([radius * Math.cos(a), (u - .5) * height, radius * Math.sin(a)]); }
  wire(g, points, material, thickness);
  if (axis === 'x') g.rotation.z = Math.PI / 2; if (axis === 'z') g.rotation.x = Math.PI / 2; return g;
}
export function loop(p, radius, pos, mat, axis = 'y', thickness = .008) {
  return coil(p, { radius, height: 0, turns: 1, center: pos, material: mat, axis, thickness });
}
// Annular cutaway extrusion. Its open sector reveals the bore without inventing
// material transparency; the missing sector is an illustration cut, not hardware.
export function sleeve(p, outer, inner, height, pos, mat, cutaway = true) {
  const shape = new THREE.Shape(), start = cutaway ? Math.PI * .55 : 0, end = cutaway ? Math.PI * 2.05 : Math.PI * 2;
  shape.absarc(0, 0, outer, start, end, false);
  if (cutaway) { shape.lineTo(inner * Math.cos(end), inner * Math.sin(end)); shape.absarc(0, 0, inner, end, start, true); shape.closePath(); }
  else { const hole = new THREE.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole); }
  const obj = mesh(p, new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 48 }), mat, [pos[0], pos[1] + height / 2, pos[2]]);
  obj.rotation.x = Math.PI / 2; return obj;
}
export function arrow(p, from, to, hex = C.blue, radius = .009) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a), len = d.length();
  const g = group(p); wire(g, [from, to], color(hex, { glow: .25 }), radius);
  const cone = mesh(g, new THREE.ConeGeometry(radius * 3.6, radius * 9, 16), color(hex, { glow: .25 }), to);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.userData.beam = true; return g;
}
export function plaque(p, text, pos, width = .4, hex = '#dce7f5') {
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#152438'; ctx.fillRect(0, 0, 640, 128); ctx.strokeStyle = '#53718d'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 636, 124);
  ctx.font = '600 42px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = hex; ctx.fillText(text, 320, 65, 610);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return mesh(p, new THREE.PlaneGeometry(width, width / 5), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }), pos);
}
export function rock(p, pos = [0, 0, 0], r = .06) {
  const g = group(p, pos); cylinder(g, r, r * 1.3, [0, 0, 0], color(0x78695b)); box(g, [r * .09, r * .85, .001], [0, 0, r * 1.001], color(C.orange)); return tagPart(g, 'Rock specimen', 'A point dipole represents the specimen in the signal model. The visible cylinder is illustrative; real finite samples need geometry corrections.');
}
export function moduleBox(p, name, pos, hex = C.blue, size = [.5, .15, .34]) {
  const g = group(p, pos); const pcb = box(g, size, [0, 0, 0], M.pcb());
  box(g, [size[0] * .25, .07, size[2] * .35], [0, size[1] / 2 + .035, 0], M.black());
  for (let i = -1; i <= 1; i++) box(g, [.025, .025, .07], [size[0] * .32, size[1] / 2 + .015, i * .08], M.gold());
  plaque(g, name, [0, .09, size[2] / 2 + .002], size[0] * .93, '#' + hex.toString(16)); return g;
}
export { M, THREE, tagPart };
