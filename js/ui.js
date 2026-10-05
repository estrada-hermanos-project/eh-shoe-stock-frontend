export const I = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7"/></svg>',
  ventas: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2 12h9l2-8H7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.4" fill="currentColor"/><circle cx="17" cy="20" r="1.4" fill="currentColor"/></svg>',
  mercaderia: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 8l9-4 9 4-9 4-9-4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 12v8" stroke="currentColor" stroke-width="1.7"/></svg>',
  inventario: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  productos: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h7l9 9-7 7-9-9V4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/></svg>',
  proveedores: '<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M4 19c.6-3 2.6-5 5-5s4.4 2 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="17" cy="9" r="2.2" stroke="currentColor" stroke-width="1.7"/><path d="M16.2 19c.4-2.2 1.8-3.6 3.8-3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  reportes: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V9M10 19V5M15 19v-7M20 19V8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v6h6M12 17v-6M9.5 14.5 12 17l2.5-2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 19c.8-3.4 3.3-5 6.5-5s5.7 1.6 6.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l9 15H3l9-15z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 8l9-4 9 4v8l-9 4-9-4V8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function escapeHtml(value)
{
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const BUSINESS_ZONE = "America/Guatemala";

const WEEKDAY_INDEX = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function toIso(date)
{
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function businessParts(now)
{
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: WEEKDAY_INDEX[value("weekday")],
  };
}

function isoDate(year, month, day)
{
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function todayIso(now = new Date())
{
  const { year, month, day } = businessParts(now);
  return isoDate(year, month, day);
}

export function monthStartIso(now = new Date())
{
  const { year, month } = businessParts(now);
  return isoDate(year, month, 1);
}

export function weekStartIso(now = new Date())
{
  const { year, month, day, weekday } = businessParts(now);
  return isoDate(year, month, day - (weekday - 1));
}

export function formatInt(n)
{
  return Number(n || 0).toLocaleString("es-GT");
}

export function placeholderForType(type)
{
  if (type === "Dama" || type === "Niña")
  {
    return "images/dama-1.jpg";
  }
  if (type === "Niño")
  {
    return "images/caballero-2.jpg";
  }
  return "images/caballero-1.jpg";
}

export function kpi(icon, label, value)
{
  return `<div class="kpi">
    <div class="kpi__icon">${icon}</div>
    <div class="kpi__label">${escapeHtml(label)}</div>
    <div class="kpi__value">${escapeHtml(String(value ?? "0"))}</div>
  </div>`;
}

export function badgeStock(stock, isLow)
{
  if (Number(stock) === 0)
  {
    return `<span class="badge badge--danger"><span class="badge-dot"></span>Agotado</span>`;
  }
  if (isLow)
  {
    return `<span class="badge badge--warn"><span class="badge-dot"></span>Stock bajo</span>`;
  }
  return `<span class="badge badge--ok"><span class="badge-dot"></span>Disponible</span>`;
}

export function badgeStatus(status)
{
  if (status === "RECIBIDA")
  {
    return `<span class="badge badge--ok">Recibida</span>`;
  }
  return `<span class="badge badge--gold">Pendiente</span>`;
}

export function badgeAdvice(advice)
{
  if (advice === "REPONER")
  {
    return `<span class="badge badge--danger">Reponer</span>`;
  }
  if (advice === "VIGILAR")
  {
    return `<span class="badge badge--warn">Vigilar</span>`;
  }
  return `<span class="badge badge--ok">No pedir</span>`;
}

export function empty(icon, text, actionHtml = "")
{
  return `<div class="empty">${icon}<p>${escapeHtml(text)}</p>${actionHtml}</div>`;
}

export function bannerError(message, retryAttr = "data-retry")
{
  return `<div class="banner"><span>${escapeHtml(message)}</span>
    <button class="btn btn--ghost btn--sm" ${retryAttr}>Reintentar</button></div>`;
}

export function skeleton(count = 4)
{
  return `<div class="kpis">${Array.from({ length: count }, () => `<div class="skel skel-kpi"></div>`).join("")}</div>
    <div class="grid grid--2"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;
}

export function tableWrap(headers, rowsHtml)
{
  return `<div class="table-wrap"><table class="data">
    <thead><tr>${headers.map((h) => `<th${h.num ? ' class="num"' : ""}>${h.label}</th>`).join("")}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table></div>`;
}

export function rankBars(items)
{
  if (!items.length)
  {
    return empty(I.reportes, "Sin datos para el período.");
  }
  const max = Math.max(...items.map((i) => Number(i.v) || 0), 1);
  return items.map((i) => `
    <div class="rankbar">
      <div class="rankbar__top"><b>${escapeHtml(i.label)}</b><span>${formatInt(i.v)} pares</span></div>
      <div class="rankbar__track"><div class="rankbar__fill" style="width:${(Number(i.v) / max) * 100}%"></div></div>
    </div>`).join("");
}

export function barsChart(data)
{
  if (!data.length)
  {
    return empty(I.reportes, "Sin volumen para graficar.");
  }
  const max = Math.max(...data.map((d) => Number(d.v) || 0), 1);
  return `<div class="bars">${data.map((d) => `
    <div class="bars__col">
      <div class="bars__bar" style="height:${Math.max(6, (Number(d.v) / max) * 100)}%"><span>${formatInt(d.v)}</span></div>
      <div class="bars__x">${escapeHtml(d.m)}</div>
    </div>`).join("")}</div>`;
}

export function donut(pct, centerVal, centerLab, legend)
{
  return `<div class="donut-wrap">
    <div class="donut" style="--p:${pct}"><div class="donut__label"><b>${escapeHtml(String(centerVal))}</b><span>${escapeHtml(centerLab)}</span></div></div>
    <ul class="legend">${legend.map((l) => `<li><span class="dot" style="background:${l.color}"></span>${escapeHtml(l.label)} · <b>&nbsp;${escapeHtml(l.val)}</b></li>`).join("")}</ul>
  </div>`;
}

export function toast(msg, kind = "ok")
{
  const wrap = $("#toast-wrap");
  if (!wrap)
  {
    return;
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${kind === "ok" ? I.check : I.alert}<span>${escapeHtml(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() =>
  {
    el.style.opacity = "0";
    el.style.transform = "translateX(20px)";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

export function openModal(title, body, foot)
{
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = body;
  $("#modal-foot").innerHTML = foot;
  $("#modal").hidden = false;
}

export function closeModal()
{
  const modal = $("#modal");
  if (modal)
  {
    modal.hidden = true;
  }
}

export function printAsPdf({ title, subtitle })
{
  let head = document.getElementById("print-report-head");
  if (!head)
  {
    head = document.createElement("header");
    head.id = "print-report-head";
    head.className = "print-report-head";
    document.body.prepend(head);
  }
  head.innerHTML = `<h1>${escapeHtml(title || "Reporte")}</h1>
    <p>${escapeHtml(subtitle || "")}</p>`;
  const restore = () =>
  {
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

export function pairsOf(order)
{
  return (order?.details || []).reduce((sum, line) => sum + Number(line.amount || 0), 0);
}

export function optionsHtml(items, getValue, getLabel, selected)
{
  return items.map((item) =>
  {
    const value = getValue(item);
    const selectedAttr = String(value) === String(selected) ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${selectedAttr}>${escapeHtml(getLabel(item))}</option>`;
  }).join("");
}
