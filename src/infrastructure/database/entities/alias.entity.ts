import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./user.entity";
import { BaseEntity } from "./base";

@Entity({ name: "aliases" })
export class Alias extends BaseEntity {
  // one user can have many aliases
  @ManyToOne(() => User, (user) => user.aliases, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @Column({ type: "uuid" })
  ownerId!: string;

  // user-defined alias label
  @Column({ type: "varchar", length: 100 })
  alias!: string;

  @Column({ type: "varchar", length: 255 })
  aliasAddress!: string;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;
}
