import { z } from "zod";

/**
 * Swap Processing Job Schema
 * Defines the structure for token swap jobs
 */
export const swapProcessorJobSchema = z.object({
  userId: z.string().uuid(),
  swapId: z.string().uuid(),
  chain: z.enum(["Base", "Ethereum", "Polygon", "Optimism", "Arbitrum"]),
  fromAsset: z.string(),
  toAsset: z.string(),
  amountIn: z.string(),
  amountOutExpected: z.string(),
  protocol: z.string().optional(), // e.g., "Uniswap", "1inch"
  slippage: z.number().default(0.5), // percentage
  userOp: z.string().optional(), // ERC-4337 UserOperation payload
});

export type SwapProcessorJob = z.infer<typeof swapProcessorJobSchema>;

/**
 * Job result interface
 */
export interface SwapJobResult {
  success: boolean;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
  amountOutReceived?: string;
  actualSlippage?: number;
  error?: string;
}
