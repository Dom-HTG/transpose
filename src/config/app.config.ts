import dotenv from "dotenv";
dotenv.config({
  path: "./src/config/app.env",
});

export interface BaseConfig {
  server: ServerConfig;
  chain: ChainConfig;
}

interface ServerConfig {
  port: string;
  logsDir: string;
}

interface ChainConfig {
  viemApiKey: string;
}

export class AppConfigs {
  /* server config */
  public readonly port: string;
  public readonly logsDir: string;

  public readonly viemApiKey: string;

  constructor() {
    console.log("Loading Application configurations...");

    this.port = this.getenv("APP_PORT");
    this.logsDir = this.getenv("LOGS_DIR");
    this.viemApiKey = this.getenv("VIEM_API_KEY");
  }

  private getenv(envVariable: string): string {
    const value = process.env[envVariable] as string;

    if (!value)
      throw new Error(`environment Variable <${envVariable}> not set`);
    return value;
  }

  public serveConfigs(): BaseConfig {
    const configs: BaseConfig = {
      server: {
        port: this.port,
        logsDir: this.logsDir,
      },
      chain: {
        viemApiKey: this.viemApiKey,
      },
    };

    return configs;
  }
}
