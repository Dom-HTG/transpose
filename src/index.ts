import { AppServer } from "./server";

/* start and run application */

(async () => {
  const app: AppServer = new AppServer();
  await app.start();
})();
