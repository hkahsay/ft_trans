
export async function initializeCsrf()
{
  await fetch("/api/server-info", {
    method: "GET",
    credentials: "include"
  });
}
export async function initializeSession() {
    await initializeCsrf();
}
