export const BACKEND_HOST = "http://184.193.230.77";

function defaultApiBase()
{
  const stored = localStorage.getItem("eh.apiBase");
  if (stored)
  {
    return stored;
  }
  return `${BACKEND_HOST}:8080/api/v1`;
}

export const CONFIG = {
  apiBase: defaultApiBase(),
  authToken: localStorage.getItem("eh.authToken") || "local-auth-token",
};
