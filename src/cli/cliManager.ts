import figlet from "figlet";
import chalk from "chalk";
import { Command } from "commander";
import readline from "readline";
import axios from "axios";

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

  private async transposeAction(query: string){
    try {
      const resp = await axios.post("http://127.0.0.1:2039/chat", { query });
      return resp;
    } catch (e: any) {
      console.error(chalk.red(`Transpose Error: ${e}`));
    }
  }

  private async interractiveTerminalMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt(chalk.yellow("💡 User: "));
    rl.prompt();

     rl.on("line", async (line) => {
    try {
      const query = line.trim();
      if (!query) {
        rl.prompt();
        return;
      }

      // Wait for response
      const response = await this.transposeAction(query);

      // Show response as prompt
      rl.setPrompt(chalk.green(`🤖 Transpose: ${response?.data.data}\n\n💡 Enter your query: `));
    } catch (err) {
      rl.setPrompt(chalk.red(`❌ Error: ${err}\n\n💡 Enter your query: `));
    }

    rl.prompt();
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
