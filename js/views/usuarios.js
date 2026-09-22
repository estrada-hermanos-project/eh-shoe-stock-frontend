import { UsersApi } from "../api.js";
import {
  I, $, bannerError, closeModal, empty, escapeHtml, openModal, skeleton, tableWrap, toast,
} from "../ui.js";

export async function renderUsuarios(root, ctx)
{
  const query = (ctx.query || "").toLowerCase();
  root.innerHTML = skeleton(2);
  try
  {
    const list = (await UsersApi.list() || []).filter((u) =>
      !query || `${u.name} ${u.phone} ${u.email || ""}`.toLowerCase().includes(query));
    root.innerHTML = `
      <div class="section-title">
        <div><div class="eyebrow">Cuenta</div><h3>Administradores</h3></div>
        <button class="btn btn--gold btn--sm" id="u-new">${I.plus} Nuevo administrador</button>
      </div>
      <div class="card" style="margin-bottom:1.1rem">
        <div class="card__head"><div class="card__title">Personas</div>
          <div class="card__sub">El listado no incluye DPI; búsquelo para editar o eliminar</div></div>
        <div class="card__body">
          <div class="filters" style="margin:0">
            <div class="field"><label>DPI (13 dígitos)</label><input id="u-dpi" inputmode="numeric" maxlength="13" placeholder="13 dígitos"></div>
            <button class="btn btn--primary btn--sm" id="u-find">Buscar</button>
          </div>
          <div id="u-found"></div>
        </div>
        <div class="card__body card__body--flush">${list.length ? tableWrap(
          [{ label: "Nombre" }, { label: "Teléfono" }, { label: "Correo" }],
          list.map((u) => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.phone)}</td>
            <td>${escapeHtml(u.email || "—")}</td></tr>`).join("")
        ) : empty(I.usuarios, "No hay administradores.")}</div>
      </div>
      <div class="card">
        <div class="card__head"><div class="card__title">Cuenta de acceso</div>
          <div class="card__sub">La contraseña se guarda cifrada. No se puede consultar después.</div></div>
        <div class="card__body">
          <div class="form-row">
            <div class="field"><label>DPI del administrador</label><input id="a-dpi" maxlength="13"></div>
            <div class="field"><label>Usuario</label><input id="a-user" autocomplete="off"></div>
          </div>
          <div class="field"><label>Contraseña</label><input type="password" id="a-pass" autocomplete="new-password"></div>
          <button class="btn btn--primary" id="a-save">Crear cuenta</button>
        </div>
      </div>`;

    $("#u-new", root)?.addEventListener("click", () => openAdminForm(ctx));
    $("#u-find", root)?.addEventListener("click", async () =>
    {
      const dpi = $("#u-dpi", root).value.trim();
      const box = $("#u-found", root);
      if (!/^\d{13}$/.test(dpi))
      {
        toast("El DPI debe tener 13 dígitos.");
        return;
      }
      try
      {
        const user = await UsersApi.byDpi(dpi);
        box.innerHTML = `<div class="lookup-result"><small>${escapeHtml(dpi)}</small>${escapeHtml(user.name)}
          <div class="table-actions" style="margin-top:.7rem">
            <button class="btn btn--ghost btn--sm" id="u-edit">Editar</button>
            <button class="btn btn--ghost btn--sm" id="u-del">Eliminar</button>
          </div></div>`;
        $("#u-edit", box).addEventListener("click", () => openAdminForm(ctx, dpi, user));
        $("#u-del", box).addEventListener("click", () => confirmDelete(ctx, dpi, user));
      }
      catch (err)
      {
        box.innerHTML = `<p class="muted">${escapeHtml(err.message)}</p>`;
      }
    });
    $("#a-save", root)?.addEventListener("click", async () =>
    {
      const dpi = $("#a-dpi", root).value.trim();
      const username = $("#a-user", root).value.trim();
      const password = $("#a-pass", root).value;
      if (!/^\d{13}$/.test(dpi) || !username || !password)
      {
        toast("Complete DPI, usuario y contraseña.");
        return;
      }
      try
      {
        await UsersApi.createAccount({ dpi, username, password });
        toast(`Cuenta ${username} creada`);
        $("#a-pass", root).value = "";
      }
      catch (err)
      {
        toast(err.message, "err");
      }
    });
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}

function openAdminForm(ctx, dpi, current = {})
{
  openModal(dpi ? "Editar administrador" : "Nuevo administrador", `
    ${dpi ? "" : `<div class="field"><label>DPI (13 dígitos)</label><input id="f-dpi" maxlength="13"></div>`}
    <div class="field"><label>Nombre completo</label><input id="f-name" maxlength="100" value="${escapeHtml(current.name || "")}"></div>
    <div class="form-row">
      <div class="field"><label>Teléfono (8 dígitos)</label><input id="f-phone" maxlength="8" value="${escapeHtml(current.phone || "")}"></div>
      <div class="field"><label>Correo (opcional, Gmail)</label><input id="f-mail" value="${escapeHtml(current.email || "")}"></div>
    </div>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-save" type="button">Guardar</button>`);
  $("#f-save").addEventListener("click", async () =>
  {
    const full_name = $("#f-name").value.trim();
    const phone = $("#f-phone").value.trim();
    const email = $("#f-mail").value.trim() || null;
    if (!full_name || !/^\d{8}$/.test(phone))
    {
      toast("Nombre obligatorio y teléfono de 8 dígitos.");
      return;
    }
    try
    {
      if (dpi)
      {
        await UsersApi.update(dpi, { full_name, phone, email });
        toast("Administrador actualizado");
      }
      else
      {
        const newDpi = $("#f-dpi").value.trim();
        if (!/^\d{13}$/.test(newDpi))
        {
          toast("El DPI debe tener 13 dígitos.");
          return;
        }
        await UsersApi.create({ dpi: newDpi, full_name, phone, email });
        toast("Administrador registrado");
      }
      closeModal();
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}

function confirmDelete(ctx, dpi, user)
{
  openModal("Eliminar administrador", `
    <p>¿Eliminar a <b>${escapeHtml(user.name)}</b>?</p>
    <p class="muted">Esta acción no se puede deshacer.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-ok" type="button">Eliminar</button>`);
  $("#f-ok").addEventListener("click", async () =>
  {
    try
    {
      await UsersApi.remove(dpi);
      closeModal();
      toast("Administrador eliminado");
      ctx.reload();
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}
