import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "price_cache" })
export class PriceCache{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  tokenSymbol!: string;

  @Column({
    type: "enum",
    enum: ["Base", "Ethereum", "Polygon", "Optimism", "Arbitrum"],
  })
  chain!: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";

  @Column({ type: "varchar", name: "price_usd" })
  priceUSD!: string;

  @Column({ type: "timestamp with time zone" })
  timestamp!: Date;

  @Column({
    type: "enum",
    enum: ["CoinGecko", "CoinMarketCap", "Chainlink"],
  })
  oracleSource!: "CoinGecko" | "CoinMarketCap" | "Chainlink";

  // No updatedAt needed
  @Column({ type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
