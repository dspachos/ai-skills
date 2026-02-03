---
name: gh-github
description: Work with GitHub repositories, pull requests, issues, projects, and workflows using the GitHub CLI (gh). Use when viewing, creating, or managing PRs, issues, workflow runs, projects, or performing any GitHub repository operations through the command line.
---

# GitHub CLI (gh)

## Overview

Use this skill when working with GitHub through the command line. Covers viewing and managing pull requests, issues, projects, workflows/actions, and repository operations.

## Pull Requests

View PRs: `gh pr list`, `gh pr view <number>`, `gh pr diff <number>`
Create PRs: `gh pr create --title "Title" --body "Description"`
Review PRs: `gh pr review <number> --approve`, `gh pr review <number> --request-changes`
Merge PRs: `gh pr merge <number> --squash`, `gh pr merge <number> --rebase`

## Issues

List issues: `gh issue list --state open`, `gh issue list --label "bug"`
View issue: `gh issue view <number>`
Create issue: `gh issue create --title "Title" --body "Description"`
Manage: `gh issue close <number>`, `gh issue edit <number> --add-label "label"`

## Projects

View projects: `gh project list`, `gh project view <number>`
List items: `gh project item-list <number>`
Manage items: `gh project item-add <project-number> --owner-owner --content-type ISSUE --content-id <issue-id>`

## Workflows and Actions

List runs: `gh run list --workflow "workflow.yml"`, `gh run list --status failed`
View run: `gh run view <run-id> --log`
View workflow: `gh workflow list`, `gh workflow view <workflow.yml>`
Trigger workflow: `gh workflow run <workflow.yml> -f param=value`
Rerun: `gh run rerun <run-id>`, `gh run cancel <run-id>`

## Repository Operations

View repo: `gh repo view`, `gh repo view owner/repo`
List repos: `gh repo list owner --limit 10`

## Useful Patterns

Get JSON output for scripting: `gh pr list --json number,title,state`
Open in browser: `gh pr view <number> --web`
Filter with flags: `gh pr list --author "@me" --state open --label "needs-review"`
Check CI status: `gh run list --limit 5`, `gh run view --log`

## Resources

See [references/gh-cli-workflows.md](references/gh-cli-workflows.md) for comprehensive command reference including advanced usage, batch operations, and complete flag documentation.
