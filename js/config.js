export const BACKEND_HOST = "https://d1pgzyoqrjk0bx.cloudfront.net";

function defaultApiBase()
{
  const stored = localStorage.getItem("eh.apiBase");
  if (stored)
  {
    return stored;
  }
  return `${BACKEND_HOST}/api/v1`;
}

export const CONFIG = {
  apiBase: defaultApiBase(),
  authToken: localStorage.getItem("eh.authToken") || "local-auth-token",
};
