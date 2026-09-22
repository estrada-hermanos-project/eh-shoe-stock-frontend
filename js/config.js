function defaultApiBase()
{
  const stored = localStorage.getItem("eh.apiBase");
  if (stored)
  {
    return stored;
  }
  const host = (location.hostname === "127.0.0.1" || location.hostname === "[::1]")
    ? "127.0.0.1"
    : "localhost";
  return `http://${host}:8080/api/v1`;
}

export const CONFIG = {
  apiBase: defaultApiBase(),
  authToken: localStorage.getItem("eh.authToken") || "local-auth-token",
};
