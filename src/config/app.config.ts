import dotenv from "dotenv";
dotenv.config({
  path: "./src/config/.env",
});

export interface BaseConfig {
  server: ServerConfig;
  db: DbConfig;
  chain: ChainConfig;
  agent: AgentConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
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
  langsmithTracing: boolean;
  langsmithApiKey: string;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
}

interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
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
  public readonly redisHost: string;
  public readonly redisPort: number;
  public readonly redisPassword?: string;
  public readonly jwtAccessSecret: string;
  public readonly jwtRefreshSecret: string;
  public readonly jwtAccessExpiry: string;
  public readonly jwtRefreshExpiry: string;

  constructor() {
    console.log("Loading Application configurations...");

    /* application core env */
    this.port = this.getenv("APP_PORT");
    this.logsDir = this.getenv("LOGS_DIR");

    /* database core env */
    this.dbHost = this.getenv("DB_HOST");
    const dbPortStr = this.getenv("DB_PORT");
    this.dbPort = Number(dbPortStr);

    // Validate port is a valid number
    if (isNaN(this.dbPort) || this.dbPort <= 0 || this.dbPort > 65535) {
      throw new Error(
        `Invalid DB_PORT: ${dbPortStr}. Must be a number between 1 and 65535`,
      );
    }
    this.dbUsername = this.getenv("DB_USERNAME");
    this.dbPassword = this.getenv("DB_PASSWORD");
    this.dbDatabase = this.getenv("DB_DATABASE");

    /* blockchain core env */
    this.viemApiKey = this.getenv("VIEM_API_KEY");

    /* agent core env */
    this.grokApiKey = this.getenv("GROK_API_KEY");
    this.langsmithTracing = this.getBoolEnv("LANGCHAIN_TRACING_V2");
    this.langsmithApiKey = this.getenv("LANGCHAIN_API_KEY");

    /* redis env */
    this.redisHost = this.getOptionalEnv("REDIS_HOST", "localhost");
    this.redisPort = Number(this.getOptionalEnv("REDIS_PORT", "6379"));
    this.redisPassword = this.getOptionalEnv("REDIS_PASSWORD");

    /* jwt env */
    this.jwtAccessSecret = this.getOptionalEnv(
      "JWT_ACCESS_SECRET",
      "default_access_secret_change_in_production",
    );
    this.jwtRefreshSecret = this.getOptionalEnv(
      "JWT_REFRESH_SECRET",
      "default_refresh_secret_change_in_production",
    );
    this.jwtAccessExpiry = this.getOptionalEnv("JWT_ACCESS_EXPIRY", "15m");
    this.jwtRefreshExpiry = this.getOptionalEnv("JWT_REFRESH_EXPIRY", "7d");
  }

  private getenv(envVariable: string): string {
    const value = process.env[envVariable] as string;

    if (!value)
      throw new Error(`environment Variable <${envVariable}> not set`);
    return value;
  }

  private getOptionalEnv(envVariable: string, defaultValue?: string): string {
    const value = process.env[envVariable];
    return value ?? defaultValue ?? "";
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
        langsmithTracing: this.langsmithTracing,
        langsmithApiKey: this.langsmithApiKey,
      },
      redis: {
        host: this.redisHost,
        port: this.redisPort,
        ...(this.redisPassword && { password: this.redisPassword }),
      },
      jwt: {
        accessTokenSecret: this.jwtAccessSecret,
        refreshTokenSecret: this.jwtRefreshSecret,
        accessTokenExpiry: this.jwtAccessExpiry,
        refreshTokenExpiry: this.jwtRefreshExpiry,
      },
    };

    return configs;
  }
}
