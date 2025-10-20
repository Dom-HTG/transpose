import {
  Entity,
  Column,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user.entity";

@Entity("transactions")
export class Transaction extends BaseEntity {
  // user => multiple transactions
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  owner!: User;

  // Blockchain network
  @Column({
    type: "enum",
    enum: ["Base", "Ethereum", "Polygon", "Optimism", "Arbitrum"],
  })
  chain!: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";

  // Transaction type
  @Column({
    type: "enum",
    enum: ["transfer", "swap"],
  })
  type!: "transfer" | "swap";

  // Text-based summary of the transaction
  @Column({ type: "text" })
  preview!: string;

  // Raw ERC-4337 operation payload
  @Column({ type: "text", name: "user_op" })
  userOp!: string;

  // Sender address
  @Column({ type: "varchar", name: "from_address" })
  fromAddress!: string;

  // Receiver address
  @Column({ type: "varchar", name: "to_address" })
  toAddress!: string;

  // Transaction hash
  @Column({ type: "varchar", unique: true, name: "tx_hash" })
  txHash!: string;

  // Asset involved (e.g., ETH, USDC)
  @Column({ type: "varchar" })
  asset!: string;

  // Amount (stored as string to handle large values or decimals)
  @Column({ type: "varchar" })
  amount!: string;

  // Transaction status
  @Column({
    type: "enum",
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  })
  status!: "pending" | "confirmed" | "failed";
}
