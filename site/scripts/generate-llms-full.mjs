#!/usr/bin/env node
/**
 * Generates static/llms-full.txt by concatenating all docs in logical order.
 * Runs automatically before each build via the "prebuild" npm script.
 *
 * - Agents section first (AI agents land here)
 * - Then getting-started → entities → records → rules → api → admin → integrations → deploy → pdf → scheduling → billing → changelog
 * - Strips YAML frontmatter from each file
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..', 'docs');
const outFile = join(__dirname, '..', 'static', 'llms-full.txt');

const FILES = [
  // Agents first — primary audience for llms-full.txt
  'agents/overview.md',
  'agents/authentication.md',
  'agents/bot-identity.md',
  'agents/mcp-quickstart.md',
  'agents/building-a-site.md',
  'agents/users-and-rbac.md',
  'agents/channel-tools.md',
  // Getting started
  'getting-started/quick-start.md',
  'getting-started/concepts.md',
  'getting-started/mcp-setup.md',
  // Entities
  'entities/create-entity.md',
  'entities/field-types.md',
  'entities/add-fields.md',
  'entities/publish.md',
  'entities/views.md',
  // Records
  'records/crud.md',
  'records/filtering.md',
  'records/relations.md',
  // Business rules
  'business-rules/overview.md',
  'business-rules/dsl-reference.md',
  'business-rules/examples.md',
  'business-rules/execution-logs.md',
  // API reference
  'api/mcp-tools.md',
  'api/rest-api.md',
  'api/tool-profiles.md',
  // Admin
  'admin/users.md',
  'admin/anonymous-keys.md',
  'admin/api-management.md',
  'admin/api-keys.md',
  'admin/webhooks.md',
  'admin/knowledge.md',
  'admin/flows.md',
  'admin/secrets.md',
  'admin/files.md',
  'admin/apps.md',
  'admin/import-export.md',
  'admin/platform-invitations.md',
  // Integrations
  'integrations/n8n.md',
  // Deployment
  'deployment/static-sites.md',
  'deployment/github-actions.md',
  // PDF
  'pdf/generation.md',
  'pdf/templates.md',
  // Scheduling
  'scheduling/availability.md',
  'scheduling/bookings.md',
  // Billing
  'billing/plans.md',
  'billing/storage-usage.md',
  'billing/stripe.md',
  // Changelog & intro
  'changelog.md',
  'intro.md',
];

function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('---', 3);
  if (end === -1) return content;
  return content.slice(end + 3).trimStart();
}

const parts = [
  '# Fyso — Complete Documentation\n',
  '> This file contains the complete Fyso platform documentation. For a curated index, see /llms.txt\n',
];

for (const file of FILES) {
  const path = join(docsDir, file);
  if (!existsSync(path)) {
    console.warn(`[llms-full] skipping missing file: ${file}`);
    continue;
  }
  const raw = readFileSync(path, 'utf-8');
  parts.push('---\n');
  parts.push(stripFrontmatter(raw));
  parts.push('\n');
}

writeFileSync(outFile, parts.join('\n'), 'utf-8');
const size = (readFileSync(outFile).length / 1024).toFixed(0);
console.log(`[llms-full] generated ${outFile} (${size} KB, ${FILES.length} files)`);
