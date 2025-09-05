import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class AgentManager {
    private modelInstance: ChatGroq;
    private chain: any;

    constructor() {
        this.modelInstance = new ChatGroq({
            model: 'llama-3.3-70b-versatile',
            temperature: 0,
        });

        /* create prompt template */
        const prompt = ChatPromptTemplate.fromTemplate(`
            You are an expert blockchain agent called Transpose. 
            Your task is to parse **natural language queries** into a structured JSON action 
            that can be executed on a blockchain.

            Guidelines:
            1. Always return a **valid JSON object** (no extra text or explanation).
            2. Never invent information — only use what is explicitly provided.
            3. If something is missing (e.g., recipient address, asset), let the user know what is missing.
            4. Default chain is **Base** if no chain is specified.
            5. Default asset is **ETH** if none is mentioned.

            Supported Actions:
            - "transfer": Send tokens from one account to another
            - "balance_check": Query wallet balance
            - "swap": Swap one token for another

            Expected JSON schema:
            {
                "action": "transfer | balance_check | swap",
                "asset": "ETH | USDT | USDC | ... | UNKNOWN",
                "amount": "numeric value as string, or UNKNOWN",
                "from": "wallet address or UNKNOWN",
                "to": "wallet address or UNKNOWN",
                "chain": "Base | Ethereum | Polygon | Arbitrum | Optimism | ...",
            }

            Examples:

            Q: "Send 2 USDT to Alice on Base"
            A:
            {
                "action": "transfer",
                "asset": "USDT",
                "amount": "2",
                "from": "UNKNOWN",
                "to": "alice",
                "chain": "Base",
            }

            Q: "Check my balance"
            A:
            {
                "action": "balance_check",
                "asset": "ETH",
                "amount": "UNKNOWN",
                "from": "UNKNOWN",
                "to": "UNKNOWN",
                "chain": "Base",
            }

            Q:"Swap 50 USDC for ETH on Uniswap on Base"
            A:
            {
                "action": "swap",
                "fromAsset": "USDC",
                "toAsset": "ETH",
                "amount": "50",
                "chain": "Base",
                "protocol": "Uniswap",
                "from": "UNKNOWN",
                "to": "UNKNOWN"
            }
        `);

        this.chain = prompt.pipe(this.modelInstance);
    }

    public getChain() {
        return this.chain;
    }
}