import figlet from "figlet";
import chalk from "chalk";
import { Command } from "commander";

export class CliManager {
  private program: Command;

  constructor() {
    this.program = new Command();

    // ASCII rendering.
    const textSync = chalk.greenBright(
      figlet.textSync("Transpose", { horizontalLayout: "full" }),
    );

    console.log(textSync);
  }

  private transposeAction(query: string) {
    console.log(chalk.greenBright(`🚀 Query received: "${query}"`));
    console.log(chalk.cyan("✨ CLI is working as expected!"));
  }

  public bootstrapCli() {
    this.program
      .name("transpose")
      .description("Natural language blockchain transaction agent")
      .version("1.0.0")
      .argument("<query>", "User Query to execute")
      .action((query) => this.transposeAction(query));

    this.program.parse(process.argv);
  }
}
