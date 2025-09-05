import figlet from "figlet";
import chalk from "chalk";
import { Command } from "commander";
import readline from 'readline';
import { stdin, stdout } from "process";

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
    if (query) console.log(chalk.greenBright(`🚀 Query received: "${query}"`));
  }

  private async interractiveTerminalMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt(chalk.yellow("💡 Enter your query: "));
    rl.prompt();

    rl.on("line", (line) => {
      this.transposeAction(line.trim());
      rl.prompt(); // keep alive
    });
  }

  public bootstrapCli() {
    this.program
      .name("transpose")
      .description("Natural language blockchain transaction agent")
      .version("1.0.0")
      .action(() => this.interractiveTerminalMode());

    this.program.parse(process.argv);
  }
}
