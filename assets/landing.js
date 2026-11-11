/* Metanor Clinic Suite landing page: language, packages, the walkthrough and the inquiry form.
   Runs before the kit's modules, so the words are in place before the moments split them. */
(function () {
  const I = window.SUITE_I18N;
  const root = document.documentElement;
  const lang = ['en', 'ar', 'bn'].includes(root.lang) ? root.lang : 'en';
  const $ = id => document.getElementById(id);
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const ui = I.ui[lang];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- words */
  if (lang !== 'en') {
    const d = I[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = d[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { const v = d[el.dataset.i18nAria]; if (v) el.setAttribute('aria-label', v); });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => { const v = d[el.dataset.i18nAlt]; if (v) el.alt = v; });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { const v = d[el.dataset.i18nPh]; if (v) el.placeholder = v; });
  }
  document.querySelectorAll('[data-lang-name]').forEach(el => { el.textContent = I.names[lang]; });
  document.querySelectorAll('.hero [data-pick]').forEach(el => el.classList.toggle('is-picked', el.dataset.pick === lang));

  /* ---- language chooser: on the first visit, and from the bar */
  const dlg = $('chooser');
  const save = l => { try { localStorage.setItem('clinicSuiteLang', l); } catch (e) {} };
  dlg.querySelectorAll('[data-choose]').forEach(b => {
    b.setAttribute('aria-current', String(b.dataset.choose === lang));
    b.onclick = () => {
      const l = b.dataset.choose;
      save(l);
      if (l !== lang) location.reload(); else dlg.close();
    };
  });
  dlg.addEventListener('cancel', () => save(lang));
  dlg.addEventListener('click', e => { if (e.target === dlg) { save(lang); dlg.close(); } });
  document.querySelectorAll('[data-open-chooser]').forEach(b => { b.onclick = () => dlg.showModal(); });
  let saved = false; try { saved = !!localStorage.getItem('clinicSuiteLang'); } catch (e) {}
  // ?lang=xx shows the page in that language without asking; ?choose always asks.
  const fixed = /[?&]lang=(en|ar|bn)(?![a-z])/.test(location.search);
  if (((!saved && !fixed) || /[?&]choose(?![a-z])/.test(location.search)) && dlg.showModal) dlg.showModal();

  /* ---- walkthrough: the patient's WhatsApp, the handover, the staff reply */
  const F = I.flow[lang], phone = $('flowPhone'), list = $('flowList'), thread = $('flowThread'), head = $('flowHead'), field = $('flowField'), send = $('flowSend');
  const con = $('console'), stage = $('stage2'), steps = [...document.querySelectorAll('#steps [data-step]')];
  const mobile = () => matchMedia('(max-width: 639px)').matches;
  field.dataset.ph = F.ph;
  let run = 0, anim = true;
  const STOP = Symbol('stop');
  const wait = async (ms, id) => { if (anim && ms) await new Promise(r => setTimeout(r, ms)); if (id !== run) throw STOP; };
  const add = (box, el) => { if (anim) el.classList.add('is-new'); box.append(el); };
  function bubble(kind, text, from) {
    const b = make('div', 'bubble bubble--' + kind); b.dir = 'auto';
    if (from) b.append(make('span', 'bubble__from', from));
    b.append(document.createTextNode(text));
    return b;
  }
  async function botSay(text, id) {
    if (anim) { const t = make('div', 'typing'); t.innerHTML = '<i></i><i></i><i></i>'; phone.append(t); await wait(900, id); t.remove(); }
    add(phone, bubble('bot', text));
  }
  const tmsg = (kind, who, text) => { const m = make('div', 'tmsg tmsg--' + kind); m.dir = 'auto'; m.append(make('small', '', who), document.createTextNode(text)); return m; };
  function row(r, cls) { const el = make('div', 'row' + (cls ? ' ' + cls : '')); el.append(make('b', '', r[0]), make('span', '', r[1]), make('em', '', r[2])); return el; }
  function view(v) {
    stage.dataset.view = v;
    stage.querySelectorAll('.stage2__tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  }
  stage.querySelectorAll('.stage2__tabs button').forEach(b => { b.onclick = () => view(b.dataset.view); });
  function mark(k) { steps.forEach((b, i) => { b.toggleAttribute('aria-current', false); if (i === k) b.setAttribute('aria-current', 'step'); b.classList.toggle('is-past', i < k); }); }
  function reset() {
    phone.replaceChildren(); thread.replaceChildren(make('p', 'thread__empty', F.empty)); head.textContent = '';
    list.replaceChildren(...F.rows.map(r => row(r))); field.textContent = ''; con.classList.add('is-idle'); view('phone');
  }
  let newRow = null;
  const STEPS = [
    async id => {
      const pick = bubble('bot', I.flow.pick); const chips = make('span', 'bubble__chips');
      [['en', 'English'], ['ar', 'العربية'], ['bn', 'বাংলা']].forEach(([k, n]) => { const c = make('span', '', n); c.dataset.k = k; chips.append(c); });
      pick.append(chips); add(phone, pick);
      await wait(1100, id);
      chips.querySelector(`[data-k="${lang}"]`).classList.add('is-picked');
      await wait(700, id);
      add(phone, bubble('me', F.q1));
    },
    async id => { await botSay(F.a1, id); },
    async id => {
      add(phone, bubble('me', F.q2)); await wait(500, id);
      await botSay(F.a2, id); await wait(700, id);
      if (anim && mobile()) { view('staff'); await wait(400, id); }
      con.classList.remove('is-idle');
      newRow = row(F.newRow, 'is-staff'); list.prepend(newRow); if (anim) newRow.classList.add('is-new');
      await wait(500, id);
      newRow.classList.add('is-open');
      head.innerHTML = ''; head.append(make('b', '', F.head));
      thread.replaceChildren(tmsg('patient', F.patient, F.q1), tmsg('bot', F.bot, F.a1), tmsg('patient', F.patient, F.q2), tmsg('bot', F.bot, F.a2));
      add(thread, make('div', 'tmsg tmsg--flag', F.flag));
    },
    async id => {
      if (mobile()) view('staff');
      field.classList.add('is-typing');
      if (anim) { for (let i = 1; i <= F.staffReply.length; i += 2) { field.textContent = F.staffReply.slice(0, i); await wait(28, id); } }
      field.textContent = F.staffReply; field.classList.remove('is-typing');
      await wait(400, id);
      send.classList.add('is-press'); await wait(160, id); send.classList.remove('is-press');
      field.textContent = '';
      add(thread, tmsg('staff', F.staff, F.staffReply));
      if (newRow) { newRow.classList.remove('is-staff'); newRow.querySelector('em').textContent = F.replied; }
      await wait(900, id);
      if (anim && mobile()) { view('phone'); await wait(300, id); }
      add(phone, bubble('staff', F.staffReply, F.staff));
    }
  ];
  async function play(from, to, animated) {
    const id = ++run;
    try {
      anim = false; reset(); newRow = null;
      for (let i = 0; i < from; i++) await STEPS[i](id);
      anim = animated && !reduced;
      for (let i = from; i <= to; i++) { mark(i); await STEPS[i](id); await wait(i < to ? 1300 : 0, id); }
      if (!anim && mobile()) view(to >= 2 && to < 3 ? 'staff' : 'phone');
    } catch (e) { if (e !== STOP) throw e; }
  }
  steps.forEach((b, i) => { b.onclick = () => play(i, i, true); });
  $('replay').onclick = () => play(0, 3, true);
  reset(); mark(-1);
  if (reduced) play(0, 3, false);
  else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); play(0, 3, true); } }, { threshold: 0.2 });
    io.observe($('flow'));
  } else play(0, 3, false);

  /* ---- inquiry: setup or bespoke, sent through the visitor's email app */
  const wrap = $('inqWrap'), form = $('inqForm');
  form.dataset.fix = lang === 'bn' ? '{n}টি ঘর ঠিক করতে হবে।' : lang === 'ar' ? 'عدد الحقول التي تحتاج إلى تصحيح: {n}' : '{n} fields to fix.';
  const kind = () => form.querySelector('input[name="kind"]:checked').value;
  form.querySelectorAll('input[name="kind"]').forEach(r => r.addEventListener('change', () => { wrap.dataset.kind = kind(); }));
  document.querySelectorAll('[data-inquiry]').forEach(a => a.addEventListener('click', () => {
    const r = form.querySelector(`input[name="kind"][value="${a.dataset.inquiry}"]`);
    if (r) { r.checked = true; wrap.dataset.kind = r.value; }
  }));
  form.addEventListener('submit', e => {
    if (!form.checkValidity()) return;   // system.js marks the fields to fix
    e.preventDefault();
    const v = n => (form.elements[n] && form.elements[n].value || '').trim();
    const sel = n => { const s = form.elements[n]; return s ? s.options[s.selectedIndex].value : ''; };
    const bespoke = kind() === 'bespoke';
    const lines = [
      `Inquiry: ${bespoke ? 'Something else' : 'Clinic setup (website, booking platform, WhatsApp, staff training)'}`,
      `Name: ${v('name')}`, `Clinic: ${v('clinic')}`, `Email: ${v('email')}`, `Clinic size: ${sel('size')}`,
      bespoke ? `Needs: ${sel('area')}` : null,
      `Page language: ${I.names[lang]}`, '', v('message')
    ].filter(x => x !== null);
    const subject = `${bespoke ? ui.subjBespoke : ui.subjSetup}: ${v('clinic')}`;
    location.href = `mailto:contact@metanor.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    setTimeout(() => { const s = form.querySelector('[data-form-status]'); if (s) s.textContent = ui.opened; }, 50);
  });
})();
