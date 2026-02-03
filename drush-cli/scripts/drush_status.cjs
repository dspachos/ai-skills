#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Quick system status check
 * Usage: node drush_status.cjs [options]
 * Options:
 *   --json    Output as JSON
 *   --verbose Show all status information
 */

const args = process.argv.slice(2);
const useJson = args.includes('--json');
const useVerbose = args.includes('--verbose');

try {
  let command = 'drush status';

  if (useJson) {
    command += ' --format=json';
  } else if (useVerbose) {
    command += ' --full';
  }

  const output = execSync(command, { encoding: 'utf8' });
  console.log(output.trim());

  if (!useJson && !useVerbose) {
    // Add helpful additional info
    try {
      const phpVersion = execSync('php -v | head -n 1', { encoding: 'utf8' });
      console.log('\nPHP Version: ' + phpVersion.trim().split(' ')[1]);

      const drushVersion = execSync('drush --version', { encoding: 'utf8' });
      const versionLine = drushVersion.trim().split('\n')[0];
      const versionMatch = versionLine.match(/(\d+\.\d+\.\d+\.\d+)/);
      console.log('Drush: ' + (versionMatch ? versionMatch[1] : 'unknown'));
    } catch (err) {
      // Ignore errors for additional info
    }
  }
} catch (error) {
  console.error('Error: Failed to get system status');
  console.error(error.message);
  process.exit(1);
}
