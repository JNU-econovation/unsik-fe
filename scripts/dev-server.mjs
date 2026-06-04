const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 5173);

process.env.CI ??= 'true';

const { createServer } = await import('vite');

const server = await createServer({
  server: {
    host,
    port,
  },
});

await server.listen();
server.printUrls();

const shutdown = async () => {
  await server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

setInterval(() => undefined, 2_147_483_647);
