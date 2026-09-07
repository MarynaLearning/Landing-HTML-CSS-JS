# landing-croatia-tools

Custom Claude Code plugin for this repo. Not auto-loaded — install it manually per the steps below.

## Test without installing

Load the plugin for a single session, no marketplace needed:

```bash
claude --plugin-dir ./plugins/landing-croatia-tools
```

## Install via the local marketplace

This repo also ships a marketplace manifest at `.claude-plugin/marketplace.json` that lists this plugin. To install it for your own Claude Code sessions:

```
/plugin marketplace add ./.claude-plugin/marketplace.json
/plugin install landing-croatia-tools@maryna-tools
```

This registers the plugin for you personally — it is not enabled automatically for anyone else who opens this repo.

## Commands

- `/find-plugin-todos` — find every TODO/FIXME comment in the codebase, grouped by file, ignoring `node_modules`.
