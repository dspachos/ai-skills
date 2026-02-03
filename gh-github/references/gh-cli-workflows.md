# GitHub CLI Workflows Reference

Complete guide to common gh CLI operations for managing repositories, issues, pull requests, and workflows.

## Repository Operations

### View Repository Info
```bash
gh repo view
gh repo view owner/repo
gh repo view --json name,description,visibility
```

### List Repositories
```bash
gh repo list
gh repo list owner --limit 10
gh repo list --json name,description,stargazerCount
```

## Issues

### List Issues
```bash
gh issue list
gh issue list --state open
gh issue list --state closed
gh issue list --label "bug,enhancement"
gh issue list --assignee "@me"
gh issue list --json number,title,state,author,labels
```

### View Issue
```bash
gh issue view 123
gh issue view 123 --json title,body,comments
```

### Create Issue
```bash
gh issue create --title "Issue title" --body "Issue description"
gh issue create --title "Fix bug" --body "Details" --label "bug" --assignee "@me"
```

### Update Issue
```bash
gh issue edit 123 --add-label "high-priority"
gh issue edit 123 --remove-label "bug"
gh issue close 123
gh issue reopen 123
```

### Add Comments
```bash
gh issue comment 123 --body "This is a comment"
```

## Pull Requests

### List Pull Requests
```bash
gh pr list
gh pr list --state open
gh pr list --state merged
gh pr list --author "@me"
gh pr list --base main
gh pr list --head feature-branch
gh pr list --label "review-needed"
gh pr list --json number,title,state,author,headRefName,baseRefName,mergedAt
```

### View Pull Request
```bash
gh pr view 123
gh pr view 123 --json title,body,headRefName,baseRefName,state,merged
```

### Create Pull Request
```bash
# Current branch to default branch
gh pr create --title "Add new feature" --body "Description"

# Specify branches
gh pr create --base main --head feature-branch --title "Title" --body "Description"

# With reviewers and labels
gh pr create --title "Title" --body "Description" --reviewer user1,user2 --label "needs-review"

# Draft PR
gh pr create --title "Title" --body "Description" --draft
```

### Review Pull Request
```bash
# View PR diff
gh pr diff 123

# Review with comment
gh pr review 123 --body "Looks good to me!"

# Approve
gh pr review 123 --approve

# Request changes
gh pr review 123 --request-changes --body "Please address these issues..."

# Comment on specific lines
gh pr review 123 --comment -F review_comments.txt
```

### Update Pull Request
```bash
# Add reviewers
gh pr edit 123 --add-reviewer user1,user2

# Add labels
gh pr edit 123 --add-label "ready-to-merge"

# Change title/body
gh pr edit 123 --title "New title" --body "New description"

# Close PR
gh pr close 123

# Reopen PR
gh pr reopen 123
```

### Merge Pull Request
```bash
# Merge (default merge commit)
gh pr merge 123

# Squash merge
gh pr merge 123 --squash

# Rebase merge
gh pr merge 123 --rebase

# Delete branch after merge
gh pr merge 123 --delete-branch

# With comment
gh pr merge 123 --squash --message "Merged PR"
```

## Projects (GitHub Projects)

### View Projects
```bash
gh project list
gh project list --owner owner
gh project view project-number
```

### List Items in Project
```bash
gh project item-list project-number
gh project item-list project-number --json title,status,assignedTo
```

### Add Item to Project
```bash
gh project item-add project-number --owner-owner --content-type ISSUE --content-id issue-id
```

## Workflows and Actions

### List Workflow Runs
```bash
gh run list
gh run list --workflow "test.yml"
gh run list --status running
gh run list --branch main
gh run list --limit 10
```

### View Workflow Run
```bash
gh run view run-id
gh run view run-id --log
gh run view run-id --log-failed
gh run view run-id --json status,conclusion,workflowName
```

### View Workflow Details
```bash
gh run view run-id --web
```

### Trigger Workflow
```bash
gh workflow run workflow.yml
gh workflow run workflow.yml -f param1=value1 -f param2=value2
```

### List Workflows
```bash
gh workflow list
gh workflow list --all
```

### View Workflow
```bash
gh workflow view workflow.yml
gh workflow view workflow.yml --yaml
gh workflow view workflow.yml --web
```

### Download Workflow Logs
```bash
gh run download run-id
gh run download run-id --name job-name
```

### Rerun Workflow
```bash
gh run rerun run-id
gh run rerun run-id --failed
```

### Cancel Workflow
```bash
gh run cancel run-id
```

## Authentication and Configuration

### View Auth Status
```bash
gh auth status
```

### Login
```bash
gh auth login
```

### Logout
```bash
gh auth logout
```

### Set Default Repository
```bash
gh repo set-default owner/repo
```

## Useful Flags

### JSON Output
Add `--json field1,field2,...` to get JSON output for scripting:
```bash
gh pr list --json number,title,state,author
gh issue view 123 --json title,body,comments
```

### Web View
Add `--web` to open in browser:
```bash
gh pr view 123 --web
gh run view 456 --web
```

### Pagination
Use `--limit` to control results:
```bash
gh pr list --limit 20
gh issue list --limit 50
```

### Filtering
Combine flags for precise filtering:
```bash
gh pr list --author "@me" --state open --label "needs-review"
gh run list --status failed --branch main --limit 10
```

## Common Patterns

### Quick PR Review Flow
```bash
# View PR
gh pr view 123

# View diff
gh pr diff 123

# Approve
gh pr review 123 --approve
```

### Create PR from Feature Branch
```bash
# Ensure branch is pushed
git push origin feature-branch

# Create PR
gh pr create --base main --head feature-branch --title "Feature: Description" --body "Details"
```

### Check CI Status
```bash
# List recent runs
gh run list --limit 5

# View latest run
gh run view --log
```

### Batch Operations
```bash
# Add reviewers to multiple PRs
for pr in $(gh pr list --json number --jq '.[].number'); do
  gh pr edit $pr --add-reviewer user1
done

# Close all open issues in repo
gh issue close $(gh issue list --state open --json number --jq '.[].number')
```
