import { ReportsApi, SalesApi } from "../api.js";
import {
  I, $, bannerError, donut, empty, escapeHtml, formatInt, kpi,
  monthStartIso, rankBars, skeleton, tableWrap, todayIso, weekStartIso,
} from "../ui.js";
import { openSaleModal } from "./ventas.js";

function rangeFor(period)
{
  const end = todayIso();
  if (period === "hoy")
  {
    return { start_date: end, end_date: end };
  }
  if (period === "semana")
  {
    return { start_date: weekStartIso(), end_date: end };
  }
  return { start_date: monthStartIso(), end_date: end };
}

export async function renderDashboard(root, ctx)
{
  const period = ctx.params.get("period") || "mes";
  root.innerHTML = `
    <div class="period-switch" style="margin-bottom:1rem">
      ${["hoy", "semana", "mes"].map((p) =>
        `<button class="chip ${period === p ? "is-active" : ""}" data-go="dashboard" data-period="${p}">${p === "hoy" ? "Hoy" : p === "semana" ? "Esta semana" : "Este mes"}</button>`
      ).join("")}
    </div>
    ${skeleton()}`;

  const range = rangeFor(period);
  try
  {
    const [summary, top, categories, lows, outs, pending, sales] = await Promise.all([
      ReportsApi.summary(range),
      ReportsApi.topProducts({ ...range, limit: 5 }),
      ReportsApi.salesByCategory(range),
      ReportsApi.lowStock(),
      ReportsApi.outOfStock(),
      ReportsApi.pendingOrders(),
      SalesApi.byDate(todayIso()),
    ]);

    const salesData = summary?.sales || {};
    const inv = summary?.inventory || {};
    const mer = summary?.merchandise || {};
    const alerts = [...(lows || []), ...(outs || [])];
    const dama = (categories || []).find((c) => c.type === "Dama");
    const cab = (categories || []).find((c) => c.type === "Caballero");
    const damaPairs = Number(dama?.amount_sold || 0);
    const cabPairs = Number(cab?.amount_sold || 0);
    const damaPct = dama?.share_percent ?? (damaPairs + cabPairs ? Math.round((damaPairs / (damaPairs + cabPairs)) * 100) : 0);

    root.innerHTML = `
      <div class="kpis">
        ${kpi(I.ventas, "Pares vendidos", formatInt(salesData.amount_sold))}
        ${kpi(I.inventario, "Stock total (pares)", formatInt(inv.pairs_in_stock))}
        ${kpi(I.alert, "Alertas de stock", formatInt(Number(inv.low_stock_count || 0) + Number(inv.out_of_stock_count || 0)))}
        ${kpi(I.mercaderia, "Pedidos pendientes", formatInt(mer.pending_orders))}
      </div>
      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><div class="card__title">Productos más vendidos</div><span class="badge badge--gold">Pares</span></div>
          <div class="card__body">${rankBars((top || []).map((p) => ({
            label: `${p.shoe_name} · ${p.color} · ${p.size}`,
            v: p.amount_sold,
          })))}</div>
        </div>
        <div class="card">
          <div class="card__head"><div class="card__title">Ventas por categoría</div></div>
          <div class="card__body">${(categories || []).length ? donut(damaPct, `${damaPct}%`, "Dama", [
            { color: "var(--gold)", label: "Dama", val: `${formatInt(damaPairs)} pares` },
            { color: "var(--cream-deep)", label: "Caballero", val: `${formatInt(cabPairs)} pares` },
          ]) : empty(I.reportes, "Aún no hay ventas en el período.")}</div>
        </div>
      </div>
      <div class="grid grid--2" style="margin-top:1.1rem">
        <div class="card">
          <div class="card__head">
            <div class="card__title">Alertas de inventario</div>
            <button class="btn btn--ghost btn--sm" data-go="inventario" data-filter="Bajo">Ver inventario</button>
          </div>
          <div class="card__body">${alerts.length ? alerts.slice(0, 8).map((p) => `
            <div style="display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;border-bottom:1px solid var(--line-soft)">
              <div><b>${escapeHtml(p.shoe_name)}</b><div class="muted">${escapeHtml(p.color)} · talla ${p.size}</div></div>
              <div style="text-align:right">${p.stock === 0 || p.stock == null
                ? `<span class="badge badge--danger">Agotado</span>`
                : `<span class="badge badge--warn">${p.stock} pares</span>`}</div>
            </div>`).join("") : empty(I.check, "Sin alertas de stock.")}</div>
        </div>
        <div class="card">
          <div class="card__head">
            <div class="card__title">Pedidos pendientes</div>
            <button class="btn btn--ghost btn--sm" data-go="mercaderia">Ver mercadería</button>
          </div>
          <div class="card__body">${(pending || []).length ? pending.slice(0, 6).map((o) => `
            <div style="display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;border-bottom:1px solid var(--line-soft)">
              <div><b class="code">${escapeHtml(o.order_id)}</b><div class="muted">${escapeHtml(o.supplier_name)} · ${o.days_pending ?? 0} días</div></div>
              <button class="btn btn--gold btn--sm" data-go="mercaderia" data-order="${escapeHtml(o.order_id)}">Recibir</button>
            </div>`).join("") : empty(I.mercaderia, "No hay pedidos pendientes.")}</div>
        </div>
      </div>
      <div class="card" style="margin-top:1.1rem">
        <div class="card__head">
          <div><div class="card__title">Últimas ventas de hoy</div><div class="card__sub">${(sales || []).length} registro(s)</div></div>
          <button class="btn btn--gold btn--sm" data-action="nueva-venta">${I.plus} Registrar venta</button>
        </div>
        <div class="card__body card__body--flush">${salesTable(sales || [])}</div>
      </div>`;

    root.querySelectorAll("[data-action='nueva-venta']").forEach((btn) =>
    {
      btn.addEventListener("click", () => openSaleModal(ctx));
    });
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}

function salesTable(list)
{
  if (!list.length)
  {
    return empty(I.ventas, "Aún no hay ventas hoy.", `<button class="btn btn--gold btn--sm" data-action="nueva-venta">${I.plus} Registrar venta</button>`);
  }
  return tableWrap(
    [{ label: "#" }, { label: "Fecha" }, { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Pares", num: true }],
    list.map((s, i) => `<tr>
      <td class="code">${i + 1}</td><td>${escapeHtml(s.sale_date)}</td>
      <td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.color)}</td>
      <td>${s.size}</td><td class="num">${s.stock}</td>
    </tr>`).join("")
  );
}
