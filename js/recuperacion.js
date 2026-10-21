import { AuthApi } from "./api.js";

(function ()
{
  const form = document.getElementById("recovery-form");
  const messageEl = document.getElementById("recovery-message");
  const submit = document.getElementById("recovery-submit");
  const userInput = document.getElementById("user");
  if (!form || !messageEl || !submit || !userInput)
  {
    return;
  }

  let inflight = false;

  function showMessage(text, ok)
  {
    messageEl.textContent = text;
    messageEl.className = ok ? "login__ok" : "login__error";
  }

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

    const username = (userInput.value || "").trim();
    if (!username)
    {
      showMessage("Ingrese su usuario", false);
      return;
    }

    inflight = true;
    submit.disabled = true;
    submit.textContent = "Enviando…";
    showMessage("", false);
    try
    {
      await AuthApi.requestPasswordRecovery(username);
      showMessage("Si el usuario existe, recibirá un correo con el enlace para cambiar su contraseña.", true);
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
      submit.textContent = "Enviar";
    }
  }

  form.addEventListener("submit", handleSubmit);
  submit.addEventListener("click", handleSubmit);
})();
