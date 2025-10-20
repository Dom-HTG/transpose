import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user.entity";

@Entity({ name: "user_intents" })
export class UserIntent extends BaseEntity {
  // user => multiple intents
  @ManyToOne(() => User, (user) => user.intents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @Column({ type: "uuid" })
  ownerId!: string;

  @Column({ type: "text" })
  userQuery!: string;

  @Column({ type: "text" })
  parsedQuery!: string;

  @Column({
    type: "enum",
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  })
  status!: "pending" | "confirmed" | "failed";
}
