/* Demo interactiva: réplica visual del sistema, 100 % en el navegador. No usa servidor ni datos reales. */
(function () {
  'use strict';
  const D = window.Demo;
  const KEY = 'yesotec-demo-v2';
  const BP = D.BP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Estado ----------
  let S = cargar();
  let rol = 'admin';
  try { rol = localStorage.getItem(KEY + '-rol') || 'admin'; } catch (e) {}
  function cargar() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.cfg && j.productos) return j; } catch (e) {} return D.semilla(); }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const lista = (id) => S.listas.find((l) => l.id === id) || { id: '', nombre: 'Sin lista', proveedor: '', moneda: 'ARS', d1: 0, d2: 0, flete: 0 };
  const pr = (p) => D.precio(p, S.cfg, lista(p.listaId));
  const yo = () => D.USUARIOS[rol];
  const cuando = (iso) => D.fechaHora(iso);
  // Deja constancia de quién y cuándo tocó precios (global y, si se indica, en el producto).
  function marcarPrecio(detalle, p) {
    const en = D.ahoraISO();
    S.precioLog = { por: yo(), en, detalle };
    if (p) p.act = { por: yo(), en };
  }
  const quien = (por, en) => `<span class="badge">${esc(por || '—')} · ${cuando(en)}</span>`;
  const prod = (id) => S.productos.find((p) => p.id === id);
  const veCostos = () => rol === 'admin' || (rol === 'ventas' && S.cfg.ventasVeCostos);

  // ---------- Navegación y permisos ----------
  const NAV = [
    { k: 'inicio', t: 'Inicio', r: ['admin', 'ventas', 'deposito'] },
    { sec: 'Ventas' },
    { k: 'pedidos', t: 'Pedidos', r: ['admin', 'ventas'] },
    { k: 'remitos', t: 'Remitos', r: ['admin', 'ventas'] },
    { k: 'presupuestos', t: 'Presupuestos', r: ['admin', 'ventas'] },
    { k: 'cotizador', t: 'Cotizador', r: ['admin', 'ventas'] },
    { k: 'clientes', t: 'Clientes', r: ['admin', 'ventas'] },
    { k: 'facturacion', t: 'Facturación', r: ['admin'] },
    { sec: 'Catálogo' },
    { k: 'productos', t: 'Productos', r: ['admin', 'ventas'] },
    { k: 'listas', t: 'Listas de precios', r: ['admin'] },
    { k: 'importar', t: 'Importar lista', r: ['admin'] },
    { k: 'stock', t: 'Stock', r: ['admin', 'deposito'] },
  ];
  const ROL_T = { admin: 'Administrador', ventas: 'Ventas', deposito: 'Depósito' };
  const puede = (k) => { const n = NAV.find((x) => x.k === k); return !n || n.r.includes(rol); };

  function parseHash() {
    const h = (location.hash || '#/inicio').replace(/^#\//, '').split('/');
    return { k: h[0] || 'inicio', a: h[1], b: h[2] };
  }
  function ir(h) { location.hash = h; }

  function renderSide(k) {
    const pend = S.solicitudes.filter((s) => s.estado === 'pendiente').length;
    let html = '<div class="logo">Tu Negocio</div>';
    NAV.forEach((n) => {
      if (n.sec) { html += `<div class="sec">${n.sec}</div>`; return; }
      if (!n.r.includes(rol)) return;
      const cnt = n.k === 'facturacion' && pend ? `<span class="cnt">${pend}</span>` : '';
      html += `<a href="#/${n.k}" class="${k === n.k ? 'on' : ''}">${n.t}${cnt}</a>`;
    });
    html += `<div class="quien"><b>${esc(yo())}</b><div class="muted small">${ROL_T[rol]}</div></div>`;
    $('#side').innerHTML = html;
    $('#side').classList.remove('open');
  }

  // ---------- Utilidades de UI ----------
  let tt;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.remove('hide');
    clearTimeout(tt); tt = setTimeout(() => t.classList.add('hide'), 2600);
  }
  function cerrarModal() { const o = $('#modal'); if (o) o.remove(); }
  function abrirModal(html) {
    cerrarModal();
    const o = document.createElement('div'); o.className = 'modal-bg'; o.id = 'modal';
    o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    o.addEventListener('mousedown', (e) => { if (e.target === o) cerrarModal(); });
    document.body.appendChild(o);
    const f = o.querySelector('input:not([type=radio]),select'); if (f) f.focus();
    return o;
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });
  const badge = (txt, tono) => `<span class="badge ${tono || ''}">${esc(txt)}</span>`;
  const head = (t, d, acc) => `<div class="head"><div><h1>${t}</h1>${d ? `<p>${d}</p>` : ''}</div><div class="row">${acc || ''}</div></div>`;
  const num = (tipo, n, extra) => `${tipo === 'p' ? 'P' : tipo === 'r' ? 'R' : 'N'}-${String(n).padStart(5, '0')}${extra || ''}`;
  const dec = (s) => { // "1.234,56" / "12,5" / "12.5"
    let t = String(s).trim().replace(/[$\s%]/g, ''); if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    const n = Number(t); return isFinite(n) ? n : null;
  };
  const cantTxt = (q) => String(q).replace('.', ',');

  // ---------- Cálculos de documentos ----------
  function totales(d) {
    const sub = d.items.reduce((s, i) => s + Math.round(i.qty * i.precio), 0);
    const descuento = Math.round((sub * (d.descBp || 0)) / BP);
    const total = sub - descuento + (d.envioCent || 0);
    const costo = d.items.reduce((s, i) => s + Math.round(i.qty * (i.costo || 0)), 0);
    const neto = Math.round((sub - descuento) / (1 + S.cfg.ivaBp / BP));
    return { sub, descuento, total, ganancia: neto - costo, sobreCostoBp: costo > 0 ? ((neto - costo) / costo) * BP : null };
  }
  const vencido = (p) => ['borrador', 'enviado'].includes(p.estado) && p.vence && p.vence < D.hoyISO();
  const entregadoPor = (ped) => {
    const m = {}; S.remitos.filter((r) => r.pedidoId === ped.id && r.estado === 'emitido').forEach((r) => r.items.forEach((i) => { m[i.idx] = (m[i.idx] || 0) + i.qty; }));
    return m;
  };
  const unidades = (q) => Math.ceil(q - 1e-9);
  function moverStock(pid, delta, tipo, motivo) {
    const p = prod(pid); if (!p) return;
    p.stock += delta;
    S.mov.unshift({ id: uid('m'), fecha: D.hoyISO(), en: D.ahoraISO(), por: yo(), pid, tipo, cant: Math.abs(delta), motivo, result: p.stock });
  }
  function estadoPedido(e) { return { nuevo: ['Nuevo', 'warn'], confirmado: ['Confirmado', 'info'], preparando: ['Preparando', 'info'], entregado: ['Entregado', 'ok'], cancelado: ['Cancelado', 'dan'] }[e]; }
  function estadoPres(p) {
    if (vencido(p)) return ['Vencido', 'dan'];
    return { borrador: ['Borrador', ''], enviado: ['Enviado', 'info'], aceptado: ['Aceptado', 'ok'], rechazado: ['Rechazado', 'dan'] }[p.estado];
  }
  const stockEstado = (p) => (p.stock <= 0 ? ['Sin stock', 'dan'] : p.minimo > 0 && p.stock <= p.minimo ? ['Bajo mínimo', 'warn'] : ['OK', 'ok']);

  // ---------- Páginas ----------
  const paginas = {};

  paginas.inicio = () => {
    if (rol === 'deposito') {
      const bajo = S.productos.filter((p) => p.stock > 0 && p.stock <= p.minimo).length;
      const sin = S.productos.filter((p) => p.stock <= 0).length;
      return head(`Hola, ${ROL_T[rol]}`, 'Estado del stock.') + `<div class="grid g4" style="grid-template-columns:repeat(3,1fr)">
        <div class="card pad stat"><div class="l">Productos</div><div class="v">${S.productos.length}</div><div class="h">En el inventario</div></div>
        <div class="card pad stat"><div class="l">Bajo el mínimo</div><div class="v">${bajo}</div><div class="h">Para reponer</div></div>
        <div class="card pad stat"><div class="l">Sin stock</div><div class="v">${sin}</div><div class="h">Agotados</div></div></div>` + guia();
    }
    const mes = S.pedidos.filter((p) => p.estado !== 'cancelado').reduce((s, p) => s + totales(p).total, 0);
    const porAtender = S.pedidos.filter((p) => ['nuevo', 'confirmado', 'preparando'].includes(p.estado)).length;
    const abiertos = S.presupuestos.filter((p) => ['borrador', 'enviado'].includes(p.estado) && !vencido(p)).length;
    const valor = S.productos.reduce((s, p) => s + Math.max(0, p.stock) * pr(p).costo, 0);
    const pend = S.solicitudes.filter((s) => s.estado === 'pendiente').length;
    const alerta = rol === 'admin' && pend ? `<div class="alert">Hay ${pend} ${pend === 1 ? 'pedido de factura' : 'pedidos de factura'} de vendedores sin atender. <a href="#/facturacion">Ver y facturar</a></div>` : '';
    return head(`Hola, ${ROL_T[rol]}`, 'Resumen del día.') + alerta + `<div class="grid g4">
      ${rol === 'admin' ? `<div class="card pad stat"><div class="l">Ventas del mes</div><div class="v">${D.fmtCorto(mes)}</div><div class="h">Pedidos no cancelados</div></div>` : ''}
      <div class="card pad stat"><div class="l">Pedidos por atender</div><div class="v">${porAtender}</div><div class="h">Nuevos, confirmados y en preparación</div></div>
      <div class="card pad stat"><div class="l">Presupuestos abiertos</div><div class="v">${abiertos}</div><div class="h">Vigentes, sin responder</div></div>
      ${rol === 'admin' ? `<div class="card pad stat"><div class="l">Stock valorizado</div><div class="v">${D.fmtCorto(valor)}</div><div class="h">A costo</div></div>` : ''}</div>` + guia();
  };
  function guia() {
    return `<div class="card pad mt"><div class="sec-title">Qué podés probar</div><div class="sec-hint">Recorrido sugerido de la demo. Cambiá de perfil arriba, en «Ver como».</div>
      <ol class="muted" style="margin:0;padding-left:20px;line-height:1.9">
      <li><b>Importar lista</b> (Administrador): elegí una lista, cargá la planilla de ejemplo del proveedor, revisá los cambios de precio y creá los productos nuevos.</li>
      <li><b>Cotizador</b>: armá un presupuesto, probá el descuento y ocultá la ganancia con el ojo. Después abrilo en PDF.</li>
      <li><b>Pedidos → Entregas</b>: emití un remito parcial y mirá cómo baja el stock; después completá la entrega.</li>
      <li><b>Ver como Ventas</b>: no ve costos ni facturación; en un pedido usá «Pedir factura al administrador».</li>
      <li><b>Ver como Administrador</b>: aparece el aviso del pedido de factura. <b>Ver como Depósito</b>: solo stock.</li>
      <li><b>Productos</b>: cambiá un margen o un precio final, usá «Aumentar precios…», abrí «¿Cómo se arma el precio?» y editá el stock de un producto con el botón ✎. En la pestaña «Valores y fórmula» están el IVA, el margen general, el redondeo y el dólar.</li><li><b>Listas de precios</b>: creá una lista por proveedor, con sus descuentos y flete, y subí todos sus precios con un porcentaje.</li></ol></div>`;
  }

  // ---------- Productos ----------
  let fProd = { q: '', cat: '', lista: '' };
  const tabsProd = (act) => rol === 'admin' ? `<div class="tabs"><a href="#/productos" class="${act === 'p' ? 'on' : ''}">Productos</a><a href="#/productos/valores" class="${act === 'v' ? 'on' : ''}">Valores y fórmula de precios</a></div>` : '';
  const badgeActualizacion = () => `<div class="row mb"><span class="badge info" title="Último cambio de precios del sistema">Última actualización de precios: ${esc(S.precioLog.por)} · ${cuando(S.precioLog.en)}</span><span class="small subtle">${esc(S.precioLog.detalle)}</span></div>`;

  // Recordatorio de cómo se arma el precio, con los números de un producto real.
  function pasosPrecio(pid) {
    const p = prod(pid) || S.productos[0]; const l = lista(p.listaId); const x = pr(p); const c = S.cfg; const usd = l.moneda === 'USD';
    const f = (cent) => D.fmt(cent) + (usd ? '' : '');
    const fila = (n, t, v, h) => `<li><span class="n">${n}</span><span class="t"><b>${t}</b>${h ? `<small>${h}</small>` : ''}</span><span class="v tabular">${v}</span></li>`;
    return `<ol class="pasos">
      ${fila('1', 'Precio de lista del proveedor', (usd ? 'US$ ' + (p.listaCent / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : f(p.listaCent)), 'Viene de la lista «' + esc(l.nombre) + '»')}
      ${fila('2', 'Descuentos del proveedor', '− ' + D.pct(l.d1) + (l.d2 ? ' y − ' + D.pct(l.d2) : ''), 'Se aplican uno después del otro')}
      ${fila('3', 'Flete', '+ ' + D.pct(l.flete), 'Costo de traer la mercadería')}
      ${fila('4', 'Dólar', usd ? '× ' + D.fmt(c.dolarCent) : 'No aplica', usd ? 'La lista está en dólares' : 'La lista está en pesos')}
      ${fila('=', 'Costo', f(x.costo), 'Lo que cuesta reponer el producto')}
      ${fila('5', 'Margen', '+ ' + D.pct(x.margenBp), (p.margenBp != null ? 'Margen propio del producto' : 'Margen general') + (c.tipoMargen === 'markup' ? ' · sobre el costo' : ' · sobre la venta'))}
      ${fila('=', 'Precio neto', f(x.neto), 'Sin impuestos')}
      ${fila('6', 'IVA', '+ ' + D.pct(c.ivaBp), '')}
      ${fila('7', 'Ajuste de venta general', (c.ajusteBp >= 0 ? '+ ' : '− ') + D.pct(Math.abs(c.ajusteBp)), 'Sube o baja todos los precios a la vez')}
      ${fila('8', 'Redondeo', { ninguno: 'Sin redondeo', peso: 'Al peso', diez: 'A los $10', cien: 'A los $100' }[c.redondeo], '')}
      ${fila('=', 'Precio final', D.fmt(x.final), 'El que ve el cliente, con IVA incluido')}</ol>`;
  }
  function recordatorio(abierto, pid) {
    const sel = `<label class="f" style="max-width:380px"><span>Ver el ejemplo con:</span><select id="rec-p">${S.productos.map((p) => `<option value="${p.id}" ${p.id === (pid || 'p4') ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></label>`;
    return `<details class="card pad mb" ${abierto ? 'open' : ''}><summary>¿Cómo se arma el precio de un producto?</summary><p class="small muted" style="margin:8px 0 12px">Estos son los pasos, siempre en este orden. Los descuentos, el flete y la moneda los define la <b>lista de precios</b> del proveedor; el margen, el IVA, el ajuste y el redondeo se definen en «Valores y fórmula de precios».</p>${sel}<div id="rec-body">${pasosPrecio(pid || 'p4')}</div></details>`;
  }
  function bindRecordatorio() { const s = $('#rec-p'); if (s) s.addEventListener('change', (e) => { $('#rec-body').innerHTML = pasosPrecio(e.target.value); }); }

  paginas.productos = (a) => (a === 'valores' ? (rol === 'admin' ? valoresPage() : paginas.sin()) : productosPage());
  function productosPage() {
    const cats = [...new Set(S.productos.map((p) => p.cat))];
    const acc = rol === 'admin' ? '<button class="btn" id="btn-aum">Aumentar precios…</button>' : '';
    return head('Productos', 'Tocá el precio final o el margen para cambiarlos: el sistema calcula el otro. El stock se edita desde cada producto.', acc) + tabsProd('p') + badgeActualizacion() + recordatorio(false) +
      `<div class="row mb"><input type="search" id="q-prod" placeholder="Buscar por nombre o código" value="${esc(fProd.q)}" style="max-width:300px">
      <select id="cat-prod" style="max-width:190px"><option value="">Todas las categorías</option>${cats.map((c) => `<option ${fProd.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <select id="lista-prod" style="max-width:260px"><option value="">Todas las listas</option>${S.listas.map((l) => `<option value="${l.id}" ${fProd.lista === l.id ? 'selected' : ''}>${esc(l.nombre)}</option>`).join('')}</select></div>
      <div class="card tw"><table><thead><tr><th>Producto</th><th>Lista</th>${veCostos() ? `<th class="th-r">Costo</th><th class="th-r">Margen ${S.cfg.tipoMargen === 'markup' ? '(s/costo)' : '(s/venta)'}</th>` : ''}<th class="th-r">Precio final</th><th class="th-r">Stock</th></tr></thead><tbody id="tb-prod"></tbody></table></div>`;
  }
  function filasProd() {
    const q = fProd.q.toLowerCase();
    return S.productos.filter((p) => (!fProd.cat || p.cat === fProd.cat) && (!fProd.lista || p.listaId === fProd.lista) && (!q || (p.nombre + ' ' + p.codigo).toLowerCase().includes(q))).map((p) => {
      const x = pr(p); const [et, to] = stockEstado(p); const l = lista(p.listaId);
      const editaStock = rol === 'admin';
      return `<tr><td><b>${esc(p.nombre)}</b><div class="subtle small">${esc(p.codigo)} · ${esc(p.medida)}</div>${p.act ? `<div class="small subtle">Precio act.: ${esc(p.act.por)} · ${cuando(p.act.en)}</div>` : ''}</td>
        <td class="small muted">${esc(l.nombre.split(' — ')[0])}${l.moneda === 'USD' ? ' <span class="badge info">USD</span>' : ''}</td>
        ${veCostos() ? `<td class="right tabular muted">${D.fmt(x.costo)}</td><td class="right"><input class="price-edit tabular margin-edit" data-pid="${p.id}" value="${String(Math.round(x.margenBp) / 100).replace('.', ',')}" style="width:80px" aria-label="Margen de ${esc(p.nombre)}"> %</td>` : ''}
        <td class="right"><input class="price-edit tabular final-edit" data-pid="${p.id}" value="${(x.final / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}" aria-label="Precio final de ${esc(p.nombre)}"></td>
        <td class="right tabular">${editaStock ? `<button class="btn sm" data-stock="${p.id}" title="Editar stock">${p.stock} ✎</button>` : p.stock} ${to !== 'ok' ? badge(et, to) : ''}</td></tr>`;
    }).join('') || '<tr><td colspan="6" class="center muted" style="padding:30px">Ningún producto coincide.</td></tr>';
  }
  function bindProductos() {
    const pintar = () => { $('#tb-prod').innerHTML = filasProd(); };
    pintar(); bindRecordatorio();
    $('#q-prod').addEventListener('input', (e) => { fProd.q = e.target.value; pintar(); });
    $('#cat-prod').addEventListener('change', (e) => { fProd.cat = e.target.value; pintar(); });
    $('#lista-prod').addEventListener('change', (e) => { fProd.lista = e.target.value; pintar(); });
    const aum = $('#btn-aum'); if (aum) aum.addEventListener('click', () => modalAumento({}));
    $('#tb-prod').addEventListener('click', (e) => { const b = e.target.closest('[data-stock]'); if (b) modalStock(b.dataset.stock); });
    $('#tb-prod').addEventListener('change', (e) => {
      const i = e.target.closest('.price-edit'); if (!i) return;
      const p = prod(i.dataset.pid); const v = dec(i.value); const c = pr(p).costo;
      if (i.classList.contains('final-edit')) {
        if (v === null || v <= 0) { toast('Escribí un precio válido.'); return pintar(); }
        const m = D.margenParaFinal(Math.round(v * 100), c, S.cfg);
        if (m < 0) { toast('Ese precio queda por debajo del costo.'); return pintar(); }
        p.margenBp = m; marcarPrecio('Cambio de precio: ' + p.nombre, p); guardar(); render(); toast(`Precio guardado. Margen resultante: ${D.pct(m)}`);
      } else {
        if (v === null || v < 0 || (S.cfg.tipoMargen === 'sobre_venta' && v >= 99)) { toast('Escribí un margen válido' + (S.cfg.tipoMargen === 'sobre_venta' ? ' (menor a 99 %).' : '.')); return pintar(); }
        p.margenBp = Math.round(v * 100); marcarPrecio('Cambio de margen: ' + p.nombre, p); guardar(); render(); toast(`Margen guardado. Precio final: ${D.fmt(pr(p).final)}`);
      }
    });
  }

  // Aumentar (o bajar) precios en un porcentaje
  function alcance(valor) {
    if (valor === 'todos') return { t: 'todos los productos', ps: S.productos };
    if (valor.startsWith('cat:')) return { t: 'la categoría «' + valor.slice(4) + '»', ps: S.productos.filter((p) => p.cat === valor.slice(4)) };
    const l = lista(valor.slice(6)); return { t: 'la lista «' + l.nombre + '»', ps: S.productos.filter((p) => p.listaId === l.id) };
  }
  function modalAumento(pre) {
    const cats = [...new Set(S.productos.map((p) => p.cat))];
    const o = abrirModal(`<h2>Aumentar precios</h2><p class="muted small mb">Sube (o baja, con un valor negativo) los precios en un porcentaje. Antes de aplicar ves cómo quedan.</p>
      <label class="f"><span>A qué productos</span><select id="au-alc"><option value="todos">Todos los productos</option>${cats.map((c) => `<option value="cat:${esc(c)}">Categoría: ${esc(c)}</option>`).join('')}${S.listas.map((l) => `<option value="lista:${l.id}">Lista: ${esc(l.nombre)}</option>`).join('')}</select></label>
      <label class="f"><span>Qué se modifica</span></label>
      <label class="chk"><input type="radio" name="au-modo" value="venta" checked> <span><b>Precio de venta</b><br><span class="small muted">Se ajusta el margen de cada producto. El costo no cambia.</span></span></label>
      <label class="chk"><input type="radio" name="au-modo" value="costo"> <span><b>Lista del proveedor (costo)</b><br><span class="small muted">Sube el precio de lista: el costo sube y el precio de venta lo acompaña, conservando el margen.</span></span></label>
      <label class="f"><span>Porcentaje (%)</span><input type="text" id="au-pct" value="${pre.pct || '10'}" inputmode="decimal"></label>
      <div id="au-prev" class="card pad" style="background:rgb(var(--surface-2));box-shadow:none"></div>
      <div class="row mt"><button class="btn pri" id="au-ok">Aplicar aumento</button><button class="btn" id="au-no">Cancelar</button></div>`);
    if (pre.alc) $('#au-alc', o).value = pre.alc; if (pre.modo) $$('[name=au-modo]', o).forEach((r) => { r.checked = r.value === pre.modo; });
    const leer = () => ({ alc: $('#au-alc', o).value, modo: $$('[name=au-modo]', o).find((r) => r.checked).value, x: dec($('#au-pct', o).value) });
    function simular() {
      const { alc, modo, x } = leer(); const { t, ps } = alcance(alc);
      if (x === null || x === 0 || x < -90 || x > 500) return { ok: false, html: '<span class="muted small">Escribí un porcentaje distinto de cero (entre −90 y 500).</span>' };
      const cambios = []; let omitidos = 0;
      ps.forEach((p) => {
        const a = pr(p); let nuevo;
        if (modo === 'costo') nuevo = D.precio(Object.assign({}, p, { listaCent: Math.round(p.listaCent * (1 + x / 100)) }), S.cfg, lista(p.listaId)).final;
        else { const objetivo = Math.round(a.final * (1 + x / 100)); const m = D.margenParaFinal(objetivo, a.costo, S.cfg); if (m < 0) { omitidos++; return; } nuevo = D.finalParaMargen(a.costo, m, S.cfg); cambios.push({ p, a: a.final, n: nuevo, m }); return; }
        cambios.push({ p, a: a.final, n: nuevo });
      });
      const muestra = cambios.slice(0, 4).map((c) => `<div class="row between small"><span>${esc(c.p.nombre)}</span><span class="tabular">${D.fmt(c.a)} → <b>${D.fmt(c.n)}</b></span></div>`).join('');
      return { ok: true, cambios, modo, x, t, html: `<div class="small"><b>${cambios.length}</b> producto${cambios.length === 1 ? '' : 's'} de ${esc(t)} ${x > 0 ? 'suben' : 'bajan'} ${String(Math.abs(x)).replace('.', ',')} %${omitidos ? ` · ${omitidos} se omiten porque quedarían por debajo del costo` : ''}.</div><div style="margin-top:8px">${muestra}${cambios.length > 4 ? `<div class="small subtle">…y ${cambios.length - 4} más</div>` : ''}</div>` };
    }
    const pintar = () => { $('#au-prev', o).innerHTML = simular().html; };
    pintar(); $$('input,select', o).forEach((e) => e.addEventListener('input', pintar));
    $('#au-no', o).addEventListener('click', cerrarModal);
    $('#au-ok', o).addEventListener('click', () => {
      const r = simular(); if (!r.ok || !r.cambios.length) return toast('No hay nada para aplicar.');
      const { alc, modo, x } = leer(); const en = D.ahoraISO();
      if (modo === 'costo') {
        const afectadas = new Set();
        r.cambios.forEach((c) => { c.p.listaCent = Math.round(c.p.listaCent * (1 + x / 100)); c.p.act = { por: yo(), en }; afectadas.add(c.p.listaId); });
        afectadas.forEach((id) => { const l = S.listas.find((z) => z.id === id); if (l) { l.act = { por: yo(), en, tipo: `Aumento de ${x} %` }; S.hist.unshift({ id: uid('h'), en, por: yo(), lista: id, tipo: 'Aumento de la lista', detalle: `${x > 0 ? '+' : ''}${String(x).replace('.', ',')} % sobre ${r.cambios.filter((c) => c.p.listaId === id).length} productos` }); } });
      } else {
        r.cambios.forEach((c) => { c.p.margenBp = c.m; c.p.act = { por: yo(), en }; });
        S.hist.unshift({ id: uid('h'), en, por: yo(), lista: '', tipo: 'Ajuste de precios de venta', detalle: `${x > 0 ? '+' : ''}${String(x).replace('.', ',')} % sobre ${r.t}` });
      }
      S.precioLog = { por: yo(), en, detalle: `${modo === 'costo' ? 'Aumento de lista' : 'Aumento de precios de venta'} ${x > 0 ? '+' : ''}${String(x).replace('.', ',')} % (${r.t})` };
      guardar(); cerrarModal(); toast(`Listo: ${r.cambios.length} productos actualizados.`); render();
    });
  }

  // Valores y fórmula (dentro de Productos)
  function valoresPage() {
    const c = S.cfg;
    return head('Valores y fórmula de precios', 'Estos valores se aplican a todos los precios de venta. Cambiá uno y mirá cómo se recalculan.') + tabsProd('v') + badgeActualizacion() + `<div class="grid g2"><div class="card pad"><div class="sec-title">Valores generales</div><div class="sec-hint">El margen propio de un producto tiene prioridad sobre el general.</div>
      <label class="f"><span>IVA (%)</span><input type="text" id="k-iva" value="${c.ivaBp / 100}"></label>
      <label class="f"><span>Margen general (%)</span><input type="text" id="k-mar" value="${c.margenGeneralBp / 100}"></label>
      <label class="f"><span>Cómo se interpreta el margen</span><select id="k-tipo"><option value="markup" ${c.tipoMargen === 'markup' ? 'selected' : ''}>Markup sobre el costo</option><option value="sobre_venta" ${c.tipoMargen === 'sobre_venta' ? 'selected' : ''}>Margen sobre la venta</option></select></label>
      <label class="f"><span>Redondeo del precio final</span><select id="k-red">${[['ninguno', 'Sin redondeo (al centavo)'], ['peso', 'Al peso'], ['diez', 'A los $10'], ['cien', 'A los $100']].map((o) => `<option value="${o[0]}" ${c.redondeo === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
      <label class="f"><span>Ajuste de venta general (%)</span><input type="text" id="k-aj" value="${c.ajusteBp / 100}"></label>
      <label class="f"><span>Cotización del dólar ($ por USD)</span><input type="text" id="k-usd" value="${(c.dolarCent / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}"></label>
      <label class="chk"><input type="checkbox" id="k-vv" ${c.ventasVeCostos ? 'checked' : ''}> Los vendedores pueden ver costos, márgenes y ganancia</label>
      <button class="btn pri" id="k-guardar">Guardar valores</button></div>
      <div><div class="card pad"><div class="sec-title">Así queda un producto</div><div class="sec-hint" id="k-ej-t"></div><dl class="kv" id="k-ej"></dl></div>
      <div class="mt">${recordatorio(true)}</div></div></div>`;
  }
  function bindValores() {
    bindRecordatorio();
    const leer = () => ({ ivaBp: Math.round((dec($('#k-iva').value) || 0) * 100), margenGeneralBp: Math.round((dec($('#k-mar').value) || 0) * 100), tipoMargen: $('#k-tipo').value, redondeo: $('#k-red').value, ajusteBp: Math.round((dec($('#k-aj').value) || 0) * 100), dolarCent: Math.round((dec($('#k-usd').value) || 0) * 100), ventasVeCostos: $('#k-vv').checked });
    const ej = () => { const c = Object.assign({}, S.cfg, leer()); const p = prod('p4'); const x = D.precio(Object.assign({}, p, { margenBp: null }), c, lista(p.listaId)); $('#k-ej-t').textContent = `${p.nombre}, con el margen general.`; $('#k-ej').innerHTML = `<div><dt>Costo (con descuentos y flete)</dt><dd>${D.fmt(x.costo)}</dd></div><div><dt>Precio neto (margen ${D.pct(x.margenBp)})</dt><dd>${D.fmt(x.neto)}</dd></div><div><dt><b>Precio final (IVA y redondeo)</b></dt><dd style="color:rgb(var(--brand))">${D.fmt(x.final)}</dd></div>`; };
    ej(); $$('#main .grid input,#main .grid select').forEach((e) => { if (e.id !== 'rec-p') e.addEventListener('input', ej); });
    $('#k-guardar').addEventListener('click', () => { const v = leer(); if (v.tipoMargen === 'sobre_venta' && v.margenGeneralBp >= 9900) return toast('Con margen sobre la venta, el porcentaje debe ser menor a 99 %.'); if (!v.dolarCent) return toast('Poné la cotización del dólar.'); Object.assign(S.cfg, v); marcarPrecio('Cambio de valores generales'); guardar(); toast('Guardado. Los precios se recalcularon con los nuevos valores.'); render(); });
  }

  // ---------- Listas de precios ----------
  paginas.listas = () => {
    const filas = S.listas.map((l) => { const n = S.productos.filter((p) => p.listaId === l.id).length; return `<tr><td><b>${esc(l.nombre)}</b><div class="small subtle">Proveedor: ${esc(l.proveedor)} · vigencia ${D.fechaLarga(l.vigencia)}</div></td><td>${l.moneda === 'USD' ? badge('USD', 'info') : badge('ARS')}</td><td class="small tabular">− ${D.pct(l.d1)}${l.d2 ? ' − ' + D.pct(l.d2) : ''}<div class="subtle">flete + ${D.pct(l.flete)}</div></td><td class="right tabular">${n}</td><td>${l.act ? quien(l.act.por, l.act.en) + `<div class="small subtle">${esc(l.act.tipo)}</div>` : '—'}</td><td class="right"><div class="row" style="justify-content:flex-end"><button class="btn sm" data-lz-edit="${l.id}">Editar</button><button class="btn sm" data-lz-aum="${l.id}">Aumentar %</button><button class="btn sm" data-lz-ver="${l.id}">Ver productos</button></div></td></tr>`; }).join('');
    const hist = S.hist.slice(0, 10).map((h) => { const l = S.listas.find((x) => x.id === h.lista); return `<tr><td>${cuando(h.en)}</td><td>${esc(h.por)}</td><td>${esc(l ? l.nombre.split(' — ')[0] : '—')}</td><td>${esc(h.tipo)}</td><td class="muted small">${esc(h.detalle)}</td></tr>`; }).join('');
    return head('Listas de precios', 'Cada proveedor tiene su lista, con sus descuentos, flete y moneda. Los productos toman su costo de la lista a la que pertenecen.', '<button class="btn pri" id="lz-nueva">Nueva lista</button>') + badgeActualizacion() +
      `<div class="card tw"><table><thead><tr><th>Lista</th><th>Moneda</th><th>Condiciones</th><th class="th-r">Productos</th><th>Última actualización</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>
      <div class="mt">${recordatorio(false)}</div>
      <div class="card tw"><div class="pad" style="padding-bottom:0"><div class="sec-title">Historial de cambios</div></div><table><thead><tr><th>Fecha y hora</th><th>Quién</th><th>Lista</th><th>Qué</th><th>Detalle</th></tr></thead><tbody>${hist || '<tr><td colspan="5" class="center muted" style="padding:20px">Sin cambios.</td></tr>'}</tbody></table></div>`;
  };
  function modalLista(id) {
    const l = id ? S.listas.find((x) => x.id === id) : { nombre: '', proveedor: '', moneda: 'ARS', d1: 0, d2: 0, flete: 0 };
    const o = abrirModal(`<h2>${id ? 'Editar lista' : 'Nueva lista de precios'}</h2><p class="muted small mb">${id ? 'Si cambiás los descuentos, el flete o la moneda, el costo de sus productos se recalcula.' : 'Después podés cargar sus productos con «Importar lista».'}</p>
      <label class="f"><span>Nombre de la lista</span><input type="text" id="lz-n" value="${esc(l.nombre)}" placeholder="Ej.: Placas — Proveedor Norte"></label>
      <label class="f"><span>Proveedor</span><input type="text" id="lz-p" value="${esc(l.proveedor)}"></label>
      <div class="grid g2"><label class="f"><span>Moneda de la lista</span><select id="lz-m"><option value="ARS" ${l.moneda === 'ARS' ? 'selected' : ''}>Pesos (ARS)</option><option value="USD" ${l.moneda === 'USD' ? 'selected' : ''}>Dólares (USD)</option></select></label>
      <label class="f"><span>Flete (%)</span><input type="text" id="lz-f" value="${l.flete / 100}"></label>
      <label class="f"><span>Descuento 1 (%)</span><input type="text" id="lz-d1" value="${l.d1 / 100}"></label>
      <label class="f"><span>Descuento 2 (%)</span><input type="text" id="lz-d2" value="${l.d2 / 100}"></label></div>
      <div class="row mt"><button class="btn pri" id="lz-ok">${id ? 'Guardar' : 'Crear lista'}</button><button class="btn" id="lz-no">Cancelar</button></div>`);
    $('#lz-no', o).addEventListener('click', cerrarModal);
    $('#lz-ok', o).addEventListener('click', () => {
      const nombre = $('#lz-n', o).value.trim(); if (!nombre) return toast('Poné un nombre para la lista.');
      const vals = { nombre, proveedor: $('#lz-p', o).value.trim() || '—', moneda: $('#lz-m', o).value, flete: Math.round((dec($('#lz-f', o).value) || 0) * 100), d1: Math.round((dec($('#lz-d1', o).value) || 0) * 100), d2: Math.round((dec($('#lz-d2', o).value) || 0) * 100) };
      if (vals.d1 >= BP || vals.d2 >= BP) return toast('Un descuento no puede ser del 100 % o más.');
      const en = D.ahoraISO();
      if (id) { Object.assign(l, vals, { act: { por: yo(), en, tipo: 'Cambio de condiciones' } }); S.hist.unshift({ id: uid('h'), en, por: yo(), lista: id, tipo: 'Cambio de condiciones', detalle: 'Descuentos, flete o moneda' }); marcarPrecio('Cambio de condiciones de la lista ' + nombre); }
      else { const n = Object.assign({ id: uid('l'), vigencia: D.hoyISO(), act: { por: yo(), en, tipo: 'Alta de la lista' } }, vals); S.listas.push(n); S.hist.unshift({ id: uid('h'), en, por: yo(), lista: n.id, tipo: 'Alta de la lista', detalle: 'Lista creada sin productos' }); }
      guardar(); cerrarModal(); toast(id ? 'Lista actualizada.' : 'Lista creada. Cargale productos con «Importar lista».'); render();
    });
  }
  function bindListas() {
    bindRecordatorio();
    $('#lz-nueva').addEventListener('click', () => modalLista(null));
    $('#main').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lzEdit) modalLista(b.dataset.lzEdit);
      else if (b.dataset.lzAum) modalAumento({ alc: 'lista:' + b.dataset.lzAum, modo: 'costo' });
      else if (b.dataset.lzVer) { fProd.lista = b.dataset.lzVer; ir('#/productos'); }
    });
  }

  // ---------- Stock (se edita con un modal, desde Stock o desde cada producto) ----------
  paginas.stock = () => {
    const hist = S.mov.slice(0, 14).map((m) => { const p = prod(m.pid); return `<tr><td>${cuando(m.en || m.fecha)}</td><td>${esc(p ? p.nombre : '—')}</td><td>${m.tipo === 'ingreso' ? badge('Ingreso', 'ok') : m.tipo === 'egreso' ? badge('Egreso', 'warn') : m.tipo === 'venta' ? badge('Venta', 'info') : badge('Ajuste')}</td><td class="right tabular">${m.tipo === 'ajuste' ? '' : (m.tipo === 'ingreso' ? '+' : '−') + m.cant}</td><td class="right tabular">${m.result}</td><td>${esc(m.por || '—')}</td><td class="muted small">${esc(m.motivo || '')}</td></tr>`; }).join('');
    const filas = S.productos.map((p) => { const [et, to] = stockEstado(p); return `<tr><td><b>${esc(p.nombre)}</b><div class="subtle small">${esc(p.codigo)}</div></td><td class="right tabular"><b>${p.stock}</b></td><td class="right tabular muted">${p.minimo}</td><td>${badge(et, to)}</td><td class="right"><button class="btn sm" data-stock="${p.id}">Editar stock</button></td></tr>`; }).join('');
    return head('Stock', 'Tocá «Editar stock» en cualquier producto: cada cambio queda en el historial, con quién, cuándo y por qué.') +
      `<div class="card tw"><table><thead><tr><th>Producto</th><th class="th-r">Stock</th><th class="th-r">Mínimo</th><th>Estado</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>
      <div class="card tw mt"><div class="pad" style="padding-bottom:0"><div class="sec-title">Últimos movimientos</div></div><table><thead><tr><th>Fecha y hora</th><th>Producto</th><th>Tipo</th><th class="th-r">Cant.</th><th class="th-r">Queda</th><th>Quién</th><th>Motivo</th></tr></thead><tbody>${hist || '<tr><td colspan="7" class="muted center">Sin movimientos.</td></tr>'}</tbody></table></div>`;
  };
  function modalStock(pid) {
    const p = prod(pid);
    const o = abrirModal(`<h2>Editar stock</h2><p class="muted small mb"><b>${esc(p.nombre)}</b> · ${esc(p.codigo)}<br>Stock actual: <b>${p.stock}</b> ${esc(p.unidad)}${p.stock === 1 ? '' : 's'} · Mínimo: ${p.minimo}</p>
      <label class="chk"><input type="radio" name="st-t" value="ingreso" checked> Ingreso de mercadería (suma)</label>
      <label class="chk"><input type="radio" name="st-t" value="egreso"> Egreso (resta)</label>
      <label class="chk"><input type="radio" name="st-t" value="ajuste"> Ajuste por conteo (queda exactamente esta cantidad)</label>
      <div class="grid g2"><label class="f"><span>Cantidad</span><input type="text" id="st-c" inputmode="numeric" value="0"></label><label class="f"><span>Stock mínimo (alerta)</span><input type="text" id="st-min" inputmode="numeric" value="${p.minimo}"></label></div>
      <label class="f"><span>Motivo (opcional)</span><input type="text" id="st-m" placeholder="Ej.: compra a proveedor, rotura, conteo"></label>
      <div id="st-prev" class="small" style="background:rgb(var(--surface-2));border-radius:10px;padding:9px 12px"></div>
      <div class="row mt"><button class="btn pri" id="st-ok">Guardar</button><button class="btn" id="st-no">Cancelar</button></div>`);
    const leer = () => ({ t: $$('[name=st-t]', o).find((r) => r.checked).value, c: parseInt($('#st-c', o).value, 10), min: parseInt($('#st-min', o).value, 10) });
    const quedaria = () => { const { t, c } = leer(); if (isNaN(c) || c < 0) return null; return t === 'ingreso' ? p.stock + c : t === 'egreso' ? p.stock - c : c; };
    const pintar = () => { const q = quedaria(); $('#st-prev', o).innerHTML = q === null ? 'Escribí una cantidad válida.' : q < 0 ? `<span style="color:rgb(var(--danger))">No alcanza el stock: hay ${p.stock}.</span>` : `Quedará en stock: <b>${q}</b>`; };
    pintar(); $$('input', o).forEach((e) => e.addEventListener('input', pintar));
    $('#st-no', o).addEventListener('click', cerrarModal);
    $('#st-ok', o).addEventListener('click', () => {
      const { t, c, min } = leer(); const q = quedaria(); const motivo = $('#st-m', o).value.trim();
      if (q === null) return toast('Escribí una cantidad válida.'); if (q < 0) return toast(`No alcanza el stock: hay ${p.stock}.`);
      if (isNaN(min) || min < 0) return toast('El mínimo no es válido.');
      if (c > 0 || t === 'ajuste') {
        if (t === 'ajuste') { const d = c - p.stock; p.stock = c; S.mov.unshift({ id: uid('m'), fecha: D.hoyISO(), en: D.ahoraISO(), por: yo(), pid, tipo: 'ajuste', cant: Math.abs(d), motivo: motivo || 'Conteo físico', result: c }); }
        else moverStock(pid, t === 'ingreso' ? c : -c, t, motivo);
      }
      p.minimo = min; guardar(); cerrarModal(); toast('Stock actualizado.'); render();
    });
  }
  function bindStock() { $('#main').addEventListener('click', (e) => { const b = e.target.closest('[data-stock]'); if (b) modalStock(b.dataset.stock); }); }

  // Cotizador
  const cotVacia = () => ({ editId: null, tipo: 'presupuesto', cliente: '', clienteId: null, tel: '', obra: '', entrega: 'retiro', dir: '', desc: '', envio: '', validez: 7, items: [], notas: '' });
  const cot = () => S.cot || (S.cot = cotVacia());
  let verGan = true; let fCot = { q: '', cat: '' };

  paginas.cotizador = () => {
    const cats = [...new Set(S.productos.map((p) => p.cat))];
    return head(cot().editId ? 'Editar presupuesto' : 'Cotizador', 'Armá el presupuesto del cliente en el mostrador. Se guarda solo mientras trabajás.', `<button class="btn" id="cot-nuevo">Nueva cotización</button>`) + `<div class="cot">
      <div class="card pad"><input type="search" id="cot-q" placeholder="Buscar por nombre, medida o código…" value="${esc(fCot.q)}">
        <div class="chips"><button class="chip ${fCot.cat === '' ? 'on' : ''}" data-cat="">Todos</button>${cats.map((c) => `<button class="chip ${fCot.cat === c ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <div class="cat-list" id="cot-cat"></div></div>
      <div class="card pad" id="cot-carrito"></div></div>`;
  };
  function pintarCatalogo() {
    const q = fCot.q.toLowerCase();
    const l = S.productos.filter((p) => (!fCot.cat || p.cat === fCot.cat) && (!q || (p.nombre + ' ' + p.medida + ' ' + p.codigo).toLowerCase().includes(q)));
    $('#cot-cat').innerHTML = l.map((p) => `<div class="prod" data-add="${p.id}"><span><b>${esc(p.nombre)}</b><div class="subtle small">${esc(p.medida)} · ${esc(p.codigo)}</div></span><span class="tabular"><b>${D.fmt(pr(p).final)}</b><div class="small subtle right">${p.stock} en stock</div></span></div>`).join('') || '<p class="muted center" style="padding:20px">Sin resultados.</p>';
  }
  function pintarCarrito() {
    const c = cot(); const t = totales({ items: c.items, descBp: Math.round((dec(c.desc) || 0) * 100), envioCent: Math.round((dec(c.envio) || 0) * 100) });
    const items = c.items.map((i, k) => `<div class="item"><div class="row between"><b style="font-size:14px">${esc(i.desc)}</b><button class="btn sm" data-del="${k}" aria-label="Quitar">✕</button></div>
      <div class="row between mt-s"><span class="qty"><button data-m="${k}">−</button><input type="text" data-q="${k}" value="${cantTxt(i.qty)}" inputmode="decimal"><button data-p="${k}">+</button></span>
      <span class="row"><span class="small subtle">$</span><input type="text" data-pr="${k}" value="${(i.precio / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}" style="width:110px;text-align:right" class="tabular"></span></div>
      ${i.catalogo != null && i.catalogo !== i.precio ? `<div class="small" style="color:rgb(var(--warn))">Precio distinto al de catálogo (${D.fmt(i.catalogo)}) <button class="btn sm" data-rec="${k}">Recuperar</button></div>` : ''}</div>`).join('') || '<p class="muted center" style="padding:24px 0">Tocá un producto para agregarlo.</p>';
    const clientes = S.clientes.map((x) => `<option value="${esc(x.nombre)}">`).join('');
    $('#cot-carrito').innerHTML = `<div class="sec-title">Cotización en curso</div>
      <label class="f"><span>Cliente</span><input type="text" id="c-cli" list="dl-cli" value="${esc(c.cliente)}" placeholder="Nombre o razón social"><datalist id="dl-cli">${clientes}</datalist></label>
      <div class="grid g2"><label class="f"><span>Descuento %</span><input type="text" id="c-desc" value="${esc(c.desc)}" inputmode="decimal" placeholder="0"></label>
      <label class="f"><span>Envío $</span><input type="text" id="c-env" value="${esc(c.envio)}" inputmode="decimal" placeholder="0"></label></div>
      <div class="row mb"><label class="chk" style="margin:0"><input type="radio" name="ent" value="retiro" ${c.entrega === 'retiro' ? 'checked' : ''}> Retira en local</label><label class="chk" style="margin:0"><input type="radio" name="ent" value="obra" ${c.entrega === 'obra' ? 'checked' : ''}> Envío a obra</label></div>
      ${c.entrega === 'obra' ? `<label class="f"><span>Dirección de la obra</span><input type="text" id="c-dir" value="${esc(c.dir)}"></label>` : ''}
      <div>${items}</div>
      <button class="btn sm mt-s" id="c-libre">+ Ítem libre (flete, colocación…)</button>
      <div style="border-top:1px solid rgb(var(--line));margin-top:12px;padding-top:10px">
        ${t.descuento ? `<div class="row between small muted"><span>Subtotal</span><span class="tabular">${D.fmt(t.sub)}</span></div><div class="row between small muted"><span>Descuento</span><span class="tabular">−${D.fmt(t.descuento)}</span></div>` : ''}
        <div class="total-row"><span>Total (IVA incl.)</span><span class="tabular">${D.fmt(t.total)}</span></div>
        ${veCostos() && c.items.length ? `<div class="gan"><span>Ganancia estimada</span><span class="row"><b class="tabular">${verGan ? D.fmt(t.ganancia) + (t.sobreCostoBp !== null ? ' · ' + D.pct(t.sobreCostoBp) + ' s/costo' : '') : '••••••'}</b><button class="btn sm" id="c-ojo" aria-label="Mostrar u ocultar ganancia">${verGan ? '👁 ocultar' : '👁 ver'}</button></span></div>` : ''}
      </div>
      <div class="row mt"><button class="btn pri" id="c-guardar" ${c.items.length ? '' : 'disabled'}>${c.editId ? 'Guardar cambios' : 'Guardar presupuesto'}</button>
      ${!c.editId ? `<button class="btn" id="c-pedido" ${c.items.length ? '' : 'disabled'}>Guardar como pedido</button>` : ''}</div>
      <p class="small subtle mt-s">Borrador guardado automáticamente en este navegador.</p>`;
  }
  function agregarItem(pid) {
    const p = prod(pid); const c = cot(); const x = pr(p);
    const e = c.items.find((i) => i.pid === pid);
    if (e) e.qty += 1; else c.items.push({ pid, desc: p.nombre + ' · ' + p.medida, cod: p.codigo, unidad: p.unidad, qty: 1, precio: x.final, catalogo: x.final, costo: x.costo });
    guardar(); pintarCarrito();
  }
  function bindCotizador() {
    pintarCatalogo(); pintarCarrito();
    $('#cot-nuevo').addEventListener('click', () => { if (cot().items.length && !confirm('Hay un borrador en curso. ¿Descartarlo?')) return; S.cot = cotVacia(); guardar(); render(); });
    $('#cot-q').addEventListener('input', (e) => { fCot.q = e.target.value; pintarCatalogo(); });
    $('#cot-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const p = $('#cot-cat .prod'); if (p) agregarItem(p.dataset.add); } });
    $$('.chip').forEach((b) => b.addEventListener('click', () => { fCot.cat = b.dataset.cat; $$('.chip').forEach((x) => x.classList.toggle('on', x === b)); pintarCatalogo(); }));
    $('#cot-cat').addEventListener('click', (e) => { const p = e.target.closest('[data-add]'); if (p) agregarItem(p.dataset.add); });
    const car = $('#cot-carrito');
    car.addEventListener('change', (e) => {
      const c = cot(); const t = e.target;
      if (t.id === 'c-cli') { c.cliente = t.value; const k = S.clientes.find((x) => x.nombre.toLowerCase() === t.value.toLowerCase()); if (k) { c.clienteId = k.id; c.tel = k.tel; if (!c.desc) c.desc = String(k.desc / 100).replace('.', ','); } }
      else if (t.id === 'c-desc') c.desc = t.value; else if (t.id === 'c-env') c.envio = t.value; else if (t.id === 'c-dir') c.dir = t.value;
      else if (t.name === 'ent') c.entrega = t.value;
      else if (t.dataset.q != null) { const v = dec(t.value); if (v > 0) c.items[t.dataset.q].qty = v; }
      else if (t.dataset.pr != null) { const v = dec(t.value); if (v >= 0) c.items[t.dataset.pr].precio = Math.round(v * 100); }
      guardar(); pintarCarrito();
    });
    car.addEventListener('click', (e) => {
      const c = cot(); const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.del != null) c.items.splice(+b.dataset.del, 1);
      else if (b.dataset.m != null) { const i = c.items[+b.dataset.m]; i.qty = Math.max(1, Math.round(i.qty - 1)); }
      else if (b.dataset.p != null) c.items[+b.dataset.p].qty = Math.round(c.items[+b.dataset.p].qty + 1);
      else if (b.dataset.rec != null) { const i = c.items[+b.dataset.rec]; i.precio = i.catalogo; }
      else if (b.id === 'c-ojo') verGan = !verGan;
      else if (b.id === 'c-libre') {
        const d = prompt('Descripción del ítem (ej.: Flete a obra)'); if (!d) return;
        const pr1 = dec(prompt('Precio unitario con IVA, en pesos') || ''); if (pr1 === null) return;
        c.items.push({ pid: null, desc: d, cod: '', unidad: 'un', qty: 1, precio: Math.round(pr1 * 100), catalogo: null, costo: 0 });
      } else if (b.id === 'c-guardar' || b.id === 'c-pedido') return guardarCot(b.id === 'c-pedido');
      else return;
      guardar(); pintarCarrito();
    });
  }
  function guardarCot(comoPedido) {
    const c = cot(); if (!c.items.length) return;
    if (!c.cliente.trim()) { toast('Falta el nombre del cliente.'); return $('#c-cli').focus(); }
    const doc = { cliente: c.cliente.trim(), clienteId: c.clienteId, tel: c.tel || '', obra: c.obra, entrega: c.entrega, dir: c.dir, descBp: Math.round((dec(c.desc) || 0) * 100), envioCent: Math.round((dec(c.envio) || 0) * 100), items: JSON.parse(JSON.stringify(c.items)), notas: '' };
    if (c.editId) {
      Object.assign(S.presupuestos.find((x) => x.id === c.editId), doc); const id = c.editId; S.cot = null; guardar(); toast('Cambios guardados.'); return ir('#/presupuestos/' + id);
    }
    if (comoPedido) {
      const p = Object.assign({ id: uid('pe'), num: S.n.n++, estado: 'nuevo', creado: D.hoyISO(), creadoEn: D.ahoraISO(), por: yo(), origen: 'Mostrador' }, doc); S.pedidos.push(p); S.cot = null; guardar(); toast('Pedido ' + num('n', p.num) + ' creado.'); return ir('#/pedidos/' + p.id);
    }
    const p = Object.assign({ id: uid('pr'), num: S.n.p++, estado: 'borrador', validez: 7, vence: D.sumarDias(7), creado: D.hoyISO(), creadoEn: D.ahoraISO(), por: yo() }, doc); S.presupuestos.push(p); S.cot = null; guardar(); toast('Presupuesto ' + num('p', p.num) + ' creado.'); ir('#/presupuestos/' + p.id);
  }

  // Listas (presupuestos y pedidos)
  let fLista = { presupuestos: '', pedidos: '', q: '' };
  function listaDocs(tipo) {
    const esP = tipo === 'presupuestos';
    const todos = esP ? S.presupuestos : S.pedidos;
    const estados = esP ? ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'] : ['nuevo', 'confirmado', 'preparando', 'entregado', 'cancelado'];
    const f = fLista[tipo]; const q = fLista.q.toLowerCase();
    const l = todos.filter((d) => (!f || (esP ? (f === 'vencido' ? vencido(d) : d.estado === f && !vencido(d)) : d.estado === f)) && (!q || (d.cliente + ' ' + (d.obra || '') + ' ' + num(esP ? 'p' : 'n', d.num)).toLowerCase().includes(q))).sort((a, b) => b.num - a.num);
    const cnt = (e) => todos.filter((d) => (esP ? (e === 'vencido' ? vencido(d) : d.estado === e && !vencido(d)) : d.estado === e)).length;
    const lab = (e) => ({ vencido: 'Vencido' }[e] || (esP ? estadoPres({ estado: e }) : estadoPedido(e))[0]);
    return head(esP ? 'Presupuestos' : 'Pedidos', esP ? 'Todas las cotizaciones. Las que pasaron su fecha de validez se marcan como vencidas.' : 'Podés cargar los de mostrador, WhatsApp o teléfono.', `<a class="btn pri" href="#/cotizador">${esP ? 'Nuevo presupuesto' : 'Nuevo pedido'}</a>`) +
      `<div class="chips"><button class="chip ${!f ? 'on' : ''}" data-f="">Todos</button>${estados.map((e) => `<button class="chip ${f === e ? 'on' : ''}" data-f="${e}">${lab(e)} <span class="subtle">${cnt(e)}</span></button>`).join('')}</div>
      <div class="row mb"><input type="search" id="q-lis" placeholder="Buscar por cliente, número u obra" value="${esc(fLista.q)}" style="max-width:340px"></div>
      <div class="card">${l.length ? `<div class="tw"><table><tbody>${l.map((d) => { const [t, tn] = esP ? estadoPres(d) : estadoPedido(d.estado); return `<tr class="clic" data-go="#/${tipo}/${d.id}"><td><b>${num(esP ? 'p' : 'n', d.num)} · ${esc(d.cliente)}</b><div class="small subtle">${d.obra ? esc(d.obra) : '&nbsp;'}</div><div style="margin-top:4px"><span class="small subtle">Cargó:</span> ${quien(d.por, d.creadoEn || d.creado)}</div></td><td class="right tabular"><b>${D.fmt(totales(d).total)}</b></td><td class="right">${badge(t, tn)}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted center pad">Nada para mostrar.</p>'}</div>`;
  }
  function bindLista(tipo) {
    $$('.chip').forEach((b) => b.addEventListener('click', () => { fLista[tipo] = b.dataset.f; render(); }));
    $('#q-lis').addEventListener('change', (e) => { fLista.q = e.target.value; render(); });
    $$('[data-go]').forEach((tr) => tr.addEventListener('click', () => ir(tr.dataset.go)));
  }
  paginas.presupuestos = (a) => (a ? detallePres(a) : listaDocs('presupuestos'));
  paginas.pedidos = (a) => (a ? detallePed(a) : listaDocs('pedidos'));

  function tablaItems(d, extra) {
    return `<div class="card tw"><table><thead><tr><th>Producto</th><th class="th-r">Cant.</th><th class="th-r">Precio</th><th class="th-r">Importe</th>${extra ? '<th class="th-r">Entregado</th>' : ''}</tr></thead><tbody>${d.items.map((i, k) => `<tr><td>${esc(i.desc)}${i.cod ? `<div class="small subtle">${esc(i.cod)}</div>` : ''}${i.catalogo != null && i.catalogo !== i.precio ? ' <span class="small" style="color:rgb(var(--warn))">precio modificado</span>' : ''}</td><td class="right tabular">${cantTxt(i.qty)} ${esc(i.unidad)}</td><td class="right tabular muted">${D.fmt(i.precio)}</td><td class="right tabular">${D.fmt(Math.round(i.qty * i.precio))}</td>${extra ? `<td class="right tabular">${cantTxt(extra[k] || 0)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }
  function cajaTotales(d) {
    const t = totales(d);
    return `<div class="card pad mt"><dl class="kv"><div><dt>Subtotal</dt><dd class="tabular">${D.fmt(t.sub)}</dd></div>${t.descuento ? `<div><dt>Descuento ${D.pct(d.descBp)}</dt><dd class="tabular">−${D.fmt(t.descuento)}</dd></div>` : ''}${d.envioCent ? `<div><dt>Envío</dt><dd class="tabular">${D.fmt(d.envioCent)}</dd></div>` : ''}<div><dt><b>Total (IVA incluido)</b></dt><dd class="tabular" style="color:rgb(var(--brand));font-size:18px">${D.fmt(t.total)}</dd></div>${veCostos() ? `<div><dt>Ganancia estimada</dt><dd class="tabular">${D.fmt(t.ganancia)}${t.sobreCostoBp !== null ? ' · ' + D.pct(t.sobreCostoBp) + ' s/costo' : ''}</dd></div>` : ''}</dl></div>`;
  }
  function datosCliente(d) {
    return `<div class="card pad mt"><div class="sec-title">Datos</div><dl class="kv"><div><dt>Cliente</dt><dd>${esc(d.cliente)}</dd></div>${d.tel ? `<div><dt>Teléfono</dt><dd>${esc(d.tel)}</dd></div>` : ''}<div><dt>Entrega</dt><dd>${d.entrega === 'obra' ? 'Envío a obra' + (d.dir ? ': ' + esc(d.dir) : '') : 'Retira en local'}</dd></div>${d.obra ? `<div><dt>Obra / ref.</dt><dd>${esc(d.obra)}</dd></div>` : ''}${d.vence ? `<div><dt>Válido hasta</dt><dd>${D.fechaLarga(d.vence)}</dd></div>` : ''}</dl></div>`;
  }

  // Detalle de presupuesto
  function detallePres(id) {
    const p = S.presupuestos.find((x) => x.id === id); if (!p) return head('No encontrado') + '<p class="muted">El presupuesto no existe.</p>';
    const [t, tn] = estadoPres(p); const ped = S.pedidos.find((x) => x.presupuestoId === p.id);
    const bt = (e, txt, cls) => `<button class="btn ${cls || ''}" data-pst="${e}">${txt}</button>`;
    const acc = { borrador: bt('enviado', 'Marcar como enviado') + bt('aceptado', 'Marcar aceptado') + bt('rechazado', 'Marcar rechazado'), enviado: bt('aceptado', 'Marcar aceptado') + bt('rechazado', 'Marcar rechazado'), aceptado: '', rechazado: '' }[p.estado] || '';
    return head(`Presupuesto ${num('p', p.num)}`, `${esc(p.cliente)}`, `<span class="small subtle">Realizado por</span> ${quien(p.por, p.creadoEn || p.creado)} ${badge(t, tn)}`) + `<div class="grid g-side"><div>${tablaItems(p)}${cajaTotales(p)}</div><div>
      <div class="card pad"><div class="sec-title">Acciones</div><div class="row">${acc}${!ped && p.estado !== 'rechazado' ? '<button class="btn pri" id="pst-pedido">Pasar a pedido</button>' : ''}</div>
      <div class="row mt" style="border-top:1px solid rgb(var(--line));padding-top:12px">${p.estado === 'borrador' ? '<button class="btn sm" id="pst-edit">Editar</button>' : ''}<a class="btn sm" href="#/doc/p/${p.id}">Cotización PDF</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Hola ' + p.cliente + ', te paso la cotización ' + num('p', p.num) + ': total ' + D.fmt(totales(p).total) + ' (IVA incluido).')}">WhatsApp</a></div>
      <div style="border-top:1px solid rgb(var(--line));margin-top:12px;padding-top:12px"><button class="btn sm" id="pst-dup">Duplicar con precios de hoy</button><p class="small subtle mt-s">Crea un presupuesto nuevo con los precios actuales. El original no se toca.</p></div>
      ${ped ? `<p class="small muted mt-s">Convertido en <a href="#/pedidos/${ped.id}">${num('n', ped.num)}</a>.</p>` : ''}</div>${datosCliente(p)}</div></div>`;
  }
  function bindDetallePres(id) {
    const p = S.presupuestos.find((x) => x.id === id); if (!p) return;
    $$('[data-pst]').forEach((b) => b.addEventListener('click', () => { p.estado = b.dataset.pst; guardar(); toast('Estado actualizado.'); render(); }));
    const q = (s, f) => { const e = $(s); if (e) e.addEventListener('click', f); };
    q('#pst-edit', () => { S.cot = Object.assign(cotVacia(), { editId: p.id, cliente: p.cliente, clienteId: p.clienteId, tel: p.tel, obra: p.obra, entrega: p.entrega, dir: p.dir, desc: String(p.descBp / 100).replace('.', ','), envio: p.envioCent ? String(p.envioCent / 100).replace('.', ',') : '', items: JSON.parse(JSON.stringify(p.items)) }); guardar(); ir('#/cotizador'); });
    q('#pst-dup', () => {
      const n = Object.assign(JSON.parse(JSON.stringify(p)), { id: uid('pr'), num: S.n.p++, estado: 'borrador', creado: D.hoyISO(), creadoEn: D.ahoraISO(), por: yo(), vence: D.sumarDias(p.validez || 7) });
      n.items.forEach((i) => { const pd = i.pid && prod(i.pid); if (pd) { const x = pr(pd); i.precio = x.final; i.catalogo = x.final; i.costo = x.costo; } });
      S.presupuestos.push(n); guardar(); toast('Presupuesto ' + num('p', n.num) + ' creado con los precios de hoy.'); ir('#/presupuestos/' + n.id);
    });
    q('#pst-pedido', () => {
      const n = Object.assign(JSON.parse(JSON.stringify(p)), { id: uid('pe'), num: S.n.n++, estado: 'nuevo', creado: D.hoyISO(), creadoEn: D.ahoraISO(), por: yo(), origen: 'Presupuesto', presupuestoId: p.id });
      delete n.vence; delete n.validez; S.pedidos.push(n); p.estado = 'aceptado'; guardar(); toast('Pedido ' + num('n', n.num) + ' creado.'); ir('#/pedidos/' + n.id);
    });
  }

  // Detalle de pedido
  function detallePed(id) {
    const p = S.pedidos.find((x) => x.id === id); if (!p) return head('No encontrado') + '<p class="muted">El pedido no existe.</p>';
    const [t, tn] = estadoPedido(p.estado); const ent = entregadoPor(p); const rems = S.remitos.filter((r) => r.pedidoId === p.id);
    const hayRem = rems.some((r) => r.estado === 'emitido');
    const sig = { nuevo: [['confirmado', 'Confirmar pedido', 'pri'], ['cancelado', 'Cancelar pedido', 'dan']], confirmado: [['preparando', 'Pasar a preparación', 'pri'], ['cancelado', 'Cancelar pedido', 'dan']], preparando: [['entregado', 'Marcar entregado', 'pri'], ['cancelado', 'Cancelar pedido', 'dan']], entregado: [], cancelado: [] }[p.estado];
    const falta = p.items.some((i, k) => (ent[k] || 0) < i.qty);
    const puedeRem = ['nuevo', 'confirmado', 'preparando'].includes(p.estado) && falta;
    const form = puedeRem ? `<div class="tw"><table><thead><tr><th>Producto</th><th class="th-r">Pedido</th><th class="th-r">Ya entregado</th><th class="th-r">Entregar ahora</th></tr></thead><tbody>${p.items.map((i, k) => { const f = i.qty - (ent[k] || 0); return `<tr><td>${esc(i.desc)}</td><td class="right tabular muted">${cantTxt(i.qty)}</td><td class="right tabular muted">${cantTxt(ent[k] || 0)}</td><td class="right">${f <= 0 ? '<span class="small" style="color:rgb(var(--ok))">completo</span>' : `<input type="text" data-rq="${k}" value="${cantTxt(f)}" style="width:80px;text-align:right" inputmode="decimal">`}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="row mt-s"><input type="text" id="rm-resp" placeholder="Quién entrega (opcional)" style="max-width:260px"><button class="btn pri" id="rm-ok">Emitir remito</button></div>` : `<p class="muted small">${p.estado === 'cancelado' ? 'El pedido está cancelado.' : falta ? 'Todavía no se puede entregar en este estado.' : 'Todo lo pedido ya fue entregado.'}</p>`;
    const compro = S.comprobantes.filter((c) => c.pedidoId === p.id);
    const pendSol = S.solicitudes.find((s) => s.pedidoId === p.id && s.estado === 'pendiente');
    let fact = '';
    if (rol === 'admin') fact = `<div class="card pad mt"><div class="sec-title">Facturación</div>${compro.map((c) => `<p class="small">${badge('DEMO', 'warn')} Factura ${c.letra} ${c.numero} · CAE ${c.cae} (simulado)</p>`).join('')}${compro.length ? '' : `<p class="small muted mb">${pendSol ? 'Un vendedor pidió esta factura.' : 'Todavía no se emitió factura.'}</p><button class="btn pri" id="fa-emitir">Emitir factura (demo)</button><p class="small subtle mt-s">En el sistema real se envía a ARCA a través de un proveedor autorizado. Acá es una simulación.</p>`}</div>`;
    else if (rol === 'ventas') fact = `<div class="card pad mt"><div class="sec-title">Factura</div><p class="small muted mb">Las facturas las emite el administrador.</p>${compro.length ? `<p class="small">${badge('DEMO', 'warn')} Factura emitida: ${compro[0].numero}</p>` : pendSol ? '<p class="small">Ya se le avisó al administrador. Cuando la emita, vas a poder verla acá.</p>' : '<button class="btn pri" id="fa-pedir">Pedir factura al administrador</button>'}</div>`;
    return head(`Pedido ${num('n', p.num)}`, `${esc(p.cliente)}`, `<span class="small subtle">Realizado por</span> ${quien(p.por, p.creadoEn || p.creado)} ${badge(t, tn)}`) + `<div class="grid g-side"><div>${tablaItems(p, ent)}${cajaTotales(p)}
      <div class="card pad mt"><div class="sec-title">Entregas</div><div class="sec-hint">Cada entrega genera un remito y descuenta el stock. Pueden ser parciales.</div>
      ${rems.length ? `<ul style="list-style:none;padding:0;margin:0 0 12px">${rems.map((r) => `<li class="row between" style="padding:6px 0;border-bottom:1px solid rgb(var(--line))"><a href="#/remitos/${r.id}"><b>${num('r', r.num)}</b></a><span class="muted small">${D.fechaLarga(r.fecha)}</span>${badge(r.estado === 'emitido' ? 'Emitido' : 'Anulado', r.estado === 'emitido' ? 'ok' : 'dan')}</li>`).join('')}</ul>` : ''}${form}</div></div>
      <div><div class="card pad"><div class="sec-title">Acciones</div><div class="row">${sig.map((s) => `<button class="btn ${s[2]}" data-ped="${s[0]}">${s[1]}</button>`).join('')}</div>${hayRem && ['nuevo', 'confirmado', 'preparando'].includes(p.estado) ? '<p class="small subtle mt-s">Con remitos emitidos, para cancelar hay que anularlos primero.</p>' : ''}</div>
      ${fact}${datosCliente(p)}</div></div>`;
  }
  function emitirRemito(p, cantidades, resp) {
    const ent = entregadoPor(p); const items = [];
    for (const [k, q] of Object.entries(cantidades)) {
      const i = p.items[k]; const f = i.qty - (ent[k] || 0);
      if (q > f + 1e-9) { toast(`«${i.desc}»: se quieren entregar ${cantTxt(q)} pero faltan ${cantTxt(f)}.`); return; }
      if (q > 0) items.push({ idx: +k, desc: i.desc, cod: i.cod, unidad: i.unidad, qty: q });
    }
    if (!items.length) return toast('Poné una cantidad mayor que cero en al menos un producto.');
    const rem = { id: uid('rm'), num: S.n.r++, pedidoId: p.id, fecha: D.hoyISO(), creadoEn: D.ahoraISO(), por: yo(), estado: 'emitido', responsable: resp, obs: '', items };
    items.forEach((it) => { const i = p.items[it.idx]; if (i.pid) { const sal = unidades((ent[it.idx] || 0) + it.qty) - unidades(ent[it.idx] || 0); it.stockOut = sal; if (sal > 0) moverStock(i.pid, -sal, 'venta', `Remito ${num('r', rem.num)} · Pedido ${num('n', p.num)}`); } });
    S.remitos.push(rem);
    const despues = entregadoPor(p);
    p.estado = p.items.every((i, k) => (despues[k] || 0) >= i.qty) ? 'entregado' : 'preparando';
    guardar(); toast(`Remito ${num('r', rem.num)} emitido.`); ir('#/remitos/' + rem.id);
  }
  function bindDetallePed(id) {
    const p = S.pedidos.find((x) => x.id === id); if (!p) return;
    $$('[data-ped]').forEach((b) => b.addEventListener('click', () => {
      const h = b.dataset.ped;
      if (h === 'cancelado') { if (S.remitos.some((r) => r.pedidoId === p.id && r.estado === 'emitido')) return toast('Este pedido ya tiene remitos: anulalos primero.'); if (!confirm('¿Cancelar el pedido? No se puede deshacer.')) return; }
      if (h === 'entregado') { // sin remitos: sale todo lo que falte, una sola vez
        const ent = entregadoPor(p);
        p.items.forEach((i, k) => { if (!i.pid) return; const resto = unidades(i.qty) - unidades(ent[k] || 0); if (resto > 0) moverStock(i.pid, -resto, 'venta', `Pedido ${num('n', p.num)} entregado`); });
      }
      p.estado = h; guardar(); toast('Estado actualizado.'); render();
    }));
    const ok = $('#rm-ok');
    if (ok) ok.addEventListener('click', () => {
      const c = {}; let bad = false;
      $$('[data-rq]').forEach((i) => { const v = dec(i.value); if (v === null || v < 0) bad = true; c[i.dataset.rq] = v || 0; });
      if (bad) return toast('Hay una cantidad inválida.');
      if (confirm('Se emite el remito y la mercadería sale del stock. ¿Continuar?')) emitirRemito(p, c, $('#rm-resp').value.trim());
    });
    const pedir = $('#fa-pedir'); if (pedir) pedir.addEventListener('click', () => { S.solicitudes.push({ id: uid('s'), pedidoId: p.id, por: yo(), fecha: D.hoyISO(), en: D.ahoraISO(), estado: 'pendiente' }); guardar(); toast('Listo: se avisó al administrador. Cambiá a «Administrador» para verlo.'); render(); });
    const emi = $('#fa-emitir'); if (emi) emi.addEventListener('click', () => {
      const k = S.clientes.find((x) => x.id === p.clienteId); const letra = k && k.cuit ? 'A' : 'B';
      S.comprobantes.push({ id: uid('f'), pedidoId: p.id, letra, numero: '0001-' + String(S.n.f++).padStart(8, '0'), cae: String(Math.floor(70000000000000 + Math.random() * 9999999999999)), fecha: D.hoyISO(), en: D.ahoraISO(), por: yo(), total: totales(p).total });
      S.solicitudes.forEach((s) => { if (s.pedidoId === p.id) s.estado = 'atendida'; }); guardar(); toast('Factura emitida (simulada).'); render();
    });
  }

  // Remitos
  paginas.remitos = (a) => {
    if (a) return detalleRem(a);
    const l = [...S.remitos].sort((x, y) => y.num - x.num);
    return head('Remitos', 'Constancias de entrega. Se emiten desde el detalle de cada pedido, total o parcialmente.') + `<div class="card">${l.length ? `<table><tbody>${l.map((r) => { const p = S.pedidos.find((x) => x.id === r.pedidoId); return `<tr class="clic" data-go="#/remitos/${r.id}"><td><b>${num('r', r.num)} · ${esc(p ? p.cliente : '')}</b><div class="small subtle">${D.fechaLarga(r.fecha)} · Pedido ${p ? num('n', p.num) : ''}</div></td><td class="right">${badge(r.estado === 'emitido' ? 'Emitido' : 'Anulado', r.estado === 'emitido' ? 'ok' : 'dan')}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted center pad">Todavía no hay remitos. Abrí un pedido y emití uno.</p>'}</div>`;
  };
  function detalleRem(id) {
    const r = S.remitos.find((x) => x.id === id); if (!r) return head('No encontrado');
    const p = S.pedidos.find((x) => x.id === r.pedidoId);
    return head(`Remito ${num('r', r.num)}`, `${esc(p.cliente)}`, `<span class="small subtle">Emitido por</span> ${quien(r.por || '—', r.creadoEn || r.fecha)} ${badge(r.estado === 'emitido' ? 'Emitido' : 'Anulado', r.estado === 'emitido' ? 'ok' : 'dan')}`) + `<div class="grid g-side"><div class="card tw"><table><thead><tr><th>Producto</th><th class="th-r">Cantidad entregada</th></tr></thead><tbody>${r.items.map((i) => `<tr><td>${esc(i.desc)}${i.cod ? `<div class="small subtle">${esc(i.cod)}</div>` : ''}</td><td class="right tabular">${cantTxt(i.qty)} ${esc(i.unidad)}</td></tr>`).join('')}</tbody></table></div>
      <div><div class="card pad"><div class="sec-title">Acciones</div><div class="row"><a class="btn pri sm" href="#/doc/r/${r.id}">Imprimir / PDF</a><a class="btn sm" href="#/pedidos/${p.id}">Ver pedido</a></div>${r.estado === 'emitido' ? '<div style="border-top:1px solid rgb(var(--line));margin-top:12px;padding-top:12px"><button class="btn dan" id="rm-anular">Anular remito</button></div>' : `<p class="small muted mt-s">Anulado${r.motivo ? ': ' + esc(r.motivo) : ''}. La mercadería volvió al stock.</p>`}</div>
      <div class="card pad mt"><div class="sec-title">Datos</div><dl class="kv"><div><dt>Pedido</dt><dd>${num('n', p.num)}</dd></div><div><dt>Entrega</dt><dd>${p.entrega === 'obra' ? 'Envío a obra' : 'Retira en local'}</dd></div>${r.responsable ? `<div><dt>Entregó</dt><dd>${esc(r.responsable)}</dd></div>` : ''}</dl></div></div></div>`;
  }
  function bindRem(id) {
    const r = S.remitos.find((x) => x.id === id); const b = $('#rm-anular'); if (!r || !b) return;
    b.addEventListener('click', () => {
      const m = prompt('Motivo de la anulación'); if (!m || m.trim().length < 3) return toast('Escribí el motivo de la anulación.');
      const p = S.pedidos.find((x) => x.id === r.pedidoId);
      r.items.forEach((it) => { const i = p.items[it.idx]; if (i.pid && it.stockOut > 0) moverStock(i.pid, it.stockOut, 'ingreso', `Anulación del remito ${num('r', r.num)}: ${m}`); });
      r.estado = 'anulado'; r.motivo = m.trim(); if (p.estado === 'entregado') p.estado = 'preparando';
      guardar(); toast('Remito anulado: la mercadería volvió al stock.'); render();
    });
  }

  // Documento imprimible
  paginas.doc = (a, b) => {
    const esR = a === 'r'; let html;
    const cab = (titulo, numero, linea) => `<header><div><div class="nom">Tu Negocio</div><div class="sm">Razón Social S.R.L.</div><div class="sm">CUIT 30-00000000-0 · Responsable Inscripto</div><div class="sm">Calle 123, Ciudad · +54 11 0000-0000</div></div><div style="text-align:right"><div style="font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">${titulo}</div><div style="font-size:21px;font-weight:700">${numero}</div><div class="sm">${linea}</div></div></header>`;
    let nombre;
    if (esR) {
      const r = S.remitos.find((x) => x.id === b); if (!r) return head('No encontrado'); const p = S.pedidos.find((x) => x.id === r.pedidoId);
      nombre = `Remito ${num('r', r.num)} - ${p.cliente}`;
      html = `<div class="hoja">${r.estado === 'anulado' ? '<div class="sello"><span>ANULADO</span></div>' : ''}${cab('Remito', num('r', r.num), 'Fecha ' + D.fechaLarga(r.fecha) + '<br><span style="font-size:11px;color:#94a3b8">Documento no válido como factura</span>')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px"><div><h4>Cliente</h4><b>${esc(p.cliente)}</b><div>${esc(p.tel || '')}</div></div><div><h4>Entrega</h4><b>${p.entrega === 'obra' ? 'Envío a obra' : 'Retira en local'}</b><div>${esc(p.dir || '')}</div><div class="sm">Pedido ${num('n', p.num)}</div></div></div>
        <table><thead><tr><th>Código</th><th>Descripción</th><th style="text-align:right">Cantidad</th></tr></thead><tbody>${r.items.map((i) => `<tr><td class="sm">${esc(i.cod || '')}</td><td><b>${esc(i.desc)}</b></td><td style="text-align:right">${cantTxt(i.qty)} ${esc(i.unidad)}</td></tr>`).join('')}</tbody></table>
        <div class="firmas"><div>Entregó${r.responsable ? ': ' + esc(r.responsable) : ''}<br>Emitido por ${esc(r.por || '—')} · ${cuando(r.creadoEn || r.fecha)}</div><div>Recibí conforme — firma, aclaración y DNI</div></div></div>`;
    } else {
      const p = S.presupuestos.find((x) => x.id === b); if (!p) return head('No encontrado'); const t = totales(p);
      nombre = `Cotización ${num('p', p.num)} - ${p.cliente}`;
      html = `<div class="hoja">${vencido(p) ? '<div class="sello"><span>VENCIDA</span></div>' : ''}${cab('Cotización', num('p', p.num), 'Emitida el ' + D.fechaLarga(p.creado) + '<br><b>Válida hasta el ' + D.fechaLarga(p.vence) + '</b>')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px"><div><h4>Cliente</h4><b>${esc(p.cliente)}</b><div>${esc(p.tel || '')}</div></div><div><h4>Entrega</h4><b>${p.entrega === 'obra' ? 'Envío a obra' : 'Retira en local'}</b><div>${esc(p.dir || '')}</div>${p.obra ? `<div class="sm">Obra: ${esc(p.obra)}</div>` : ''}</div></div>
        <table><thead><tr><th>Producto</th><th style="text-align:right">Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Importe</th></tr></thead><tbody>${p.items.map((i) => `<tr><td><b>${esc(i.desc)}</b>${i.cod ? `<div class="sm" style="font-size:11px">Cód. ${esc(i.cod)}</div>` : ''}</td><td style="text-align:right">${cantTxt(i.qty)} ${esc(i.unidad)}</td><td style="text-align:right">${D.fmt(i.precio)}</td><td style="text-align:right"><b>${D.fmt(Math.round(i.qty * i.precio))}</b></td></tr>`).join('')}</tbody></table>
        <div style="display:flex;justify-content:flex-end;margin-top:14px"><div style="width:280px"><div style="display:flex;justify-content:space-between;padding:3px 0"><span class="sm">Subtotal</span><span>${D.fmt(t.sub)}</span></div>${t.descuento ? `<div style="display:flex;justify-content:space-between;padding:3px 0"><span class="sm">Descuento ${D.pct(p.descBp)}</span><span>−${D.fmt(t.descuento)}</span></div>` : ''}${p.envioCent ? `<div style="display:flex;justify-content:space-between;padding:3px 0"><span class="sm">Envío</span><span>${D.fmt(p.envioCent)}</span></div>` : ''}<div style="display:flex;justify-content:space-between;border-top:2px solid #0f172a;margin-top:4px;padding-top:6px;font-size:16px;font-weight:700"><span>TOTAL</span><span>${D.fmt(t.total)}</span></div><div class="sm" style="text-align:right;font-size:11px">IVA incluido</div></div></div>
        <h4 style="margin-top:22px">Condiciones comerciales</h4><ul class="sm" style="margin:4px 0 0;padding-left:18px"><li>Precios en pesos argentinos con IVA incluido, sujetos a cambio sin previo aviso.</li><li>Los productos se reservan al confirmar el pago.</li><li>La entrega está sujeta a disponibilidad de stock.</li></ul>
        <div class="firmas"><div>Atendió: ${esc(p.por || '—')} · ${cuando(p.creadoEn || p.creado)}</div><div>Firma y aclaración — aceptación de la cotización</div></div></div>`;
    }
    return `<div class="hoja-wrap"><div class="hoja-bar"><a href="#/${esR ? 'remitos' : 'presupuestos'}/${b}" style="color:#334155">← Volver</a><button class="btn pri" id="imprimir">Descargar PDF / Imprimir</button></div>${html}<p class="demo-marca">Documento de ejemplo generado por la demo · sin validez comercial ni fiscal</p></div>`.replace('<div class="hoja">', `<div class="hoja" data-nombre="${esc(nombre)}">`);
  };
  function bindDoc() {
    const b = $('#imprimir'); if (!b) return;
    b.addEventListener('click', () => { const antes = document.title; document.title = $('.hoja').dataset.nombre; window.print(); document.title = antes; });
  }

  // Clientes y facturación
  paginas.clientes = () => head('Clientes', 'Con CUIT y descuento habitual: el cotizador los completa solo.') + `<div class="card tw"><table><thead><tr><th>Cliente</th><th>CUIT</th><th>Teléfono</th><th class="th-r">Descuento</th></tr></thead><tbody>${S.clientes.map((c) => `<tr><td><b>${esc(c.nombre)}</b></td><td class="muted">${esc(c.cuit || '—')}</td><td class="muted">${esc(c.tel)}</td><td class="right tabular">${D.pct(c.desc)}</td></tr>`).join('')}</tbody></table></div>`;
  paginas.facturacion = () => {
    const pend = S.solicitudes.filter((s) => s.estado === 'pendiente');
    return head('Facturación', 'Facturas y notas de crédito electrónicas, emitidas desde el detalle de cada pedido.') +
      `<div class="alert info">En esta demo la facturación es una simulación. En el sistema real se conecta con ARCA a través de un proveedor autorizado.</div>` +
      (pend.length ? `<div class="card pad mb"><div class="sec-title">Pedidos de factura (${pend.length})</div><div class="sec-hint">Los vendedores piden la factura; se marca como atendida al emitirla.</div>${pend.map((s) => { const p = S.pedidos.find((x) => x.id === s.pedidoId); return `<div class="row between" style="padding:8px 0;border-top:1px solid rgb(var(--line))"><span><b>${num('n', p.num)} · ${esc(p.cliente)}</b> · <span class="tabular">${D.fmt(totales(p).total)}</span><div class="small subtle">Pidió ${esc(s.por)} · ${cuando(s.en || s.fecha)}</div></span><a class="btn pri sm" href="#/pedidos/${p.id}">Facturar</a></div>`; }).join('')}</div>` : '') +
      `<div class="card tw"><div class="pad" style="padding-bottom:0"><div class="sec-title">Comprobantes emitidos</div></div><table><thead><tr><th>Comprobante</th><th>Pedido</th><th class="th-r">Total</th><th>CAE (simulado)</th></tr></thead><tbody>${S.comprobantes.map((c) => { const p = S.pedidos.find((x) => x.id === c.pedidoId); return `<tr><td><b>Factura ${c.letra} ${c.numero}</b> ${badge('DEMO', 'warn')}</td><td>${p ? num('n', p.num) + ' · ' + esc(p.cliente) : ''}</td><td class="right tabular">${D.fmt(c.total)}</td><td class="muted small">${c.cae}</td></tr>`; }).join('') || '<tr><td colspan="4" class="muted center" style="padding:24px">Todavía no se emitió ninguna factura.</td></tr>'}</tbody></table></div>`;
  };

  // ---------- Importar lista ----------
  let imp = null; let impLista = 'l1';
  const POOL = [
    { codigo: 'PF-ANG-3', nombre: 'Ángulo de ajuste', medida: '3,00 m', unidad: 'tira', cat: 'Perfiles', lista: 2100 },
    { codigo: 'PL-EST-95', nombre: 'Placa estándar 9,5 mm', medida: '1,20 × 2,40 m', unidad: 'placa', cat: 'Placas', lista: 10800 },
    { codigo: 'TO-T3-CJ', nombre: 'Tornillo T3 mecha', medida: 'caja x 500', unidad: 'caja', cat: 'Tornillería', lista: 6900 },
    { codigo: 'MA-SEC-5', nombre: 'Masilla de secado rápido', medida: 'bolsa 5 kg', unidad: 'bolsa', cat: 'Terminación', lista: 4200 },
    { codigo: 'PF-CAN-2', nombre: 'Cantonera metálica', medida: '2,50 m', unidad: 'tira', cat: 'Perfiles', lista: 1900 },
    { codigo: 'AI-LDR-30', nombre: 'Lana de roca 30 mm', medida: 'rollo 12 m²', unidad: 'rollo', cat: 'Aislación', lista: 15600 },
  ];
  function planilla(l) {
    const ps = S.productos.filter((p) => p.listaId === l.id); const sube = [0.07, 0.1, 0.05, 0.12, 0.08, 0.06];
    const cambios = ps.slice(0, 6).map((p, k) => ({ pid: p.id, antes: p.listaCent, nuevo: Math.round(p.listaCent * (1 + sube[k % 6])), ok: true }));
    const existentes = new Set(S.productos.map((p) => p.codigo));
    const nuevos = POOL.filter((n) => !existentes.has(n.codigo)).slice(0, ps.length ? 3 : 6).map((n) => Object.assign({}, n, { lista: l.moneda === 'USD' ? Math.max(5, Math.round(n.lista / 1000)) : n.lista, ok: true }));
    return { lid: l.id, cambios, nuevos };
  }
  paginas.importar = () => {
    if (!imp) {
      const opts = S.listas.map((l) => `<option value="${l.id}" ${impLista === l.id ? 'selected' : ''}>${esc(l.nombre)} (${l.moneda}) — ${S.productos.filter((p) => p.listaId === l.id).length} productos</option>`).join('');
      return head('Importar lista de proveedor', 'Cargá el Excel o CSV del proveedor, revisá las diferencias y aplicá. También sirve para armar el catálogo desde cero: una lista nueva y vacía se llena con la planilla.') +
        `<div class="card pad"><div class="sec-title">1. Elegí la lista y el archivo</div><div class="grid g2"><label class="f"><span>Lista de precios</span><select id="imp-lista">${opts}</select></label><label class="f"><span>Archivo (.xlsx o .csv)</span><input type="text" value="lista-proveedor-noviembre.xlsx" disabled></label></div>
        <p class="small muted mb">En la demo no se sube ningún archivo: se usa una planilla de ejemplo. Para probar el catálogo desde cero, creá una lista nueva en «Listas de precios» y elegila acá.</p><button class="btn pri" id="imp-ok">Leer planilla de ejemplo</button></div>`;
    }
    const l = lista(imp.lid); const money = (c) => (l.moneda === 'USD' ? 'US$ ' + (c / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : D.fmt(c));
    return head('Revisar importación', `${esc(l.nombre)} · lista-proveedor-noviembre.xlsx · columnas leídas: «Código», «Descripción», «Precio»`) +
      `<div class="grid g4 mb"><div class="card pad stat"><div class="l">Filas leídas</div><div class="v">${imp.cambios.length + imp.nuevos.length}</div></div><div class="card pad stat"><div class="l">Con cambio de precio</div><div class="v">${imp.cambios.length}</div></div><div class="card pad stat"><div class="l">Sin coincidencia</div><div class="v">${imp.nuevos.length}</div></div><div class="card pad stat"><div class="l">Estado</div><div class="v" style="font-size:20px">Pendiente</div></div></div>
      ${imp.cambios.length ? `<div class="card tw"><table><thead><tr><th></th><th>Producto</th><th class="th-r">Antes</th><th class="th-r">Nuevo</th><th class="th-r">Dif.</th></tr></thead><tbody>${imp.cambios.map((c, k) => { const p = prod(c.pid); const d = Math.round(((c.nuevo - c.antes) / c.antes) * 1000) / 10; return `<tr><td><input type="checkbox" data-ic="${k}" ${c.ok ? 'checked' : ''}></td><td><b>${esc(p.nombre)}</b><div class="small subtle">${esc(p.codigo)}</div></td><td class="right tabular muted">${money(c.antes)}</td><td class="right tabular">${money(c.nuevo)}</td><td class="right">${badge('+' + String(d).replace('.', ',') + ' %', 'info')}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="card pad muted">Esta lista todavía no tiene productos: se van a crear todos desde la planilla.</div>'}
      ${imp.nuevos.length ? `<div class="card pad mt"><div class="sec-title">Crear productos nuevos (${imp.nuevos.length})</div><div class="sec-hint">Se crea un producto por cada fila tildada, con código, descripción y precio del archivo, dentro de esta lista.</div><div class="tw"><table><tbody>${imp.nuevos.map((n, k) => `<tr><td><input type="checkbox" data-in="${k}" ${n.ok ? 'checked' : ''}></td><td class="muted">${esc(n.codigo)}</td><td><b>${esc(n.nombre)}</b></td><td class="right tabular">${money(n.lista * 100)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="row mt"><button class="btn pri" id="imp-aplicar">Aplicar lo tildado</button><button class="btn" id="imp-cancel">Descartar</button></div>`;
  };
  function bindImportar() {
    const sel = $('#imp-lista'); if (sel) sel.addEventListener('change', (e) => { impLista = e.target.value; });
    const ok = $('#imp-ok'); if (ok) ok.addEventListener('click', () => { imp = planilla(lista($('#imp-lista').value)); render(); });
    const c = $('#imp-cancel'); if (c) c.addEventListener('click', () => { imp = null; render(); });
    $$('[data-ic]').forEach((i) => i.addEventListener('change', () => { imp.cambios[+i.dataset.ic].ok = i.checked; }));
    $$('[data-in]').forEach((i) => i.addEventListener('change', () => { imp.nuevos[+i.dataset.in].ok = i.checked; }));
    const a = $('#imp-aplicar'); if (a) a.addEventListener('click', () => {
      const en = D.ahoraISO(); let n1 = 0, n2 = 0; const l = lista(imp.lid);
      imp.cambios.filter((x) => x.ok).forEach((x) => { const p = prod(x.pid); p.listaCent = x.nuevo; p.act = { por: yo(), en }; n1++; });
      imp.nuevos.filter((x) => x.ok).forEach((x) => { S.productos.push({ id: uid('p'), codigo: x.codigo, nombre: x.nombre, medida: x.medida, unidad: x.unidad, cat: x.cat, listaId: imp.lid, listaCent: x.lista * 100, margenBp: null, stock: 0, minimo: 0, act: { por: yo(), en } }); n2++; });
      const real = S.listas.find((z) => z.id === imp.lid); if (real) real.act = { por: yo(), en, tipo: 'Importación de lista' };
      S.hist.unshift({ id: uid('h'), en, por: yo(), lista: imp.lid, tipo: 'Importación de lista', detalle: `${n1} precios actualizados · ${n2} productos creados` });
      S.precioLog = { por: yo(), en, detalle: 'Importación de la lista ' + l.nombre };
      imp = null; guardar(); toast(`Listo: ${n1} precio(s) actualizado(s) y ${n2} producto(s) creado(s). Los precios de venta ya reflejan los nuevos costos.`); ir('#/productos');
    });
  }

  paginas.sin = () => head('Sin permiso', 'Tu perfil no tiene acceso a esta sección.') + `<div class="card pad"><p class="muted">Cambiá el perfil en «Ver como» (arriba) para ver cómo cambia lo que cada persona puede hacer.</p><a class="btn mt-s" href="#/inicio">Volver al inicio</a></div>`;

  // ---------- Render ----------
  function render() {
    const { k, a, b } = parseHash();
    if (k === 'config') return ir('#/productos/valores');
    const key = paginas[k] ? k : 'inicio';
    const permiso = key === 'doc' ? puede('presupuestos') : puede(key);
    renderSide(key === 'doc' ? (a === 'r' ? 'remitos' : 'presupuestos') : key);
    const m = $('#main');
    if (!permiso) { m.innerHTML = paginas.sin(); window.scrollTo(0, 0); return; }
    m.innerHTML = paginas[key](a, b);
    if (key === 'productos') { a === 'valores' ? bindValores() : bindProductos(); }
    else if (key === 'listas') bindListas();
    else if (key === 'stock') bindStock();
    else if (key === 'cotizador') bindCotizador();
    else if (key === 'presupuestos') { a ? bindDetallePres(a) : bindLista('presupuestos'); }
    else if (key === 'pedidos') { a ? bindDetallePed(a) : bindLista('pedidos'); }
    else if (key === 'remitos') { a ? bindRem(a) : $$('[data-go]').forEach((tr) => tr.addEventListener('click', () => ir(tr.dataset.go))); }
    else if (key === 'doc') bindDoc();
    else if (key === 'importar') bindImportar();
    document.title = 'Demo · Sistema de gestión';
  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

  // ---------- Barra de demo ----------
  $('#rol').value = rol;
  $('#rol').addEventListener('change', (e) => { rol = e.target.value; try { localStorage.setItem(KEY + '-rol', rol); } catch (x) {} const { k } = parseHash(); if (!puede(k === 'doc' ? 'presupuestos' : k)) ir('#/inicio'); render(); });
  $('#reset').addEventListener('click', () => { if (!confirm('Se vuelve a los datos originales de la demo. ¿Continuar?')) return; S = D.semilla(); imp = null; guardar(); toast('Demo reiniciada.'); ir('#/inicio'); render(); });
  $('#tema').addEventListener('click', () => { const d = document.documentElement.classList.toggle('dark'); try { localStorage.setItem(KEY + '-tema', d ? 'd' : 'l'); } catch (e) {} });
  $('#menu').addEventListener('click', () => $('#side').classList.toggle('open'));
  try { if (localStorage.getItem(KEY + '-tema') === 'd') document.documentElement.classList.add('dark'); } catch (e) {}

  render();
})();
