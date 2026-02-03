# Cache Management Reference

This reference covers Drush commands and patterns for managing Drupal caches.

## Cache Types

Drupal has multiple cache bins. Understanding which to clear is important:

- **render**: Rendered HTML output and page fragments
- **bootstrap**: Drupal bootstrap and module list
- **config**: Configuration data
- **discovery**: Plugin and hook discovery
- **dynamic_page_cache**: Anonymous page cache
- **menu**: Menu links and trees
- **page**: Page cache for authenticated users
- **path**: URL aliases
- **static**: Static cache that persists across requests

## Basic Cache Clearing

```bash
# Clear all caches
drush cache:clear

# Clear specific cache bin
drush cache:clear render
drush cache:clear bootstrap
drush cache:clear config

# Clear multiple caches
drush cache:clear render,bootstrap,config

# Clear static cache
drush cache:clear static
```

## Targeted Cache Clearing

### After Code Changes

```bash
# After updating modules/themes
drush cache:clear bootstrap
drush cache:clear discovery

# After configuration changes
drush cache:clear config

# After updating code with hooks
drush cache:clear bootstrap
drush cache:clear static
```

### After Content Changes

```bash
# After content updates affecting menus
drush cache:clear menu
drush cache:clear render

# After path changes
drush cache:clear path

# After updating taxonomy
drush cache:clear menu
drush cache:clear render
```

### Performance Optimization

```bash
# Clear render cache to see template changes
drush cache:clear render

# Clear dynamic page cache for anonymous users
drush cache:clear dynamic_page_cache

# Clear page cache for authenticated users
drush cache:clear page

# Clear render cache (CSS/JS aggregates are regenerated automatically)
drush cache:clear render
```

## Cache Clearing Scripts

### Production-Safe Cache Clear

```bash
# Clear only safe caches (don't clear static/bootstrap)
drush cache:clear render
drush cache:clear config
drush cache:clear menu
drush cache:clear page
drush cache:clear dynamic_page_cache
```

### Development Cache Clear

```bash
# Clear everything (aggressive, for development)
drush cache:clear
drush cache:rebuild

# Also clear external caches if using Varnish/CDN
drush cache:rebuild
```

## Cache Statistics

```bash
# View cache statistics
drush php-eval '
  $bins = [
    "render" => "Render cache",
    "bootstrap" => "Bootstrap cache",
    "config" => "Config cache",
    "discovery" => "Discovery cache",
  ];

  foreach ($bins as $bin => $label) {
    $backend = \Drupal::cache($bin);
    if (method_exists($backend, "getBackend")) {
      $info = $backend->getBackend()->getInfo();
      echo $label . ": " . ($info["count"] ?? "N/A") . " items\n";
    }
  }
'

# Check if specific cache is empty
drush php-eval '
  $backend = \Drupal::cache("render");
  $count = 0;
  if (method_exists($backend, "getBackend")) {
    $info = $backend->getBackend()->getInfo();
    $count = $info["count"] ?? 0;
  }
  echo $count == 0 ? "Render cache is empty\n" : "Render cache has $count items\n";
'
```

## Cache Configuration

### View Cache Settings

```bash
# View current cache configuration
drush config:get system.performance

# Check if CSS/JS aggregation is enabled
drush php-eval '
  $config = \Drupal::config("system.performance");
  echo "CSS aggregation: " . ($config->get("css.preprocess") ? "enabled" : "disabled") . "\n";
  echo "JS aggregation: " . ($config->get("js.preprocess") ? "enabled" : "disabled") . "\n";
'
```

### Configure Cache

```bash
# Enable CSS aggregation
drush config:set system.performance css.preprocess true

# Enable JS aggregation
drush config:set system.performance js.preprocess true

# Disable page caching (for development)
drush config:set system.performance cache.page.use_internal 0
drush cache:clear render
```

## Cache Backend Information

