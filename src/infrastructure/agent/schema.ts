import { z } from "zod";
import { StructuredToolParams } from "@langchain/core/tools";

// Signup action schema
const signupSchema = z.object({
  action: z.literal("signup"),
  provider: z.enum(["email", "google", "github"]),
  email: z.string().email(),
  password: z.string().optional(), // Required for email, null for OAuth
  chain: z
    .enum(["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"])
    .default("Base"),
});

// Signin/Login action schema
const signinSchema = z.object({
  action: z.literal("signin"),
  provider: z.enum(["email", "google", "github"]),
  email: z.string().email(),
  password: z.string().optional(), // Required for email, null for OAuth
});

// Alias management schemas
const createAliasSchema = z.object({
  action: z.literal("create_alias"),
  alias: z.string(),
  address: z.string(),
  chain: z
    .enum(["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"])
    .optional(),
});

const resolveAliasSchema = z.object({
  action: z.literal("resolve_alias"),
  alias: z.string(),
});

// Transfer schema
const transferSchema = z.object({
  action: z.literal("transfer"),
  asset: z.string(),
  amount: z.string(),
  from: z.string(),
  to: z.string(), // Can be alias or address
  chain: z.enum(["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"]),
});

// Balance check schema
const balanceSchema = z.object({
  action: z.literal("balance_check"),
  asset: z.string().default("ETH"),
  amount: z.string().default("UNKNOWN"),
  from: z.string().default("UNKNOWN"),
  to: z.string().default("UNKNOWN"),
  chain: z
    .enum(["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"])
    .default("Base"),
});

// Swap schema
const swapSchema = z.object({
  action: z.literal("swap"),
  fromAsset: z.string(),
  toAsset: z.string(),
  amount: z.string(),
  protocol: z.string().optional(),
  chain: z.enum(["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"]),
  from: z.string().default("UNKNOWN"),
  to: z.string().default("UNKNOWN"),
});

// Portfolio/Activity schema
const portfolioSchema = z.object({
  action: z.literal("portfolio"),
  view: z.enum(["balances", "activity", "pulse"]).default("balances"),
});

// Base discriminated union schema
const baseSchema = z.discriminatedUnion("action", [
  signupSchema,
  signinSchema,
  createAliasSchema,
  resolveAliasSchema,
  transferSchema,
  swapSchema,
  balanceSchema,
  portfolioSchema,
]);

/* Tools definitions */

const signupTool: StructuredToolParams = {
  name: "signup",
  description:
    "Register a new user account with email/password or OAuth provider",
  schema: signupSchema,
};

const signinTool: StructuredToolParams = {
  name: "signin",
  description:
    "Authenticate and login a user with email/password or OAuth provider",
  schema: signinSchema,
};

const createAliasTool: StructuredToolParams = {
  name: "create_alias",
  description:
    "Create or update a human-readable alias for a wallet address (e.g., @alice → 0x123...)",
  schema: createAliasSchema,
};

const resolveAliasTool: StructuredToolParams = {
  name: "resolve_alias",
  description: "Resolve a human-readable alias to its wallet address",
  schema: resolveAliasSchema,
};

const transferTool: StructuredToolParams = {
  name: "transfer",
  description: "Send tokens from one wallet to another on a blockchain",
  schema: transferSchema,
};

const balanceCheckTool: StructuredToolParams = {
  name: "balance_check",
  description:
    "Fetch the current token balance of a specific wallet address on a given blockchain network",
  schema: balanceSchema,
};

const swapTool: StructuredToolParams = {
  name: "swap",
  description:
    "Exchange one cryptocurrency token for another on a specified blockchain and protocol (e.g., Uniswap on Ethereum, Base, or Polygon)",
  schema: swapSchema,
};

const portfolioTool: StructuredToolParams = {
  name: "portfolio",
  description:
    "View portfolio balances, recent activity, or generate Portfolio Pulse summary",
  schema: portfolioSchema,
};

// Type exports
export type SignupDTO = z.infer<typeof signupSchema>;
export type SigninDTO = z.infer<typeof signinSchema>;
export type CreateAliasDTO = z.infer<typeof createAliasSchema>;
export type ResolveAliasDTO = z.infer<typeof resolveAliasSchema>;
export type TransferDTO = z.infer<typeof transferSchema>;
export type BalanceCheckDTO = z.infer<typeof balanceSchema>;
export type SwapDTO = z.infer<typeof swapSchema>;
export type PortfolioDTO = z.infer<typeof portfolioSchema>;

export {
  baseSchema,
  signupTool,
  signinTool,
  createAliasTool,
  resolveAliasTool,
  transferTool,
  swapTool,
  balanceCheckTool,
  portfolioTool,
};
