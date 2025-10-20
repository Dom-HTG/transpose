import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user.entity";

@Entity("wallets")
export class Wallet extends BaseEntity {
  // user => multiple wallets
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  owner!: User;

  // Chain on which the wallet is provisioned
  @Column({
    type: "enum",
    enum: ["Base", "Ethereum", "Polygon", "Optimism", "Arbitrum"],
  })
  chain!: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";

  // Address of the provisioned smart account wallet
  @Column({ type: "varchar", unique: true, name: "smart_account_address" })
  smartAccountAddress!: string;

  // Indicates whether this wallet is the user's primary wallet
  @Column({ type: "boolean", default: false, name: "is_primary" })
  isPrimary!: boolean;

  // Nonce for transaction signing
  @Column({ type: "int", default: 0 })
  nonce!: number;
}
