import { BACKEND_HOST } from "./config.js";

(function ()
{
  const KEY = "eh.session";
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  const submit = document.getElementById("login-submit");
  if (!form || !errorEl || !submit)
  {
    return;
  }

  window.__ehLoginBound = true;

  const passInput = document.getElementById("pass");
  const showPass = document.getElementById("show-pass");
  if (passInput && showPass)
  {
    showPass.addEventListener("change", function ()
    {
      const value = passInput.value;
      passInput.type = showPass.checked ? "text" : "password";
      passInput.value = value;
    });
  }

  function apiBase()
  {
    const stored = localStorage.getItem("eh.apiBase");
    if (stored)
    {
      return stored;
    }
    return BACKEND_HOST + ":8080/api/v1";
  }

  function authToken()
  {
    return localStorage.getItem("eh.authToken") || "local-auth-token";
  }

  function saveSession(token, username)
  {
    sessionStorage.setItem(KEY, JSON.stringify({
      token: token,
      username: username,
      at: Date.now(),
    }));
  }

  function existingSession()
  {
    try
    {
      const session = JSON.parse(sessionStorage.getItem(KEY) || "null");
      return session && session.token ? session : null;
    }
    catch
    {
      return null;
    }
  }

  if (existingSession())
  {
    window.location.replace("app.html#/dashboard");
    return;
  }

  let inflight = false;

  async function handleLogin(event)
  {
    if (event)
    {
      event.preventDefault();
      event.stopPropagation();
    }
    if (inflight)
    {
      return;
    }

    errorEl.textContent = "";
    const username = (document.getElementById("user").value || "").trim();
    const password = passInput ? passInput.value : "";
    if (!username || !password)
    {
      errorEl.textContent = "Ingrese usuario y contraseña.";
      return;
    }

    inflight = true;
    submit.disabled = true;
    submit.textContent = "Ingresando…";
    try
    {
      const response = await fetch(apiBase() + "/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "auth-token": authToken(),
        },
        body: JSON.stringify({ username: username, password: password }),
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok)
      {
        const message = payload.message === "Invalid credentials"
          ? "Usuario o contraseña incorrectos"
          : (payload.message === "Invalid or missing auth-token header"
            ? "No se pudo validar el acceso al servidor"
            : (payload.message || "No se pudo iniciar sesión."));
        throw new Error(message);
      }
      const token = payload.data && payload.data.token;
      if (!token)
      {
        throw new Error("El servidor no devolvió la sesión.");
      }
      saveSession(token, username);
      window.location.replace("app.html#/dashboard");
    }
    catch (err)
    {
      errorEl.textContent = err && err.message && err.message !== "Failed to fetch"
        ? err.message
        : "No se pudo conectar con el servidor. Verifique que el backend esté en marcha.";
      inflight = false;
      submit.disabled = false;
      submit.textContent = "Ingresar al panel";
    }
  }

  form.addEventListener("submit", handleLogin);
  submit.addEventListener("click", handleLogin);
})();
