// SI units throughout. Rendering uses a separate, enlarged coordinate system.
export const MU0 = 4 * Math.PI * 1e-7;
export const PHI0 = 6.62607015e-34 / (2 * 1.602176634e-19);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const linspace = (lo, hi, n = 301) => Array.from({ length: n }, (_, i) => lo + (hi - lo) * i / (n - 1));

// Reciprocity: flux through a loop due to a point dipole = m · (B_loop / I).
// Numerical Biot–Savart integration, midpoint segments; loop normal is +x.
export function loopFieldX(point, center, radius, segments = 160) {
  const b = [0, 0, 0], d = 2 * Math.PI / segments;
  for (let i = 0; i < segments; i++) {
    const a = (i + 0.5) * d;
    const r = [point[0] - center[0], point[1] - center[1] - radius * Math.cos(a), point[2] - center[2] - radius * Math.sin(a)];
    const dl = [0, -radius * Math.sin(a) * d, radius * Math.cos(a) * d];
    const factor = MU0 / (4 * Math.PI * Math.hypot(...r) ** 3);
    b[0] += (dl[1] * r[2] - dl[2] * r[1]) * factor;
    b[1] += dl[2] * r[0] * factor;
    b[2] -= dl[1] * r[0] * factor;
  }
  return b;
}
export const VSM = { radius: .012, halfGap: .018, offset: .012, turns: 100 };
export function vsmContributions(y, { radius, halfGap, offset, turns } = VSM) {
  return [-1, 1].flatMap(side => [1, -1].map(sign => turns * sign * loopFieldX([0, y, 0], [side * halfGap, sign * offset, 0], radius)[0]));
}
export function vsmCoupling(y, balanced = true) {
  const c = vsmContributions(y);
  return balanced ? c.reduce((a, b) => a + b, 0) : c[0];
}
export function derivative(f, x, delta = 1e-6) { return (f(x + delta) - f(x - delta)) / (2 * delta); }
export function vsmVoltage(t, { moment = 1e-5, amplitude = .001, frequency = 40, center = 0, balanced = true } = {}) {
  const omega = 2 * Math.PI * frequency;
  const y = center + amplitude * Math.sin(omega * t);
  return -moment * derivative(z => vsmCoupling(z, balanced), y) * amplitude * omega * Math.cos(omega * t);
}
export const GRADIOMETER = { radius: .01, spacing: .015 };
export function axialLoopCoupling(y, radius = GRADIOMETER.radius) {
  return MU0 * radius ** 2 / (2 * (radius ** 2 + y ** 2) ** 1.5);
}
export function gradiometerContributions(y, { radius, spacing } = GRADIOMETER) {
  return [-spacing, 0, spacing].map((center, i) => [1, -2, 1][i] * axialLoopCoupling(y - center, radius));
}
export function gradiometerCoupling(y) { return gradiometerContributions(y).reduce((a, b) => a + b, 0); }
export function transformerFlux(pickupFlux, pickupL = 1e-6, inputL = 1e-6, mutual = 1e-8) {
  const current = -pickupFlux / (pickupL + inputL);
  return { current, squidFlux: current * mutual };
}
// Symmetric, negligible loop inductance, overdamped RSJ approximation, Ib > 2 I0.
export function dcSquid(fluxQuanta, { junctionIc = 5e-6, shuntR = 10, biasRatio = 2.2 } = {}) {
  const critical = 2 * junctionIc * Math.abs(Math.cos(Math.PI * fluxQuanta));
  const bias = junctionIc * biasRatio;
  return { critical, voltage: shuntR / 2 * Math.sqrt(Math.max(0, bias ** 2 - critical ** 2)) };
}
export function fluxInput(t, amplitude, waveform) {
  if (waveform === 'step') return t < .6 ? 0 : amplitude;
  if (waveform === 'ramp') return t < .6 ? 0 : amplitude * (t - .6) / 3.4;
  return amplitude * Math.sin(2 * Math.PI * .5 * t);
}
// Ideal periodic phase-error FLL, with finite feedback slew and range. No commercial
// bandwidth claim. A large step can acquire the adjacent flux period (lost integer).
export function simulateFLL({ amplitude = .2, waveform = 'sine', bandwidth = 5, slew = 8, range = 5, closed = true } = {}) {
  const dt = 1 / 4000, duration = 4;
  const trace = { t: [], input: [], feedback: [], residual: [], error: [], lost: false };
  let feedback = 0;
  for (let i = 0; i <= duration / dt; i++) {
    const t = i * dt, input = fluxInput(t, amplitude, waveform);
    const residual = input - feedback;
    const error = Math.sin(2 * Math.PI * residual) / (2 * Math.PI);
    if (closed) feedback = clamp(feedback + clamp(2 * Math.PI * bandwidth * error, -slew, slew) * dt, -range, range);
    if (closed && Math.abs(residual) > .5) trace.lost = true;
    if (i % 20 === 0) { trace.t.push(t); trace.input.push(input); trace.feedback.push(feedback); trace.residual.push(input - feedback); trace.error.push(error); }
  }
  return trace;
}
export function lockinComponents(rms, phaseDegrees) {
  const p = phaseDegrees * Math.PI / 180;
  return { x: rms * Math.cos(p), y: rms * Math.sin(p), r: Math.abs(rms) };
}
export function simulateLockin({ rms = 1, phase = 35, frequency = 40, interference = 5, tau = .1, gain = 1000, rail = .01 } = {}) {
  // Signal/interference in µV RMS, output rail in V. Demodulated outputs referred
  // back to the amplifier input; unit-RMS references enforce an RMS convention.
  const dt = 1 / 4000, alpha = 1 - Math.exp(-dt / tau), p = phase * Math.PI / 180;
  const out = { t: [], raw: [], x: [], y: [], clipped: false };
  let x = 0, y = 0;
  for (let i = 0; i <= 12000; i++) {
    const t = i * dt, angle = 2 * Math.PI * frequency * t;
    const raw = Math.SQRT2 * (rms * Math.cos(angle + p) + interference * Math.cos(2 * Math.PI * 137 * t + .3));
    const amplified = raw * 1e-6 * gain, limited = clamp(amplified, -rail, rail);
    if (Math.abs(amplified) > rail) out.clipped = true;
    const input = limited / gain * 1e6;
    x += alpha * (input * Math.SQRT2 * Math.cos(angle) - x);
    y += alpha * (-input * Math.SQRT2 * Math.sin(angle) - y);
    if (i % 12 === 0) { out.t.push(t); out.raw.push(input); out.x.push(x); out.y.push(y); }
  }
  return out;
}
export function rotateMoment(vector, degrees) {
  const a = degrees * Math.PI / 180, [x, y, z] = vector;
  return [x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)];
}
