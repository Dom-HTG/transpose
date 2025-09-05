import dotenv from "dotenv";
dotenv.config({
  path: "./src/config/.env",
});

export interface BaseConfig {
  server: ServerConfig;
  chain: ChainConfig;
  agent: AgentConfig;
};

interface ServerConfig {
  port: string;
  logsDir: string;
};

interface ChainConfig {
  viemApiKey: string;
};

interface AgentConfig {
  grokApiKey: string;
  langmsithTracing: boolean;
  langsmithApiKey: string;
};

export class AppConfigs {
  /* server config */
  public readonly port: string;
  public readonly logsDir: string;
  public readonly viemApiKey: string;
  public readonly grokApiKey: string;
  public readonly langsmithTracing: boolean;
  public readonly langsmithApiKey: string;

  constructor() {
    console.log("Loading Application configurations...");

    /* application core env */
    this.port = this.getenv("APP_PORT");
    this.logsDir = this.getenv("LOGS_DIR");

    /* blockchain core env */
    this.viemApiKey = this.getenv("VIEM_API_KEY");

    /* agent core env */
    this.grokApiKey = this.getenv('GROK_API_KEY');
    this.langsmithTracing = this.getBoolEnv('LANGSMITH_TRACING');
    this.langsmithApiKey = this.getenv('LANGSMITH_API_KEY');
  }

  private getenv(envVariable: string): string {
    const value = process.env[envVariable] as string;

    if (!value)
      throw new Error(`environment Variable <${envVariable}> not set`);
    return value;
  }

  private getBoolEnv(boolEnv: string): boolean {
    const boolValue = process.env[boolEnv] as string;

    if (!boolValue) throw new Error(`environment Variable <${boolEnv}> not set`);
    return Boolean(boolValue);
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
      agent: {
        grokApiKey: this.grokApiKey,
        langmsithTracing: this.langsmithTracing,
        langsmithApiKey: this.langsmithApiKey,
      }
    };

    return configs;
  }
}
