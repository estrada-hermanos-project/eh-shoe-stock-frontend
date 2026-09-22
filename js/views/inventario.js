import { InventoryApi, ReportsApi, ShoesApi } from "../api.js";
import {
  I, $, badgeStock, bannerError, empty, escapeHtml, formatInt, kpi, skeleton,
  tableWrap, toast,
} from "../ui.js";
import { openStockModal } from "./ventas.js";

const CHIPS = ["Todos", "Dama", "Caballero", "Niño", "Niña", "Bajo", "Agotado", "Sin rotación"];

export async function renderInventario(root, ctx)
{
  const filter = ctx.params.get("filter") || "Todos";
  const query = (ctx.query || "").toLowerCase();
  root.innerHTML = skeleton(4);

  try
  {
    const typeParam = ["Dama", "Caballero", "Niño", "Niña"].includes(filter) ? filter : undefined;
    const [status, lows, slows, shoes] = await Promise.all([
      ReportsApi.inventory({ include_out_of_stock: true, type: typeParam }),
      ReportsApi.lowStock(typeParam ? { type: typeParam } : undefined),
      ReportsApi.slowMovers(typeParam ? { type: typeParam } : undefined),
      ShoesApi.list(),
    ]);
    const lowIds = new Set((lows || []).map((x) => x.shoe_stock_id));
    const slowIds = new Set((slows || []).map((x) => x.shoe_stock_id));
    const typeByName = Object.fromEntries((shoes || []).map((s) => [s.name, s.type]));

    let list = status || [];
    if (filter === "Bajo")
    {
      list = list.filter((r) => lowIds.has(r.shoe_stock_id));
    }
    else if (filter === "Agotado")
    {
      list = list.filter((r) => Number(r.stock) === 0);
    }
    else if (filter === "Sin rotación")
    {
      list = list.filter((r) => slowIds.has(r.shoe_stock_id));
    }
    if (query)
    {
      list = list.filter((r) => `${r.shoe_name} ${r.color} ${r.size}`.toLowerCase().includes(query));
    }

    const total = (status || []).reduce((a, r) => a + Number(r.stock || 0), 0);
    const out = (status || []).filter((r) => Number(r.stock) === 0).length;

    root.innerHTML = `
      <div class="kpis">
        ${kpi(I.inventario, "Stock total (pares)", formatInt(total))}
        ${kpi(I.alert, "Bajo mínimo", formatInt((lows || []).length))}
        ${kpi(I.box, "Agotados", formatInt(out))}
        ${kpi(I.reportes, "Sin rotación", formatInt((slows || []).length))}
      </div>
      <div class="card" style="margin-bottom:1.1rem">
        <div class="card__head"><div class="card__title">Consulta puntual</div><div class="card__sub">Cuando tiene el zapato en la mano</div></div>
        <div class="card__body">
          <div class="filters" style="margin:0">
            <div class="field"><label>Código</label><input id="q-code" placeholder="EH-CAB-001"></div>
            <div class="field"><label>Color</label><input id="q-color" placeholder="Negro"></div>
            <div class="field"><label>Talla</label><input type="number" id="q-size" min="1" placeholder="40"></div>
            <button class="btn btn--primary btn--sm" id="q-go">Consultar</button>
          </div>
          <div id="q-result"></div>
        </div>
      </div>
      <div class="card">
        <div class="card__head">
          <div><div class="card__title">Estado del inventario</div><div class="card__sub">Existencias por estilo, color y talla</div></div>
          <button class="btn btn--gold btn--sm" data-action="ingresar-pares">${I.plus} Ingresar pares</button>
        </div>
        <div class="card__body">
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">${CHIPS.map((c) =>
            `<button class="chip ${filter === c ? "is-active" : ""}" data-go="inventario" data-filter="${c}">${c}</button>`).join("")}</div>
        </div>
        <div class="card__body card__body--flush">${list.length ? tableWrap(
          [{ label: "Estilo" }, { label: "Tipo" }, { label: "Color" }, { label: "Talla" }, { label: "Pares", num: true }, { label: "Estado" }, { label: "Rotación" }],
          list.map((r) => `<tr>
            <td>${escapeHtml(r.shoe_name)}</td>
            <td>${escapeHtml(typeByName[r.shoe_name] || "—")}</td>
            <td>${escapeHtml(r.color)}</td>
            <td>${r.size}</td>
            <td class="num"><b>${r.stock}</b></td>
            <td>${badgeStock(r.stock, lowIds.has(r.shoe_stock_id))}</td>
            <td>${slowIds.has(r.shoe_stock_id) ? `<span class="badge badge--warn">Baja</span>` : `<span class="badge badge--ok">Activa</span>`}</td>
          </tr>`).join("")
        ) : empty(I.inventario, "Sin resultados para el filtro seleccionado.")}</div>
      </div>`;

    $("#q-go", root)?.addEventListener("click", async () =>
    {
      const shoeId = $("#q-code", root).value.trim();
      const color = $("#q-color", root).value.trim();
      const size = Number($("#q-size", root).value);
      const box = $("#q-result", root);
      if (!shoeId || !color || !size)
      {
        toast("Indique código, color y talla.");
        return;
      }
      try
      {
        const row = await InventoryApi.query(shoeId, color, size);
        box.innerHTML = `<div class="lookup-result"><small>${escapeHtml(row.name)} · ${escapeHtml(row.color)} · talla ${row.size}</small>${formatInt(row.stock)} pares</div>`;
      }
      catch (err)
      {
        box.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      }
    });
    $("[data-action='ingresar-pares']", root)?.addEventListener("click", () => openStockModal(ctx));
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}
