#!/usr/bin/env node

const { execSync } = require("child_process");

/**
 * Clear Drupal caches
 * Usage: node drush_cache_clear.cjs [cache_type]
 * Cache types: all, render, bootstrap, config, menu, page, dynamic
 * Examples:
 *   node drush_cache_clear.cjs              # Clear all caches
 *   node drush_cache_clear.cjs all          # Clear all caches
 *   node drush_cache_clear.cjs render       # Clear render cache
 *   node drush_cache_clear.cjs render config  # Clear multiple caches
 */

const args = process.argv.slice(2);
const CACHE_BINS = [
  "all",
  "render",
  "bootstrap",
  "config",
  "menu",
  "page",
  "dynamic",
  "discovery",
  "static",
];

if (args.length === 0) {
  // Default to clearing all caches
  args.push("all");
}

// Validate cache types
const invalidTypes = args.filter(
  (arg) => !CACHE_BINS.includes(arg) && !arg.startsWith("--"),
);
if (invalidTypes.length > 0) {
  console.error(`Error: Invalid cache type(s): ${invalidTypes.join(", ")}`);
  console.error(`Valid types: ${CACHE_BINS.join(", ")}`);
  process.exit(1);
}

try {
  if (args.includes("all")) {
    console.log("Clearing all caches...");
    const command = "drush cache:clear";
    const output = execSync(command, { encoding: "utf8" });
    console.log(output.trim());

    // Also clear CSS/JS aggregates
    console.log("\nOptimizing CSS and JavaScript...");
    execSync("drush asset:optimize", { encoding: "utf8" });
    console.log("Asset optimization complete");
  } else {
    // Clear specific caches
    const cacheTypes = args.filter((arg) => !arg.startsWith("--"));

    console.log(`Clearing caches: ${cacheTypes.join(", ")}`);

    // Map short names to full cache bin names
    const binMap = {
      render: "render",
      bootstrap: "bootstrap",
      config: "config",
      menu: "menu",
      page: "page",
      dynamic: "dynamic_page_cache",
      discovery: "discovery",
      static: "static",
    };

    for (const type of cacheTypes) {
      const bin = binMap[type] || type;
      console.log(`\nClearing ${type} cache...`);
      execSync(`drush cache:clear ${bin}`, { encoding: "utf8" });
    }

    console.log("\n✓ Cache clearing complete");
  }

  // Show cache stats after clearing
  console.log("\n--- Cache Status ---");
  const statsCommand = `drush php-eval '
    $bins = ["render", "bootstrap", "config"];
    foreach ($bins as $bin) {
      $backend = \\Drupal::cache($bin);
      if (method_exists($backend, "getBackend")) {
        $info = $backend->getBackend()->getInfo();
        echo ucfirst($bin) . ": " . ($info["count"] ?? 0) . " items\\n";
      }
    }
  '`;
  try {
    const stats = execSync(statsCommand, { encoding: "utf8" });
    console.log(stats.trim());
  } catch (err) {
    console.log("Cache status not available");
  }
} catch (error) {
  console.error("\nError: Failed to clear cache");
  console.error(error.message);
  process.exit(1);
}
