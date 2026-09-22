import { CONFIG } from "./config.js";

const MESSAGES = {
  "Invalid credentials": "Usuario o contraseña incorrectos",
  "Invalid or missing auth-token header": "No se pudo validar el acceso al servidor",
  "Some parameter is not being sent correctly: no matching stock":
    "No hay una variante con ese estilo, color y talla",
  "Insufficient stock to decrease": "No hay pares suficientes para completar la venta",
  "Stock not found for the given shoe, color and size":
    "No se encontró existencias para ese código, color y talla",
  "Shoe not found": "No se encontró el estilo",
  "Supplier not found": "No se encontró el proveedor",
  "Order not found": "No se encontró el pedido",
  "Order is not pending": "El pedido ya no está pendiente",
  "Order is already received": "El pedido ya fue recibido",
  "Order has no details to receive": "El pedido no tiene líneas para recibir",
  "An order with this id already exists": "Ya existe un pedido con ese folio",
  "A shoe with this code already exists": "Ya existe un estilo con ese código",
  "A supplier with this phone already exists": "Ya existe un proveedor con ese teléfono",
  "A user with this DPI already exists": "Ya existe un administrador con ese DPI",
  "An account with this username already exists": "Ese usuario de acceso ya existe",
  "No administrative user exists with this DPI": "No hay un administrador con ese DPI",
  "User admin not found": "No se encontró el administrador",
  "Stock not found": "No se encontró la variante",
  "start_date must not be after end_date": "La fecha inicial no puede ser posterior a la final",
  "start_date and end_date are required": "Debe indicar fecha inicial y final",
  "start_date and end_date must be sent together": "Debe indicar ambas fechas",
  "Phone must contain exactly 8 digits": "El teléfono debe tener exactamente 8 dígitos",
  "DPI must contain exactly 13 digits": "El DPI debe tener exactamente 13 dígitos",
  "Full name is required": "El nombre es obligatorio",
  "Request body is required": "Faltan datos en el formulario",
  "Error de integridad: registro duplicado o con dependencias asociadas":
    "No se puede completar: el registro está duplicado o tiene información asociada",
};

function translate(message)
{
  if (!message)
  {
    return "Ocurrió un error. Intente de nuevo.";
  }
  return MESSAGES[message] || message;
}

function connectionError()
{
  const error = new Error("No se pudo conectar con el servidor. Verifique que el backend esté en marcha.");
  error.status = 0;
  return error;
}

async function request(method, url, { params, data } = {})
{
  const query = new URLSearchParams();
  if (params)
  {
    Object.entries(params).forEach(([key, value]) =>
    {
      if (value !== undefined && value !== null && value !== "")
      {
        query.set(key, value);
      }
    });
  }
  const qs = query.toString();
  try
  {
    const response = await fetch(`${CONFIG.apiBase}${url}${qs ? `?${qs}` : ""}`, {
      method: method.toUpperCase(),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "auth-token": CONFIG.authToken,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
    {
      const error = new Error(translate(payload.message));
      error.status = response.status;
      error.code = payload.code;
      throw error;
    }
    return payload.data;
  }
  catch (err)
  {
    if (err.status)
    {
      throw err;
    }
    throw connectionError();
  }
}

const get = (url, params) => request("get", url, { params });
const post = (url, data) => request("post", url, { data });
const put = (url, data) => request("put", url, { data });
const del = (url) => request("delete", url);

export const health = async () =>
{
  try
  {
    const response = await fetch(`${CONFIG.apiBase}/health`);
    if (!response.ok)
    {
      return { status: "DOWN" };
    }
    return await response.json();
  }
  catch
  {
    return { status: "DOWN" };
  }
};

export const AuthApi = {
  login: (username, password) => post("/auth/login", { username, password }),
};

export const SalesApi = {
  register: (body) => post("/sales", body),
  byDate: (date) => get("/sales/by-date", { date }),
  range: (startDate, endDate) => get("/sales", { start_date: startDate, end_date: endDate }),
};

export const InventoryApi = {
  query: (shoeId, color, size) => get("/inventory", { shoe_id: shoeId, color, size }),
  register: (body) => post("/inventory", body),
};

export const ShoesApi = {
  list: () => get("/shoes"),
  byCode: (code) => get(`/shoes/${encodeURIComponent(code)}`),
  bySupplier: (supplierId) => get(`/shoes/supplier/${supplierId}`),
  create: (body) => post("/shoes", body),
  remove: (code) => del(`/shoes/${encodeURIComponent(code)}`),
};

export const SuppliersApi = {
  list: () => get("/suppliers"),
  byId: (id) => get(`/suppliers/${id}`),
  create: (body) => post("/suppliers", body),
  update: (id, body) => put(`/suppliers/${id}`, body),
  remove: (id) => del(`/suppliers/${id}`),
};

export const OrdersApi = {
  create: (body) => post("/orders", body),
  addDetail: (orderId, body) => post(`/orders/${encodeURIComponent(orderId)}/details`, body),
  byId: (orderId) => get(`/orders/${encodeURIComponent(orderId)}`),
  byStatus: (status) => get("/orders/by-status", { status }),
  bySupplier: (supplierId) => get(`/orders/supplier/${supplierId}`),
  range: (startDate, endDate) => get("/orders", { start_date: startDate, end_date: endDate }),
  receive: (orderId) => post(`/orders/${encodeURIComponent(orderId)}/receive`),
};

export const UsersApi = {
  list: () => get("/users"),
  byDpi: (dpi) => get(`/users/${encodeURIComponent(dpi)}`),
  create: (body) => post("/users", body),
  update: (dpi, body) => put(`/users/${encodeURIComponent(dpi)}`, body),
  remove: (dpi) => del(`/users/${encodeURIComponent(dpi)}`),
  createAccount: (body) => post("/accounts", body),
};

export const ReportsApi = {
  summary: (params) => get("/reports/summary", params),
  topProducts: (params) => get("/reports/sales/top-products", params),
  bottomProducts: (params) => get("/reports/sales/bottom-products", params),
  salesByPeriod: (params) => get("/reports/sales/by-period", params),
  salesByCategory: (params) => get("/reports/sales/by-category", params),
  salesBySize: (params) => get("/reports/sales/by-size", params),
  salesBySupplier: (params) => get("/reports/sales/by-supplier", params),
  salesVolume: (params) => get("/reports/sales/volume", params),
  inventory: (params) => get("/reports/inventory", params),
  inventoryByGroup: (params) => get("/reports/inventory/by-group", params),
  lowStock: (params) => get("/reports/inventory/low-stock", params),
  outOfStock: (params) => get("/reports/inventory/out-of-stock", params),
  slowMovers: (params) => get("/reports/inventory/slow-movers", params),
  restock: (params) => get("/reports/inventory/restock", params),
  pendingOrders: (params) => get("/reports/orders/pending", params),
  receivedOrders: (params) => get("/reports/orders/received", params),
  ordersBySupplier: (params) => get("/reports/orders/by-supplier", params),
  orderedVsSold: (params) => get("/reports/orders/vs-sales", params),
  orderedNotSelling: (params) => get("/reports/orders/not-selling", params),
  newStyles: (params) => get("/reports/catalog/new-styles", params),
};

export function cleanParams(params = {})
{
  const out = {};
  Object.entries(params).forEach(([key, value]) =>
  {
    if (value === undefined || value === null || value === "")
    {
      return;
    }
    out[key] = value;
  });
  return out;
}
