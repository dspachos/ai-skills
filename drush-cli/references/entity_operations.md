# Entity Inspection Patterns

This reference covers patterns for inspecting and querying Drupal entities using
Drush.

## Basic Entity Query Patterns

### Query Nodes by Type

```bash
# Get all nodes of type 'article'
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->execute();
  print_r($nids);
'

# Get published nodes only
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("status", 1)
    ->execute();
  print_r($nids);
'

# Get nodes with limit and offset
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->range(0, 20)
    ->execute();
  print_r($nids);
'
```

### Query Users

```bash
# Get all users with admin role
drush php-eval '
  $uids = \Drupal::entityQuery("user")
    ->condition("roles", "administrator")
    ->execute();
  print_r($uids);
'

# Get users created after a date
drush php-eval '
  $uids = \Drupal::entityQuery("user")
    ->condition("created", strtotime("-30 days"), ">=")
    ->execute();
  print_r($uids);
'
```

### Query Taxonomy Terms

```bash
# Get terms from specific vocabulary
drush php-eval '
  $tids = \Drupal::entityQuery("taxonomy_term")
    ->condition("vid", "tags")
    ->execute();
  print_r($tids);
'

# Get terms with parent
drush php-eval '
  $tids = \Drupal::entityQuery("taxonomy_term")
    ->condition("vid", "tags")
    ->condition("parent", 0)
    ->execute();
  print_r($tids);
'
```

## Advanced Entity Queries

### Complex Conditions

```bash
# Nodes with multiple conditions
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("status", 1)
    ->condition("created", strtotime("-7 days"), ">=")
    ->sort("created", "DESC")
    ->range(0, 10)
    ->execute();
  print_r($nids);
'

# OR conditions using 'orGroup'
drush php-eval '
  $query = \Drupal::entityQuery("node");
  $group = $query->orConditionGroup()
    ->condition("title", "test%", "LIKE")
    ->condition("body", "example");
  $query->condition($group);
  $nids = $query->execute();
  print_r($nids);
'
```

### Entity Field Conditions

```bash
# Query by field value
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("field_category.target_id", 5)
    ->execute();
  print_r($nids);
'

# Query by reference field
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("field_author.entity.uid", 1)
    ->execute();
  print_r($nids);
'

# Query by multi-value field
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("field_tags.target_id", [1, 2, 3], "IN")
    ->execute();
  print_r($nids);
'
```

## Viewing Entity Data

### View Single Entity

```bash
# View node by ID
drush php-eval '
  $node = \Drupal\node\Entity\Node::load(1);
  if ($node) {
    print "Title: " . $node->getTitle() . "\n";
    print "Type: " . $node->getType() . "\n";
    print "Status: " . ($node->isPublished() ? "published" : "unpublished") . "\n";
  }
'

# View user by ID
drush php-eval '
  $user = \Drupal\user\Entity\User::load(1);
  if ($user) {
    print "Username: " . $user->getAccountName() . "\n";
    print "Email: " . $user->getEmail() . "\n";
  }
'

# View taxonomy term by ID
drush php-eval '
  $term = \Drupal\taxonomy\Entity\Term::load(1);
  if ($term) {
    print "Name: " . $term->getName() . "\n";
    print "Vocabulary: " . $term->getVocabularyId() . "\n";
  }
'
```

### Export Entity Data

```bash
# Export node to JSON
drush php-eval '
  $node = \Drupal\node\Entity\Node::load(1);
  echo json_encode($node->toArray(), JSON_PRETTY_PRINT);
'

# Export with field data
drush php-eval '
  $node = \Drupal\node\Entity\Node::load(1);
  $data = [
    "id" => $node->id(),
    "type" => $node->getType(),
    "title" => $node->getTitle(),
    "status" => $node->isPublished(),
    "created" => date("c", $node->getCreatedTime()),
    "author" => $node->getOwner()->getDisplayName(),
  ];
  echo json_encode($data, JSON_PRETTY_PRINT);
'
```

