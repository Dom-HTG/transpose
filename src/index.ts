import { AppServer } from "./server";

/* start and run application */
(async () => {
  const app: AppServer = new AppServer();
  const serverInstance = await app.start();

  /* graceful shutdown */
  app.gracefulShutdown('SIGTERM', serverInstance);
  app.gracefulShutdown('SIGINT', serverInstance);
})();