```bash
# Check cache backend implementation
drush php-eval '
  $bins = ["default", "render", "bootstrap", "config"];
  foreach ($bins as $bin) {
    $backend = \Drupal::cache($bin);
    echo $bin . ": " . get_class($backend) . "\n";
  }
'

# Check if Redis is configured
drush php-eval '
  $settings = \Drupal::service("settings")->getAll();
  if (isset($settings["redis.connection"]["host"])) {
    echo "Redis is enabled on " . $settings["redis.connection"]["host"] . "\n";
  } else {
    echo "Redis is not configured\n";
  }
'
```

## Advanced Cache Operations

### Clear Specific Cache Items

```bash
# Clear cache by CID pattern
drush php-eval '
  $backend = \Drupal::cache("render");
  $cids = [];
  if (method_exists($backend, "getBackend")) {
    $info = $backend->getBackend()->getAll();
    foreach ($info as $cid => $data) {
      if (strpos($cid, "node:") === 0) {
        $cids[] = $cid;
      }
    }
    if (!empty($cids)) {
      $backend->deleteMultiple($cids);
      echo "Cleared " . count($cids) . " cache items\n";
    }
  }
'

# Invalidate cache tags
drush php-eval '
  \Drupal::service("cache_tags.invalidator")->invalidateTags(["node:1"]);
  echo "Invalidated cache tags for node:1\n";
'
```

### Warm Up Cache

```bash
# Warm up popular pages
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("status", 1)
    ->range(0, 10)
    ->execute();

  foreach ($nids as $nid) {
    $node = \Drupal\node\Entity\Node::load($nid);
    if ($node) {
      \Drupal::service("renderer")->renderRoot($node->view("full"));
      echo "Warmed node: " . $nid . "\n";
    }
  }
'

# Warm up menu cache
drush php-eval '
  \Drupal::service("menu.link_tree")->build(
    \Drupal::menuTree()->buildPageData("main")
  );
  echo "Warmed main menu cache\n";
'
```

## Troubleshooting

### Cache Not Clearing

```bash
# Check if static cache is being used
drush php-eval '
  $use_static = \Drupal::config("system.performance")->get("cache.page.use_internal");
  echo "Internal page cache: " . ($use_static ? "enabled" : "disabled") . "\n";
'

# Rebuild container to clear static cache
drush php-eval '
  \Drupal::service("kernel")->rebuildContainer();
  echo "Container rebuilt\n";
'
```

### Check Cache Backend Health

```bash
# Test cache write/read
drush php-eval '
  $cache = \Drupal::cache("default");
  $cache->set("drush_test", "test_value");
  $value = $cache->get("drush_test")->data;
  $cache->delete("drush_test");
  echo $value === "test_value" ? "Cache working properly\n" : "Cache error\n";
'

# Test Redis connection if enabled
drush php-eval '
  $settings = \Drupal::service("settings")->getAll();
  if (isset($settings["redis.connection"])) {
    try {
      $redis = \Drupal::service("redis.factory")->getClient();
      $redis->set("drush_test", "working");
      echo "Redis connection: OK\n";
      $redis->del("drush_test");
    } catch (\Exception $e) {
      echo "Redis connection error: " . $e->getMessage() . "\n";
    }
  }
'
```

## Cache Performance Tips

```bash
# Disable caching during development
drush config:set system.performance cache.page.use_internal 0
drush config:set system.performance cache.page.max_age 0

# Enable aggressive caching for production
drush config:set system.performance cache.page.use_internal 1
drush config:set system.performance cache.page.max_age 3600
drush config:set system.performance css.preprocess 1
drush config:set system.performance js.preprocess 1
drush cache:clear
```

## Monitoring Cache Usage

```bash
# Monitor cache hit rates (requires cache_statistics module)
drush php-eval '
  if (\Drupal::moduleHandler()->moduleExists("statistics")) {
    $stats = \Drupal::service("cache_statistics.memory_backend")->getStats();
    print_r($stats);
  } else {
    echo "Statistics module not enabled\n";
  }
'
```
