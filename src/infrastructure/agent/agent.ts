import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { BaseConfig } from "../../config/app.config";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough } from "@langchain/core/runnables";
import { baseSchema } from "./schema.agent";

/* boostraps transpose agent */

export class AgentManager {
  private modelInstance: ChatGroq;
  private chain: Runnable<{ input: string }, AIMessage>;
  private formatInstruction: string;

  constructor(config: BaseConfig) {
    this.modelInstance = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      apiKey: config.agent.grokApiKey,
    });

    /* spawn parser with schema validation */
    const parser = StructuredOutputParser.fromZodSchema(baseSchema as any);

    this.formatInstruction = parser.getFormatInstructions();

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

        {format_instructions}

        Examples:

        Q: "Send 2 USDT to Alice on Base"
        A:
        {{
            "action": "transfer",
            "asset": "USDT",
            "amount": "2",
            "from": "UNKNOWN",
            "to": "alice",
            "chain": "Base",
        }}

        Q: "Check my balance"
        A:
       {{
            "action": "balance_check",
            "asset": "ETH",
            "amount": "UNKNOWN",
            "from": "UNKNOWN",
            "to": "UNKNOWN",
            "chain": "Base",
        }}

        Q:"Swap 50 USDC for ETH on Uniswap on Base"
        A:
        {{
            "action": "swap",
            "fromAsset": "USDC",
            "toAsset": "ETH",
            "amount": "50",
            "chain": "Base",
            "protocol": "Uniswap",
            "from": "UNKNOWN",
            "to": "UNKNOWN"
        }}

        User Query: {input}
    `);

    this.chain = RunnablePassthrough.assign({
      format_instructions: () => this.formatInstruction,
    })
      .pipe(prompt)
      .pipe(this.modelInstance);
  }

  public getChain() {
    return this.chain;
  }
}
