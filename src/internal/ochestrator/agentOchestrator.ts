import { AgentTools } from "../../infrastructure/agent/tools";
import {
  transferDTO,
  swapDTO,
  balanceCheckDTO,
} from "../../infrastructure/agent/schema";
export type ToolInput = transferDTO | swapDTO | balanceCheckDTO;

export class ToolOrchestrator {
  private toolRegistry: Record<
    string,
    ReturnType<AgentTools[keyof AgentTools]>
  >;

  constructor(private readonly tools: AgentTools) {
    this.toolRegistry = {
      transfer: this.tools.transferTool(),
      swap: this.tools.swapTool(),
      balance_check: this.tools.balanceCheckTool(),
    };
  }

  async mapTool(input: ToolInput) {
    const tool =
      this.toolRegistry[input.action as keyof typeof this.toolRegistry];

    if (!tool) {
      throw new Error(`Unknown tool action: ${input.action}`);
    }

    return tool.execute(input);
  }
}
