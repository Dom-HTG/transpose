import "reflect-metadata";
import { DataSource } from "typeorm";
import pino from "pino";
import { BaseConfig } from "../../../config/app.config";

export class DatabaseClient {
    private logger: pino.Logger;
    private dataSource: DataSource;

    constructor(private appLogger: pino.Logger, config: BaseConfig) {

        this.logger = appLogger;
        this.logger.info("Initializing Database Client...");

        // Bootstrap database connection.
        this.dataSource = new DataSource({
            type: "postgres",
            poolSize: 10,
            host: config.db.host,
            port: config.db.port,
            username: config.db.username,
            password: config.db.password,
            database: config.db.database,
            synchronize: process.env.NODE_ENV === "development" ? true : false,
            logging: false,
            entities: [__dirname + "/entities/*.{ts,js}"],
        });
    }

    public async connect(): Promise<void> {
        if (!this.dataSource.isInitialized) {
            this.logger.debug("Establishing database connection...");
            await this.dataSource.initialize();
            this.logger.debug("Database connection successful.");
        } else {
            this.logger.debug("Database connection already initialized.");
        };
    }

    public async disconnect(): Promise<void> {
        if (this.dataSource.isInitialized) {
            this.logger.debug("Closing database connection...");
            await this.dataSource.destroy();
            this.logger.debug("Database connection closed.");
        };  
    }

    public getDataSource(): DataSource {
        if (!this.dataSource.isInitialized) {
            throw new Error("DataSource is not initialized. Call connect() first.");
        };
        return this.dataSource;
    }
}