import { OrdersApi, ReportsApi, SuppliersApi } from "../api.js";
import {
  I, $, badgeStatus, bannerError, closeModal, empty, escapeHtml, formatInt, kpi,
  monthStartIso, openModal, optionsHtml, pairsOf, skeleton, tableWrap, todayIso, toast,
} from "../ui.js";

export async function renderMercaderia(root, ctx)
{
  const tab = ctx.params.get("tab") || "PENDIENTE";
  const orderId = ctx.params.get("order");
  const supplierId = ctx.params.get("supplier");
  const query = (ctx.query || "").toLowerCase();
  root.innerHTML = skeleton(3);

  try
  {
    const suppliers = await SuppliersApi.list();
    let list = [];
    if (tab === "fechas")
    {
      const start = ctx.params.get("start") || monthStartIso();
      const end = ctx.params.get("end") || todayIso();
      list = await OrdersApi.range(start, end);
    }
    else if (tab === "proveedor" && supplierId)
    {
      list = await OrdersApi.bySupplier(supplierId);
    }
    else if (tab === "RECIBIDA" || tab === "PENDIENTE")
    {
      list = await OrdersApi.byStatus(tab);
    }
    list = (list || []).filter((o) =>
      !query || `${o.order_id} ${o.supplier_name}`.toLowerCase().includes(query));

    const pendingCount = tab === "PENDIENTE" ? list.length : (await OrdersApi.byStatus("PENDIENTE")).length;
    const pairs = list.reduce((a, o) => a + pairsOf(o), 0);

    root.innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        ${kpi(I.mercaderia, "Pendientes", formatInt(pendingCount))}
        ${kpi(I.box, "Pares en la lista", formatInt(pairs))}
        ${kpi(I.proveedores, "Proveedores", formatInt((suppliers || []).length))}
      </div>
      <div class="steps">
        <div class="step is-on"><b>1. Crear pedido</b> Folio y zapatero</div>
        <div class="step"><b>2. Agregar líneas</b> Variante y pares</div>
        <div class="step"><b>3. Recibir</b> Suma el inventario</div>
      </div>
      <div class="tabs">
        <button class="tab ${tab === "PENDIENTE" ? "is-active" : ""}" data-tab="PENDIENTE">Pendientes</button>
        <button class="tab ${tab === "RECIBIDA" ? "is-active" : ""}" data-tab="RECIBIDA">Recibidas</button>
        <button class="tab ${tab === "fechas" ? "is-active" : ""}" data-tab="fechas">Por fechas</button>
        <button class="tab ${tab === "proveedor" ? "is-active" : ""}" data-tab="proveedor">Por proveedor</button>
      </div>
      ${tab === "fechas" ? `<div class="filters">
        <div class="field"><label>Desde</label><input type="date" id="m-start" value="${ctx.params.get("start") || monthStartIso()}"></div>
        <div class="field"><label>Hasta</label><input type="date" id="m-end" value="${ctx.params.get("end") || todayIso()}"></div>
        <button class="btn btn--primary btn--sm" id="m-apply">Consultar</button>
      </div>` : ""}
      ${tab === "proveedor" ? `<div class="filters">
        <div class="field"><label>Proveedor</label>
          <select id="m-sup">${optionsHtml(suppliers || [], (s) => s.id, (s) => s.name, supplierId)}</select></div>
        <button class="btn btn--primary btn--sm" id="m-apply-sup">Consultar</button>
      </div>` : ""}
      <div class="card">
        <div class="card__head">
          <div><div class="card__title">Pedidos</div><div class="card__sub">${list.length} folio(s)</div></div>
          <button class="btn btn--gold btn--sm" id="m-new">${I.plus} Nuevo pedido</button>
        </div>
        <div class="card__body card__body--flush">${list.length ? tableWrap(
          [{ label: "Folio" }, { label: "Proveedor" }, { label: "Fecha" }, { label: "Estado" }, { label: "Pares", num: true }, { label: "" }],
          list.map((o) => `<tr>
            <td class="code">${escapeHtml(o.order_id)}</td>
            <td>${escapeHtml(o.supplier_name)}</td>
            <td>${escapeHtml(o.creation_date)}</td>
            <td>${badgeStatus(o.status)}</td>
            <td class="num">${pairsOf(o)}</td>
            <td><button class="btn btn--ghost btn--sm" data-open="${escapeHtml(o.order_id)}">Abrir</button></td>
          </tr>`).join("")
        ) : empty(I.mercaderia, "No hay pedidos en esta vista.")}</div>
      </div>
      <div id="order-panel"></div>`;

    root.querySelectorAll("[data-tab]").forEach((btn) =>
    {
      btn.addEventListener("click", () => ctx.go("mercaderia", { tab: btn.dataset.tab }));
    });
    $("#m-apply", root)?.addEventListener("click", () =>
      ctx.go("mercaderia", { tab: "fechas", start: $("#m-start", root).value, end: $("#m-end", root).value }));
    $("#m-apply-sup", root)?.addEventListener("click", () =>
      ctx.go("mercaderia", { tab: "proveedor", supplier: $("#m-sup", root).value }));
    $("#m-new", root)?.addEventListener("click", () => openCreateOrder(ctx, suppliers));
    root.querySelectorAll("[data-open]").forEach((btn) =>
    {
      btn.addEventListener("click", () => showOrder(root, ctx, btn.dataset.open));
    });

    const focus = orderId || sessionStorage.getItem("eh.focusOrder");
    if (focus)
    {
      sessionStorage.removeItem("eh.focusOrder");
      await showOrder(root, ctx, focus);
    }
  }
  catch (err)
  {
    root.innerHTML = bannerError(err.message);
    $("[data-retry]", root)?.addEventListener("click", () => ctx.reload());
  }
}

function openCreateOrder(ctx, suppliers)
{
  if (!suppliers?.length)
  {
    toast("Registre un proveedor antes de pedir mercadería.");
    return;
  }
  openModal("Nuevo pedido", `
    <div class="field"><label>Folio del pedido</label>
      <input id="f-id" placeholder="ORDEN-101" maxlength="40"></div>
    <div class="field"><label>Proveedor</label>
      <select id="f-sup">${optionsHtml(suppliers, (s) => s.id, (s) => s.name)}</select></div>
    <p class="muted">El pedido nace como PENDIENTE. Luego agregue las líneas.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-save" type="button">Crear pedido</button>`);
  $("#f-save").addEventListener("click", async () =>
  {
    const id = $("#f-id").value.trim();
    const supplier_id = Number($("#f-sup").value);
    if (!id)
    {
      toast("Indique el folio del pedido.");
      return;
    }
    try
    {
      await OrdersApi.create({ id, supplier_id });
      closeModal();
      toast(`Pedido ${id} creado`);
      sessionStorage.setItem("eh.focusOrder", id);
      ctx.go("mercaderia", { tab: "PENDIENTE", order: id });
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}

async function showOrder(root, ctx, orderId)
{
  const panel = $("#order-panel", root);
  panel.innerHTML = `<div class="card" style="margin-top:1.1rem"><div class="card__body">Cargando pedido…</div></div>`;
  try
  {
    const order = await OrdersApi.byId(orderId);
    const variants = await ReportsApi.inventory({ include_out_of_stock: true });
    const pending = order.status === "PENDIENTE";
    panel.innerHTML = `
      <div class="card" style="margin-top:1.1rem">
        <div class="card__head">
          <div>
            <div class="card__title">Pedido ${escapeHtml(order.order_id)}</div>
            <div class="card__sub">${escapeHtml(order.supplier_name)} · ${escapeHtml(order.creation_date)}</div>
          </div>
          ${badgeStatus(order.status)}
        </div>
        <div class="card__body card__body--flush">${(order.details || []).length ? tableWrap(
          [{ label: "Variante" }, { label: "Estilo" }, { label: "Pares", num: true }],
          order.details.map((d) => `<tr><td class="code">${d.shoe_stock_id}</td>
            <td>${escapeHtml(d.shoe_name)}</td><td class="num">${d.amount}</td></tr>`).join("")
        ) : empty(I.box, "Este pedido aún no tiene líneas.")}</div>
        ${pending ? `<div class="card__body">
          <div class="filters" style="margin:0">
            <div class="field" style="flex:1"><label>Variante</label>
              <select id="d-var">${optionsHtml(variants || [], (v) => v.shoe_stock_id,
                (v) => `${v.shoe_name} · ${v.color} · talla ${v.size} (#${v.shoe_stock_id})`)}</select></div>
            <div class="field"><label>Pares</label><input type="number" id="d-amt" min="1" value="6"></div>
            <button class="btn btn--primary btn--sm" id="d-add">Agregar línea</button>
          </div>
          <div style="margin-top:1rem;display:flex;gap:.6rem;flex-wrap:wrap">
            <button class="btn btn--gold" id="d-recv">Marcar como recibida</button>
          </div>
        </div>` : ""}
      </div>`;

    $("#d-add", panel)?.addEventListener("click", async () =>
    {
      try
      {
        await OrdersApi.addDetail(order.order_id, {
          shoe_stock_id: Number($("#d-var", panel).value),
          amount: Number($("#d-amt", panel).value),
        });
        toast("Línea agregada");
        showOrder(root, ctx, order.order_id);
      }
      catch (err)
      {
        toast(err.message, "err");
      }
    });
    $("#d-recv", panel)?.addEventListener("click", () => confirmReceive(ctx, order));
  }
  catch (err)
  {
    panel.innerHTML = bannerError(err.message);
  }
}

function confirmReceive(ctx, order)
{
  openModal("Recibir mercadería", `
    <p>Se sumarán los pares de cada línea del pedido <b>${escapeHtml(order.order_id)}</b> al inventario.</p>
    <p class="muted">Esta acción no se puede deshacer.</p>`,
    `<button class="btn btn--ghost" data-close type="button">Cancelar</button>
     <button class="btn btn--primary" id="f-ok" type="button">Marcar como recibida</button>`);
  $("#f-ok").addEventListener("click", async () =>
  {
    try
    {
      await OrdersApi.receive(order.order_id);
      closeModal();
      toast(`Pedido ${order.order_id} recibido`);
      ctx.go("mercaderia", { tab: "RECIBIDA" });
    }
    catch (err)
    {
      toast(err.message, "err");
    }
  });
}
