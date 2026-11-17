/* Datos de ejemplo y motor de precios de la demo. Todo es ficticio y vive en el navegador (localStorage). */
(function () {
  const BP = 10000;
  const HORA = 3600000;
  const DIA = 24 * HORA;

  // ---------- Motor de precios (misma lógica que el sistema real) ----------
  // costo  = lista × (1 − desc1) × (1 − desc2) × (1 + flete)   [× dólar si la lista es en USD]
  //          (las condiciones —descuentos, flete y moneda— las define la LISTA de precios del proveedor)
  // neto   = costo × (1 + margen)  ó  costo / (1 − margen)     según el tipo de margen elegido
  // final  = neto × (1 + IVA) × (1 + ajuste), y después el redondeo
  function redondear(cent, modo) {
    const f = { ninguno: 1, peso: 100, diez: 1000, cien: 10000 }[modo] || 1;
    return f === 1 ? Math.round(cent) : Math.round(cent / f) * f;
  }
  function costo(p, cfg, l) {
    l = l || { d1: 0, d2: 0, flete: 0, moneda: 'ARS' };
    let v = p.listaCent * (1 - l.d1 / BP) * (1 - l.d2 / BP) * (1 + l.flete / BP);
    if (l.moneda === 'USD') v = (v * cfg.dolarCent) / 100;
    return Math.round(v);
  }
  function netoDesde(c, m, tipo) {
    if (tipo === 'sobre_venta') return m >= BP ? null : Math.round(c / (1 - m / BP));
    return Math.round(c * (1 + m / BP));
  }
  function precio(p, cfg, l) {
    const c = costo(p, cfg, l);
    const m = p.margenBp != null ? p.margenBp : cfg.margenGeneralBp;
    const n = netoDesde(c, m, cfg.tipoMargen);
    const f = redondear(Math.round(n * (1 + cfg.ivaBp / BP) * (1 + cfg.ajusteBp / BP)), cfg.redondeo);
    return { costo: c, margenBp: m, neto: n, final: f };
  }
  // Inversa: qué margen produce el precio final escrito.
  function margenParaFinal(finalCent, c, cfg) {
    const neto = finalCent / ((1 + cfg.ivaBp / BP) * (1 + cfg.ajusteBp / BP));
    return (cfg.tipoMargen === 'sobre_venta' ? 1 - c / neto : neto / c - 1) * BP;
  }
  // Con un margen dado (en %), qué precio final resulta.
  function finalParaMargen(c, margenBp, cfg) {
    const n = netoDesde(c, margenBp, cfg.tipoMargen);
    return n === null ? null : redondear(Math.round(n * (1 + cfg.ivaBp / BP) * (1 + cfg.ajusteBp / BP)), cfg.redondeo);
  }

  const fmt = (cent) => '$ ' + (cent / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCorto = (cent) => '$ ' + Math.round(cent / 100).toLocaleString('es-AR');
  const pct = (bp) => (Math.round(bp) / 100).toString().replace('.', ',') + ' %';
  const ahoraISO = () => new Date().toISOString();
  const hoyISO = () => new Date().toISOString().slice(0, 10);
  const sumarDias = (n) => new Date(Date.now() + n * DIA).toISOString().slice(0, 10);
  const hace = (horas) => new Date(Date.now() - horas * HORA).toISOString();
  const fechaLarga = (iso) => new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  // "17/11/2026 14:32" (hora local de quien mira la demo)
  const fechaHora = (iso) => {
    const d = new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Usuarios de ejemplo (uno por perfil)
  const USUARIOS = { admin: 'Laura Gómez', ventas: 'Martín Sosa', deposito: 'Diego Ríos' };

  // ---------- Datos de ejemplo ----------
  function semilla() {
    const listas = [
      { id: 'l1', nombre: 'Placas y masillas — Proveedor Placas S.A.', proveedor: 'Placas S.A.', moneda: 'ARS', d1: 1000, d2: 500, flete: 300, vigencia: D_hoy(-12), act: { por: USUARIOS.admin, en: hace(30), tipo: 'Importación de lista' } },
      { id: 'l2', nombre: 'Perfiles y tornillería — Perfiles del Sur', proveedor: 'Perfiles del Sur', moneda: 'ARS', d1: 800, d2: 0, flete: 250, vigencia: D_hoy(-20), act: { por: USUARIOS.admin, en: hace(26 * 24), tipo: 'Importación de lista' } },
      { id: 'l3', nombre: 'Importados — Aislaciones Global (USD)', proveedor: 'Aislaciones Global', moneda: 'USD', d1: 500, d2: 0, flete: 400, vigencia: D_hoy(-5), act: { por: USUARIOS.admin, en: hace(8 * 24), tipo: 'Alta de la lista' } },
    ];
    const P = (id, codigo, nombre, medida, unidad, cat, listaId, lista, extra) =>
      Object.assign({ id, codigo, nombre, medida, unidad, cat, listaId, listaCent: Math.round(lista * 100), margenBp: null, stock: 0, minimo: 0 }, extra || {});
    const productos = [
      P('p1', 'PL-STD-125', 'Placa estándar 12,5 mm', '1,20 × 2,40 m', 'placa', 'Placas', 'l1', 13200, { stock: 140, minimo: 40 }),
      P('p2', 'PL-HUM-125', 'Placa resistente a la humedad 12,5 mm', '1,20 × 2,40 m', 'placa', 'Placas', 'l1', 17900, { stock: 62, minimo: 30 }),
      P('p3', 'PL-IGN-125', 'Placa ignífuga 12,5 mm', '1,20 × 2,40 m', 'placa', 'Placas', 'l1', 19800, { stock: 8, minimo: 20 }),
      P('p4', 'PF-MON-70', 'Montante 70 mm', '2,60 m', 'tira', 'Perfiles', 'l2', 5100, { stock: 210, minimo: 60 }),
      P('p5', 'PF-SOL-70', 'Solera 70 mm', '2,60 m', 'tira', 'Perfiles', 'l2', 4400, { stock: 175, minimo: 60 }),
      P('p6', 'PF-MON-35', 'Montante 35 mm', '2,60 m', 'tira', 'Perfiles', 'l2', 3600, { stock: 96, minimo: 50 }),
      P('p7', 'PF-OME-1', 'Perfil omega', '3,00 m', 'tira', 'Perfiles', 'l2', 2900, { stock: 0, minimo: 30 }),
      P('p8', 'TO-T2-CJ', 'Tornillo T2 punta aguja', 'caja x 1.000', 'caja', 'Tornillería', 'l2', 8200, { stock: 38, minimo: 15 }),
      P('p9', 'TO-T1-CJ', 'Tornillo T1 punta aguja', 'caja x 1.000', 'caja', 'Tornillería', 'l2', 7400, { stock: 22, minimo: 15 }),
      P('p10', 'MA-LPU-28', 'Masilla lista para usar', 'balde 28 kg', 'balde', 'Terminación', 'l1', 9800, { stock: 17, minimo: 10, margenBp: 3500 }),
      P('p11', 'CI-PAP-75', 'Cinta de papel', 'rollo 75 m', 'rollo', 'Terminación', 'l1', 3500, { stock: 90, minimo: 30 }),
      P('p12', 'AI-LDV-50', 'Lana de vidrio con aluminio', 'rollo 50 mm × 14 m²', 'rollo', 'Aislación', 'l3', 14, { stock: 12, minimo: 10, margenBp: 2600 }),
    ];
    const clientes = [
      { id: 'c1', nombre: 'Constructora Los Álamos SRL', cuit: '30-71234567-8', tel: '11 2345-6789', desc: 500 },
      { id: 'c2', nombre: 'María Gómez', cuit: '', tel: '11 5555-1234', desc: 0 },
      { id: 'c3', nombre: 'Durlock Obras SA', cuit: '30-70123456-2', tel: '11 4444-9087', desc: 800 },
      { id: 'c4', nombre: 'Estudio Rivas Arquitectura', cuit: '', tel: '11 3333-2211', desc: 300 },
    ];
    const cfg = { ivaBp: 2100, margenGeneralBp: 3000, tipoMargen: 'markup', redondeo: 'ninguno', dolarCent: 157000, ajusteBp: 0, ventasVeCostos: false };
    const st = {
      productos, listas, clientes, cfg, presupuestos: [], pedidos: [], remitos: [], mov: [], solicitudes: [], comprobantes: [], hist: [],
      importada: false, cot: null, n: { p: 3, n: 4, r: 1, f: 11 },
      precioLog: { por: USUARIOS.admin, en: hace(30), detalle: 'Importación de lista de precios' },
    };

    const lst = (id) => listas.find((l) => l.id === id);
    const linea = (pid, qty, precioOverride) => {
      const p = productos.find((x) => x.id === pid);
      const pr = precio(p, cfg, lst(p.listaId));
      return { pid, desc: p.nombre + ' · ' + p.medida, cod: p.codigo, unidad: p.unidad, qty, precio: precioOverride || pr.final, catalogo: pr.final, costo: pr.costo };
    };
    const M = USUARIOS.ventas, A = USUARIOS.admin;
    st.presupuestos.push(
      { id: 'pr1', num: 1, estado: 'enviado', por: M, creadoEn: hace(50), cliente: 'Constructora Los Álamos SRL', clienteId: 'c1', tel: '11 2345-6789', obra: 'Edificio Av. Rivadavia 4500', entrega: 'obra', dir: 'Rivadavia 4500, CABA', descBp: 500, envioCent: 650000, validez: 7, vence: sumarDias(5), creado: sumarDias(-2), notas: '', items: [linea('p1', 60), linea('p4', 40), linea('p5', 30), linea('p8', 4)] },
      { id: 'pr2', num: 2, estado: 'borrador', por: A, creadoEn: hace(240), cliente: 'Estudio Rivas Arquitectura', clienteId: 'c4', tel: '11 3333-2211', obra: 'Reforma local Palermo', entrega: 'retiro', dir: '', descBp: 300, envioCent: 0, validez: 7, vence: sumarDias(-3), creado: sumarDias(-10), notas: '', items: [linea('p2', 24), linea('p6', 18), linea('p11', 6)] },
    );
    st.pedidos.push(
      { id: 'pe1', num: 1, estado: 'entregado', por: M, creadoEn: hace(150), cliente: 'Constructora Los Álamos SRL', clienteId: 'c1', tel: '11 2345-6789', obra: '', entrega: 'retiro', dir: '', descBp: 500, envioCent: 0, creado: sumarDias(-6), origen: 'Mostrador', items: [linea('p1', 20), linea('p8', 2)] },
      { id: 'pe2', num: 2, estado: 'confirmado', por: M, creadoEn: hace(27), cliente: 'Durlock Obras SA', clienteId: 'c3', tel: '11 4444-9087', obra: 'Torre Villa Crespo', entrega: 'obra', dir: 'Corrientes 5100, CABA', descBp: 800, envioCent: 480000, creado: sumarDias(-1), origen: 'WhatsApp', items: [linea('p2', 30), linea('p4', 50), linea('p5', 50), linea('p9', 3)] },
      { id: 'pe3', num: 3, estado: 'nuevo', por: A, creadoEn: hace(2), cliente: 'María Gómez', clienteId: 'c2', tel: '11 5555-1234', obra: '', entrega: 'retiro', dir: '', descBp: 0, envioCent: 0, creado: sumarDias(0), origen: 'Mostrador', items: [linea('p12', 2), linea('p11', 3)] },
    );
    st.remitos.push({ id: 'rm1', num: 1, pedidoId: 'pe1', fecha: sumarDias(-6), creadoEn: hace(148), por: USUARIOS.deposito, estado: 'emitido', responsable: 'Depósito', obs: '', items: [{ idx: 0, desc: st.pedidos[0].items[0].desc, cod: 'PL-STD-125', unidad: 'placa', qty: 20, stockOut: 20 }, { idx: 1, desc: st.pedidos[0].items[1].desc, cod: 'TO-T2-CJ', unidad: 'caja', qty: 2, stockOut: 2 }] });
    st.solicitudes.push({ id: 's1', pedidoId: 'pe2', por: M, fecha: sumarDias(0), en: hace(3), estado: 'pendiente' });
    st.mov.push({ id: 'm1', fecha: sumarDias(-8), en: hace(200), por: USUARIOS.deposito, pid: 'p3', tipo: 'ingreso', cant: 30, motivo: 'Compra a proveedor', result: 38 });
    st.mov.push({ id: 'm2', fecha: sumarDias(-3), en: hace(76), por: USUARIOS.deposito, pid: 'p3', tipo: 'egreso', cant: 30, motivo: 'Obra Villa Urquiza', result: 8 });
    st.hist.push({ id: 'h1', en: hace(30), por: A, lista: 'l1', tipo: 'Importación de lista', detalle: '6 productos actualizados' });
    st.hist.push({ id: 'h2', en: hace(26 * 24), por: A, lista: 'l2', tipo: 'Importación de lista', detalle: '5 productos actualizados' });
    return st;
  }
  function D_hoy(n) { return new Date(Date.now() + n * DIA).toISOString().slice(0, 10); }

  window.Demo = { BP, precio, costo, margenParaFinal, finalParaMargen, redondear, fmt, fmtCorto, pct, hoyISO, ahoraISO, sumarDias, fechaLarga, fechaHora, semilla, USUARIOS };
})();
