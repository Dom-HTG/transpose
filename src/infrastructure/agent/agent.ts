import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { BaseConfig } from "../../config/app.config";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough } from "@langchain/core/runnables";
import { baseSchema } from "./schema";
import { ToolOrchestrator } from "../../internal/ochestrator/agentOchestrator";
import { z } from "zod";

type ParsedOutput = z.infer<typeof baseSchema>;

/* 
  AgentManager boostraps transpose agent
  - Uses a ChatGroq model
  - Parses natural language into structured blockchain actions
*/

export class AgentManager {
  private modelInstance: ChatGroq;
  private chain: Runnable<{ input: string }, ParsedOutput>;
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
        that can be executed on a blockchain or for user account management.

        Available Actions:
        - signup: Register a new user account
        - signin: Login an existing user
        - create_alias: Save a human-readable alias for a wallet address
        - resolve_alias: Look up a wallet address from an alias
        - transfer: Send tokens from one wallet to another
        - swap: Exchange one token for another
        - balance_check: Check wallet token balance
        - portfolio: View portfolio balances, activity, or pulse summary

        Guidelines:
        1. Always return ONLY a valid JSON object (no extra text, no markdown fences).
        2. Never invent information — only use what is explicitly provided.
        3. If something is missing (e.g., recipient address, asset), let the user know what is missing.
        4. Default chain is **Base** if no chain is specified.
        5. Default asset is **ETH** if none is mentioned.
        6. Aliases start with @ (e.g., @alice, @dom).

        {format_instructions}

        Examples:

        Q: "Sign me up with alice@gmail.com"
        A:
        {{
            "action": "signup",
            "provider": "email",
            "email": "alice@gmail.com",
            "password": "REQUIRED_PROMPT_USER",
            "chain": "Base"
        }}

        Q: "Login with my email bob@example.com"
        A:
        {{
            "action": "signin",
            "provider": "email",
            "email": "bob@example.com",
            "password": "REQUIRED_PROMPT_USER"
        }}

        Q: "Save @dom as 0x123abc456def"
        A:
        {{
            "action": "create_alias",
            "alias": "dom",
            "address": "0x123abc456def"
        }}

        Q: "Who is @alice?"
        A:
        {{
            "action": "resolve_alias",
            "alias": "alice"
        }}

        Q: "Send 2 USDT to @alice on Base"
        A:
        {{
            "action": "transfer",
            "asset": "USDT",
            "amount": "2",
            "from": "UNKNOWN",
            "to": "@alice",
            "chain": "Base"
        }}

        Q: "Check my balance"
        A:
        {{
            "action": "balance_check",
            "asset": "ETH",
            "amount": "UNKNOWN",
            "from": "UNKNOWN",
            "to": "UNKNOWN",
            "chain": "Base"
        }}

        Q: "Swap 50 USDC for ETH on Uniswap on Base"
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

        Q: "Show me my portfolio"
        A:
        {{
            "action": "portfolio",
            "view": "balances"
        }}

        Q: "What are my recent transactions?"
        A:
        {{
            "action": "portfolio",
            "view": "activity"
        }}

        User Query: {input}
    `);

    this.chain = RunnablePassthrough.assign<
      { input: string },
      { format_instructions: string }
    >({
      format_instructions: () => this.formatInstruction,
    })
      .pipe(prompt)
      .pipe(this.modelInstance)
      .pipe(parser as unknown as Runnable<any, ParsedOutput>) as Runnable<
      { input: string },
      ParsedOutput
    >;
  }

  public getChain() {
    return this.chain;
  }
}
