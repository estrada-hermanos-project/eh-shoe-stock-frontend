import { InventoryApi, ReportsApi, ShoesApi } from "../api.js";
import {
  I, $, badgeStock, bannerError, empty, escapeHtml, formatInt, kpi, optionsHtml, skeleton,
  tableWrap, toast,
} from "../ui.js";
import { openStockModal } from "./ventas.js";

const CHIPS = ["Todos", "Dama", "Caballero", "Niño", "Niña", "Bajo", "Agotado", "Sin rotación"];

function renderPointQuery(data, filtered)
{
  if (Array.isArray(data))
  {
    return renderStyleVariants(data, filtered);
  }
  return `<div class="lookup-result"><small>${escapeHtml(data.name)} · ${escapeHtml(data.color)} · talla ${data.size}</small>${formatInt(data.stock)} pares</div>`;
}

function renderStyleVariants(rows, filtered)
{
  if (!rows.length)
  {
    const message = filtered
      ? "No hay existencias para ese color o talla."
      : "Ese estilo no tiene existencias.";
    return empty(I.inventario, message);
  }
  const title = rows[0].name ? `<p class="muted">${escapeHtml(rows[0].name)}</p>` : "";
  return title + tableWrap(
    [{ label: "Color" }, { label: "Talla" }, { label: "Pares", num: true }],
    rows.map((row) => `<tr>
      <td>${escapeHtml(row.color)}</td>
      <td>${row.size}</td>
      <td class="num">${formatInt(row.stock)}</td>
    </tr>`).join("")
  );
}

function distinct(values)
{
  const seen = new Set();
  const result = [];
  values.forEach((value) =>
  {
    const key = String(value);
    if (!seen.has(key))
    {
      seen.add(key);
      result.push(value);
    }
  });
  return result;
}

function asVariants(data)
{
  if (Array.isArray(data))
  {
    return data;
  }
  return data ? [data] : [];
}

function sizesFor(variants, color)
{
  const source = color ? variants.filter((row) => row.color === color) : variants;
  return distinct(source.map((row) => row.size).filter((size) => size !== undefined && size !== null))
    .sort((left, right) => Number(left) - Number(right));
}

function paintSizes(sizeSelect, variants, color)
{
  const sizes = sizesFor(variants, color);
  const previous = sizeSelect.value;
  sizeSelect.disabled = sizes.length === 0;
  sizeSelect.innerHTML = sizes.length
    ? `<option value="">Cualquiera</option>${optionsHtml(sizes, (size) => size, (size) => size, previous)}`
    : `<option value="">Sin tallas</option>`;
  if (previous && !sizes.some((size) => String(size) === previous))
  {
    sizeSelect.value = "";
  }
}

function codeSelect(shoes)
{
  const catalog = shoes || [];
  if (!catalog.length)
  {
    return `<select id="q-code" disabled><option value="">No hay estilos</option></select>`;
  }
  return `<select id="q-code">${optionsHtml(
    catalog,
    (shoe) => shoe.code,
    (shoe) => `${shoe.code} · ${shoe.name}`
  )}</select>`;
}

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
            <div class="field"><label>Código</label>
              ${codeSelect(shoes)}</div>
            <div class="field"><label>Color</label><select id="q-color" disabled><option value="">Cualquiera</option></select></div>
            <div class="field"><label>Talla</label><select id="q-size" disabled><option value="">Cualquiera</option></select></div>
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

    let styleVariants = [];

    async function refreshStyleFilters()
    {
      const shoeId = $("#q-code", root).value.trim();
      const colorSelect = $("#q-color", root);
      const sizeSelect = $("#q-size", root);
      if (!shoeId)
      {
        styleVariants = [];
        colorSelect.disabled = true;
        sizeSelect.disabled = true;
        colorSelect.innerHTML = `<option value="">Sin colores</option>`;
        sizeSelect.innerHTML = `<option value="">Sin tallas</option>`;
        return;
      }
      try
      {
        styleVariants = asVariants(await InventoryApi.query(shoeId));
        const colors = distinct(styleVariants.map((row) => row.color).filter(Boolean));
        colorSelect.disabled = colors.length === 0;
        colorSelect.innerHTML = colors.length
          ? `<option value="">Cualquiera</option>${optionsHtml(colors, (color) => color, (color) => color)}`
          : `<option value="">Sin colores</option>`;
        paintSizes(sizeSelect, styleVariants, "");
      }
      catch (err)
      {
        styleVariants = [];
        $("#q-result", root).innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      }
    }

    $("#q-code", root)?.addEventListener("change", () => refreshStyleFilters());
    $("#q-color", root)?.addEventListener("change", () =>
    {
      paintSizes($("#q-size", root), styleVariants, $("#q-color", root).value);
    });
    $("#q-go", root)?.addEventListener("click", async () =>
    {
      const shoeId = $("#q-code", root).value.trim();
      const color = $("#q-color", root).value.trim();
      const sizeText = $("#q-size", root).value.trim();
      const box = $("#q-result", root);
      if (!shoeId)
      {
        toast("Indique el código del estilo.");
        return;
      }
      try
      {
        const data = await InventoryApi.query(shoeId, color, sizeText === "" ? undefined : Number(sizeText));
        box.innerHTML = renderPointQuery(data, Boolean(color || sizeText));
      }
      catch (err)
      {
        box.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      }
    });
    await refreshStyleFilters();
    $("[data-action='ingresar-pares']", root)?.addEventListener("click", () => openStockModal(ctx));
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}
