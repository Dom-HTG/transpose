import dotenv from 'dotenv';
dotenv.config();

export class AppConfigs {
    public readonly viemApiKey: string;

    constructor() {
        console.log('Loading Application configurations...');

        this.viemApiKey = this.getenv('VIEM_API_KEY');
    }

    private getenv(envVariable: string): string {
        const value = process.env[envVariable] as string;

        if (!value) throw new Error(`environment Variable <${envVariable}> not set`);
        return value;
    }

    public serveConfigs() {
        const configs = {
            viemApiKey: this.viemApiKey
        };

        return configs;
    };
}