#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * List and search configuration
 * Usage: node drush_config_list.cjs [pattern]
 * Examples:
 *   node drush_config_list.cjs                    # List all config
 *   node drush_config_list.cjs system.site        # View specific config
 *   node drush_config_list.cjs --search node      # Search config names
 *   node drush_config_list.cjs --export system.site  # Export to JSON
 */

const args = process.argv.slice(2);
const useExport = args.includes('--export');
const useSearch = args.includes('--search');

try {
  if (useSearch) {
    // Search config
    const pattern = args.find((arg) => !arg.startsWith('--')) || '';
    const command = `drush php:eval '
      $configs = \\Drupal::configFactory()->listAll("${pattern}");
      foreach ($configs as $config) {
        echo $config . "\\n";
      }
    '`;
    try {
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output.trim());
    } catch (err) {
      console.log('No matching configuration found');
    }
  } else if (useExport && args.length > 1) {
    // Export specific config to JSON
    const configName = args.find((arg) => !arg.startsWith('--'));
    const command = `drush config:get ${configName} --format=json`;
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output.trim());
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    // View specific config
    const configName = args[0];
    const command = `drush config:get ${configName}`;
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output.trim());
  } else {
    // List all config with categories
    const listCommand = `drush php:eval '
      $configs = \\Drupal::configFactory()->listAll();
      foreach ($configs as $config) {
        echo $config . "\\n";
      }
    '`;
    const output = execSync(listCommand, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    const configNames = output.trim().split('\n');

    // Group by module/extension
    const groups = {};
    configNames.forEach((name) => {
      const parts = name.split('.');
      const group = parts[0] || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(name);
    });

    console.log('\n--- Configuration Groups ---');
    Object.keys(groups)
      .sort()
      .forEach((group) => {
        console.log(`\n${group}:`);
        groups[group].slice(0, 10).forEach((name) => {
          console.log(`  - ${name}`);
        });
        if (groups[group].length > 10) {
          console.log(`  ... and ${groups[group].length - 10} more`);
        }
      });

    console.log(`\n\nTotal configuration items: ${configNames.length}`);
  }
} catch (error) {
  console.error('Error: Failed to get configuration');
  console.error(error.message);
  process.exit(1);
}
