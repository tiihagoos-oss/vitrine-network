
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
      ).all();

      return Response.json({
        status: "Conectado!",
        database: "vitrine-network-db",
        tables: result.results
      });
    }

    return env.ASSETS.fetch(request);
  }
};
