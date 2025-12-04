import { MCPTools, ToolInput } from "../mcp/tools";

// Re-export ToolInput for use in other modules
export type { ToolInput };

/**
 * ToolOrchestrator
 * Routes parsed LLM actions to appropriate MCP tools
 * Handles all action types: signup, signin, alias, transfer, swap, balance, portfolio
 */
export class ToolOrchestrator {
  private toolRegistry: Record<string, any>;

  constructor(private readonly tools: MCPTools) {
    // Register all MCP tools
    this.toolRegistry = {
      signup: this.tools.signupTool(),
      signin: this.tools.signinTool(),
      create_alias: this.tools.createAliasTool(),
      resolve_alias: this.tools.resolveAliasTool(),
      transfer: this.tools.transferTool(),
      swap: this.tools.swapTool(),
      balance_check: this.tools.balanceCheckTool(),
      portfolio: this.tools.portfolioTool(),
    };
  }

  /**
   * Map tool input to appropriate tool and execute
   * @param input - Parsed action from LLM
   * @param userId - Current user ID (optional, required for authenticated actions)
   */
  async mapTool(input: ToolInput, userId?: string) {
    const tool =
      this.toolRegistry[input.action as keyof typeof this.toolRegistry];

    if (!tool) {
      throw new Error(`Unknown tool action: ${input.action}`);
    }

    return tool.execute(input, userId);
  }

  /**
   * Get all available tool names
   */
  getAvailableTools(): string[] {
    return Object.keys(this.toolRegistry);
  }
}
