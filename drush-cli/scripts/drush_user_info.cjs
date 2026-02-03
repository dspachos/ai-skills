#!/usr/bin/env node

const { execSync } = require("child_process");

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
const useRoles = args.includes("--roles");
const useJson = args.includes("--json");

try {
  if (useRoles) {
    // List users grouped by role
    const rolesCommand = `drush php-eval '
      $roles = \\Drupal::entityQuery("user")->execute();
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
    const output = execSync(rolesCommand, { encoding: "utf8" });
    console.log(output.trim());
  } else if (args.length > 0 && !args[0].startsWith("--")) {
    // View specific user
    const userArg = args[0];
    const command = `drush user-information ${userArg}`;
    const output = execSync(command, { encoding: "utf8" });
    console.log(output.trim());
  } else {
    // List all users
    let command = "drush user-information";
    const output = execSync(command, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });

    if (useJson) {
      console.log(output.trim());
    } else {
      // Parse and format output
      const lines = output.trim().split("\n");
      console.log("\n--- Users Summary ---");
      console.log(`Total users: ${lines.length - 1}`); // Subtract header line

      // Show first 20 users
      const displayLines = lines.slice(1, 21);
      displayLines.forEach((line) => {
        const parts = line.split(/\s{2,}/);
        if (parts.length >= 2) {
          console.log(`  ${parts[0]} - ${parts[1]}`);
        }
      });

      if (lines.length > 21) {
        console.log(`\n  ... and ${lines.length - 21} more users`);
      }
    }

    // Show active/suspended stats
    const statsCommand = `drush php-eval '
      $active = \\Drupal::entityQuery("user")->condition("status", 1)->count()->execute();
      $blocked = \\Drupal::entityQuery("user")->condition("status", 0)->count()->execute();
      echo "Active: $active, Blocked: $blocked\\n";
    '`;
    const stats = execSync(statsCommand, { encoding: "utf8" });
    console.log("\n" + stats.trim());
  }
} catch (error) {
  console.error("Error: Failed to get user information");
  console.error(error.message);
  process.exit(1);
}
