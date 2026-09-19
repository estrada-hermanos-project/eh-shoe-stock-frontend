import { SuppliersApi } from "../api.js";
import {
  I, $, bannerError, closeModal, empty, escapeHtml, openModal, skeleton, tableWrap, toast,
} from "../ui.js";

export async function renderProveedores(root, ctx)
{
  const query = (ctx.query || "").toLowerCase();
  root.innerHTML = skeleton(2);
  try
  {
    const list = (await SuppliersApi.list() || []).filter((s) =>
      !query || `${s.name} ${s.phone}`.toLowerCase().includes(query));
    root.innerHTML = `
      <div class="section-title">
        <div><div class="eyebrow">Maestros</div><h3>Proveedores artesanos</h3></div>
        <button class="btn btn--gold btn--sm" id="s-new">${I.plus} Nuevo proveedor</button>
      </div>
      <div class="card">
        <div class="card__body card__body--flush">${list.length ? tableWrap(
          [{ label: "Nombre" }, { label: "Teléfono" }, { label: "" }],
          list.map((s) => `<tr>
            <td><b>${escapeHtml(s.name)}</b></td>
            <td>${escapeHtml(s.phone)}</td>
            <td class="table-actions">
              <button class="btn btn--ghost btn--sm" data-edit="${s.id}">Editar</button>
              <button class="btn btn--ghost btn--sm" data-go="productos" data-supplier="${s.id}">Ver estilos</button>
              <button class="btn btn--ghost btn--sm" data-go="mercaderia" data-supplier="${s.id}" data-tab="proveedor">Ver pedidos</button>
              <button class="btn btn--ghost btn--sm" data-del="${s.id}">Eliminar</button>
            </td>
          </tr>`).join("")
        ) : empty(I.proveedores, "No hay proveedores registrados.")}</div>
      </div>`;

    $("#s-new", root)?.addEventListener("click", () => openSupplierForm(ctx));
    root.querySelectorAll("[data-edit]").forEach((btn) =>
    {
      btn.addEventListener("click", () => openSupplierForm(ctx, Number(btn.dataset.edit)));
    });
    root.querySelectorAll("[data-del]").forEach((btn) =>
    {
      btn.addEventListener("click", () => confirmDelete(ctx, Number(btn.dataset.del)));
    });
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}

async function openSupplierForm(ctx, id)
{
  let current = { name: "", phone: "" };
  if (id)
  {
    try
    {
      current = await SuppliersApi.byId(id);
    }
    catch (err)
    {
      toast(err.message, "err");
      return;
    }
  }
  openModal(id ? "Editar proveedor" : "Nuevo proveedor", `
    <div class="field"><label>Nombre</label>
      <input id="f-name" maxlength="100" value="${escapeHtml(current.name)}"></div>
    <div class="field"><label>Teléfono (8 dígitos)</label>
      <input id="f-phone" inputmode="numeric" maxlength="8" value="${escapeHtml(current.phone)}"></div>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-save" type="button">Guardar</button>`);
  $("#f-save").addEventListener("click", async () =>
  {
    const full_name = $("#f-name").value.trim();
    const phone = $("#f-phone").value.trim();
    if (!full_name || !/^\d{8}$/.test(phone))
    {
      toast("Nombre obligatorio y teléfono de 8 dígitos.");
      return;
    }
    try
    {
      if (id)
      {
        await SuppliersApi.update(id, { full_name, phone });
      }
      else
      {
        await SuppliersApi.create({ full_name, phone });
      }
      closeModal();
      toast(id ? "Proveedor actualizado" : "Proveedor registrado");
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}

function confirmDelete(ctx, id)
{
  openModal("Eliminar proveedor", `
    <p>¿Eliminar este proveedor?</p>
    <p class="muted">No se podrá si tiene estilos o pedidos asociados.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-ok" type="button">Eliminar</button>`);
  $("#f-ok").addEventListener("click", async () =>
  {
    try
    {
      await SuppliersApi.remove(id);
      closeModal();
      toast("Proveedor eliminado");
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}
