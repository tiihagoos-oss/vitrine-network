
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      try {
        const result = await env.DB.prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
          ORDER BY name
        `).all();

        return Response.json({
          status: "Conectado!",
          application: "Vitrine Network",
          database: "vitrine-network-db",
          tables: result.results
        });
      } catch (error) {
        return Response.json({
          status: "Erro na conexão",
          message: "Não foi possível consultar o banco de dados."
        }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
