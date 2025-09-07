import { TransferService } from "../../domain/transaction/transaction.service";
import { transferToolParams, swapToolParams, balanceCheckToolParams } from "./schema";


export interface AgentToolsContract {
    transferTool(): any;
    swapTool(): any;
    balanceCheckTool(): any;
};

export interface transferDTO {
    to: string;
    from: string;
    amount: string;
    asset: string;
    chain: string;
}

export interface swapDTO {
    fromAsset: string;
    toAsset: string;
    amount: string;
    protocol: string;
    chain: string;
    from: string;
    to: string;
}

export class AgentTools implements AgentToolsContract {
    constructor(private readonly transferService: TransferService) {}

    transferTool() {
        return {
            ...transferToolParams,
            execute: async (input: transferDTO) => {
                return this.transferService.transferToken(input);
            }
        }
    }

    swapTool() {

    }

    balanceCheckTool() {
        
    }
}