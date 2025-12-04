import { z } from "zod";

/**
 * Wallet Provisioning Job Schema
 * Defines the structure for wallet provisioning jobs
 */
export const walletProvisionJobSchema = z.object({
  userId: z.string().uuid(),
  chain: z.enum(["Base", "Ethereum", "Polygon", "Optimism", "Arbitrum"]),
});

export type WalletProvisionJob = z.infer<typeof walletProvisionJobSchema>;

/**
 * Job processor for wallet provisioning
 * This is called by the wallet worker
 */
export interface WalletJobResult {
  success: boolean;
  walletId?: string;
  address?: string;
  txHash?: string;
  error?: string;
}
