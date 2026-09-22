const KEY = "eh.session";

export function saveSession({ token, username })
{
  sessionStorage.setItem(KEY, JSON.stringify({
    token,
    username,
    at: Date.now(),
  }));
}

export function clearSession()
{
  sessionStorage.removeItem(KEY);
}

export function getSession()
{
  const raw = sessionStorage.getItem(KEY);
  if (!raw)
  {
    return null;
  }
  try
  {
    const session = JSON.parse(raw);
    if (!session?.token)
    {
      clearSession();
      return null;
    }
    if (isExpired(session.token, session.at))
    {
      clearSession();
      return null;
    }
    return session;
  }
  catch
  {
    clearSession();
    return null;
  }
}

export function requireSession()
{
  const session = getSession();
  if (!session)
  {
    window.location.replace("acceso.html");
    return null;
  }
  return session;
}

function isExpired(token, savedAt)
{
  try
  {
    const part = token.split(".")[1] || "";
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!payload.exp)
    {
      return false;
    }
    const ttlMs = payload.iat ? (payload.exp - payload.iat) * 1000 : 60 * 60 * 1000;
    const origin = Number(savedAt) || Date.now();
    return Date.now() > origin + ttlMs;
  }
  catch
  {
    return false;
  }
}
