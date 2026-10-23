# Magnetometry 3D

General educational Vite + Three.js models of automated rock magnetometry,
inductive vibrating-sample magnetometry and axial SQUID magnetometry. Instrument
names, model numbers, product-specific plaques and manufacturer links have been
removed from the current source. All instrument layouts are illustrative.

[Open Magnetometry 3D](https://duserzym.github.io/rock-magnetometry-3d/).
Source: [duserzym/rock-magnetometry-3d](https://github.com/duserzym/rock-magnetometry-3d).

## Run locally

Requires Node.js 22.12+ or a compatible current release.

```sh
npm ci
npm run dev -- --port 5198
```

Open <http://127.0.0.1:5198/>. Build: `npm run build`; checks: `npm test`.
No CDN, external font, API key, account or backend is required at runtime.

## Explore

| Scene | What you can inspect |
| --- | --- |
| `#scene=rock&changer=xy` | 100-position square X–Y stage; pickup, clearance, insertion, rotation and return |
| `#scene=rock&changer=snake` | 200 linked specimen cups and an empty-cup insertion path |
| `#scene=vsm` | Electromagnet, isolated vibration head, differential pickups, separate signal controller, drive amplifier and magnet supply |
| `#scene=squid-system` | Generic enclosure, cryostat, axial gradiometer, shielded SQUID, warm readout and separate thermal paths |
| `#scene=pickups` | Signed winding contributions, coupling, background rejection and inductance matching |
| `#scene=squid` | Two Josephson junctions, electrode/barrier layers, shunts and coupling windings |
| `#scene=fll` | Voltage preamp, error detector, capacitor integrator, feedback resistor and period ambiguity |
| `#scene=lockin` | Generic instrumentation amplifier, gain resistor, I/Q multiplication, filtering and clipping |
| `#scene=rf` | One-junction RF SQUID, resonant tank, illustrative RF gain chain and envelope detection |

VSM and SQUID-system scenes offer exterior and cutaway views. For example:
`#scene=squid-system&view=exterior&cooling=recondensing`.

Use Explode or E to separate parts. Click a component for its function and
camera-focus button. Drag to orbit, scroll to zoom, right-drag to pan. Labels,
housings, signal paths and glow are switchable. PNG exports the rendered model;
browser screenshots also include labels and panels. Shortcuts: E, Shift+E, L, X, B, R.

## Scientific scope

[SOURCES.md](SOURCES.md) lists independent scientific references for operating
principles. [MODEL.md](MODEL.md) records equations and assumptions. The panel
distinguishes principles from illustrative geometry and circuit parameters.

- Inductive VSM detects induced voltage; ideal pickup voltage vanishes without motion.
- Superconducting pickups can retain screening current with a stationary sample.
- Centered oscillation through an even axial coupling function gives a leading
  **2f** response; axial offset introduces f. DC scans record spatial response.
- RF and DC SQUIDs have different sensor and readout architectures.
- Sample temperature, superconducting detector temperature and warm electronics
  are separate physical environments. Helium recondensation is a conceptual option.
- Tray capacities, enclosure dimensions, winding counts, circuits and frequencies
  are teaching choices. These are functional diagrams rather than instrument CAD.

Calculations omit finite-sample corrections, material hysteresis, temperature
dependence of moment, field FEM, full cryogenic thermodynamics and complete
Josephson-device dynamics. Rendered winding counts can be reduced for clarity.

## Validation and provenance

Sixteen numerical checks cover coil fields, induction scaling, stationary flux,
background cancellation, axial harmonics, transformer sign, SQUID periodicity,
feedback capture, RMS demodulation, filtering, overload and vector rotation.
Browser coverage is recorded in [QA.md](QA.md).

Geometry, charts, teaching text and `public/icon.svg` are original code. The
application shell and style derive from the author's MIT-licensed `tims-3d`.
No source photographs, manuals, CAD or scanned diagrams are bundled. Scientific
references retain their own rights; they are not relicensed by this project.

The MIT project license and bundled dependency notices are included in the site.
See [PUBLIC_RELEASE_REVIEW.md](PUBLIC_RELEASE_REVIEW.md) for the current provenance
review. The public repository starts from the reviewed generic snapshot; earlier
instrument-specific drafts remain in local history.

## Deployment

The GitHub Actions workflow in `.github/workflows/pages.yml` installs locked
dependencies, runs the physics checks, builds for `/rock-magnetometry-3d/` and
deploys `dist` to GitHub Pages. Pushes to `main` publish automatically; the
workflow can also be run manually. Only the deployment job receives Pages write
permission. Local development continues to use the root URL.
