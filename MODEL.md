# Model equations and assumptions

Physics uses SI units; rendering uses enlarged teaching coordinates (Y-up).
Machine X/Y on the automated specimen stage are the two horizontal axes; physical Z is vertical.
The numerical coupling functions call the motion coordinate `y` consistently
with the rendering system. Flux-arrow lengths and winding colors are schematic.

## Pickups

For a dipole moment **m**, reciprocal flux coupling is
`Phi = m · B_loop/I`. Circular-loop fields are integrated with 160 midpoint
Biot–Savart segments. The x-normal loop has analytic on-axis field
`B/I = mu0 R²/[2(R²+x²)^(3/2)]`; a test checks this independently.

The conventional VSM uses four ideal x-normal loop bundles at
`x = ±18 mm, y = ±12 mm`, radius 12 mm, 100 turns per bundle. Upper/lower
winding signs are opposite. The horizontal moment is parallel to the applied
field. The sample moves vertically:

`y(t) = y0 + A sin(2 pi f t)`

`epsilon(t) = -m K'(y) A 2 pi f cos(2 pi f t)`.

A central finite difference of 1 µm evaluates K'. Visible winding turns are
reduced. Motion in the overview is slowed and enlarged 30×. The reported
frequency and numerical voltage use the actual input values. The B-field arrows
do not solve magnetic-circuit behavior or predict sample magnetization.

The axial gradiometer has radius 10 mm, adjacent-plane spacing 15 mm and signed
weights `[+1,-2,+1]`. All numerical coil dimensions are assumed teaching values.
The response is a weighted sum of analytic axial circular-loop couplings.
Equal areas give `sum(w)=0` and `sum(w*y)=0`, cancelling an ideal uniform
axial field and a linear axial gradient. The simulated sample is a point dipole.

The axial SQUID-magnetometer overview uses moment 1e-8 A m². Its cryostat and winding shapes are
schematic. The displayed motion is slowed and enlarged 8×. Centered oscillation
through even K(y) produces a leading second harmonic. Offset breaks that
symmetry. DC-scan plots show position-dependent flux; neither graph is a
calibrated commercial instrument output. The graph labels remove only the DC
component in SQUID-VSM mode.

For the ideal superconducting flux transformer:

`I_pickup = -Phi_pickup/(L_pickup + L_input)`

`Phi_squid = M I_pickup`.

The workbench takes `L_pickup = 1 µH`, SQUID loop inductance `0.1 µH`,
`M = 0.01 sqrt(L_input * 0.1 µH)`, and moment `1e-8 A m²`.
Stray inductance and SQUID back-action are excluded. The displayed transfer is
its absolute magnitude, with a maximum near inductance matching.

## DC SQUID

`Phi0 = h/(2e)` uses exact SI h and e. For equal junction critical currents I0,
negligible loop inductance and overdamped RSJ dynamics:

`Ic(Phi) = 2 I0 |cos(pi Phi/Phi0)|`.

The voltage approximation is
`V = Rsh/2 * sqrt(Ib² - Ic(Phi)²)` for `Ib > 2 I0`. Both shunts have resistance
Rsh; their parallel effective value gives the factor 1/2. We set `I0 = 5 µA`.
Thermal noise, capacitance, finite loop screening and time-dependent Josephson
oscillations are not solved. Barrier thickness and all circuit geometry are
strongly enlarged.

## Flux feedback

This is an idealized periodic signed-error controller, independently of the
DC-SQUID RSJ voltage approximation. With cancellation command q in flux quanta:

`r = Phi_input/Phi0 - q`

`e(r) = sin(2 pi r)/(2 pi)`

`dq/dt = 2 pi fc e(r)`.

Euler integration uses 0.25 ms steps, much shorter than the selected loop time
scale. Feedback has a selected slew limit and ±5 Phi0 range. Small-signal
linearization gives a first-order closed-loop pole at `2 pi fc`. Large steps
can acquire an adjacent integer flux period while the periodic error is near
zero. A 1.2 Phi0 step demonstrates a 1 Phi0 reconstruction error. This is not a
commercial bandwidth, noise or flux-counter model.

