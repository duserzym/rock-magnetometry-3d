import { section, para, sources, note, h, buttons } from '../core/ui.js';
// Scientific references support principles, not a particular instrument layout.
const superconductivity = { label: 'Applied superconductivity · course notes', url: 'https://ocw.mit.edu/courses/6-763-applied-superconductivity-fall-2005/' };
export const S = {
 handling: { label: 'Automated specimen handling · research paper', url: 'https://doi.org/10.1029/2007GC001856' },
 vsm: { label: 'Vibrating-sample magnetometry · original paper', url: 'https://doi.org/10.1063/1.1716679' },
 squid: { label: 'DC-SQUID operating principles', url: 'https://www.ims.kit.edu/english/2056.php' },
 jj: superconductivity,
 fll: superconductivity,
 ina: { label: 'Instrumentation amplifiers · course', url: 'https://ocw.tudelft.nl/course-lectures/instrumentation-amplifiers/' },
 lockin: { label: 'Phase-sensitive detection · teaching experiment', url: 'https://courses.washington.edu/phys431/lock-in/lock-in.php' },
 rf: superconductivity,
};
export function card(title, ...children) { const c = section(title); c.body.append(...children); return c; }
export function evidence(verified, assumed, refs) {
 return card('Principles & model limits', para('<span class="tag v">Principle</span> ' + verified), para('<span class="tag a">Schematic</span> ' + assumed), sources(refs)).el;
}
export function intro(kicker, text) { return card(kicker, para(text)).el; }
export function equation(text) { return h('div', { class: 'equation', html: text }); }
export function jump(id, text) { return h('a', { class: 'scene-link', href: '#scene=' + id }, text + ' ↗'); }
export function focusButtons(app, items, beforeFocus = null) { return buttons(items.map(([label, obj]) => ({ label, onClick: () => { beforeFocus?.(obj); app.select(obj); app.focusOn(obj); } }))).el; }
export function statusOverlay(ctx, title, subtitle) {
 const el = h('div', {}, h('b', {}, title), h('div', { class: 'overlay-sub' }, subtitle)); ctx.overlay(el); return el;
}
export const fmt = (x, digits = 2) => Number(x).toFixed(digits);

export function setSceneParams(values) {
 const params = new URLSearchParams(location.hash.slice(1));
 for (const [key, value] of Object.entries(values)) params.set(key, value);
 history.replaceState(null, '', '#' + params.toString());
}
