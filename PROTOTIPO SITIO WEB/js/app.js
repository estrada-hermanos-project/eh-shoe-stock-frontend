/* ============================================================
   Estrada Hermanos — Panel de gestión (prototipo frontend)
   Solo HTML / CSS / JS · datos quemados (sin backend)
   ============================================================ */
(() => {
  "use strict";

  const NOW = new Date("2026-08-16");
  const money = (n) => "Q " + Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const int = (n) => Number(n).toLocaleString("es-GT");
  const daysSince = (iso) => Math.round((NOW - new Date(iso)) / 86400000);

  /* ---------------- ICONS ---------------- */
  const I = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7"/></svg>',
    ventas: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2 12h9l2-8H7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.4" fill="currentColor"/><circle cx="17" cy="20" r="1.4" fill="currentColor"/></svg>',
    mercaderia: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 8l9-4 9 4-9 4-9-4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 12v8" stroke="currentColor" stroke-width="1.7"/></svg>',
    inventario: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    productos: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h7l9 9-7 7-9-9V4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none"><path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v8M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l9 15H3l9-15z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h7l9 9-7 7-9-9V4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 8l9-4 9 4v8l-9 4-9-4V8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  };

  /* ---------------- DATOS QUEMADOS ---------------- */
  const providers = ["Taller Xelajú", "Calzado Minerva", "Artesanos El Quetzal", "Don Chus"];

  const products = [
    { code: "EH-CAB-001", name: "Oxford Clásico", cat: "Caballero", color: "Negro", price: 525, img: "images/caballero-1.jpg", sold: 42, lastSale: "2026-08-14", stock: { 38: 3, 39: 5, 40: 8, 41: 6, 42: 4, 43: 2 } },
    { code: "EH-CAB-002", name: "Derby Tejido", cat: "Caballero", color: "Café", price: 560, img: "images/caballero-2.jpg", sold: 28, lastSale: "2026-08-10", stock: { 38: 1, 39: 2, 40: 3, 41: 2, 42: 1, 43: 0 } },
    { code: "EH-DAM-001", name: "Mocasín Dorado", cat: "Dama", color: "Camel", price: 485, img: "images/dama-1.jpg", sold: 51, lastSale: "2026-08-15", stock: { 34: 4, 35: 7, 36: 9, 37: 8, 38: 5, 39: 3 } },
    { code: "EH-DAM-002", name: "Tacón Bajo", cat: "Dama", color: "Vino", price: 510, img: "images/dama-2.jpg", sold: 37, lastSale: "2026-08-12", stock: { 34: 2, 35: 3, 36: 4, 37: 3, 38: 2, 39: 1 } },
    { code: "EH-DAM-003", name: "Ballerina Moño", cat: "Dama", color: "Castaño", price: 450, img: "images/dama-3.jpg", sold: 19, lastSale: "2026-06-20", stock: { 34: 1, 35: 1, 36: 2, 37: 1, 38: 0, 39: 0 } },
    { code: "EH-DAM-004", name: "Zapato Castaño", cat: "Dama", color: "Castaño", price: 495, img: "images/dama-4.jpg", sold: 8, lastSale: "2026-05-30", stock: { 34: 5, 35: 6, 36: 7, 37: 6, 38: 5, 39: 4 } },
    { code: "EH-CAB-003", name: "Formal Oficina", cat: "Caballero", color: "Negro", price: 540, img: "images/coleccion.jpg", sold: 33, lastSale: "2026-08-13", stock: { 38: 2, 39: 4, 40: 6, 41: 5, 42: 3, 43: 2 } },
    { code: "EH-DAM-005", name: "Charol Elegante", cat: "Dama", color: "Negro", price: 530, img: "images/dama-2.jpg", sold: 24, lastSale: "2026-08-09", stock: { 34: 3, 35: 4, 36: 5, 37: 4, 38: 3, 39: 2 } },
  ];

  const sales = [
    { id: "V-0048", date: "2026-08-15", code: "EH-DAM-001", size: 36, qty: 1 },
    { id: "V-0047", date: "2026-08-15", code: "EH-CAB-001", size: 41, qty: 1 },
    { id: "V-0046", date: "2026-08-14", code: "EH-CAB-003", size: 40, qty: 2 },
    { id: "V-0045", date: "2026-08-14", code: "EH-DAM-002", size: 35, qty: 1 },
    { id: "V-0044", date: "2026-08-13", code: "EH-DAM-001", size: 37, qty: 1 },
    { id: "V-0043", date: "2026-08-12", code: "EH-CAB-002", size: 40, qty: 1 },
    { id: "V-0042", date: "2026-08-11", code: "EH-DAM-005", size: 36, qty: 1 },
    { id: "V-0041", date: "2026-08-10", code: "EH-CAB-001", size: 42, qty: 1 },
    { id: "V-0040", date: "2026-08-09", code: "EH-DAM-002", size: 34, qty: 2 },
    { id: "V-0039", date: "2026-08-08", code: "EH-DAM-001", size: 35, qty: 1 },
    { id: "V-0038", date: "2026-08-07", code: "EH-CAB-003", size: 41, qty: 1 },
    { id: "V-0037", date: "2026-08-05", code: "EH-DAM-004", size: 36, qty: 1 },
  ];

  const intakes = [
    { id: "M-0021", date: "2026-08-12", provider: "Taller Xelajú", code: "EH-CAB-001", size: 40, qty: 6 },
    { id: "M-0020", date: "2026-08-11", provider: "Calzado Minerva", code: "EH-DAM-001", size: 36, qty: 8 },
    { id: "M-0019", date: "2026-08-08", provider: "Artesanos El Quetzal", code: "EH-CAB-003", size: 41, qty: 5 },
    { id: "M-0018", date: "2026-08-05", provider: "Don Chus", code: "EH-DAM-002", size: 35, qty: 6 },
    { id: "M-0017", date: "2026-08-02", provider: "Taller Xelajú", code: "EH-CAB-002", size: 40, qty: 4 },
    { id: "M-0016", date: "2026-07-28", provider: "Calzado Minerva", code: "EH-DAM-005", size: 36, qty: 7 },
  ];

  const monthly = [
    { m: "Mar", v: 14800 }, { m: "Abr", v: 16200 }, { m: "May", v: 15100 },
    { m: "Jun", v: 18400 }, { m: "Jul", v: 19800 }, { m: "Ago", v: 21250 },
  ];

  /* ---------------- DERIVADOS ---------------- */
  const byCode = (c) => products.find((p) => p.code === c);
  const totalStock = (p) => Object.values(p.stock).reduce((a, b) => a + b, 0);
  const stockStatus = (p) => { const t = totalStock(p); return t === 0 ? "agotado" : t <= 10 ? "bajo" : "ok"; };
  const isSlow = (p) => daysSince(p.lastSale) > 45;
  const catalogStock = () => products.reduce((a, p) => a + totalStock(p), 0);
  const inMonth = (iso) => iso.startsWith("2026-08");
  const monthSales = () => sales.filter((s) => inMonth(s.date));
  const saleTotal = (s) => { const p = byCode(s.code); return p ? p.price * s.qty : 0; };
  const revenueMonth = () => monthSales().reduce((a, s) => a + saleTotal(s), 0);
  const unitsMonth = () => monthSales().reduce((a, s) => a + s.qty, 0);
  const avgTicket = () => { const m = monthSales(); return m.length ? revenueMonth() / m.length : 0; };

  /* ---------------- ESTADO ---------------- */
  const state = { view: "dashboard", query: "", prodFilter: "Todos", invFilter: "Todos" };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const NAV = [
    { id: "dashboard", label: "Dashboard", eyebrow: "Resumen general", icon: I.dashboard },
    { id: "ventas", label: "Ventas", eyebrow: "Registro y estadísticas", icon: I.ventas },
    { id: "mercaderia", label: "Mercadería", eyebrow: "Ingreso de existencias", icon: I.mercaderia },
    { id: "inventario", label: "Inventario", eyebrow: "Estado del stock", icon: I.inventario },
    { id: "productos", label: "Productos", eyebrow: "Catálogo de estilos", icon: I.productos },
  ];

  /* ---------------- COMPONENTES ---------------- */
  const kpi = (icon, label, value, delta) => `
    <div class="kpi">
      <div class="kpi__icon">${icon}</div>
      <div class="kpi__label">${label}</div>
      <div class="kpi__value">${value}</div>
      ${delta ? `<div class="kpi__delta ${delta.dir}">${delta.dir === "up" ? I.up : I.down}${delta.text}</div>` : ""}
    </div>`;

  const badgeStock = (p) => {
    const s = stockStatus(p);
    if (s === "agotado") return `<span class="badge badge--danger"><span class="badge-dot"></span>Agotado</span>`;
    if (s === "bajo") return `<span class="badge badge--warn"><span class="badge-dot"></span>Stock bajo</span>`;
    return `<span class="badge badge--ok"><span class="badge-dot"></span>Disponible</span>`;
  };
  const prodCell = (p) => `<div class="cell-prod"><img src="${p.img}" alt=""><div><b>${p.name}</b><small>${p.cat} · ${p.color}</small></div></div>`;

  const barsChart = (data, fmt) => {
    const max = Math.max(...data.map((d) => d.v));
    return `<div class="bars">${data.map((d) => `
      <div class="bars__col">
        <div class="bars__bar" style="height:${Math.max(6, (d.v / max) * 100)}%"><span>${fmt(d.v)}</span></div>
        <div class="bars__x">${d.m}</div>
      </div>`).join("")}</div>`;
  };
  const rankBars = (items) => {
    const max = Math.max(...items.map((i) => i.v));
    return items.map((i) => `
      <div class="rankbar">
        <div class="rankbar__top"><b>${i.label}</b><span>${i.v} pares</span></div>
        <div class="rankbar__track"><div class="rankbar__fill" style="width:${(i.v / max) * 100}%"></div></div>
      </div>`).join("");
  };
  const donut = (pct, centerVal, centerLab, legend) => `
    <div class="donut-wrap">
      <div class="donut" style="--p:${pct}"><div class="donut__label"><b>${centerVal}</b><span>${centerLab}</span></div></div>
      <ul class="legend">${legend.map((l) => `<li><span class="dot" style="background:${l.color}"></span>${l.label} · <b>&nbsp;${l.val}</b></li>`).join("")}</ul>
    </div>`;

  const sizePills = (p) => `<div style="display:flex;flex-wrap:wrap;gap:.3rem">${Object.entries(p.stock).map(([sz, n]) =>
    `<span class="badge ${n === 0 ? "badge--danger" : n <= 2 ? "badge--warn" : "badge--muted"}" title="Talla ${sz}">${sz}: ${n}</span>`).join("")}</div>`;

  /* ---------------- VISTAS ---------------- */
  function renderDashboard() {
    const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5).map((p) => ({ label: p.name, v: p.sold }));
    const damaU = products.filter((p) => p.cat === "Dama").reduce((a, p) => a + p.sold, 0);
    const cabU = products.filter((p) => p.cat === "Caballero").reduce((a, p) => a + p.sold, 0);
    const damaPct = Math.round((damaU / (damaU + cabU)) * 100);
    const lows = products.filter((p) => stockStatus(p) !== "ok");

    return `
      <div class="kpis">
        ${kpi(I.coin, "Ventas del mes", money(revenueMonth()), { dir: "up", text: "+7.3% vs. julio" })}
        ${kpi(I.ventas, "Pares vendidos (mes)", int(unitsMonth()), { dir: "up", text: "+5 pares" })}
        ${kpi(I.productos, "Estilos en catálogo", int(products.length), null)}
        ${kpi(I.inventario, "Stock total (pares)", int(catalogStock()), { dir: "down", text: lows.length + " en alerta" })}
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><div><div class="card__title">Ventas de los últimos 6 meses</div><div class="card__sub">Ingresos en quetzales (Q)</div></div></div>
          <div class="card__body">${barsChart(monthly, (v) => "Q" + (v / 1000).toFixed(1) + "k")}</div>
        </div>
        <div class="card">
          <div class="card__head"><div class="card__title">Ventas por categoría</div></div>
          <div class="card__body">${donut(damaPct, damaPct + "%", "Dama", [
            { color: "var(--gold)", label: "Dama", val: damaU + " pares" },
            { color: "var(--cream-deep)", label: "Caballero", val: cabU + " pares" },
          ])}</div>
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:1.1rem">
        <div class="card">
          <div class="card__head"><div class="card__title">Productos más vendidos</div><span class="badge badge--gold">Histórico</span></div>
          <div class="card__body">${rankBars(topProducts)}</div>
        </div>
        <div class="card">
          <div class="card__head"><div class="card__title">Alertas de inventario</div><span class="badge badge--warn">${lows.length}</span></div>
          <div class="card__body">
            ${lows.length ? lows.map((p) => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.55rem 0;border-bottom:1px solid var(--line-soft)">
                <div class="cell-prod"><img src="${p.img}" alt=""><div><b>${p.name}</b><small>${p.code}</small></div></div>
                <div style="text-align:right"><div style="font-weight:600">${totalStock(p)} pares</div>${badgeStock(p)}</div>
              </div>`).join("") : `<div class="empty">${I.check}<p>Sin alertas de stock.</p></div>`}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:1.1rem">
        <div class="card__head">
          <div><div class="card__title">Últimas ventas</div><div class="card__sub">Registro más reciente</div></div>
          <button class="btn btn--gold btn--sm" data-action="nueva-venta">${I.plus} Registrar venta</button>
        </div>
        <div class="card__body card__body--flush">${salesTable(sales.slice(0, 6))}</div>
      </div>`;
  }

  function salesTable(list) {
    if (!list.length) return `<div class="empty">${I.ventas}<p>No hay ventas que coincidan.</p></div>`;
    return `<div class="table-wrap"><table class="data">
      <thead><tr><th>Folio</th><th>Fecha</th><th>Producto</th><th>Talla</th><th class="num">Cant.</th><th class="num">Total</th></tr></thead>
      <tbody>${list.map((s) => { const p = byCode(s.code); return `
        <tr><td class="code">${s.id}</td><td>${s.date}</td><td>${prodCell(p)}</td>
        <td>${s.size}</td><td class="num">${s.qty}</td><td class="num">${money(saleTotal(s))}</td></tr>`; }).join("")}
      </tbody></table></div>`;
  }

  function renderVentas() {
    const q = state.query.toLowerCase();
    const list = sales.filter((s) => { const p = byCode(s.code); return !q || s.id.toLowerCase().includes(q) || (p && (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))); });
    return `
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        ${kpi(I.coin, "Ventas del mes", money(revenueMonth()), { dir: "up", text: "+7.3%" })}
        ${kpi(I.ventas, "Pares vendidos (mes)", int(unitsMonth()), null)}
        ${kpi(I.tag, "Ticket promedio", money(avgTicket()), null)}
      </div>
      <div class="grid grid--2">
        <div class="card">
          <div class="card__head">
            <div><div class="card__title">Registro de ventas</div><div class="card__sub">${list.length} venta(s)</div></div>
            <button class="btn btn--gold btn--sm" data-action="nueva-venta">${I.plus} Registrar venta</button>
          </div>
          <div class="card__body card__body--flush">${salesTable(list)}</div>
        </div>
        <div class="card">
          <div class="card__head"><div class="card__title">Tendencia mensual</div></div>
          <div class="card__body">${barsChart(monthly, (v) => "Q" + (v / 1000).toFixed(1) + "k")}</div>
        </div>
      </div>`;
  }

  function renderMercaderia() {
    const q = state.query.toLowerCase();
    const list = intakes.filter((m) => { const p = byCode(m.code); return !q || m.id.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || (p && p.name.toLowerCase().includes(q)); });
    const unitsIn = intakes.filter((m) => inMonth(m.date)).reduce((a, m) => a + m.qty, 0);
    return `
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        ${kpi(I.box, "Pares ingresados (mes)", int(unitsIn), { dir: "up", text: "5 ingresos" })}
        ${kpi(I.mercaderia, "Proveedores activos", int(providers.length), null)}
        ${kpi(I.inventario, "Stock total (pares)", int(catalogStock()), null)}
      </div>
      <div class="card">
        <div class="card__head">
          <div><div class="card__title">Ingresos de mercadería</div><div class="card__sub">${list.length} registro(s)</div></div>
          <button class="btn btn--gold btn--sm" data-action="nuevo-ingreso">${I.plus} Registrar ingreso</button>
        </div>
        <div class="card__body card__body--flush">
          ${list.length ? `<div class="table-wrap"><table class="data">
            <thead><tr><th>Folio</th><th>Fecha</th><th>Proveedor</th><th>Producto</th><th>Talla</th><th class="num">Pares</th></tr></thead>
            <tbody>${list.map((m) => { const p = byCode(m.code); return `
              <tr><td class="code">${m.id}</td><td>${m.date}</td><td>${m.provider}</td><td>${prodCell(p)}</td><td>${m.size}</td><td class="num">${m.qty}</td></tr>`; }).join("")}
            </tbody></table></div>` : `<div class="empty">${I.mercaderia}<p>No hay ingresos que coincidan.</p></div>`}
        </div>
      </div>`;
  }

  function renderInventario() {
    const filt = state.invFilter, q = state.query.toLowerCase();
    let list = products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    if (filt === "Bajo") list = list.filter((p) => stockStatus(p) !== "ok");
    else if (filt === "Sin rotación") list = list.filter(isSlow);
    else if (filt === "Dama" || filt === "Caballero") list = list.filter((p) => p.cat === filt);
    const lows = products.filter((p) => stockStatus(p) !== "ok").length;
    const slow = products.filter(isSlow).length;
    const chips = ["Todos", "Dama", "Caballero", "Bajo", "Sin rotación"];
    return `
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        ${kpi(I.inventario, "Stock total (pares)", int(catalogStock()), null)}
        ${kpi(I.alert, "Productos en alerta", int(lows), lows ? { dir: "down", text: "requiere pedido" } : null)}
        ${kpi(I.box, "Sin rotación (+45 días)", int(slow), null)}
      </div>
      <div class="card">
        <div class="card__head">
          <div><div class="card__title">Estado del inventario</div><div class="card__sub">Existencias por estilo y talla</div></div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">${chips.map((c) => `<button class="chip ${filt === c ? "is-active" : ""}" data-inv="${c}">${c}</button>`).join("")}</div>
        </div>
        <div class="card__body card__body--flush">
          ${list.length ? `<div class="table-wrap"><table class="data">
            <thead><tr><th>Código</th><th>Producto</th><th>Existencias por talla</th><th class="num">Total</th><th>Estado</th><th>Rotación</th></tr></thead>
            <tbody>${list.map((p) => `
              <tr><td class="code">${p.code}</td><td>${prodCell(p)}</td><td>${sizePills(p)}</td>
              <td class="num"><b>${totalStock(p)}</b></td><td>${badgeStock(p)}</td>
              <td>${isSlow(p) ? `<span class="badge badge--warn">Baja</span>` : `<span class="badge badge--ok">Activa</span>`}</td></tr>`).join("")}
            </tbody></table></div>` : `<div class="empty">${I.inventario}<p>Sin resultados para el filtro seleccionado.</p></div>`}
        </div>
      </div>`;
  }

  function renderProductos() {
    const filt = state.prodFilter, q = state.query.toLowerCase();
    let list = products.filter((p) => (filt === "Todos" || p.cat === filt) && (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)));
    const chips = ["Todos", "Dama", "Caballero"];
    return `
      <div class="section-title">
        <div><div class="eyebrow">Catálogo</div><h3>Estilos de calzado</h3></div>
        <button class="btn btn--gold btn--sm" data-action="nuevo-producto">${I.plus} Nuevo estilo</button>
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:1.1rem;flex-wrap:wrap">${chips.map((c) => `<button class="chip ${filt === c ? "is-active" : ""}" data-prod="${c}">${c}</button>`).join("")}</div>
      ${list.length ? `<div class="prod-grid">${list.map((p) => `
        <article class="prod" data-view-prod="${p.code}">
          <div class="prod__media"><span class="prod__code">${p.code}</span><img src="${p.img}" alt="${p.name}"></div>
          <div class="prod__body">
            <div class="prod__cat">${p.cat} · ${p.color}</div>
            <h4 class="prod__name">${p.name}</h4>
            <div class="prod__meta"><span class="prod__price">${money(p.price)}</span>${badgeStock(p)}</div>
            <div class="prod__foot"><span>Stock: <b>${totalStock(p)}</b></span><span>Vendidos: <b>${p.sold}</b></span></div>
          </div>
        </article>`).join("")}</div>` : `<div class="empty">${I.productos}<p>No hay productos que coincidan.</p></div>`}`;
  }

  const RENDERERS = { dashboard: renderDashboard, ventas: renderVentas, mercaderia: renderMercaderia, inventario: renderInventario, productos: renderProductos };

  function render() {
    const meta = NAV.find((n) => n.id === state.view);
    $("#view-eyebrow").textContent = meta.eyebrow;
    $("#view-title").textContent = meta.label;
    NAV.forEach((n) => {
      const el = $(`#view-${n.id}`);
      el.hidden = n.id !== state.view;
      if (n.id === state.view) el.innerHTML = RENDERERS[n.id]();
    });
    $$(".navlink").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === state.view));
  }

  function go(view) { state.view = view; state.query = ""; $("#global-search").value = ""; render(); closeSidebar(); window.scrollTo({ top: 0 }); }

  /* ---------------- MODALES ---------------- */
  const modal = $("#modal");
  function openModal(title, body, foot) {
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = body;
    $("#modal-foot").innerHTML = foot;
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; }

  function selProducts(filterFn) {
    return products.filter(filterFn || (() => true)).map((p) => `<option value="${p.code}">${p.code} — ${p.name}</option>`).join("");
  }
  function sizeOptions(code, onlyStock) {
    const p = byCode(code); if (!p) return "";
    return Object.entries(p.stock).filter(([, n]) => !onlyStock || n > 0).map(([sz, n]) => `<option value="${sz}">Talla ${sz}${onlyStock ? ` (${n} disp.)` : ""}</option>`).join("");
  }

  function modalNuevaVenta() {
    const avail = products.filter((p) => totalStock(p) > 0);
    const first = avail[0];
    openModal("Registrar venta", `
      <div class="field"><label>Producto</label><select id="f-prod">${avail.map((p) => `<option value="${p.code}">${p.code} — ${p.name} · ${money(p.price)}</option>`).join("")}</select></div>
      <div class="form-row">
        <div class="field"><label>Talla</label><select id="f-size">${sizeOptions(first.code, true)}</select></div>
        <div class="field"><label>Cantidad</label><input type="number" id="f-qty" min="1" value="1"></div>
      </div>
      <div class="summary"><span>Total de la venta</span><b id="f-total">${money(first.price)}</b></div>`,
      `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" id="f-save">Registrar venta</button>`);

    const recalc = () => {
      const p = byCode($("#f-prod").value);
      const qty = Math.max(1, +$("#f-qty").value || 1);
      $("#f-total").textContent = money(p.price * qty);
    };
    $("#f-prod").addEventListener("change", () => { $("#f-size").innerHTML = sizeOptions($("#f-prod").value, true); recalc(); });
    $("#f-qty").addEventListener("input", recalc);
    $("#f-save").addEventListener("click", () => {
      const code = $("#f-prod").value, size = +$("#f-size").value, qty = Math.max(1, +$("#f-qty").value || 1);
      const p = byCode(code);
      if (!size) return toast("Seleccione una talla disponible.");
      if ((p.stock[size] || 0) < qty) return toast("Existencia insuficiente para esa talla.");
      p.stock[size] -= qty; p.sold += qty; p.lastSale = "2026-08-16";
      const id = "V-" + String(48 + sales.filter((s) => s.id.startsWith("V-")).length - 11).padStart(4, "0");
      sales.unshift({ id, date: "2026-08-16", code, size, qty });
      closeModal(); render(); toast(`Venta ${id} registrada — ${money(p.price * qty)}`);
    });
  }

  function modalNuevoIngreso() {
    const first = products[0];
    openModal("Registrar ingreso de mercadería", `
      <div class="field"><label>Proveedor</label><select id="f-prov">${providers.map((p) => `<option>${p}</option>`).join("")}</select></div>
      <div class="field"><label>Producto</label><select id="f-prod">${selProducts()}</select></div>
      <div class="form-row">
        <div class="field"><label>Talla</label><select id="f-size">${sizeOptions(first.code, false)}</select></div>
        <div class="field"><label>Pares ingresados</label><input type="number" id="f-qty" min="1" value="6"></div>
      </div>`,
      `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" id="f-save">Registrar ingreso</button>`);
    $("#f-prod").addEventListener("change", () => { $("#f-size").innerHTML = sizeOptions($("#f-prod").value, false); });
    $("#f-save").addEventListener("click", () => {
      const provider = $("#f-prov").value, code = $("#f-prod").value, size = +$("#f-size").value, qty = Math.max(1, +$("#f-qty").value || 1);
      const p = byCode(code);
      p.stock[size] = (p.stock[size] || 0) + qty;
      const id = "M-" + String(21 + intakes.filter((m) => m.id.startsWith("M-")).length - 5).padStart(4, "0");
      intakes.unshift({ id, date: "2026-08-16", provider, code, size, qty });
      closeModal(); render(); toast(`Ingreso ${id} registrado — ${qty} pares de ${p.name}`);
    });
  }

  function modalNuevoProducto() {
    openModal("Registrar nuevo estilo", `
      <div class="field"><label>Nombre del estilo</label><input type="text" id="f-name" placeholder="Ej. Bota Chelsea"></div>
      <div class="form-row">
        <div class="field"><label>Categoría</label><select id="f-cat"><option>Dama</option><option>Caballero</option></select></div>
        <div class="field"><label>Color</label><input type="text" id="f-color" placeholder="Ej. Negro"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Precio (Q)</label><input type="number" id="f-price" min="1" value="500"></div>
        <div class="field"><label>Stock inicial por talla</label><input type="number" id="f-init" min="0" value="4"></div>
      </div>
      <p class="login__hint" style="margin:.2rem 0 0">Se generará automáticamente un código único para el estilo.</p>`,
      `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" id="f-save">Guardar estilo</button>`);
    $("#f-save").addEventListener("click", () => {
      const name = $("#f-name").value.trim(); if (!name) return toast("Ingrese el nombre del estilo.");
      const cat = $("#f-cat").value, color = $("#f-color").value.trim() || "Natural", price = Math.max(1, +$("#f-price").value || 1);
      const init = Math.max(0, +$("#f-init").value || 0);
      const prefix = cat === "Dama" ? "EH-DAM" : "EH-CAB";
      const n = products.filter((p) => p.code.startsWith(prefix)).length + 1;
      const code = `${prefix}-${String(n).padStart(3, "0")}`;
      const sizes = cat === "Dama" ? [34, 35, 36, 37, 38, 39] : [38, 39, 40, 41, 42, 43];
      const stock = {}; sizes.forEach((s) => (stock[s] = init));
      const img = cat === "Dama" ? "images/dama-3.jpg" : "images/caballero-2.jpg";
      products.push({ code, name, cat, color, price, img, sold: 0, lastSale: "2026-08-16", stock });
      closeModal(); state.view = "productos"; render(); toast(`Estilo ${code} “${name}” agregado al catálogo`);
    });
  }

  function modalVerProducto(code) {
    const p = byCode(code);
    openModal(p.name, `
      <div style="display:flex;gap:1.1rem;flex-wrap:wrap;align-items:flex-start">
        <img src="${p.img}" alt="" style="width:150px;height:150px;object-fit:cover;border-radius:12px;border:1px solid var(--line)">
        <div style="flex:1;min-width:180px">
          <div class="prod__cat">${p.cat} · ${p.color}</div>
          <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:600">${money(p.price)}</div>
          <p style="margin:.3rem 0 .6rem"><span class="code">${p.code}</span></p>
          <div style="display:flex;gap:1.4rem;font-size:.9rem">
            <div><div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)">Stock</div><b style="font-size:1.2rem">${totalStock(p)} pares</b></div>
            <div><div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)">Vendidos</div><b style="font-size:1.2rem">${p.sold} pares</b></div>
          </div>
          <div style="margin-top:.6rem">${badgeStock(p)} ${isSlow(p) ? `<span class="badge badge--warn">Sin rotación</span>` : `<span class="badge badge--ok">Rotación activa</span>`}</div>
        </div>
      </div>
      <div style="margin-top:1.1rem"><div style="font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:.5rem">Existencias por talla</div>${sizePills(p)}</div>`,
      `<button class="btn btn--ghost" data-close>Cerrar</button><button class="btn btn--gold" data-action="nueva-venta">${I.plus} Registrar venta</button>`);
  }

  /* ---------------- TOAST ---------------- */
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = `${I.check}<span>${msg}</span>`;
    $("#toast-wrap").appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(20px)"; setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------------- SIDEBAR (móvil) ---------------- */
  const sidebar = $("#sidebar"), scrim = $("#scrim");
  function openSidebar() { sidebar.classList.add("is-open"); scrim.hidden = false; }
  function closeSidebar() { sidebar.classList.remove("is-open"); scrim.hidden = true; }

  /* ---------------- INIT ---------------- */
  function buildNav() {
    $("#nav").innerHTML = `<div class="sidebar__label">Módulos</div>` + NAV.map((n) =>
      `<a class="navlink" href="#" data-nav="${n.id}">${n.icon}<span>${n.label}</span></a>`).join("");
  }

  function bind() {
    // login
    $("#login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      $("#login").hidden = true; $("#app").hidden = false; render();
    });
    $("#logout").addEventListener("click", () => { $("#app").hidden = true; $("#login").hidden = false; });

    // nav (delegation)
    $("#nav").addEventListener("click", (e) => {
      const a = e.target.closest(".navlink"); if (!a) return;
      e.preventDefault(); go(a.dataset.nav);
    });

    // global actions (delegation on document)
    document.addEventListener("click", (e) => {
      const act = e.target.closest("[data-action]");
      if (act) {
        const a = act.dataset.action;
        if (a === "nueva-venta") { closeModal(); modalNuevaVenta(); }
        else if (a === "nuevo-ingreso") modalNuevoIngreso();
        else if (a === "nuevo-producto") modalNuevoProducto();
        return;
      }
      const card = e.target.closest("[data-view-prod]");
      if (card) { modalVerProducto(card.dataset.viewProd); return; }
      const invc = e.target.closest("[data-inv]");
      if (invc) { state.invFilter = invc.dataset.inv; render(); return; }
      const prodc = e.target.closest("[data-prod]");
      if (prodc) { state.prodFilter = prodc.dataset.prod; render(); return; }
      if (e.target.closest("[data-close]")) closeModal();
    });

    // search
    $("#global-search").addEventListener("input", (e) => { state.query = e.target.value; if (state.view !== "dashboard") render(); });

    // sidebar mobile
    $("#menu-toggle").addEventListener("click", openSidebar);
    scrim.addEventListener("click", closeSidebar);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeSidebar(); } });
  }

  buildNav();
  bind();
})();
