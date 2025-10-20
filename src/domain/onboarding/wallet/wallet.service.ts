interface IWallet {
    id: string;
    ownerId: string;
    chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
    smartAccountAddress: string; // address of provisioned wallet.
    isPrimary: boolean; // indicates if this is the user's primary wallet since user can have multiple provisioned wallets.
    nonce: number;
    createdAt: Date;
    updatedAt: Date;
}