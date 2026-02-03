#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Get entity information
 * Usage: node drush_entity_info.cjs <entity_type> [entity_id]
 * Examples:
 *   node drush_entity_info.cjs node          # List recent nodes
 *   node drush_entity_info.cjs node 1        # View node 1
 *   node drush_entity_info.cjs user         # List users
 *   node drush_entity_info.cjs user 1       # View user 1
 *   node drush_entity_info.cjs taxonomy_term # List terms
 */

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node drush_entity_info.cjs <entity_type> [entity_id]');
  console.error('Entity types: node, user, taxonomy_term, comment, file');
  process.exit(1);
}

const entityType = args[0];
const entityId = args[1];
const useJson = process.argv.includes('--json');

try {
  let command;

  if (entityId) {
    // View specific entity
    command = `drush php:eval '
      $entity = \\Drupal::entityTypeManager()->getStorage("${entityType}")->load(${entityId});
      if ($entity) {
        echo "ID: " . $entity->id() . "\\n";
        echo "Type: " . $entity->getEntityTypeId() . "\\n";
        echo "Bundle: " . $entity->bundle() . "\\n";
        echo "Label: " . $entity->label() . "\\n";
      } else {
        echo "Entity not found.\\n";
      }
    '`;
  } else {
    // List entities
    command = `drush php:eval '
      $ids = \\Drupal::entityQuery("${entityType}")->accessCheck(false)->range(0, 10)->execute();
      $entities = \\Drupal::entityTypeManager()->getStorage("${entityType}")->loadMultiple($ids);
      foreach ($entities as $entity) {
        echo $entity->id() . ": " . $entity->label() . "\\n";
      }
    '`;
  }

  const output = execSync(command, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  console.log(output.trim());

  // Show count if listing
  if (!entityId) {
    const countCommand = `drush php:eval 'echo \\Drupal::entityQuery("${entityType}")->accessCheck(false)->count()->execute();'`;
    try {
      const count = execSync(countCommand, { encoding: 'utf8' });
      console.log(`\nTotal ${entityType}s: ${count.trim()}`);
    } catch (err) {
      // Ignore count errors
    }
  }
} catch (error) {
  console.error(`Error: Failed to get entity information for ${entityType}`);
  console.error(error.message);
  process.exit(1);
}
