---
name: lagoon-cli
description: Lagoon CLI for managing hosted projects. Use when working with Lagoon (amazee.io), deploying applications, managing environments, SSH access, logs, backups, or Lagoon configuration.
---

# Lagoon CLI

Lagoon CLI manages Lagoon-hosted projects via the `lagoon` command.

## Authentication

```bash
lagoon login                    # Login to Lagoon
lagoon config add               # Add Lagoon instance
lagoon config list              # List configured instances
lagoon config current           # Show current instance
```

## Projects & Environments

```bash
lagoon list projects -l <instance>              # List all projects
lagoon get project -p <project>                 # Get project details
lagoon list environments -p <project>           # List environments
lagoon get environment -p <project> -e <env>   # Get environment details
lagoon deploy latest -p <project> -e <env>      # Deploy latest
lagoon deploy branch -p <project> -b <branch>    # Deploy branch
```

## SSH & Logs

```bash
lagoon ssh -p <project> -e <env>                    # SSH to environment
lagoon ssh -p <project> -e <env> -s <service>       # SSH to specific service
lagoon ssh -p <project> -e <env> -C "command"       # Run command via SSH
lagoon logs -p <project> -e <env>                    # View logs
lagoon logs -p <project> -e <env> -f                 # Follow logs
lagoon logs -p <project> -e <env> -s <service>      # Logs for specific service
```

## Deployments & Tasks

```bash
lagoon list deployments -p <project> -e <env>      # List deployments
lagoon list tasks -p <project> -e <env>             # List tasks
lagoon run custom -p <project> -e <env> -- "<cmd>"  # Run custom command
lagoon run invoke -p <project> -e <env> -t <task>  # Invoke registered task
```

## Variables

```bash
lagoon list variables -p <project> -e <env>        # List variables
lagoon add variable -p <project> -e <env> --name KEY --value VALUE --scope runtime
lagoon update variable -p <project> -e <env> --name KEY --value NEW_VALUE
lagoon delete variable -p <project> -e <env> --name KEY
```

## Backups

```bash
lagoon list backups -p <project> -e <env>          # List backups
lagoon retrieve backup -p <project> -e <env> -b <id> # Retrieve backup
```

## Common Options

```bash
-p, --project string       Specify project
-e, --environment string   Specify environment
-l, --lagoon string       Specify Lagoon instance
--output-json             JSON output
--output-csv              CSV output
--force                   Force yes on prompts
-v, --verbose             Verbose output
```

## Examples

Deploy a feature branch:
```bash
lagoon deploy branch -p myproject -b feature/new-feature
```

SSH into the php service of production environment:
```bash
lagoon ssh -p myproject -e production -s php
```

Follow logs from nginx:
```bash
lagoon logs -p myproject -e staging -s nginx -f
```

Add an environment variable:
```bash
lagoon add variable -p myproject -e staging --name API_URL --value "https://api.example.com" --scope runtime
```
