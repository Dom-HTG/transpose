#!/usr/bin/env node

/* entry point for application cli */

import { CliManager } from "./cli/cliManager";

/* initialize appliation CLI */
const cliManager = new CliManager();
cliManager.bootstrapCli();
