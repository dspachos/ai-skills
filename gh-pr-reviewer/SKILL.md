---
name: gh-pr-reviewer
description: Retrieve and display GitHub pull requests assigned to you or pending your review. Use when user asks for PRs assigned to them, PRs needing review, or wants to check their GitHub PR workload.
---

# GitHub PR Reviewer

## Overview

Retrieve your assigned pull requests and review requests from GitHub. This skill fetches PRs where you are:
- The assignee
- Requested as a reviewer

## Get Your GitHub Username

First, get your GitHub username:
```bash
gh api user --jq '.login'
```

Use this username in subsequent commands.

## PRs Assigned to You

Fetch all PRs where you are the assignee:
```bash
gh search prs --assignee <username> --state all --json title,state,number,url,repository,updatedAt --jq '.[] | {title: .title, number: .number, state: .state, repo: .repository.name, url: .url, updated: .updatedAt}'
```

For only open PRs, remove `--state all`.

## PRs Pending Your Review

Fetch all PRs where you are requested as a reviewer:
```bash
gh search prs --review-requested <username> --state open --json title,number,url,repository,updatedAt --jq '.[] | {title: .title, number: .number, repo: .repository.name, url: .url, updated: .updatedAt}'
```

## Output Format

Present results as a clean table:
| State | # | Repository | Title | Updated |
|-------|---|------------|-------|---------|
| [state] | [number] | [repo] | [title] | [date] |

For open review requests:
| # | Repository | Title | Updated |
|---|------------|-------|---------|
| [number] | [repo] | [title] | [date] |
