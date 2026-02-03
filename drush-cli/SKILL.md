---
name: drush-cli
description:
  Drupal command-line operations via Drush for system inspection, entity
  management, cache clearing, configuration, database operations, and
  module/theme management. Use when working with Drupal through Drush CLI for
  any administrative or development task.
---

# Drush CLI

## Quick Start

### Check System Status

```bash
# Get quick system overview
node scripts/drush_status.cjs

# Get full status as JSON
node scripts/drush_status.cjs --json

# Verbose output
node scripts/drush_status.cjs --verbose
```

### Inspect Entities

```bash
# List recent nodes
node scripts/drush_entity_info.cjs node

# View specific node
node scripts/drush_entity_info.cjs node 1

# List users
node scripts/drush_entity_info.cjs user

# View user details
node scripts/drush_entity_info.cjs user 1
```

### User Management

```bash
# List all users
node scripts/drush_user_info.cjs

# View specific user
node scripts/drush_user_info.cjs admin

# List users by role
node scripts/drush_user_info.cjs --roles
```

### Configuration Management

```bash
# List all configuration
node scripts/drush_config_list.cjs

# View specific configuration
node scripts/drush_config_list.cjs system.site

# Export config to JSON
node scripts/drush_config_list.cjs --export system.site

# Search configuration
node scripts/drush_config_list.cjs --search node
```

### Cache Clearing

```bash
# Clear all caches
node scripts/drush_cache_clear.cjs

# Clear specific cache type
node scripts/drush_cache_clear.cjs render

# Clear multiple caches
node scripts/drush_cache_clear.cjs render config menu
```

## Available Scripts

All scripts are located in `scripts/` and are executable Node.js scripts:

- `drush_status.cjs` - Quick system status check
- `drush_entity_info.cjs` - Query and view entities
- `drush_user_info.cjs` - User information and listing
- `drush_config_list.cjs` - Configuration listing and search
- `drush_cache_clear.cjs` - Cache management

## Reference Documentation

### Comprehensive Command Reference

See [references/drush_commands.md](references/drush_commands.md) for complete
Drush command coverage organized by category:

- System Information
- Entity Operations (nodes, users, taxonomy)
- Configuration Management
- Cache Management
- Module/Theme Management
- Database Operations
- Maintenance Mode
- Cron Jobs
- Watchdog Logs
- Update Operations
- Utilities

### Entity Inspection Patterns

See [references/entity_operations.md](references/entity_operations.md) for
advanced entity query patterns:

- Basic entity queries by type, status, and conditions
- Complex queries with AND/OR logic
- Entity field conditions and reference queries
- Batch export operations
- Entity metadata and field definitions
- Entity statistics and bulk operations

### Cache Management

See [references/cache_management.md](references/cache_management.md) for cache
management strategies:

- Cache types and when to clear each
- Targeted cache clearing for development vs production
- Cache statistics and monitoring
- Cache configuration
- Advanced cache operations (specific items, cache tags)
- Cache warming strategies
- Troubleshooting cache issues

## Common Workflows

### After Module Installation

```bash
drush module:install views
node scripts/drush_cache_clear.cjs bootstrap
node scripts/drush_cache_clear.cjs discovery
```

### After Configuration Changes

```bash
drush config:import
node scripts/drush_cache_clear.cjs config
node scripts/drush_cache_clear.cjs render
```

### Database Operations

```bash
# Export database
drush sql:dump --result-file=../dump.sql

# Import database
drush sql:cli < ../dump.sql

# Run SQL query
drush sql:query "SELECT * FROM users_field_data"
```

### Content Inspection

```bash
# Find unpublished content
drush php-eval '
  $nids = \\Drupal::entityQuery("node")
    ->condition("status", 0)
    ->execute();
  print_r(\\Drupal\\node\\Entity\\Node::loadMultiple($nids));
'
```

### Performance Optimization

```bash
# Enable aggregation
drush config:set system.performance css.preprocess true
drush config:set system.performance js.preprocess true

# Clear CSS/JS aggregates and caches
drush css:flush && drush js:flush
node scripts/drush_cache_clear.cjs all
```

## Troubleshooting

### Drush Not Found

Ensure Drush is installed in the project:

```bash
cd apps/drupal
composer require drush/drush
```

### Permission Denied on Scripts

Make scripts executable:

```bash
chmod +x scripts/*.cjs
```

### Cache Not Clearing

Check if static cache is being used:

```bash
drush php-eval '
  $use_static = \\Drupal::config("system.performance")->get("cache.page.use_internal");
  echo $use_static ? "Internal page cache enabled\\n" : "Internal page cache disabled\\n";
'
```

If needed, rebuild container:

```bash
drush php-eval '\\Drupal::service("kernel")->rebuildContainer();'
```

## Notes

- This skill assumes a single-site Drupal installation
- All scripts should be run from the Drupal root directory
- Scripts suppress verbose error messages for cleaner output
- When scripts fail, check the underlying Drush command directly for debugging
