import { CONFIG } from "./config.js";
import { getSession } from "./session.js";

const MESSAGES = {
  "Invalid credentials": "Usuario o contraseña incorrectos",
  "Invalid or missing auth-token header": "No se pudo validar el acceso al servidor",
  "Some parameter is not being sent correctly: no matching stock":
    "No hay una variante con ese estilo, color y talla",
  "Insufficient stock to decrease": "No hay pares suficientes para completar la venta",
  "Stock not found for the given shoe, color and size":
    "No se encontró existencias para ese código, color y talla",
  "Color and size must be sent together": "Para afinar la consulta, indique color y talla",
  "Shoe not found": "No se encontró el estilo",
  "Supplier not found": "No se encontró el proveedor",
  "Order not found": "No se encontró el pedido",
  "Order is not pending": "El pedido ya no está pendiente",
  "Order is already received": "El pedido ya fue recibido",
  "Order has no details to receive": "El pedido no tiene líneas para recibir",
  "An order with this id already exists": "Ya existe un pedido con ese folio",
  "A shoe with this code already exists": "Ya existe un estilo con ese código",
  "A variant with this color and size already exists": "Esa talla y color ya existen en el estilo",
  "Color is required": "El color es obligatorio",
  "Size must be a positive integer": "La talla debe ser un número positivo",
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
  "Username is required": "El usuario es obligatorio",
  "Password is required": "La contraseña es obligatoria",
  "Password confirmation is required": "Debe confirmar la contraseña",
  "Password confirmation does not match": "La confirmación no coincide con la nueva contraseña",
  "Recovery token is required": "El enlace de recuperación no es válido",
  "Recovery token is invalid or expired": "El enlace de recuperación venció o ya fue usado",
  "Could not send email": "No se pudo enviar el correo. Intente de nuevo.",
  "Could not send the report email": "No se pudo enviar el reporte por correo",
  "Could not generate the report PDF": "No se pudo generar el PDF del reporte",
  "The report was sent to the administrator email": "El reporte fue enviado a su correo",
  "group_by must be DAY, WEEK or MONTH": "El agrupado debe ser día, semana o mes",
  "group_by must be TYPE or SUPPLIER": "El agrupado debe ser tipo o proveedor",
  "limit must be greater than or equal to 1": "El límite debe ser al menos 1",
  "days must be greater than or equal to 1": "Los días deben ser al menos 1",
  "Shoe type must be Dama, Caballero, Niño or Niña": "El tipo debe ser Dama, Caballero, Niño o Niña",
  "Unknown report": "El reporte indicado no existe",
  "Unknown sub-report": "El sub-reporte indicado no existe",
  "Session token is required": "Debe iniciar sesión para enviar el reporte",
  "Invalid or expired session": "La sesión no es válida o ya venció",
  "Could not request password recovery": "No se pudo solicitar la recuperación de contraseña",
  "Could not update password": "No se pudo cambiar la contraseña",
  "If the account exists, a recovery email was sent":
    "Si el usuario existe, recibirá un correo con el enlace para cambiar su contraseña.",
  "Password updated": "Cambio de contraseña exitoso",
  "The administrator has no email registered": "El administrador no tiene un correo registrado",
  "The login code was already used": "El código ya fue usado",
  "Login code must contain exactly 4 digits": "El código debe tener exactamente 4 dígitos",
  "Could not verify login code": "No se pudo verificar el código de inicio de sesión",
  "Could not authenticate user": "No se pudo iniciar sesión",
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

async function request(method, url, { params, data, headers } = {})
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
        ...headers,
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
const post = (url, data, headers) => request("post", url, { data, headers });
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
  verifyLogin: (username, code) => post("/auth/login/verify", { username, code }),
  requestPasswordRecovery: (username) => post("/auth/password-recovery", { username }),
  resetPassword: (username, newPassword, confirmPassword, token) => post("/auth/password-reset", {
    username,
    new_password: newPassword,
    confirm_password: confirmPassword,
    token,
  }),
};

export const SalesApi = {
  register: (body) => post("/sales", body),
  byDate: (date, shoeCode) => get("/sales/by-date", cleanParams({ date, shoe_code: shoeCode })),
  range: (startDate, endDate, shoeCode) => get("/sales", cleanParams({ start_date: startDate, end_date: endDate, shoe_code: shoeCode })),
};

export const InventoryApi = {
  query: (shoeId, color, size) => get("/inventory", { shoe_id: shoeId, color, size }),
  bySupplier: (supplierId) => get(`/inventory/supplier/${supplierId}`),
  register: (body) => post("/inventory", body),
  createVariant: (body) => post("/inventory/variants", body),
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
  sendEmail: (body) =>
  {
    const session = getSession();
    const headers = session ? { Authorization: `Bearer ${session.token}` } : {};
    return post("/reports/email", body, headers);
  },
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
