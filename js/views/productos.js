import { ReportsApi, ShoesApi, SuppliersApi } from "../api.js";
import {
  I, $, badgeStock, bannerError, closeModal, empty, escapeHtml, openModal,
  optionsHtml, placeholderForType, toast,
} from "../ui.js";
import { openStockModal } from "./ventas.js";

const TYPES = ["Todos", "Dama", "Caballero", "Niño", "Niña"];

export async function renderProductos(root, ctx)
{
  const filter = ctx.params.get("type") || "Todos";
  const supplier = ctx.params.get("supplier");
  const query = (ctx.query || "").toLowerCase();
  root.innerHTML = `<div class="skel skel-card"></div>`;

  try
  {
    const [shoes, suppliers, inventory] = await Promise.all([
      supplier ? ShoesApi.bySupplier(supplier) : ShoesApi.list(),
      SuppliersApi.list(),
      ReportsApi.inventory({ include_out_of_stock: true }).catch(() => []),
    ]);
    const stockByName = {};
    (inventory || []).forEach((row) =>
    {
      stockByName[row.shoe_name] = (stockByName[row.shoe_name] || 0) + Number(row.stock || 0);
    });
    let list = shoes || [];
    if (filter !== "Todos")
    {
      list = list.filter((s) => s.type === filter);
    }
    if (query)
    {
      list = list.filter((s) => `${s.code} ${s.name} ${s.supplier_name}`.toLowerCase().includes(query));
    }

    root.innerHTML = `
      <div class="section-title">
        <div><div class="eyebrow">Catálogo</div><h3>Estilos de calzado</h3></div>
        <button class="btn btn--gold btn--sm" id="p-new">${I.plus} Nuevo estilo</button>
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:1.1rem;flex-wrap:wrap">${TYPES.map((t) =>
        `<button class="chip ${filter === t ? "is-active" : ""}" data-type="${t}">${t}</button>`).join("")}</div>
      ${list.length ? `<div class="prod-grid">${list.map((s) => `
        <article class="prod" data-code="${escapeHtml(s.code)}">
          <div class="prod__media">
            <span class="prod__code">${escapeHtml(s.code)}</span>
            <img src="${placeholderForType(s.type)}" alt="${escapeHtml(s.name)}">
          </div>
          <div class="prod__body">
            <div class="prod__cat">${escapeHtml(s.type)} · ${escapeHtml(s.supplier_name || "")}</div>
            <h4 class="prod__name">${escapeHtml(s.name)}</h4>
            <p class="muted">${escapeHtml(s.description || "Sin descripción")}</p>
            <div class="prod__foot">
              <span>Stock: <b>${stockByName[s.name] ?? "—"}</b></span>
              ${stockByName[s.name] == null
                ? `<span class="badge badge--muted">Sin variantes</span>`
                : badgeStock(stockByName[s.name], stockByName[s.name] > 0 && stockByName[s.name] <= 5)}
            </div>
            <p class="prod__note">Foto de referencia</p>
          </div>
        </article>`).join("")}</div>` : empty(I.productos, "No hay estilos que coincidan.")}`;

    $("#p-new", root)?.addEventListener("click", () => openCreateShoe(ctx, suppliers));
    root.querySelectorAll("[data-type]").forEach((btn) =>
    {
      btn.addEventListener("click", () => ctx.go("productos", { type: btn.dataset.type, supplier }));
    });
    root.querySelectorAll("[data-code]").forEach((card) =>
    {
      card.addEventListener("click", () => openShoeDetail(ctx, card.dataset.code, stockByName));
    });
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}

function openCreateShoe(ctx, suppliers)
{
  if (!suppliers?.length)
  {
    toast("Registre un proveedor antes de crear un estilo.");
    return;
  }
  openModal("Registrar nuevo estilo", `
    <div class="form-row">
      <div class="field"><label>Código único</label><input id="f-code" placeholder="Ej. EH-DAM-012"></div>
      <div class="field"><label>Tipo</label>
        <select id="f-type"><option>Dama</option><option>Caballero</option><option>Niño</option><option>Niña</option></select></div>
    </div>
    <div class="field"><label>Nombre</label><input id="f-name" placeholder="Oxford clásico"></div>
    <div class="field"><label>Descripción</label><input id="f-desc" placeholder="Cuero de res, suela clásica"></div>
    <div class="field"><label>Proveedor</label>
      <select id="f-sup">${optionsHtml(suppliers, (s) => s.id, (s) => s.name)}</select></div>
    <p class="muted">El código lo define el dueño. Las tallas se agregan al ingresar pares.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-save" type="button">Guardar estilo</button>`);
  $("#f-save").addEventListener("click", async () =>
  {
    const code = $("#f-code").value.trim();
    const name = $("#f-name").value.trim();
    if (!code || !name)
    {
      toast("Código y nombre son obligatorios.");
      return;
    }
    try
    {
      await ShoesApi.create({
        code,
        type: $("#f-type").value,
        name,
        description: $("#f-desc").value.trim(),
        supplier_id: Number($("#f-sup").value),
      });
      closeModal();
      toast(`Estilo ${code} agregado al catálogo`);
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}

async function openShoeDetail(ctx, code, stockByName)
{
  try
  {
    const shoe = await ShoesApi.byCode(code);
    openModal(shoe.name, `
      <div style="display:flex;gap:1.1rem;flex-wrap:wrap;align-items:flex-start">
        <img src="${placeholderForType(shoe.type)}" alt="" style="width:150px;height:150px;object-fit:cover;border-radius:12px;border:1px solid var(--line)">
        <div style="flex:1;min-width:180px">
          <div class="prod__cat">${escapeHtml(shoe.type)} · ${escapeHtml(shoe.supplier_name || "")}</div>
          <p class="muted" style="margin:.3rem 0 .6rem"><span class="code">${escapeHtml(shoe.code)}</span></p>
          <p>${escapeHtml(shoe.description || "Sin descripción")}</p>
          <p class="muted">Foto de referencia · el catálogo aún no guarda fotografías</p>
          <div><div class="muted">Stock aproximado</div><b style="font-size:1.3rem">${stockByName[shoe.name] ?? "—"} pares</b></div>
        </div>
      </div>`,
      `<button class="btn btn--ghost" data-close type="button">Cerrar</button>
       <button class="btn btn--gold" id="f-var" type="button">${I.plus} Agregar talla/color</button>
       <button class="btn btn--primary" id="f-del" type="button">Eliminar</button>`);
    $("#f-var").addEventListener("click", () =>
    {
      closeModal();
      openStockModal(ctx, shoe.code);
    });
    $("#f-del").addEventListener("click", () => confirmDeleteShoe(ctx, shoe));
  }
  catch (err)
  {
    toast(err.message, "err");
  }
}

function confirmDeleteShoe(ctx, shoe)
{
  openModal("Eliminar estilo", `
    <p>¿Eliminar <b>${escapeHtml(shoe.name)}</b> (${escapeHtml(shoe.code)})?</p>
    <p class="muted">No se podrá si tiene ventas, pedidos o existencias asociadas.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-ok" type="button">Eliminar</button>`);
  $("#f-ok").addEventListener("click", async () =>
  {
    try
    {
      await ShoesApi.remove(shoe.code);
      closeModal();
      toast("Estilo eliminado");
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}
