import { ReportsApi, SuppliersApi, cleanParams } from "../api.js";
import {
  I, $, badgeAdvice, bannerError, barsChart, donut, empty, escapeHtml, formatInt,
  kpi, monthStartIso, printAsPdf, rankBars, skeleton, tableWrap, todayIso, toast,
} from "../ui.js";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "ventas", label: "Ventas" },
  { id: "inventario", label: "Inventario" },
  { id: "mercaderia", label: "Mercadería" },
];

export async function renderReportes(root, ctx)
{
  const tab = ctx.params.get("tab") || "resumen";
  const start = ctx.params.get("start") || monthStartIso();
  const end = ctx.params.get("end") || todayIso();
  const type = ctx.params.get("type") || "";
  const supplierId = ctx.params.get("supplier") || "";
  const report = ctx.params.get("report") || defaultReport(tab);

  let suppliers = [];
  try
  {
    suppliers = await SuppliersApi.list() || [];
  }
  catch
  {
    suppliers = [];
  }

  root.innerHTML = `
    <div class="filters">
      <div class="field"><label>Desde</label><input type="date" id="r-start" value="${start}"></div>
      <div class="field"><label>Hasta</label><input type="date" id="r-end" value="${end}"></div>
      <div class="field"><label>Tipo</label>
        <select id="r-type"><option value="">Todos</option>
          <option${type === "Dama" ? " selected" : ""}>Dama</option>
          <option${type === "Caballero" ? " selected" : ""}>Caballero</option>
          <option${type === "Niño" ? " selected" : ""}>Niño</option>
          <option${type === "Niña" ? " selected" : ""}>Niña</option></select></div>
      <div class="field"><label>Proveedor</label>
        <select id="r-sup"><option value="">Todos</option>
          ${suppliers.map((s) => `<option value="${s.id}" ${String(s.id) === String(supplierId) ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}
        </select></div>
      <button class="btn btn--primary btn--sm" id="r-apply">Aplicar</button>
      <button class="btn btn--gold btn--sm" type="button" id="r-pdf">${I.pdf} Descargar PDF</button>
    </div>
    <div class="tabs">${TABS.map((t) =>
      `<button class="tab ${tab === t.id ? "is-active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("")}</div>
    <div id="r-body">${skeleton(3)}</div>`;

  $("#r-apply", root).addEventListener("click", () =>
    ctx.go("reportes", {
      tab, report,
      start: $("#r-start", root).value,
      end: $("#r-end", root).value,
      type: $("#r-type", root).value,
      supplier: $("#r-sup", root).value,
    }));
  root.querySelectorAll("[data-tab]").forEach((btn) =>
  {
    btn.addEventListener("click", () => ctx.go("reportes", {
      tab: btn.dataset.tab,
      start: $("#r-start", root).value,
      end: $("#r-end", root).value,
      type: $("#r-type", root).value,
      supplier: $("#r-sup", root).value,
    }));
  });
  $("#r-pdf", root).addEventListener("click", () =>
  {
    const typeLabel = $("#r-type", root).value || "Todos los tipos";
    const supplierEl = $("#r-sup", root);
    const supplierLabel = supplierEl.options[supplierEl.selectedIndex]?.text || "Todos";
    printAsPdf({
      title: `Estrada Hermanos — ${reportHeading(tab, report)}`,
      subtitle: `Período ${start} a ${end} · Tipo: ${typeLabel} · Proveedor: ${supplierLabel} · Generado ${todayIso()}`,
    });
  });

  const body = $("#r-body", root);
  const filters = cleanParams({
    start_date: start,
    end_date: end,
    type,
    supplier_id: supplierId ? Number(supplierId) : undefined,
  });
  try
  {
    if (tab === "resumen")
    {
      await fillResumen(body, filters);
    }
    else if (tab === "ventas")
    {
      await fillVentas(body, ctx, filters, report, start, end);
    }
    else if (tab === "inventario")
    {
      await fillInventario(body, ctx, filters, report);
    }
    else
    {
      await fillMercaderia(body, ctx, filters, report, start, end);
    }
  }
  catch (err)
  {
    body.innerHTML = bannerError(err.message);
    $("[data-retry]", body)?.addEventListener("click", () => ctx.reload());
  }
}

function defaultReport(tab)
{
  if (tab === "ventas")
  {
    return "top";
  }
  if (tab === "inventario")
  {
    return "estado";
  }
  if (tab === "mercaderia")
  {
    return "pendientes";
  }
  return "";
}

function reportHeading(tab, report)
{
  const tabs = { resumen: "Resumen", ventas: "Ventas", inventario: "Inventario", mercaderia: "Mercadería" };
  const reports = {
    top: "Más vendidos",
    bottom: "Menos vendidos",
    period: "Detalle del período",
    cat: "Por categoría",
    size: "Por talla",
    sup: "Por proveedor",
    vol: "Volumen",
    estado: "Estado actual",
    grupo: "Por grupo",
    bajo: "Stock bajo",
    agotado: "Agotados",
    lento: "Sin rotación",
    pedir: "Qué pedir",
    pendientes: "Pedidos pendientes",
    recibidos: "Pedidos recibidos",
    vs: "Pedido vs venta",
    nosale: "Pedido que no se vende",
  };
  const group = tabs[tab] || "Reportes";
  if (!report || tab === "resumen")
  {
    return group;
  }
  return `${group} · ${reports[report] || report}`;
}

function reportChips(ctx, current, items, extra)
{
  return `<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1rem">${items.map((it) =>
    `<button class="chip ${current === it.id ? "is-active" : ""}" data-rep="${it.id}">${it.label}</button>`).join("")}</div>`;
}

function bindChips(body, ctx, tab)
{
  body.querySelectorAll("[data-rep]").forEach((btn) =>
  {
    btn.addEventListener("click", () => ctx.go("reportes", {
      tab,
      report: btn.dataset.rep,
      start: $("#r-start")?.value,
      end: $("#r-end")?.value,
      type: $("#r-type")?.value,
      supplier: $("#r-sup")?.value,
    }));
  });
}

async function fillResumen(body, filters)
{
  const [summary, styles] = await Promise.all([
    ReportsApi.summary(filters),
    ReportsApi.newStyles(filters),
  ]);
  const s = summary?.sales || {};
  const i = summary?.inventory || {};
  const m = summary?.merchandise || {};
  const c = summary?.catalog || {};
  body.innerHTML = `
    <div class="kpis">
      ${kpi(I.ventas, "Pares vendidos", formatInt(s.amount_sold))}
      ${kpi(I.box, "Ventas", formatInt(s.sale_count))}
      ${kpi(I.inventario, "Pares en stock", formatInt(i.pairs_in_stock))}
      ${kpi(I.alert, "Bajo / agotado", `${formatInt(i.low_stock_count)} / ${formatInt(i.out_of_stock_count)}`)}
    </div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      ${kpi(I.mercaderia, "Pedidos pendientes", formatInt(m.pending_orders))}
      ${kpi(I.box, "Pares recibidos", formatInt(m.pairs_received))}
      ${kpi(I.productos, "Estilos nuevos", formatInt(c.new_styles))}
    </div>
    <div class="card">
      <div class="card__head"><div class="card__title">Estilos registrados en el período</div></div>
      <div class="card__body card__body--flush">${(styles || []).length ? tableWrap(
        [{ label: "Código" }, { label: "Nombre" }, { label: "Tipo" }, { label: "Proveedor" }, { label: "Alta" }],
        styles.map((st) => `<tr><td class="code">${escapeHtml(st.code)}</td><td>${escapeHtml(st.name)}</td>
          <td>${escapeHtml(st.type)}</td><td>${escapeHtml(st.supplier_name)}</td>
          <td>${escapeHtml(st.created_at)}</td></tr>`).join("")
      ) : empty(I.productos, "No hay estilos nuevos en este período.")}</div>
    </div>`;
}

async function fillVentas(body, ctx, filters, report, start, end)
{
  const chips = [
    { id: "top", label: "Más vendidos" },
    { id: "bottom", label: "Menos vendidos" },
    { id: "period", label: "Detalle del período" },
    { id: "cat", label: "Por categoría" },
    { id: "size", label: "Por talla" },
    { id: "sup", label: "Por proveedor" },
    { id: "vol", label: "Volumen" },
  ];
  let html = reportChips(ctx, report, chips);
  if (report === "top")
  {
    const rows = await ReportsApi.topProducts({ ...filters, limit: 10 });
    html += `<div class="card"><div class="card__body">${rankBars((rows || []).map((p) => ({
      label: `${p.shoe_name} · ${p.color} · ${p.size}`, v: p.amount_sold,
    })))}</div></div>`;
  }
  else if (report === "bottom")
  {
    const rows = await ReportsApi.bottomProducts({ ...filters, limit: 10 });
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Vendidos", num: true }, { label: "Stock" },
    ], (p) => `<tr><td>${escapeHtml(p.shoe_name)}</td><td>${escapeHtml(p.color)}</td><td>${p.size}</td>
      <td class="num">${p.amount_sold}</td><td>${p.current_stock}</td></tr>`);
  }
  else if (report === "period")
  {
    const rows = await ReportsApi.salesByPeriod({ start_date: start, end_date: end });
    html += tableOrEmpty(rows, [
      { label: "Fecha" }, { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Pares", num: true },
    ], (p) => `<tr><td>${escapeHtml(p.sale_date)}</td><td>${escapeHtml(p.shoe_name)}</td>
      <td>${escapeHtml(p.color)}</td><td>${p.size}</td><td class="num">${p.amount}</td></tr>`);
  }
  else if (report === "cat")
  {
    const rows = await ReportsApi.salesByCategory(filters);
    const dama = (rows || []).find((r) => r.type === "Dama");
    html += `<div class="card"><div class="card__body">${(rows || []).length ? donut(
      dama?.share_percent || 0, `${dama?.share_percent || 0}%`, "Dama",
      (rows || []).map((r, i) => ({ color: i ? "var(--rosewood)" : "var(--gold)", label: r.type, val: `${formatInt(r.amount_sold)} pares` }))
    ) : empty(I.reportes, "Sin datos.")}</div></div>`;
  }
  else if (report === "size")
  {
    const rows = await ReportsApi.salesBySize(filters);
    html += `<div class="card"><div class="card__body">${barsChart((rows || []).map((r) => ({ m: `T${r.size}`, v: r.amount_sold })))}</div></div>`;
  }
  else if (report === "sup")
  {
    const rows = await ReportsApi.salesBySupplier(filters);
    html += tableOrEmpty(rows, [
      { label: "Proveedor" }, { label: "Pares", num: true }, { label: "Estilos" }, { label: "%" },
    ], (r) => `<tr><td>${escapeHtml(r.supplier_name)}</td><td class="num">${r.amount_sold}</td>
      <td>${r.styles_sold}</td><td>${r.share_percent}%</td></tr>`);
  }
  else
  {
    const group = ctx.params.get("group") || "DAY";
    const rows = await ReportsApi.salesVolume({ start_date: start, end_date: end, group_by: group });
    html += `<div class="period-switch" style="margin-bottom:1rem">
      ${["DAY", "WEEK", "MONTH"].map((g) => `<button class="chip ${group === g ? "is-active" : ""}" data-group="${g}">${g === "DAY" ? "Día" : g === "WEEK" ? "Semana" : "Mes"}</button>`).join("")}
    </div>
    <div class="card"><div class="card__body">${barsChart((rows || []).map((r) => ({ m: r.period, v: r.amount_sold })))}</div></div>`;
  }
  body.innerHTML = html;
  bindChips(body, ctx, "ventas");
  body.querySelectorAll("[data-group]").forEach((btn) =>
  {
    btn.addEventListener("click", () => ctx.go("reportes", {
      tab: "ventas", report: "vol", group: btn.dataset.group,
      start: $("#r-start")?.value, end: $("#r-end")?.value,
      type: $("#r-type")?.value, supplier: $("#r-sup")?.value,
    }));
  });
}

async function fillInventario(body, ctx, filters, report)
{
  const chips = [
    { id: "estado", label: "Estado actual" },
    { id: "grupo", label: "Por grupo" },
    { id: "bajo", label: "Stock bajo" },
    { id: "agotado", label: "Agotados" },
    { id: "lento", label: "Sin rotación" },
    { id: "pedir", label: "Qué pedir" },
  ];
  let html = reportChips(ctx, report, chips);
  if (report === "estado")
  {
    const rows = await ReportsApi.inventory({ type: filters.type, supplier_id: filters.supplier_id, include_out_of_stock: true });
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Pares", num: true },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td>
      <td>${r.size}</td><td class="num">${r.stock}</td></tr>`);
  }
  else if (report === "grupo")
  {
    const group = ctx.params.get("group") || "TYPE";
    const rows = await ReportsApi.inventoryByGroup({ group_by: group });
    html += `<div class="period-switch" style="margin-bottom:1rem">
      <button class="chip ${group === "TYPE" ? "is-active" : ""}" data-group="TYPE">Tipo</button>
      <button class="chip ${group === "SUPPLIER" ? "is-active" : ""}" data-group="SUPPLIER">Proveedor</button>
    </div>
    <div class="kpis">${(rows || []).map((r) => kpi(I.inventario, r.group, `${formatInt(r.pairs_in_stock)} pares`)).join("") || empty(I.inventario, "Sin datos.")}</div>`;
  }
  else if (report === "bajo")
  {
    const rows = await ReportsApi.lowStock(filters);
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Stock" }, { label: "Mínimo" }, { label: "Proveedor" },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td><td>${r.size}</td>
      <td>${r.stock}</td><td>${r.min_stock}</td><td>${escapeHtml(r.supplier_name)}</td></tr>`);
  }
  else if (report === "agotado")
  {
    const rows = await ReportsApi.outOfStock(filters);
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Tipo" }, { label: "Pedido pendiente" },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td><td>${r.size}</td>
      <td>${escapeHtml(r.type)}</td><td>${r.has_pending_order ? "Sí" : "No"}</td></tr>`);
  }
  else if (report === "lento")
  {
    const rows = await ReportsApi.slowMovers(filters);
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Stock" }, { label: "Última venta" }, { label: "Días" },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td><td>${r.size}</td>
      <td>${r.stock}</td><td>${r.last_sale_date || "Nunca vendido"}</td><td>${r.days_without_sale ?? "—"}</td></tr>`);
  }
  else
  {
    const rows = await ReportsApi.restock(filters);
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Vendidos" }, { label: "Stock" }, { label: "Consejo" }, { label: "" },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td><td>${r.size}</td>
      <td>${r.amount_sold}</td><td>${r.stock}</td><td>${badgeAdvice(r.advice)}</td>
      <td>${r.advice === "REPONER" ? `<button class="btn btn--gold btn--sm" data-pedir="${r.shoe_stock_id}">Crear pedido</button>` : ""}</td></tr>`);
  }
  body.innerHTML = html;
  bindChips(body, ctx, "inventario");
  body.querySelectorAll("[data-group]").forEach((btn) =>
  {
    btn.addEventListener("click", () => ctx.go("reportes", {
      tab: "inventario", report: "grupo", group: btn.dataset.group,
      start: $("#r-start")?.value, end: $("#r-end")?.value,
      type: $("#r-type")?.value, supplier: $("#r-sup")?.value,
    }));
  });
  body.querySelectorAll("[data-pedir]").forEach((btn) =>
  {
    btn.addEventListener("click", () =>
    {
      sessionStorage.setItem("eh.draftVariant", btn.dataset.pedir);
      toast("Abra un pedido pendiente y agregue la variante sugerida.");
      ctx.go("mercaderia", { tab: "PENDIENTE" });
    });
  });
}

async function fillMercaderia(body, ctx, filters, report, start, end)
{
  const chips = [
    { id: "pendientes", label: "Pendientes" },
    { id: "recibidos", label: "Recibidos" },
    { id: "sup", label: "Por proveedor" },
    { id: "vs", label: "Pedido vs venta" },
    { id: "nosale", label: "Pedido que no se vende" },
  ];
  let html = reportChips(ctx, report, chips);
  if (report === "pendientes")
  {
    const rows = await ReportsApi.pendingOrders({ supplier_id: filters.supplier_id });
    html += tableOrEmpty(rows, [
      { label: "Folio" }, { label: "Proveedor" }, { label: "Días" }, { label: "Pares", num: true },
    ], (r) => `<tr><td class="code">${escapeHtml(r.order_id)}</td><td>${escapeHtml(r.supplier_name)}</td>
      <td>${r.days_pending}</td><td class="num">${r.total_pairs}</td></tr>`);
  }
  else if (report === "recibidos")
  {
    const rows = await ReportsApi.receivedOrders({ start_date: start, end_date: end, supplier_id: filters.supplier_id });
    html += tableOrEmpty(rows, [
      { label: "Folio" }, { label: "Proveedor" }, { label: "Fecha" }, { label: "Pares", num: true },
    ], (r) => `<tr><td class="code">${escapeHtml(r.order_id)}</td><td>${escapeHtml(r.supplier_name)}</td>
      <td>${escapeHtml(r.creation_date)}</td><td class="num">${r.total_pairs}</td></tr>`);
  }
  else if (report === "sup")
  {
    const rows = await ReportsApi.ordersBySupplier(filters);
    html += tableOrEmpty(rows, [
      { label: "Proveedor" }, { label: "Pendientes" }, { label: "Recibidos" }, { label: "Pares pedidos" }, { label: "Pares recibidos" },
    ], (r) => `<tr><td>${escapeHtml(r.supplier_name)}</td><td>${r.pending_count}</td><td>${r.received_count}</td>
      <td>${r.pairs_requested}</td><td>${r.pairs_received}</td></tr>`);
  }
  else if (report === "vs")
  {
    const rows = await ReportsApi.orderedVsSold({ start_date: start, end_date: end, supplier_id: filters.supplier_id });
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Pedidos" }, { label: "Vendidos" }, { label: "Diferencia" },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td><td>${r.size}</td>
      <td>${r.pairs_ordered}</td><td>${r.pairs_sold}</td><td>${r.difference}</td></tr>`);
  }
  else
  {
    const rows = await ReportsApi.orderedNotSelling(filters);
    html += tableOrEmpty(rows, [
      { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Pedidos" }, { label: "Vendidos" }, { label: "Días sin venta" },
    ], (r) => `<tr><td>${escapeHtml(r.shoe_name)}</td><td>${escapeHtml(r.color)}</td><td>${r.size}</td>
      <td>${r.pairs_ordered}</td><td>${r.pairs_sold}</td><td>${r.days_without_sale ?? "—"}</td></tr>`);
  }
  body.innerHTML = html;
  bindChips(body, ctx, "mercaderia");
}

function tableOrEmpty(rows, headers, rowFn)
{
  if (!rows?.length)
  {
    return `<div class="card"><div class="card__body">${empty(I.reportes, "No hay movimientos en este período.")}</div></div>`;
  }
  return `<div class="card"><div class="card__body card__body--flush">${tableWrap(headers, rows.map(rowFn).join(""))}</div></div>`;
}
