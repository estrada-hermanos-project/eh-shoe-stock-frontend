import { InventoryApi, ReportsApi, SalesApi, ShoesApi, cleanParams } from "../api.js";
import {
  I, $, bannerError, closeModal, empty, escapeHtml, formatInt, kpi, openModal,
  optionsHtml, skeleton, tableWrap, todayIso, toast,
} from "../ui.js";

export async function renderVentas(root, ctx)
{
  const mode = ctx.params.get("mode") || "dia";
  const date = ctx.params.get("date") || todayIso();
  const start = ctx.params.get("start") || todayIso();
  const end = ctx.params.get("end") || todayIso();
  const query = (ctx.query || "").toLowerCase();

  root.innerHTML = `
    <div class="filters">
      <div class="field"><label>Vista</label>
        <select id="v-mode"><option value="dia"${mode === "dia" ? " selected" : ""}>Un día</option>
        <option value="rango"${mode === "rango" ? " selected" : ""}>Rango</option></select>
      </div>
      <div class="field" id="f-day"${mode === "rango" ? " hidden" : ""}"><label>Fecha</label>
        <input type="date" id="v-date" value="${date}"></div>
      <div class="field"${mode === "dia" ? " hidden" : ""} id="f-start"><label>Desde</label>
        <input type="date" id="v-start" value="${start}"></div>
      <div class="field"${mode === "dia" ? " hidden" : ""} id="f-end"><label>Hasta</label>
        <input type="date" id="v-end" value="${end}"></div>
      <button class="btn btn--primary btn--sm" id="v-apply">Consultar</button>
      <button class="btn btn--gold btn--sm" data-action="nueva-venta">${I.plus} Registrar venta</button>
    </div>
    ${skeleton(3)}`;

  try
  {
    const list = mode === "rango"
      ? await SalesApi.range(start, end)
      : await SalesApi.byDate(date);
    const filtered = (list || []).filter((s) =>
      !query || `${s.name} ${s.color}`.toLowerCase().includes(query));
    const pairs = filtered.reduce((a, s) => a + Number(s.stock || 0), 0);

    root.innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        ${kpi(I.ventas, "Pares vendidos", formatInt(pairs))}
        ${kpi(I.box, "Ventas registradas", formatInt(filtered.length))}
        ${kpi(I.reportes, "Período", mode === "rango" ? `${start} → ${end}` : date)}
      </div>
      <div class="card">
        <div class="card__head">
          <div><div class="card__title">Historial de ventas</div><div class="card__sub">${filtered.length} registro(s) · sin montos</div></div>
          <button class="btn btn--gold btn--sm" data-action="nueva-venta">${I.plus} Registrar venta</button>
        </div>
        <div class="card__body">
          <div class="filters" style="margin-bottom:0">
            <div class="field"><label>Vista</label>
              <select id="v-mode"><option value="dia"${mode === "dia" ? " selected" : ""}>Un día</option>
              <option value="rango"${mode === "rango" ? " selected" : ""}>Rango</option></select></div>
            <div class="field" id="f-day"${mode === "rango" ? " hidden" : ""}><label>Fecha</label>
              <input type="date" id="v-date" value="${date}"></div>
            <div class="field" id="f-start"${mode === "dia" ? " hidden" : ""}><label>Desde</label>
              <input type="date" id="v-start" value="${start}"></div>
            <div class="field" id="f-end"${mode === "dia" ? " hidden" : ""}><label>Hasta</label>
              <input type="date" id="v-end" value="${end}"></div>
            <button class="btn btn--primary btn--sm" id="v-apply">Consultar</button>
          </div>
        </div>
        <div class="card__body card__body--flush">${filtered.length ? tableWrap(
          [{ label: "#" }, { label: "Fecha" }, { label: "Estilo" }, { label: "Color" }, { label: "Talla" }, { label: "Pares", num: true }],
          filtered.map((s, i) => `<tr><td class="code">${i + 1}</td><td>${escapeHtml(s.sale_date)}</td>
            <td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.color)}</td><td>${s.size}</td>
            <td class="num">${s.stock}</td></tr>`).join("")
        ) : empty(I.ventas, "No hay ventas que coincidan.")}</div>
      </div>`;

    bindFilters(root, ctx);
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

function bindFilters(root, ctx)
{
  const modeEl = $("#v-mode", root);
  modeEl?.addEventListener("change", () =>
  {
    const rango = modeEl.value === "rango";
    $("#f-day", root).hidden = rango;
    $("#f-start", root).hidden = !rango;
    $("#f-end", root).hidden = !rango;
  });
  $("#v-apply", root)?.addEventListener("click", () =>
  {
    const nextMode = $("#v-mode", root).value;
    ctx.go("ventas", nextMode === "rango"
      ? { mode: "rango", start: $("#v-start", root).value, end: $("#v-end", root).value }
      : { mode: "dia", date: $("#v-date", root).value });
  });
}

export async function openSaleModal(ctx)
{
  let shoes = [];
  let variants = [];
  try
  {
    [shoes, variants] = await Promise.all([
      ShoesApi.list(),
      ReportsApi.inventory(cleanParams({ include_out_of_stock: false })),
    ]);
  }
  catch (err)
  {
    toast(err.message, "err");
    return;
  }
  if (!shoes.length)
  {
    toast("Primero registre un estilo en Productos.");
    return;
  }

  const first = shoes[0];
  const colorsOf = (name) => [...new Set(variants.filter((v) => v.shoe_name === name).map((v) => v.color))];
  const sizesOf = (name, color) => variants
    .filter((v) => v.shoe_name === name && v.color === color && v.stock > 0)
    .map((v) => v.size);

  const fillSizes = (name, color) =>
  {
    const sizes = sizesOf(name, color);
    return sizes.length
      ? sizes.map((sz) => `<option value="${sz}">Talla ${sz}</option>`).join("")
      : `<option value="">Sin existencias</option>`;
  };

  openModal("Registrar venta", `
    <div class="field"><label>Estilo</label>
      <select id="f-name">${optionsHtml(shoes, (s) => s.name, (s) => `${s.code} — ${s.name}`)}</select></div>
    <div class="form-row">
      <div class="field"><label>Color</label>
        <select id="f-color">${optionsHtml(colorsOf(first.name).map((c) => ({ c })), (x) => x.c, (x) => x.c)}</select></div>
      <div class="field"><label>Talla</label>
        <select id="f-size">${fillSizes(first.name, colorsOf(first.name)[0])}</select></div>
    </div>
    <div class="field"><label>Pares</label><input type="number" id="f-qty" min="1" value="1"></div>
    <p class="muted">El stock se descuenta al confirmar. No se registra precio.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-save" type="button">Registrar venta</button>`);

  const refresh = () =>
  {
    const name = $("#f-name").value;
    const colors = colorsOf(name);
    $("#f-color").innerHTML = colors.length
      ? optionsHtml(colors.map((c) => ({ c })), (x) => x.c, (x) => x.c)
      : `<option value="">Sin colores</option>`;
    $("#f-size").innerHTML = fillSizes(name, $("#f-color").value);
  };
  $("#f-name").addEventListener("change", refresh);
  $("#f-color").addEventListener("change", () =>
  {
    $("#f-size").innerHTML = fillSizes($("#f-name").value, $("#f-color").value);
  });
  $("#f-save").addEventListener("click", async () =>
  {
    const name = $("#f-name").value;
    const color = $("#f-color").value;
    const size = Number($("#f-size").value);
    const stock = Number($("#f-qty").value);
    if (!name || !color || !size || stock < 1)
    {
      toast("Complete estilo, color, talla y pares.");
      return;
    }
    try
    {
      await SalesApi.register({ name, color, size, stock });
      closeModal();
      toast(`Venta registrada: ${stock} par(es) de ${name}`);
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}

export async function openStockModal(ctx, presetCode)
{
  let shoes = [];
  try
  {
    shoes = await ShoesApi.list();
  }
  catch (err)
  {
    toast(err.message, "err");
    return;
  }
  if (!shoes.length)
  {
    toast("Primero registre un estilo.");
    return;
  }
  openModal("Ingresar pares", `
    <div class="field"><label>Estilo</label>
      <select id="f-code">${optionsHtml(shoes, (s) => s.code, (s) => `${s.code} — ${s.name}`, presetCode)}</select></div>
    <div class="form-row">
      <div class="field"><label>Color</label><input id="f-color" placeholder="Ej. Negro" required></div>
      <div class="field"><label>Talla</label><input type="number" id="f-size" min="1" value="36"></div>
    </div>
    <div class="field"><label>Pares</label><input type="number" id="f-qty" min="1" value="4"></div>
    <p class="muted">Si la variante no existe, se crea. Si ya existe, se suman los pares.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-save" type="button">Ingresar pares</button>`);
  $("#f-save").addEventListener("click", async () =>
  {
    const id_shoe = $("#f-code").value;
    const color = $("#f-color").value.trim();
    const size = Number($("#f-size").value);
    const stock = Number($("#f-qty").value);
    if (!id_shoe || !color || size < 1 || stock < 1)
    {
      toast("Complete todos los campos.");
      return;
    }
    try
    {
      await InventoryApi.register({ id_shoe, color, size, stock });
      const shoe = shoes.find((s) => s.code === id_shoe);
      closeModal();
      toast(`Se ingresaron ${stock} pares de ${shoe?.name || id_shoe} color ${color} talla ${size}`);
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}
