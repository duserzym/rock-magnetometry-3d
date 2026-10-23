# Local preview validation

Checked 23 October 2026. The generic preview was reviewed locally before the
user authorized public release. GitHub Actions repeats the physics checks and
production build before publishing.

## Current generic version

- `npm test`: all 16 existing numerical physics checks pass.
- `npm run build`: all 37 modules build successfully.
- All eight scenes load in the in-app browser. The separate fresh QA tab
  records no browser warnings or errors.
- Instrument navigation, headings, plaques, controls, component descriptions,
  notices, metadata and source links use general measurement-method names.
  Current source and production output were scanned for superseded commercial
  names, model identifiers and manufacturer domains.
- Automated rock magnetometer: both the 100-position square X–Y stage and the
  200-cup chain render with the cryostat exploded. The changer selector updates
  its label and URL; handling motion can be paused. Neither tray is split into
  loose parts by the explosion.
- Inductive VSM: the neutral head cover and functional signal, vibration-drive
  and magnet-supply modules render. Full explosion keeps the excitation windings
  and end flanges clear of the console. Default ideal pickup output remains
  0.782 µV RMS at the assumed 83 Hz reference.
- Axial SQUID magnetometer: the neutral enclosure and open electronics frame
  render in exterior/recondensing view. At 80% explosion, front panels, deck
  and cryostat layers leave the measurement coils visible. The centered
  oscillation readout still reports a leading 2f response.
- Pickup, DC-SQUID, flux-feedback, lock-in and RF-SQUID workbenches load their
  general principle/assumption panels and independent scientific references.
  Lock-in defaults remain X = 0.819 µV, Y = 0.573 µV and R = 1.000 µV RMS.
- MIT project and third-party copyright notices are retained. No manufacturer
  manuals, drawings or binary assets have been added.

## Existing physics and interaction coverage

The 16 automated checks cover circular-loop fields, VSM frequency scaling,
stationary superconducting flux, background cancellation, axial harmonics and
centering, transformer sign, flux quantum, SQUID periodicity, feedback capture
and wrong-period failure, I/Q RMS conventions, filtering, overload and rotation.

Earlier local browser checks also covered mobile navigation, zero-frequency
inductive response, offset/DC/static modes, gradiometer balance, junction-layer
explosion, feedback presets, amplifier clipping, resonator tuning, component
focus and continuous automatic explosion. The current edits preserve those
calculations and explosion paths. This validation does not compare the models
against measured instrument performance or manufacturing CAD.

## Release preparation

The release build uses the `/rock-magnetometry-3d/` asset base. Public source
starts from a clean root snapshot; earlier local draft history is excluded.
GitHub Pages deploys only `dist`, including the project license, third-party
notices and original icon.
