import { AppServer } from "./server";

/* start and run application */

(async () => {
  try {
    const app: AppServer = new AppServer();
    await app.bootstrapDependencies();
    app.start();
  } catch (e) {
    console.error("Failed to initialize application", e);
    process.exit(1);
  }
})();
