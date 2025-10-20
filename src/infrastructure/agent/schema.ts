import { z } from "zod";
import { StructuredToolParams } from "@langchain/core/tools";

const transferSchema = z.object({
  action: z.literal("transfer"),
  asset: z.string(),
  amount: z.string(),
  from: z.string(),
  to: z.string(),
  chain: z.enum(["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"]),
});

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

const baseSchema = z.discriminatedUnion("action", [
  transferSchema,
  swapSchema,
  balanceSchema,
]);

/* tools schema */

const transferToolParams: StructuredToolParams = {
  name: "transfer",
  description: "send tokens from one wallet to another on a blockchain",
  schema: transferSchema,
};

const balanceCheckToolParams: StructuredToolParams = {
  name: "balance_check",
  description:
    "Fetch the current token balance of a specific wallet address on a given blockchain network.",
  schema: balanceSchema,
};

const swapToolParams: StructuredToolParams = {
  name: "swap",
  description:
    "Exchange one cryptocurrency token for another on a specified blockchain and protocol (e.g., Uniswap on Ethereum, Base, or Polygon).",
  schema: swapSchema,
};

export type transferDTO = z.infer<typeof transferSchema>;
export type balanceCheckDTO = z.infer<typeof balanceSchema>;
export type swapDTO = z.infer<typeof swapSchema>;

export {
  baseSchema,
  swapToolParams,
  balanceCheckToolParams,
  transferToolParams,
};
