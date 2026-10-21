import { AuthApi } from "./api.js";
import { saveLoginChallenge } from "./session.js";

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
      const data = await AuthApi.login(username, password);
      if (!data || !data.second_step_required)
      {
        throw new Error("No se pudo iniciar sesión.");
      }
      saveLoginChallenge(username);
      window.location.replace("codigo.html");
    }
    catch (err)
    {
      errorEl.textContent = err && err.message
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
