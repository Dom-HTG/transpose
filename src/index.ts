import { AppServer } from "./server";

(async () => {
    const app: AppServer = new AppServer();
    await app.start(); 
})();