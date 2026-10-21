import { AuthApi } from "./api.js";

(function ()
{
  const form = document.getElementById("reset-form");
  const messageEl = document.getElementById("reset-message");
  const submit = document.getElementById("reset-submit");
  const newPass = document.getElementById("new-pass");
  const confirmPass = document.getElementById("confirm-pass");
  const showPass = document.getElementById("show-pass");
  if (!form || !messageEl || !submit || !newPass || !confirmPass)
  {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const username = (params.get("username") || "").trim();
  const token = (params.get("token") || "").trim();

  if (showPass)
  {
    showPass.addEventListener("change", function ()
    {
      const type = showPass.checked ? "text" : "password";
      const newValue = newPass.value;
      const confirmValue = confirmPass.value;
      newPass.type = type;
      confirmPass.type = type;
      newPass.value = newValue;
      confirmPass.value = confirmValue;
    });
  }

  function showMessage(text, ok)
  {
    messageEl.textContent = text;
    messageEl.className = ok ? "login__ok" : "login__error";
  }

  if (!username || !token)
  {
    showMessage("El enlace de recuperación no es válido. Solicite uno nuevo desde el acceso.", false);
  }

  let inflight = false;

  async function handleSubmit(event)
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
    if (newPass.value !== confirmPass.value)
    {
      showMessage("Las contraseñas no coinciden", false);
      return;
    }

    inflight = true;
    submit.disabled = true;
    submit.textContent = "Cambiando…";
    showMessage("", false);
    try
    {
      await AuthApi.resetPassword(username, newPass.value, confirmPass.value, token);
      showMessage("Cambio de contraseña exitoso", true);
    }
    catch (err)
    {
      showMessage(
        err && err.message
          ? err.message
          : "No se pudo conectar con el servidor. Verifique que el backend esté en marcha.",
        false
      );
    }
    finally
    {
      inflight = false;
      submit.disabled = false;
      submit.textContent = "Cambiar Contraseña";
    }
  }

  form.addEventListener("submit", handleSubmit);
  submit.addEventListener("click", handleSubmit);
})();
