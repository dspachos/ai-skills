#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Get user information
 * Usage: node drush_user_info.cjs [username_or_id]
 * Examples:
 *   node drush_user_info.cjs           # List all users
 *   node drush_user_info.cjs admin     # View admin user
 *   node drush_user_info.cjs 1         # View user ID 1
 *   node drush_user_info.cjs --roles   # List users by role
 */

const args = process.argv.slice(2);
const useRoles = args.includes('--roles');
const useJson = args.includes('--json');

try {
  if (useRoles) {
    // List users grouped by role
    const rolesCommand = `drush php:eval '
      $roles = \\Drupal::entityQuery("user")->accessCheck(false)->execute();
      $users = \\Drupal\\user\\Entity\\User::loadMultiple($roles);
      $by_role = [];
      foreach ($users as $user) {
        foreach ($user->getRoles() as $role) {
          $by_role[$role][] = $user->getAccountName() . " (ID: " . $user->id() . ")";
        }
      }
      foreach ($by_role as $role => $userlist) {
        echo $role . ":\\n";
        foreach ($userlist as $user) {
          echo "  - " . $user . "\\n";
        }
        echo "\\n";
      }
    '`;
    const output = execSync(rolesCommand, { encoding: 'utf8' });
    console.log(output.trim());
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    // View specific user
    const userArg = args[0];
    const command = `drush user-information ${userArg}`;
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output.trim());
  } else {
    // List all users
    const command = `drush php:eval '
      $uids = \\Drupal::entityQuery("user")->accessCheck(false)->execute();
      $users = \\Drupal\\user\\Entity\\User::loadMultiple($uids);
      foreach ($users as $user) {
        $name = $user->getAccountName() ?: "(no name)";
        $mail = $user->getEmail() ?: "(no email)";
        echo $user->id() . "|" . $name . "|" . $mail . "\\n";
      }
    '`;
    const output = execSync(command, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    if (useJson) {
      const lines = output.trim().split('\n');
      const users = lines.map((line) => {
        const [id, name, mail] = line.split('|');
        return { id, name, mail };
      });
      console.log(JSON.stringify(users, null, 2));
    } else {
      const lines = output.trim().split('\n');
      console.log('\n--- Users Summary ---');
      console.log(`Total users: ${lines.length}`);

      // Show first 20 users
      const displayLines = lines.slice(0, 20);
      displayLines.forEach((line) => {
        const parts = line.split('|');
        if (parts.length >= 3) {
          console.log(`  ${parts[0]} - ${parts[1]} (${parts[2]})`);
        }
      });

      if (lines.length > 20) {
        console.log(`\n  ... and ${lines.length - 20} more users`);
      }
    }

    // Show active/suspended stats
    const statsCommand = `drush php:eval '
      $active = \\Drupal::entityQuery("user")->condition("status", 1)->accessCheck(false)->count()->execute();
      $blocked = \\Drupal::entityQuery("user")->condition("status", 0)->accessCheck(false)->count()->execute();
      echo "Active: $active, Blocked: $blocked\\n";
    '`;
    const stats = execSync(statsCommand, { encoding: 'utf8' });
    console.log('\n' + stats.trim());
  }
} catch (error) {
  console.error('Error: Failed to get user information');
  console.error(error.message);
  process.exit(1);
}
