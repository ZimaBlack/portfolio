/* Datos de ejemplo y motor de precios de la demo. Todo es ficticio y vive en el navegador (localStorage). */
(function () {
  const BP = 10000;
  const DIA = 86400000;

  // ---------- Motor de precios (misma lógica que el sistema real) ----------
  // costo  = lista × (1 − desc1) × (1 − desc2) × (1 + flete)   [× dólar si la lista es en USD]
  // neto   = costo × (1 + margen)  ó  costo / (1 − margen)     según el tipo de margen elegido
  // final  = neto × (1 + IVA) × (1 + ajuste), y después el redondeo
  function redondear(cent, modo) {
    const f = { ninguno: 1, peso: 100, diez: 1000, cien: 10000 }[modo] || 1;
    return f === 1 ? Math.round(cent) : Math.round(cent / f) * f;
  }
  function costo(p, cfg) {
    let v = p.listaCent * (1 - p.d1 / BP) * (1 - p.d2 / BP) * (1 + p.flete / BP);
    if (p.moneda === 'USD') v = (v * cfg.dolarCent) / 100;
    return Math.round(v);
  }
  function netoDesde(c, m, tipo) {
    if (tipo === 'sobre_venta') return m >= BP ? null : Math.round(c / (1 - m / BP));
    return Math.round(c * (1 + m / BP));
  }
  function precio(p, cfg) {
    const c = costo(p, cfg);
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

  const fmt = (cent) => '$ ' + (cent / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCorto = (cent) => '$ ' + Math.round(cent / 100).toLocaleString('es-AR');
  const pct = (bp) => (Math.round(bp) / 100).toString().replace('.', ',') + ' %';
  const hoyISO = () => new Date().toISOString().slice(0, 10);
  const sumarDias = (n) => new Date(Date.now() + n * DIA).toISOString().slice(0, 10);
  const fechaLarga = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // ---------- Datos de ejemplo ----------
  function semilla() {
    const P = (id, codigo, nombre, medida, unidad, cat, lista, extra) =>
      Object.assign({ id, codigo, nombre, medida, unidad, cat, listaCent: Math.round(lista * 100), moneda: 'ARS', d1: 1000, d2: 500, flete: 300, margenBp: null, stock: 0, minimo: 0 }, extra || {});
    const productos = [
      P('p1', 'PL-STD-125', 'Placa estándar 12,5 mm', '1,20 × 2,40 m', 'placa', 'Placas', 13200, { stock: 140, minimo: 40 }),
      P('p2', 'PL-HUM-125', 'Placa resistente a la humedad 12,5 mm', '1,20 × 2,40 m', 'placa', 'Placas', 17900, { stock: 62, minimo: 30 }),
      P('p3', 'PL-IGN-125', 'Placa ignífuga 12,5 mm', '1,20 × 2,40 m', 'placa', 'Placas', 19800, { stock: 8, minimo: 20 }),
      P('p4', 'PF-MON-70', 'Montante 70 mm', '2,60 m', 'tira', 'Perfiles', 5100, { stock: 210, minimo: 60 }),
      P('p5', 'PF-SOL-70', 'Solera 70 mm', '2,60 m', 'tira', 'Perfiles', 4400, { stock: 175, minimo: 60 }),
      P('p6', 'PF-MON-35', 'Montante 35 mm', '2,60 m', 'tira', 'Perfiles', 3600, { stock: 96, minimo: 50 }),
      P('p7', 'PF-OME-1', 'Perfil omega', '3,00 m', 'tira', 'Perfiles', 2900, { stock: 0, minimo: 30 }),
      P('p8', 'TO-T2-CJ', 'Tornillo T2 punta aguja', 'caja x 1.000', 'caja', 'Tornillería', 8200, { stock: 38, minimo: 15 }),
      P('p9', 'TO-T1-CJ', 'Tornillo T1 punta aguja', 'caja x 1.000', 'caja', 'Tornillería', 7400, { stock: 22, minimo: 15 }),
      P('p10', 'MA-LPU-28', 'Masilla lista para usar', 'balde 28 kg', 'balde', 'Terminación', 31, { moneda: 'USD', stock: 17, minimo: 10, margenBp: 3500 }),
      P('p11', 'CI-PAP-75', 'Cinta de papel', 'rollo 75 m', 'rollo', 'Terminación', 3500, { stock: 90, minimo: 30 }),
      P('p12', 'AI-LDV-50', 'Lana de vidrio con aluminio', 'rollo 50 mm × 14 m²', 'rollo', 'Aislación', 21800, { stock: 12, minimo: 10, margenBp: 2600 }),
    ];
    const clientes = [
      { id: 'c1', nombre: 'Constructora Los Álamos SRL', cuit: '30-71234567-8', tel: '11 2345-6789', desc: 500 },
      { id: 'c2', nombre: 'María Gómez', cuit: '', tel: '11 5555-1234', desc: 0 },
      { id: 'c3', nombre: 'Durlock Obras SA', cuit: '30-70123456-2', tel: '11 4444-9087', desc: 800 },
      { id: 'c4', nombre: 'Estudio Rivas Arquitectura', cuit: '', tel: '11 3333-2211', desc: 300 },
    ];
    const cfg = {
      ivaBp: 2100, margenGeneralBp: 3000, tipoMargen: 'markup', redondeo: 'ninguno', dolarCent: 157000, ajusteBp: 0, ventasVeCostos: false,
    };
    const st = { productos, clientes, cfg, presupuestos: [], pedidos: [], remitos: [], mov: [], solicitudes: [], comprobantes: [], importada: false, cot: null, n: { p: 3, n: 4, r: 1, f: 11 } };

    const linea = (pid, qty, precioOverride) => {
      const p = productos.find((x) => x.id === pid);
      const pr = precio(p, cfg);
      return { pid, desc: p.nombre + ' · ' + p.medida, cod: p.codigo, unidad: p.unidad, qty, precio: precioOverride || pr.final, catalogo: pr.final, costo: pr.costo };
    };
    st.presupuestos.push(
      { id: 'pr1', num: 1, estado: 'enviado', cliente: 'Constructora Los Álamos SRL', clienteId: 'c1', tel: '11 2345-6789', obra: 'Edificio Av. Rivadavia 4500', entrega: 'obra', dir: 'Rivadavia 4500, CABA', descBp: 500, envioCent: 650000, validez: 7, vence: sumarDias(5), creado: sumarDias(-2), notas: '', items: [linea('p1', 60), linea('p4', 40), linea('p5', 30), linea('p8', 4)] },
      { id: 'pr2', num: 2, estado: 'borrador', cliente: 'Estudio Rivas Arquitectura', clienteId: 'c4', tel: '11 3333-2211', obra: 'Reforma local Palermo', entrega: 'retiro', dir: '', descBp: 300, envioCent: 0, validez: 7, vence: sumarDias(-3), creado: sumarDias(-10), notas: '', items: [linea('p2', 24), linea('p6', 18), linea('p11', 6)] },
    );
    st.pedidos.push(
      { id: 'pe1', num: 1, estado: 'entregado', cliente: 'Constructora Los Álamos SRL', clienteId: 'c1', tel: '11 2345-6789', obra: '', entrega: 'retiro', dir: '', descBp: 500, envioCent: 0, creado: sumarDias(-6), origen: 'Mostrador', items: [linea('p1', 20), linea('p8', 2)] },
      { id: 'pe2', num: 2, estado: 'confirmado', cliente: 'Durlock Obras SA', clienteId: 'c3', tel: '11 4444-9087', obra: 'Torre Villa Crespo', entrega: 'obra', dir: 'Corrientes 5100, CABA', descBp: 800, envioCent: 480000, creado: sumarDias(-1), origen: 'WhatsApp', items: [linea('p2', 30), linea('p4', 50), linea('p5', 50), linea('p9', 3)] },
      { id: 'pe3', num: 3, estado: 'nuevo', cliente: 'María Gómez', clienteId: 'c2', tel: '11 5555-1234', obra: '', entrega: 'retiro', dir: '', descBp: 0, envioCent: 0, creado: sumarDias(0), origen: 'Mostrador', items: [linea('p12', 2), linea('p11', 3)] },
    );
    // Remito del pedido entregado (la mercadería ya salió)
    st.remitos.push({ id: 'rm1', num: 1, pedidoId: 'pe1', fecha: sumarDias(-6), estado: 'emitido', responsable: 'Depósito', obs: '', items: [{ idx: 0, desc: st.pedidos[0].items[0].desc, cod: 'PL-STD-125', unidad: 'placa', qty: 20 }, { idx: 1, desc: st.pedidos[0].items[1].desc, cod: 'TO-T2-CJ', unidad: 'caja', qty: 2 }] });
    st.solicitudes.push({ id: 's1', pedidoId: 'pe2', por: 'Vendedor (demo)', fecha: sumarDias(0), estado: 'pendiente' });
    st.mov.push({ id: 'm1', fecha: sumarDias(-8), pid: 'p3', tipo: 'ingreso', cant: 30, motivo: 'Compra a proveedor', result: 38 });
    st.mov.push({ id: 'm2', fecha: sumarDias(-3), pid: 'p3', tipo: 'egreso', cant: 30, motivo: 'Obra Villa Urquiza', result: 8 });
    return st;
  }

  window.Demo = { BP, precio, costo, margenParaFinal, redondear, fmt, fmtCorto, pct, hoyISO, sumarDias, fechaLarga, semilla };
})();
