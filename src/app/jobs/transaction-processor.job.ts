import { z } from "zod";

/**
 * Transaction Processing Job Schema
 * Defines the structure for transfer/transaction jobs
 */
export const transactionProcessorJobSchema = z.object({
  userId: z.string().uuid(),
  transactionId: z.string().uuid(),
  chain: z.enum(["Base", "Ethereum", "Polygon", "Optimism", "Arbitrum"]),
  type: z.enum(["transfer", "swap"]),
  fromAddress: z.string(),
  toAddress: z.string(),
  asset: z.string(),
  amount: z.string(),
  userOp: z.string().optional(), // ERC-4337 UserOperation payload
});

export type TransactionProcessorJob = z.infer<
  typeof transactionProcessorJobSchema
>;

/**
 * Job result interface
 */
export interface TransactionJobResult {
  success: boolean;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
  error?: string;
}
