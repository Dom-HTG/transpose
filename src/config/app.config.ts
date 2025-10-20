import dotenv from "dotenv";
dotenv.config({
  path: "./src/config/.env",
});

export interface BaseConfig {
  server: ServerConfig;
  db: DbConfig;
  chain: ChainConfig;
  agent: AgentConfig;
}

interface ServerConfig {
  port: string;
  logsDir: string;
}

interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface ChainConfig {
  viemApiKey: string;
}

interface AgentConfig {
  grokApiKey: string;
  langmsithTracing: boolean;
  langsmithApiKey: string;
}

export class AppConfigs {
  public readonly port: string;
  public readonly logsDir: string;
  public readonly dbHost: string;
  public readonly dbPort: number;
  public readonly dbUsername: string;
  public readonly dbPassword: string;
  public readonly dbDatabase: string;
  public readonly viemApiKey: string;
  public readonly grokApiKey: string;
  public readonly langsmithTracing: boolean;
  public readonly langsmithApiKey: string;

  constructor() {
    console.log("Loading Application configurations...");

    /* application core env */
    this.port = this.getenv("APP_PORT");
    this.logsDir = this.getenv("LOGS_DIR");

    /* database core env */
    this.dbHost = this.getenv("DB_HOST");
    this.dbPort = Number(this.getenv("DB_PORT"));
    this.dbUsername = this.getenv("DB_USERNAME");
    this.dbPassword = this.getenv("DB_PASSWORD");
    this.dbDatabase = this.getenv("DB_DATABASE");

    /* blockchain core env */
    this.viemApiKey = this.getenv("VIEM_API_KEY");

    /* agent core env */
    this.grokApiKey = this.getenv("GROK_API_KEY");
    this.langsmithTracing = this.getBoolEnv("LANGCHAIN_TRACING_V2");
    this.langsmithApiKey = this.getenv("LANGCHAIN_API_KEY");
  }

  private getenv(envVariable: string): string {
    const value = process.env[envVariable] as string;

    if (!value)
      throw new Error(`environment Variable <${envVariable}> not set`);
    return value;
  }

  private getBoolEnv(boolEnv: string): boolean {
    const boolValue = process.env[boolEnv] as string;

    if (!boolValue)
      throw new Error(`environment Variable <${boolEnv}> not set`);
    return Boolean(boolValue);
  }

  public serveConfigs(): BaseConfig {
    const configs: BaseConfig = {
      server: {
        port: this.port,
        logsDir: this.logsDir,
      },
      db: {
        host: this.dbHost,
        port: this.dbPort,
        username: this.dbUsername,
        password: this.dbPassword,
        database: this.dbDatabase,
      },
      chain: {
        viemApiKey: this.viemApiKey,
      },
      agent: {
        grokApiKey: this.grokApiKey,
        langmsithTracing: this.langsmithTracing,
        langsmithApiKey: this.langsmithApiKey,
      },
    };

    return configs;
  }
}