The amplifier noise panel converts voltage-noise density through an assumed
SQUID slope: `S_phi^(1/2) = e_n/|V_phi|`. It excludes sensor noise and input
current noise. The three-dimensional capacitor illustrates charge storage; its
rendered geometry does not set the numerical controller bandwidth.

## Preamplifier and lock-in

The generic three-op-amp instrumentation diagram assumes matched first-stage
feedback resistors `R = 25 kOhm` and a unity-gain difference stage:
`G = 1 + 2R/Rg = 1 + 50 kOhm/Rg`. These resistor values are teaching choices.
A deliberately small ±10 mV output limit makes clipping observable.

The synthesized signal is `sqrt(2) A_rms cos(omega t + theta)` plus a deterministic
137 Hz interfering tone. It is amplified and clipped before mixing. Multipliers
use `sqrt(2) cos(omega t)` and `-sqrt(2) sin(omega t)`. First-order low-pass filters
use exact exponential step coefficients at 4000 samples/s:
`alpha = 1-exp(-dt/tau)`. Ideal input-referred DC components are
`X = A_rms cos(theta)`, `Y = A_rms sin(theta)`.
Readouts average the simulated 2.5–3.0 s window; slow filters can still be settling.
First-order equivalent noise bandwidth is `1/(4 tau)`. The interference is a
tone, not a white-noise process, so ENBW is explanatory rather than an empirical
noise estimate from this trace.

## RF-SQUID demonstration

The one-weak-link loop and tank illustrate an RF-SQUID architecture. The initial
20 MHz carrier, four RF stages, enclosure proportions and PCB placement are
assumed teaching choices, independent of any particular instrument.

The tuning chart assumes L = 1 µH, adjustable C, and
`f0 = 1/(2 pi sqrt(LC))`. A phenomenological loss law
`Q = 30/[1+0.25(1-cos(2 pi Phi/Phi0))]` produces a flux-dependent normalized
RF amplitude
`(Q/30)/sqrt(1+Q²(f/f0-f0/f)²)`.
This demonstrates tuning and RF amplitude detection, not a solution of the
hysteretic RF-SQUID dynamics. No numerical RF-SQUID transfer calibration is
claimed.

## General instrument assemblies

All exterior geometry is an illustrative functional arrangement. It does not
specify the dimensions, rated field, temperature range, PCB, service procedure
or internal layout of a commercial instrument.

The rock magnetometer has two teaching handlers: a 100-position square X–Y tray
and a 200-cup serpentine chain. Both retain the pickup, clearance and insertion
sequence. Frame dimensions and chain routing are illustrative.

The inductive VSM separates signal processing, vibration power and electromagnet
current into functional modules. Its initial 83 Hz reference is an assumed
teaching value. Isolation frame, head linkage, cabinet and bobbins are schematic.

The axial SQUID magnetometer uses a neutral enclosure and open electronics frame.
Its independently enlarged teaching insert is scaled by 0.7 within the scene;
this is not a dimensional CAD fit. Bath and helium-recondensing cryostats are
selectable conceptual arrangements. The latter adds a pulse-tube cold head,
compressor and shortened pressure lines. The sample chamber has its own thermal
path, separate from the cold magnet and sensor. Complete cryogenic operation is
not simulated. The computer has a decorative status trace, not a calculated
hysteresis loop or a reproduction of a commercial interface.

## Exploded-view presentation

Explode offsets are teaching layouts, not real assembly/disassembly paths.
SQUID-magnetometer front panels separate laterally and park toward the rear; side panels and
the lifted deck leave the front sample axis open. Cabinet covers move before
cryostat layers, with the solenoid separating later. The pickup windings stay
on the sample axis. The measurement-zone label also appears in an exploded
exterior. A SQUID close-up temporarily hides surrounding shields; moving
Explode or changing instrument view restores them.

VSM winding insulation moves first; excitation windings and their end
flanges move together toward the lower foreground, followed by pole pieces and
sense-coil pairs. This keeps the windings clear of the fixed electronics rack.
Rock-magnetometer shields separate to opposite sides/rear while its bore, sample and chosen
handler retain their operating alignment. Neither specimen changer is split into
loose cups or carriages by the cryostat explosion.

The shared Animate control starts at the current explosion pose and cycles
smoothly through assembly/separation, rather than jumping to a global clock
phase. These illustrative offsets do not change the numerical physics.
