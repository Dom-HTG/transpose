import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user.entity";
import { Transaction } from "./transaction.entity";

@Entity("swaps")
export class Swap extends BaseEntity {
  // user => multiple swap transaction
  @ManyToOne(() => Transaction, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tx_hash", referencedColumnName: "txHash" })
  owner!: User;

  @Column({ type: "varchar", unique: true, name: "tx_hash" })
  txHash!: string;

  // Swap protocol (e.g., Uniswap)
  @Column({ type: "varchar" })
  protocol!: string;

  // From asset symbol (e.g., ETH)
  @Column({ type: "varchar", name: "from_asset" })
  fromAsset!: string;

  // To asset symbol (e.g., USDC)
  @Column({ type: "varchar", name: "to_asset" })
  toAsset!: string;

  // Expected amount before slippage
  @Column({ type: "varchar", name: "amount_expected" })
  amountExpected!: string;

  // Actual received amount
  @Column({ type: "varchar", name: "amount_received" })
  amountReceived!: string;

  // Slippage percentage (e.g., "0.5")
  @Column({ type: "varchar" })
  slippage!: string;
}
