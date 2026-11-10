/* Be Happy Waffles · lógica del menú (sin librerías). */
(() => {
  'use strict';
  const D = window.DATOS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const pesos = (n) => '$' + n.toLocaleString('es-CO');
  const foto = (id, min) => `img/productos/${id}${min ? '-min' : ''}.webp`;
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Índice de productos
  const PROD = {};
  D.categorias.forEach((c) => c.grupos.forEach((g) => g.items.forEach((p) => { PROD[p.id] = { ...p, cat: c.id }; })));

  // Guardado local (puede fallar en modo privado: la página sigue funcionando)
  const guardar = (k, v) => { try { localStorage.setItem('bh-' + k, JSON.stringify(v)); } catch (e) {} };
  const leer = (k, def) => { try { const v = JSON.parse(localStorage.getItem('bh-' + k)); return v ?? def; } catch (e) { return def; } };
  let carrito = leer('carrito', {}); // { id: cantidad }
  let favs = new Set(leer('favs', []));
  Object.keys(carrito).forEach((id) => { if (!PROD[id] || !(carrito[id] > 0)) delete carrito[id]; });

  // ---------- Aviso corto ----------
  let tAviso;
  function aviso(txt) {
    const a = $('#aviso'); a.textContent = txt; a.classList.add('ver');
    clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('ver'), 1800);
  }

  // ---------- Abierto / cerrado (hora de Colombia) ----------
  function estado() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
    const finde = p.weekday === 'Sat' || p.weekday === 'Sun';
    const [ab, ci] = finde ? D.horario.sabDom : D.horario.lunVie;
    const ahora = +p.hour * 60 + +p.minute, m = (h) => +h.slice(0, 2) * 60 + +h.slice(3);
    const abierto = ahora >= m(ab) && ahora < m(ci);
    const hora12 = (h) => { const [H, M] = h.split(':').map(Number); return `${((H + 11) % 12) + 1}:${String(M).padStart(2, '0')} ${H < 12 ? 'a. m.' : 'p. m.'}`; };
    const e = $('#estado');
    const mananaFinde = p.weekday === 'Fri' || p.weekday === 'Sat';
    const abre = ahora < m(ab) ? ab : (mananaFinde ? D.horario.sabDom : D.horario.lunVie)[0];
    e.textContent = abierto ? `Abierto · cierra ${hora12(ci)}` : `Cerrado · abre ${ahora < m(ab) ? '' : 'mañana '}${hora12(abre)}`;
    e.classList.toggle('cerrado', !abierto);
  }

  // ---------- Inicio: tarjetas nube ----------
  $('#nubes').innerHTML = D.categorias.map((c, i) => `
    <button class="nube" style="--i:${i}" data-ir="${c.id}" aria-label="Ver ${esc(c.nombre)}">
      <span class="nube__foto"><img src="${foto(c.foto, true)}" alt="" loading="${i < 4 ? 'eager' : 'lazy'}" width="420" height="420"></span>
      <span class="nube__etq">${icono(c.icono)}<span>${esc(c.nombre)}</span>${icono('chev')}</span>
      <span class="nube__sub">${esc(c.sub)}</span>
    </button>`).join('');

  // ---------- Menú: chips + secciones ----------
  const precioHtml = (p) => (p.precioAntes ? `<s>${pesos(p.precioAntes)}</s> ` : '') + pesos(p.precio);
  const tarjeta = (p) => `
    <article class="prod" data-id="${p.id}">
      <button class="fav" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Guardar ${esc(p.nombre)} en favoritos">${icono('corazon')}</button>
      <button class="prod__abrir" data-ver="${p.id}" aria-label="Ver ${esc(p.nombre)}">
        <span class="prod__foto"><img src="${foto(p.id, true)}" alt="${esc(p.nombre)}" loading="lazy" width="420" height="420">${p.etiqueta ? `<span class="prod__etq">${esc(p.etiqueta)}</span>` : ''}</span>
        <span class="prod__txt"><span class="prod__nombre">${esc(p.nombre)}</span><span class="prod__desc">${esc(p.desc)}</span></span>
      </button>
      <div class="prod__pie"><span class="prod__precio">${precioHtml(p)}</span>
        <button class="macaron" data-sumar="${p.id}" aria-label="Agregar ${esc(p.nombre)} al pedido"><span>+</span></button></div>
    </article>`;
  $('#chips').innerHTML = D.categorias.map((c) => `<button class="chip" data-chip="${c.id}">${esc(c.nombre)}</button>`).join('');
  $('#secciones').innerHTML = D.categorias.map((c) => `
    <section class="seccion" id="sec-${c.id}" aria-labelledby="h-${c.id}">
      <h2 class="seccion__titulo" id="h-${c.id}">${esc(c.nombre)}</h2>
      <p class="seccion__sub">${esc(c.sub)}</p>
      ${c.grupos.map((g) => `${g.titulo ? `<h3 class="grupo">${esc(g.titulo)}</h3>` : ''}<div class="productos">${g.items.map(tarjeta).join('')}</div>`).join('')}
    </section>`).join('');

  // ---------- Promo y recomendados ----------
  const mini = (p) => `
    <div class="sug"><button class="sug__ver" data-ver="${p.id}" aria-label="Ver ${esc(p.nombre)}"><img src="${foto(p.id, true)}" alt="" loading="lazy" width="420" height="420">
      <span><b>${esc(p.nombre)}</b><small>${precioHtml(p)}</small></span></button>
      <button class="macaron" data-sumar="${p.id}" aria-label="Agregar ${esc(p.nombre)} al pedido"><span>+</span></button></div>`;
  if (D.promo && PROD[D.promo.id]) {
    const p = PROD[D.promo.id];
    $$('.promo-slot').forEach((el) => { el.innerHTML = `
      <aside class="promo" aria-label="${esc(D.promo.titulo)}">
        <button class="promo__foto" data-ver="${p.id}" aria-label="Ver ${esc(p.nombre)}"><img src="${foto(p.id, true)}" alt="${esc(p.nombre)}" width="420" height="420"></button>
        <div class="promo__txt"><span class="promo__etq">Promo</span><b>${esc(D.promo.titulo)}</b><p>${esc(D.promo.texto)}</p>
          <p class="promo__precio">${precioHtml(p)}</p>
          <button class="btn btn--pastel" data-sumar="${p.id}">${esc(D.promo.boton)}</button></div>
      </aside>`; });
  }
  if (D.recomendados) {
    const R = D.recomendados;
    $$('.reco-slot').forEach((el) => { el.innerHTML = `
      <section class="reco" aria-label="${esc(R.titulo)}">
        <h2 class="seccion__titulo">${esc(R.titulo)}</h2><p class="seccion__sub">${esc(R.sub)}</p>
        <div class="reco__fila">${R.items.filter((r) => PROD[r.id]).map((r) => { const p = PROD[r.id]; return `
          <article class="reco__card">
            <button class="reco__foto" data-ver="${p.id}" aria-label="Ver ${esc(p.nombre)}"><img src="${foto(p.id, true)}" alt="${esc(p.nombre)}" loading="lazy" width="420" height="420"><span class="prod__etq">${esc(r.etiqueta)}</span></button>
            <div class="reco__txt"><b>${esc(p.nombre)}</b><p>${esc(r.texto)}</p>
              <div class="prod__pie"><span class="prod__precio">${precioHtml(p)}</span><button class="macaron" data-sumar="${p.id}" aria-label="Agregar ${esc(p.nombre)} al pedido"><span>+</span></button></div></div>
          </article>`; }).join('')}</div>
      </section>`; });
  }

  function marcarChip(id) {
    $$('.chip').forEach((b) => {
      const on = b.dataset.chip === id; b.setAttribute('aria-current', on);
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }
  const obs = new IntersectionObserver((ent) => {
    const v = ent.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (v && !$('#v-menu').hidden) marcarChip(v.target.id.slice(4));
  }, { rootMargin: '-150px 0px -55% 0px' });
  $$('.seccion').forEach((s) => obs.observe(s));
  function irSeccion(id, suave = true) {
    const s = $('#sec-' + id); if (!s) return;
    marcarChip(id);
    s.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
  }

  // ---------- Favoritos ----------
  function pintarFavs() {
    const ids = [...favs].filter((id) => PROD[id]);
    $('#listaFav').innerHTML = ids.map((id) => tarjeta(PROD[id])).join('');
    $('#favVacio').hidden = ids.length > 0;
  }
  function alternarFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    guardar('favs', [...favs]);
    $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', favs.has(id)));
    aviso(favs.has(id) ? 'Guardado en favoritos ♥' : 'Quitado de favoritos');
    if (!$('#v-favoritos').hidden) pintarFavs();
  }

  // ---------- Navegación (Inicio · Menú · Favoritos · Contacto) ----------
  const VISTAS = ['inicio', 'menu', 'favoritos', 'contacto'];
  function mostrar() {
    let [v, sec] = (location.hash.slice(1) || 'inicio').split('/');
    // Enlace directo a un producto: #producto/waffle-happy
    if (v === 'producto' && PROD[sec]) { const id = sec; v = 'menu'; sec = PROD[id].cat; setTimeout(() => abrirProducto(id), 250); }
    const vista = VISTAS.includes(v) ? v : 'inicio';
    VISTAS.forEach((x) => { $('#v-' + x).hidden = x !== vista; });
    $$('.navbar a').forEach((a) => { if (a.dataset.v === vista) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (vista === 'favoritos') pintarFavs();
    if (vista === 'menu' && sec) requestAnimationFrame(() => irSeccion(sec, false));
    else window.scrollTo({ top: 0 });
    if (vista === 'menu' && !sec) marcarChip(D.categorias[0].id);
  }
  window.addEventListener('hashchange', mostrar);

  // ---------- Detalle del producto ----------
  const dlgP = $('#dlgProducto');
  let actual = null, cant = 1;
  function abrirProducto(id) {
    const p = PROD[id]; if (!p) return;
    actual = p; cant = 1;
    $('#pFoto').src = foto(id); $('#pFoto').alt = p.nombre;
    $('#pNombre').textContent = p.nombre; $('#pDesc').textContent = p.desc;
    $('#pEtq').textContent = p.etiqueta; $('#pPrecio').innerHTML = precioHtml(p);
    pintarCant(); dlgP.showModal();
  }
  function pintarCant() { $('#pCant').textContent = cant; $('#pAgregar').textContent = `Agregar · ${pesos(actual.precio * cant)}`; }
  $('#pMenos').onclick = () => { if (cant > 1) { cant--; pintarCant(); } };
  $('#pMas').onclick = () => { if (cant < 20) { cant++; pintarCant(); } };
  $('#pAgregar').onclick = () => { dlgP.close(); sumar(actual.id, cant); };

  // ---------- Carrito ----------
  const dlgC = $('#dlgCarrito');
  function sumar(id, n = 1) {
    carrito[id] = Math.min(20, (carrito[id] || 0) + n);
    if (carrito[id] <= 0) delete carrito[id];
    guardar('carrito', carrito); pintarCarrito();
    if (n > 0) ofrecerAcompanar(id);
    if (n > 0) { aviso(`${PROD[id].nombre} agregado`); const b = $('#abrirCarrito'); b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }
  }
  // ¿Lo acompañas? Solo al agregar un plato fuerte, si aún no hay bebida, una vez por visita
  const dlgA = $('#dlgAcompanar');
  let yaOfrecido = false;
  function ofrecerAcompanar(id) {
    const A = D.acompanar; if (!A || yaOfrecido || !A.tras.includes(PROD[id].cat)) return;
    if (Object.keys(carrito).some((k) => ['bebidas', 'cafes'].includes(PROD[k].cat))) return;
    yaOfrecido = true;
    $('#tAcomp').textContent = A.titulo;
    $('#acompItems').innerHTML = A.ofrecer.filter((k) => PROD[k]).map((k) => mini(PROD[k])).join('');
    setTimeout(() => { if (!dlgP.open && !dlgC.open) dlgA.showModal(); }, 450);
  }
  // Sugerencias en el pedido: una por categoría que aún no tenga (bebidas, cafés, postres)
  function pintarSugerencias(ids) {
    const S = D.sugerencias, el = $('#sugerir'); if (!S || !ids.length) { el.innerHTML = ''; return; }
    const tiene = new Set(ids), tieneCat = new Set(ids.map((k) => PROD[k].cat));
    const preferidos = new Set([...(D.recomendados ? D.recomendados.items.map((r) => r.id) : []), D.promo && D.promo.id]);
    const todos = Object.values(PROD), sug = [];
    S.categorias.forEach((c) => {
      if (tieneCat.has(c)) return;
      const p = todos.find((x) => x.cat === c && !tiene.has(x.id) && preferidos.has(x.id)) || todos.find((x) => x.cat === c && !tiene.has(x.id));
      if (p) sug.push(p);
    });
    el.innerHTML = sug.length ? `<h3 class="grupo">${esc(S.titulo)}</h3>${sug.slice(0, S.max).map(mini).join('')}` : '';
  }
  function pintarCarrito() {
    const ids = Object.keys(carrito);
    const n = ids.reduce((a, id) => a + carrito[id], 0);
    const total = ids.reduce((a, id) => a + carrito[id] * PROD[id].precio, 0);
    $('#nCarrito').textContent = n;
    $('#abrirCarrito').setAttribute('aria-label', `Ver mi pedido (${n} productos)`);
    $('#lineas').innerHTML = ids.map((id) => `
      <li class="linea"><img src="${foto(id, true)}" alt="">
        <div><b>${esc(PROD[id].nombre)}</b><small>${pesos(PROD[id].precio * carrito[id])}</small></div>
        <div class="cantidad"><button data-linea="${id}" data-d="-1" aria-label="Quitar uno de ${esc(PROD[id].nombre)}">−</button><output>${carrito[id]}</output><button data-linea="${id}" data-d="1" aria-label="Agregar uno de ${esc(PROD[id].nombre)}">+</button></div>
      </li>`).join('');
    $('#total').textContent = pesos(total);
    $('#carritoVacio').hidden = n > 0;
    $('#formPedido').hidden = n === 0;
    pintarSugerencias(ids);
  }
  $('#abrirCarrito').onclick = () => { pintarCarrito(); dlgC.showModal(); };

  $('#formPedido').addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = Object.keys(carrito); if (!ids.length) return;
    const nombre = $('#fNombre').value.trim(); if (!nombre) { $('#fNombre').focus(); return; }
    guardar('nombre', nombre);
    const modo = $('input[name="modo"]:checked').value, nota = $('#fNota').value.trim();
    const total = ids.reduce((a, id) => a + carrito[id] * PROD[id].precio, 0);
    const msg = ['¡Hola Be Happy! 🧇 Quiero hacer este pedido:', '',
      ...ids.map((id) => `• ${carrito[id]} x ${PROD[id].nombre} — ${pesos(carrito[id] * PROD[id].precio)}`), '',
      `*Total: ${pesos(total)}*`, `Nombre: ${nombre}`, `Para: ${modo}`, nota ? `Nota: ${nota}` : null, 'Pago en el local.'].filter((l) => l !== null).join('\n');
    window.open(`https://wa.me/${D.negocio.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
  $('#fNombre').value = leer('nombre', '');

  // ---------- Clics (un solo escuchador) ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ir],[data-chip],[data-ver],[data-sumar],[data-fav],[data-linea],[data-cerrar]');
    if (!t) return;
    if (t.dataset.ir) location.hash = 'menu/' + t.dataset.ir;
    else if (t.dataset.chip) irSeccion(t.dataset.chip);
    else if (t.dataset.ver) abrirProducto(t.dataset.ver);
    else if (t.dataset.sumar) { const enA = t.closest('#dlgAcompanar'); sumar(t.dataset.sumar, 1); if (enA) dlgA.close(); }
    else if (t.dataset.fav) alternarFav(t.dataset.fav);
    else if (t.dataset.linea) sumar(t.dataset.linea, +t.dataset.d);
    else if (t.hasAttribute('data-cerrar')) t.closest('dialog').close();
  });
  // Cerrar las hojas tocando fuera
  [dlgP, dlgC, dlgA].forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  // ---------- Contacto ----------
  $('#lnkWa').href = `https://wa.me/${D.negocio.whatsapp}?text=${encodeURIComponent('¡Hola Be Happy! 🧇')}`;
  $('#lnkMapa').href = D.negocio.mapa;
  $('#lnkIg').href = `https://instagram.com/${D.negocio.instagram}`;
  $('#txtWa').textContent = D.negocio.whatsappVisible;

  estado(); setInterval(estado, 60000);
  pintarCarrito();
  mostrar();
})();
