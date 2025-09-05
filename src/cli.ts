#!/usr/bin/env node

/* entry point for application cli */

import { CliManager } from "./cli/cliManager";

const cliManager = new CliManager();
cliManager.bootstrapCli();
