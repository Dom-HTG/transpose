interface IAlias {
  id: string;
  ownerId: string;
  alias: string; // user-defined label.
  aliasAddress: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
