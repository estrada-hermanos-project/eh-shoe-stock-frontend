import { health } from "./api.js";
import { clearSession, requireSession } from "./session.js";
import { I, $, $$, closeModal } from "./ui.js";
import { renderDashboard } from "./views/dashboard.js";
import { openSaleModal, renderVentas } from "./views/ventas.js";
import { renderInventario } from "./views/inventario.js";
import { renderMercaderia } from "./views/mercaderia.js";
import { renderProductos } from "./views/productos.js";
import { renderProveedores } from "./views/proveedores.js";
import { renderReportes } from "./views/reportes.js";
import { renderUsuarios } from "./views/usuarios.js";

const session = requireSession();
if (!session)
{
  // Redirección a acceso.html
}

const NAV = [
  { group: "Inicio", id: "dashboard", label: "Dashboard", eyebrow: "Resumen del día", icon: I.dashboard, render: renderDashboard },
  { group: "Operación", id: "ventas", label: "Ventas", eyebrow: "Registro y estadísticas", icon: I.ventas, render: renderVentas },
  { group: "Operación", id: "inventario", label: "Inventario", eyebrow: "Estado del stock", icon: I.inventario, render: renderInventario },
  { group: "Operación", id: "mercaderia", label: "Mercadería", eyebrow: "Pedidos e ingresos", icon: I.mercaderia, render: renderMercaderia },
  { group: "Catálogo", id: "productos", label: "Productos", eyebrow: "Catálogo de estilos", icon: I.productos, render: renderProductos },
  { group: "Catálogo", id: "proveedores", label: "Proveedores", eyebrow: "Zapateros artesanos", icon: I.proveedores, render: renderProveedores },
  { group: "Análisis", id: "reportes", label: "Reportes", eyebrow: "Consultas en pares", icon: I.reportes, render: renderReportes },
  { group: "Cuenta", id: "usuarios", label: "Usuarios", eyebrow: "Dueños y cuentas", icon: I.usuarios, render: renderUsuarios },
];

const state = { query: "" };

if (session)
{
$("#session-user").textContent = session.username || "Propietario";

function buildNav()
{
  let html = "";
  let last = "";
  NAV.forEach((item) =>
  {
    if (item.group !== last)
    {
      html += `<div class="sidebar__label">${item.group}</div>`;
      last = item.group;
    }
    html += `<a class="navlink" href="#/${item.id}" data-nav="${item.id}">${item.icon}<span>${item.label}</span></a>`;
  });
  $("#nav").innerHTML = html;
}

function parseRoute()
{
  const raw = (location.hash || "#/dashboard").replace(/^#/, "");
  const [path, query] = raw.split("?");
  const id = (path.replace(/^\//, "") || "dashboard");
  const item = NAV.find((n) => n.id === id) || NAV[0];
  return { item, params: new URLSearchParams(query || "") };
}

function go(id, params = {})
{
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) =>
  {
    if (value !== undefined && value !== null && value !== "")
    {
      search.set(key, value);
    }
  });
  const qs = search.toString();
  location.hash = `#/${id}${qs ? `?${qs}` : ""}`;
}

const ctx = {
  query: "",
  params: new URLSearchParams(),
  go,
  reload: () => render(),
};

async function render()
{
  const { item, params } = parseRoute();
  ctx.params = params;
  ctx.query = state.query;
  $("#view-eyebrow").textContent = item.eyebrow;
  $("#view-title").textContent = item.label;
  $$(".navlink").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === item.id));
  const search = $("#global-search");
  if (item.id === "dashboard")
  {
    search.placeholder = "Ir a productos…";
  }
  else
  {
    search.placeholder = "Buscar producto, código…";
  }
  await item.render($("#view-root"), ctx);
  closeSidebar();
  window.scrollTo({ top: 0 });
}

function openSidebar()
{
  $("#sidebar").classList.add("is-open");
  $("#scrim").hidden = false;
}

function closeSidebar()
{
  $("#sidebar").classList.remove("is-open");
  $("#scrim").hidden = true;
}

async function pingHealth()
{
  const el = $("#api-health");
  const data = await health();
  const up = data?.status === "UP";
  el.classList.toggle("is-up", up);
  el.classList.toggle("is-down", !up);
  el.lastChild && (el.childNodes[el.childNodes.length - 1].textContent = up ? " API en línea" : " API fuera");
}

buildNav();
$("#logout").addEventListener("click", () =>
{
  clearSession();
  window.location.replace("acceso.html");
});
$("#menu-toggle").addEventListener("click", openSidebar);
$("#scrim").addEventListener("click", closeSidebar);
$("#fab-sale").addEventListener("click", () => openSaleModal(ctx));
$("#global-search").addEventListener("input", (event) =>
{
  state.query = event.target.value;
  const { item } = parseRoute();
  if (item.id === "dashboard")
  {
    if (state.query.trim())
    {
      go("productos");
    }
    return;
  }
  render();
});
document.addEventListener("click", (event) =>
{
  if (event.target.closest("[data-close]"))
  {
    closeModal();
  }
  const jump = event.target.closest("[data-go]");
  if (jump && !jump.closest(".sidebar"))
  {
    const params = { ...jump.dataset };
    delete params.go;
    go(jump.dataset.go, params);
  }
});
document.addEventListener("keydown", (event) =>
{
  if (event.key === "Escape")
  {
    closeModal();
    closeSidebar();
  }
});
window.addEventListener("hashchange", () =>
{
  state.query = "";
  $("#global-search").value = "";
  render();
});

if (!location.hash)
{
  location.hash = "#/dashboard";
}
else
{
  render();
}
pingHealth();
}
