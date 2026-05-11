#!/usr/bin/env node
/**
 * factory CLI — entry point.
 *
 * Status: skeleton. Most commands are stubs that print "phase 1 — to implement".
 * The structure is in place so commands can be filled in incrementally.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { repoCloneCmd } from './commands/repo-clone.js';
import { repoAuditCmd } from './commands/repo-audit.js';
import { repoNormalizeCmd } from './commands/repo-normalize.js';
import { repoConnectCmd } from './commands/repo-connect.js';
import { repoScanCmd } from './commands/repo-scan.js';
import { repoRunCmd } from './commands/repo-run.js';
import { repoCreatePrCmd } from './commands/repo-create-pr.js';
import { siteAnalyzeCmd } from './commands/site-analyze.js';
import { featureGenerateCmd } from './commands/feature-generate.js';
import { productCreateCmd } from './commands/product-create.js';
import { productPortCmd } from './commands/product-port.js';
import { securityScanCmd } from './commands/security-scan.js';
import { privacyRedactCmd } from './commands/privacy-redact.js';
import { devTriageCmd } from './commands/dev-triage.js';

const program = new Command();

program
  .name('factory')
  .description('CLI central de la factory App/SaaS')
  .version('0.1.0');

// Repo subcommands
const repo = program.command('repo').description('Repo operations');
repo.command('clone <owner/repo>').description('Clone a repo locally').action(repoCloneCmd);
repo.command('audit <path>').description('Audit a local repo (stack, deps, security)').action(repoAuditCmd);
repo.command('normalize <path>').description('Normalize structure to factory conventions').action(repoNormalizeCmd);
repo.command('connect <path>').description('Connect a normalized repo to a template').action(repoConnectCmd);
repo.command('scan <path>').description('Run all security scanners').action(repoScanCmd);
repo.command('run <path>').description('Run dev workflow on a repo').action(repoRunCmd);

// PR
program.command('pr:create').description('Create a PR with current branch').action(repoCreatePrCmd);

// Site analysis
const site = program.command('site').description('Reference site analyzer (cleanroom)');
site.command('analyze <url>').description('Analyze a public site').option('-n, --name <name>', 'feature name').action(siteAnalyzeCmd);

// Feature generation
const feature = program.command('feature').description('Feature generation');
feature.command('from-url <url>').action(featureGenerateCmd);
feature.command('from-screenshot <path>').action(featureGenerateCmd);
feature.command('generate <spec>').action(featureGenerateCmd);

// Product
const product = program.command('product').description('Product (template instance) operations');
product.command('create <name>').description('Create a new product from template').action(productCreateCmd);
product.command('port <feature-dir> <template-dir>').description('Port a feature into a template').action(productPortCmd);

// Security
const security = program.command('security').description('Security scans');
security.command('scan [path]').description('Run all scanners').action(securityScanCmd);
security.command('scan-app <url>').description('Scan a running app (ZAP/Nuclei)').action(securityScanCmd);

// Privacy (PII)
const privacy = program.command('privacy').description('AI privacy gateway');
privacy.command('redact <file>').description('Redact PII in a file').action(privacyRedactCmd);
privacy.command('test <file>').description('Test PII detection on sample').action(privacyRedactCmd);

// Dev orchestrator
const dev = program.command('dev').description('Dev orchestrator');
dev.command('triage').description('Detect tasks in repo').action(devTriageCmd);
dev.command('queue').description('List queued tasks').action(devTriageCmd);
dev.command('run-next').description('Run next task').action(devTriageCmd);
dev.command('review-task <id>').description('Review a specific task').action(devTriageCmd);

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
