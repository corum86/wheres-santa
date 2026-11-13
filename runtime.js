/* Where's Santa? — tiny template runtime for the standalone build.
   Renders the game's UI template ({{ expr }}, <sc-if>, <sc-for>, on* handlers, refs)
   and patches the page in place (keyed by template position), so elements keep focus,
   pointer capture, playing video and CSS animations between renders. */
(function () {
  'use strict';
  class DCLogic { constructor(props) { this.props = props || {}; this.state = {}; } setState(o) { const p = typeof o === 'function' ? o(this.state, this.props) : o; this.state = Object.assign({}, this.state, p); schedule(); } }
  window.DCLogic = DCLogic;
  const cache = new Map();
  const ev = (expr, scope) => { let f = cache.get(expr); if (!f) { f = new Function('s', 'with (s) { return (' + expr + '); }'); cache.set(expr, f); } try { return f(scope); } catch (e) { return undefined; } };
  const ONE = /^\s*\{\{\s*([\s\S]*?)\s*\}\}\s*$/;
  const interp = (str, scope) => str.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (m, e) => { const v = ev(e, scope); return v == null || v === false ? '' : String(v); });
  let uid = 0; const idOf = (n) => n.__dcId || (n.__dcId = 't' + (uid++));

  // template -> light virtual nodes
  function build(node, scope, out, suffix) {
    if (node.nodeType === 3) { const t = node.nodeValue; if (!t.trim() && t.indexOf('\n') >= 0 && !/\{\{/.test(t)) return; out.push({ text: interp(t, scope), key: idOf(node) + suffix }); return; }
    if (node.nodeType !== 1) return;
    const tag = node.localName;
    if (tag === 'sc-if') { const m = ONE.exec(node.getAttribute('value') || ''); if (m && ev(m[1], scope)) for (const c of node.childNodes) build(c, scope, out, suffix); return; }
    if (tag === 'sc-for') {
      const m = ONE.exec(node.getAttribute('list') || ''); const list = m ? ev(m[1], scope) : null; const as = node.getAttribute('as') || 'item';
      (list || []).forEach((it, i) => { const sc = Object.create(scope); sc[as] = it; sc.index = i; for (const c of node.childNodes) build(c, sc, out, suffix + '.' + i); });
      return;
    }
    const v = { tag, ns: node.namespaceURI, key: idOf(node) + suffix, attrs: {}, on: {}, ref: null, kids: [] };
    for (const a of Array.from(node.attributes)) {
      const name = a.name; if (name.startsWith('hint-')) continue; const m = ONE.exec(a.value);
      if (name === 'ref') { const f = m ? ev(m[1], scope) : null; if (typeof f === 'function') v.ref = f; continue; }
      if (/^on[a-z]/i.test(name) && m) { const f = ev(m[1], scope); if (typeof f === 'function') v.on[name.slice(2).toLowerCase()] = f; continue; }
      if (m) { const x = ev(m[1], scope); if (x === false || x == null) { if (name.startsWith('aria-')) v.attrs[name] = 'false'; } else if (x === true) v.attrs[name] = name.startsWith('aria-') ? 'true' : ''; else v.attrs[name] = String(x); }
      else v.attrs[name] = a.value.indexOf('{{') >= 0 ? interp(a.value, scope) : a.value;
    }
    for (const c of node.childNodes) build(c, scope, v.kids, suffix);
    out.push(v);
  }

  // patch real DOM to match
  function relay(e) { const h = this.__dcOn && this.__dcOn[e.type]; if (h) h.call(this, e); }
  function create(v) {
    if (v.text != null) { const t = document.createTextNode(v.text); t.__dcKey = v.key; return t; }
    const el = document.createElementNS(v.ns, v.tag); el.__dcKey = v.key; el.__dcOn = {};
    update(el, v, true); return el;
  }
  function update(el, v, fresh) {
    const old = el.__dcAttrs || {};
    for (const k in old) if (!(k in v.attrs)) el.removeAttribute(k);
    for (const k in v.attrs) if (old[k] !== v.attrs[k]) el.setAttribute(k, v.attrs[k]);
    el.__dcAttrs = v.attrs;
    for (const k in el.__dcOn) if (!(k in v.on)) delete el.__dcOn[k];
    for (const k in v.on) { if (!el.__dcBound) el.__dcBound = {}; if (!el.__dcBound[k]) { el.addEventListener(k, relay); el.__dcBound[k] = true; } el.__dcOn[k] = v.on[k]; }
    patchKids(el, v.kids);
    if (fresh && v.ref) el.__dcRef = v.ref;
  }
  function patchKids(parent, vkids) {
    const byKey = new Map(); for (const c of Array.from(parent.childNodes)) if (c.__dcKey) byKey.set(c.__dcKey, c);
    const fresh = [];
    let at = parent.firstChild;
    for (const v of vkids) {
      let el = byKey.get(v.key);
      if (el && (v.text != null ? el.nodeType !== 3 : (el.nodeType !== 1 || el.localName !== v.tag))) el = null;
      if (el) { byKey.delete(v.key); if (v.text != null) { if (el.nodeValue !== v.text) el.nodeValue = v.text; } else update(el, v, false); }
      else { el = create(v); if (el.__dcRef) fresh.push(el); }
      if (el !== at) parent.insertBefore(el, at); else at = at.nextSibling;
      at = el.nextSibling;
    }
    const extra = []; while (at) { if (at.__dcKey) extra.push(at); at = at.nextSibling; }
    for (const c of byKey.values()) if (c.parentNode === parent) c.remove();
    for (const c of extra) if (c.parentNode === parent) c.remove();
    for (const el of fresh) mounted.push(el);
  }
  let mounted = [];
  let comp = null, host = null, tpl = null, queued = false;
  function render() {
    queued = false; if (!comp) return;
    const vals = comp.renderVals(); const out = []; for (const c of tpl.content.childNodes) build(c, vals, out, '');
    mounted = []; patchKids(host, out);
    const m = mounted; mounted = []; for (const el of m) { const f = el.__dcRef; el.__dcRef = null; try { f(el); } catch (e) { console.error(e); } }
  }
  function schedule() { if (queued || !comp) return; queued = true; requestAnimationFrame(render); }
  window.dcBoot = function (Comp, props, hostEl, tplEl) {
    host = hostEl; tpl = tplEl; comp = window.comp = new Comp(props);
    render(); if (comp.componentDidMount) comp.componentDidMount(); schedule();
  };
})();
