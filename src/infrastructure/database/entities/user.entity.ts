import { Entity, Column, PrimaryGeneratedColumn,OneToMany } from "typeorm";
import { BaseEntity } from "./base";
import { Alias } from "./alias.entity";
import { UserIntent } from "./userIntent.entity";
import { Swap } from "./swap.entity";

interface IPriceCache {
    id: string;
    tokenSymbol: string;
    chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
    priceUSD: string;
    timestamp: Date; // timestamp of price fetch.
    oracleSource: "CoinGecko" | "CoinMarketCap" | "Chainlink";
    createdAt: Date;
}

@Entity("user")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  // Nullable if using wallet-only authentication
  @Column({ type: "varchar", nullable: true, unique: true })
  email!: string | null;

  // Authentication method used
  @Column({
    type: "enum",
    enum: ["wallet", "email", "oauth"],
  })
  auth!: "wallet" | "email" | "oauth";

  // User-approved recovery method
  @Column({
    type: "enum",
    enum: ["email", "phone"],
  })
  recovery!: "email" | "phone";

  // Initially null until a wallet is provisioned
  @Column({ type: "varchar", nullable: true, name: "primary_wallet_address" })
  primaryWalletAddress!: string | null;

  // User Aliases
  @OneToMany(() => Alias, (alias) => alias.owner, { cascade: true })
  aliases!: Alias[];

  // User Intents
  @OneToMany(() => UserIntent, (intent) => intent.owner, { cascade: true })
  intents!: UserIntent[];

  // User Swaps
  @OneToMany(() => Swap, (swap) => swap.owner, { cascade: true })
  swaps!: Swap[];
}

