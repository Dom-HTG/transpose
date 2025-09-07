import { z } from "zod";

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

export { baseSchema };
