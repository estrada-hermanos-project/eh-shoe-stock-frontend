import { AuthApi } from "./api.js";
import { clearLoginChallenge, getLoginChallenge, saveSession } from "./session.js";

(function ()
{
  const form = document.getElementById("code-form");
  const messageEl = document.getElementById("code-message");
  const submit = document.getElementById("code-submit");
  const codeInput = document.getElementById("code");
  if (!form || !messageEl || !submit || !codeInput)
  {
    return;
  }

  const challenge = getLoginChallenge();
  let inflight = false;

  function showMessage(text)
  {
    messageEl.textContent = text;
    messageEl.className = "login__error";
  }

  if (!challenge)
  {
    showMessage("Inicie sesión de nuevo para recibir un código.");
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

    const code = (codeInput.value || "").trim();
    if (!/^\d{4}$/.test(code))
    {
      showMessage("El código debe tener exactamente 4 dígitos");
      return;
    }
    if (!challenge)
    {
      showMessage("Inicie sesión de nuevo para recibir un código.");
      return;
    }

    inflight = true;
    submit.disabled = true;
    submit.textContent = "Ingresando…";
    showMessage("");
    try
    {
      const data = await AuthApi.verifyLogin(challenge.username, code);
      const token = data && data.token;
      if (!token)
      {
        throw new Error("El servidor no devolvió la sesión.");
      }
      saveSession({ token, username: challenge.username });
      clearLoginChallenge();
      window.location.replace("app.html#/dashboard");
    }
    catch (err)
    {
      showMessage(err && err.message
        ? err.message
        : "No se pudo conectar con el servidor. Verifique que el backend esté en marcha.");
      inflight = false;
      submit.disabled = false;
      submit.textContent = "Ingresar al Panel";
    }
  }

  form.addEventListener("submit", handleSubmit);
  submit.addEventListener("click", handleSubmit);
})();
