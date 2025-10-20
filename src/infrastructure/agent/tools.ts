import { TransferService } from "../../domain/transaction/transaction.service";
import {
  transferToolParams,
  swapToolParams,
  balanceCheckToolParams,
} from "./schema";
import { ToolInput } from "../../internal/ochestrator/agentOchestrator";

export interface AgentToolsContract {
  transferTool(): any;
  swapTool(): any;
  balanceCheckTool(): any;
}
export class AgentTools implements AgentToolsContract {
  constructor(private readonly transferService: TransferService) {}

  transferTool() {
    return {
      ...transferToolParams,
      execute: async (input: ToolInput) => {
        return this.transferService.transferToken(input);
      },
    };
  }

  swapTool() {}

  balanceCheckTool() {}
}
