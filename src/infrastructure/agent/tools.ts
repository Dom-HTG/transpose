import { TransferService } from "../../domain/transaction/transaction.service";
import { SwapService } from "../../domain/swap/swap.service";
import { transferTool, swapTool, balanceCheckTool } from "./schema";
import { ToolInput } from "../../internal/ochestrator/agentOchestrator";

export interface AgentToolsContract {
  transferTool(): any;
  swapTool(): any;
  balanceCheckTool(): any;
}
export class AgentTools implements AgentToolsContract {
  constructor(
    private readonly transferService: TransferService,
    private readonly swapService: SwapService,
  ) {}

  transferTool() {
    return {
      ...transferTool,
      execute: async (input: ToolInput) => {
        return this.transferService.transferToken(input);
      },
    };
  }

  swapTool() {
    return {
      ...swapTool,
      execute: async (input: ToolInput) => {
        return this.swapService.swapToken(input);
      },
    };
  }

  balanceCheckTool() {
    return {
      ...balanceCheckTool,
      execute: async (input: ToolInput) => {
        return this.transferService.checkTokenBalance(input);
      },
    };
  }
}
