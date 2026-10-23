// Original schematic cabinet hardware; dimensions are illustrative unless stated.
import { M, C, box, cylinder, wire, group, plaque, color, tagPart } from './model.js';

export function rackUnit(parent, title, position, info, { width = .52, height = .13, depth = .42, hex = C.blue } = {}) {
  const unit = group(parent, position);
  box(unit, [width, height, depth], [0, 0, 0], M.panel(0x243242));
  box(unit, [width + .025, height, .018], [0, 0, depth / 2], M.panel(0x415469));
  plaque(unit, title, [-.035, .008, depth / 2 + .012], width * .73);
  cylinder(unit, .014, .012, [width * .43, 0, depth / 2 + .015], color(hex), 'z');
  for (const side of [-1, 1]) box(unit, [.012, height * .60, .025], [side * width * .46, 0, depth / 2 + .03], M.steel());
  return tagPart(unit, title, info);
}

export function monitor(parent, position, width = .50) {
  const screen = group(parent, position), height = width * .60;
  box(screen, [width, height, .04], [0, 0, 0], M.black());
  box(screen, [width * .90, height * .83, .006], [0, 0, .024], color(0x1b3448));
  wire(screen, [[-width*.36,-height*.26,.030],[-width*.36,height*.22,.030]], color(0x71899e), .002);
  wire(screen, [[-width*.36,-height*.26,.030],[width*.36,-height*.26,.030]], color(0x71899e), .002);
  // A generic display trace, not a simulated magnetic hysteresis measurement.
  wire(screen, [[-width*.32,-height*.20,.031],[-width*.14,-height*.18,.031],[-width*.07,0,.031],[width*.07,height*.16,.031],[width*.32,height*.18,.031]], color(C.green), .003);
  box(screen, [.035, .13, .035], [0, -height / 2 - .055, -.01], M.black());
  box(screen, [width * .40, .018, .13], [0, -height / 2 - .12, .01], M.black());
  return tagPart(screen, 'Computer control display', 'A schematic computer display and status trace identify the control workstation. The trace is decorative, not calculated M(H) data or a reproduction of commercial software.');
}

export function casters(parent, halfWidth, halfDepth, y = .055) {
  for (const x of [-halfWidth, halfWidth]) for (const z of [-halfDepth, halfDepth]) {
    cylinder(parent, .028, .032, [x, y, z], M.black(), 'x');
    cylinder(parent, .009, .04, [x, y + .03, z], M.steel());
  }
}