### Batch Export Entities

```bash
# Export all published articles
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("status", 1)
    ->execute();

  $nodes = \Drupal\node\Entity\Node::loadMultiple($nids);
  foreach ($nodes as $node) {
    echo $node->id() . ": " . $node->getTitle() . "\n";
  }
'

# Export to file
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->execute();

  $nodes = \Drupal\node\Entity\Node::loadMultiple($nids);
  file_put_contents("articles.json", json_encode(
    array_map(function($n) { return $n->toArray(); }, $nodes),
    JSON_PRETTY_PRINT
  ));
  echo "Exported " . count($nids) . " articles\n";
'
```

## Entity Metadata

### Get Entity Type Information

```bash
# Get all entity types
drush php-eval '
  $types = \Drupal::entityTypeManager()->getDefinitions();
  foreach ($types as $type => $definition) {
    echo $type . ": " . $definition->getLabel() . "\n";
  }
'

# Get node type information
drush php-eval '
  $types = \Drupal::entityTypeManager()->getStorage("node")->getQuery()
    ->execute();
  $nodes = \Drupal\node\Entity\Node::loadMultiple($types);
  $bundles = [];
  foreach ($nodes as $node) {
    $bundles[$node->getType()] = ($bundles[$node->getType()] ?? 0) + 1;
  }
  print_r($bundles);
'
```

### Get Field Definitions

```bash
# Get all fields for content types
drush php-eval '
  $fields = \Drupal::service("entity_field.manager")->getFieldDefinitions("node", "article");
  foreach ($fields as $name => $definition) {
    echo $name . ": " . $definition->getLabel() . "\n";
  }
'

# Get field properties
drush php-eval '
  $field = \Drupal::service("entity_field.manager")
    ->getFieldDefinitions("node", "article")["body"];
  print_r($field->getPropertyDefinitions());
'
```

## Entity Statistics

```bash
# Count entities by type
drush php-eval '
  $types = ["node", "user", "taxonomy_term", "comment", "file"];
  foreach ($types as $type) {
    $count = \Drupal::entityQuery($type)->count()->execute();
    echo $type . ": " . $count . "\n";
  }
'

# Count nodes by bundle
drush php-eval '
  $bundles = ["article", "page"];
  foreach ($bundles as $bundle) {
    $count = \Drupal::entityQuery("node")
      ->condition("type", $bundle)
      ->count()
      ->execute();
    echo $bundle . ": " . $count . "\n";
  }
'

# Get storage statistics
drush php-eval '
  $database = \Drupal::database();
  $query = $database->select("file_managed", "f");
  $query->addExpression("SUM(f.filesize)", "total_size");
  $query->addExpression("COUNT(f.fid)", "total_files");
  $result = $query->execute()->fetchAssoc();
  echo "Total files: " . $result["total_files"] . "\n";
  echo "Total size: " . format_size($result["total_size"]) . "\n";
'
```

## Entity Operations

### Bulk Operations

```bash
# Publish multiple nodes
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("type", "article")
    ->condition("status", 0)
    ->execute();

  $nodes = \Drupal\node\Entity\Node::loadMultiple($nids);
  foreach ($nodes as $node) {
    $node->setPublished(TRUE);
    $node->save();
  }
  echo "Published " . count($nids) . " nodes\n";
'

# Delete stale content
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("created", strtotime("-1 year"), "<")
    ->condition("status", 0)
    ->execute();

  $nodes = \Drupal\node\Entity\Node::loadMultiple($nids);
  foreach ($nodes as $node) {
    $node->delete();
  }
  echo "Deleted " . count($nids) . " nodes\n";
'
```

### Entity References

```bash
# Find nodes referencing a specific term
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("field_tags.target_id", 5)
    ->execute();
  print_r($nids);
'

# Find nodes by author
drush php-eval '
  $nids = \Drupal::entityQuery("node")
    ->condition("uid", 1)
    ->execute();
  print_r($nids);
'
```
