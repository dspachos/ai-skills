# Drush Command Reference

This reference organizes common Drush commands by category for quick lookup.

## System Information

```bash
# Get Drupal system status
drush status

# Get system information in JSON format
drush status --format=json

# View PHP information
drush php-eval 'phpinfo();'

# View Drupal core version
drush core:status drupal-version
```

## Entity Operations

### Nodes

```bash
# List recent nodes
drush entity:query node --limit=10

# Get node details by ID
drush entity:view node 1

# Delete a node
drush entity:delete node 1

# Create a node programmatically
drush php-eval '
  $node = \Drupal\node\Entity\Node::create([
    "type" => "article",
    "title" => "Test Node",
    "uid" => 1,
  ]);
  $node->save();
  print "Created node: " . $node->id() . "\n";
'
```

### Users

```bash
# List all users
drush user-information

# View specific user details
drush user-information admin

# Create a new user
drush user:create newuser --mail="user@example.com" --password="password"

# Add user to role
drush user:role:add "administrator" newuser

# Cancel user account
drush user:cancel username --delete-content
```

### Taxonomy

```bash
# List all taxonomy vocabularies
drush taxonomy:vocabulary-list

# List terms in a vocabulary
drush taxonomy:term-list tags

# Create a taxonomy term
drush taxonomy:term:create tags "New Term"
```

## Configuration Management

```bash
# Export all configuration
drush config:export

# Export single configuration item
drush config:get system.site

# Set configuration value
drush config:set system.site.name "My Site"

# Delete configuration
drush config:delete system.site.name

# Import configuration from sync directory
drush config:import

# View differences between active and sync configuration
drush config:status
```

## Cache Management

```bash
# Clear all caches
drush cache:clear

# Clear specific caches
drush cache:clear render
drush cache:clear bootstrap
drush cache:clear dynamic_page_cache

# Rebuild registry
drush registry-rebuild
```

## Module and Theme Management

```bash
# List installed modules
drush pm:list --type=module --status=enabled

# Install module
drush module:install views

# Uninstall module
drush module:uninstall views

# Enable module
drush module:enable views

# Disable module
drush module:disable views

# List installed themes
drush pm:list --type=theme --status=enabled

# Install theme
drush theme:install bartik

# Set default theme
drush config:set system.theme default bartik

# Uninstall theme
drush theme:uninstall bartik
```

## Database Operations

```bash
# Connect to database (opens SQL shell)
drush sql:cli

# Export database
drush sql:dump --result-file=../dump.sql

# Import database
drush sql:cli < ../dump.sql

# Run SQL query
drush sql:query "SELECT * FROM users_field_data WHERE uid = 1"

# Drop all tables
drush sql:drop --yes

# Sanitize database (remove user data)
drush sql:sanitize --yes
```

## Maintenance Mode

```bash
# Enable maintenance mode
drush state:set system.maintenance_mode 1

# Disable maintenance mode
drush state:set system.maintenance_mode 0

# Check maintenance mode status
drush state:get system.maintenance_mode
```

## Cron Jobs

```bash
# Run all cron tasks
drush cron

# Run specific cron handler
drush cron:run

# View last cron run time
drush state:get system.cron_last
```

## Watchdog Logs

```bash
# View recent watchdog entries
drush watchdog:show

# View specific log type
drush watchdog:show --type=php

# Delete all watchdog logs
drush watchdog:delete all

# Export watchdog to file
drush watchdog:show --extended --fields=wid,type,timestamp,message > logs.txt
```

## Update Operations

```bash
# Check for available updates
drush pm:security

# Apply database updates
drush updatedb

# List pending database updates
drush updatedb:status

# Clear update status
drush pm:updatestatus
```

## Utilities

```bash
# Run PHP code
drush php-eval 'print "Hello World\n";'

# Execute a PHP script
drush php-script myscript.php

# View site URL
drush site:alias @self

# Generate one-time login link
drush user:login

# Clear drush cache
drush cc drush

# View Drush version
drush --version
```

## Performance

```bash
# Generate CSS and JavaScript aggregate files
drush asset:optimize

# Clear CSS/JS aggregate files
drush asset:clear

# Rebuild content access permissions
drush node:access-rebuild
```
