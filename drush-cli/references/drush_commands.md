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
```

## Entity Operations

### Nodes

```bash
# List recent nodes
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->sort("created", "DESC")
    ->range(0, 10)
    ->execute();
  print_r($nids);
'

# Get node details by ID
drush php-eval '
  $node = \Drupal\node\Entity\Node::load(1);
  if ($node) {
    print "Title: " . $node->getTitle() . "\n";
    print "Type: " . $node->getType() . "\n";
    print "Status: " . ($node->isPublished() ? "published" : "unpublished") . "\n";
  }
'

# Delete a node
drush entity:delete node 1

# Delete multiple nodes
drush entity:delete node 1,2,3

# Delete all nodes of a specific type
drush entity:delete node --bundle=article

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

# Block a user
drush user:block username

# Unblock a user
drush user:unblock username
```

### Taxonomy

```bash
# List all taxonomy vocabularies
drush php-eval '
  $vocabularies = \Drupal\taxonomy\Entity\Vocabulary::loadMultiple();
  foreach ($vocabularies as $vid => $vocabulary) {
    print $vid . ": " . $vocabulary->label() . "\n";
  }
'

# List terms in a vocabulary
drush php-eval '
  $terms = \Drupal::entityTypeManager()->getStorage("taxonomy_term")
    ->loadTree("tags");
  foreach ($terms as $term) {
    print $term->tid . ": " . $term->name . "\n";
  }
'

# Create a taxonomy term
drush php-eval '
  $term = \Drupal\taxonomy\Entity\Term::create([
    "vid" => "tags",
    "name" => "New Term",
  ]);
  $term->save();
  print "Created term: " . $term->id() . "\n";
'
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
drush cache:rebuild

# Clear specific caches
drush cache:clear render
drush cache:clear bootstrap
drush cache:clear dynamic_page_cache
```

## Module and Theme Management

```bash
# List installed modules
drush pm:list --type=module --status=enabled

# Install module
drush pm:install views

# Uninstall module
drush pm:uninstall views

# Enable module (alias for install)
drush pm:enable views

# Disable module
drush pm:uninstall views

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
# Check for security updates (use composer audit instead)
composer audit

# Apply database updates
drush updatedb

# List pending database updates
drush updatedb:status
```

## Utilities

```bash
# Run PHP code
drush php-eval 'print "Hello World\n";'

# Execute a PHP script
drush php:script myscript.php

# View site URL
drush site:alias @self

# Generate one-time login link
drush user:login

# Clear drush cache
drush cc

# View Drush version
drush --version
```

## Performance

```bash
# Clear render cache to regenerate CSS/JS aggregates
drush cache:clear render

# Rebuild content access permissions
drush php-eval '
  node_access_rebuild();
  print "Content access permissions rebuilt\n";
'
```
