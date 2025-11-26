# Adding element_selector Column to Database

## Problem
The `element_selector` column may not exist in the `issue_screenshots` table, preventing HTML element data from being stored.

## Solution

### Option 1: Run SQL Script Directly

Run this SQL script against your database:

```bash
# Using psql
psql -U postgres -d issue_collector -f scripts/add-element-selector-column.sql

# Or using your database connection string
psql "postgresql://user:password@localhost:5432/issue_collector" -f scripts/add-element-selector-column.sql
```

The script will:
- Check if the column exists
- Add it if missing
- Verify it was added

### Option 2: Use Prisma Migrate

```bash
cd infra/database
pnpm db:migrate --name add_element_selector_column
```

### Option 3: Use Prisma DB Push (Development Only)

```bash
cd infra/database
pnpm db:push
```

**Warning**: `db:push` is for development only and doesn't create migration files.

## Verify Column Exists

After running the migration, verify the column exists:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'issue_screenshots'
AND column_name = 'element_selector';
```

Expected result:
```
column_name      | data_type | is_nullable
-----------------+-----------+------------
element_selector | jsonb     | YES
```

## What Gets Stored

Once the column exists, the following data will be stored:

```json
{
  "cssSelector": "div.class-name#id",
  "xpath": "/html/body/div[1]/div[2]",
  "boundingBox": {
    "x": 100,
    "y": 200,
    "width": 500,
    "height": 300
  },
  "outerHTML": "<div class=\"class-name\" id=\"id\">...</div>"
}
```

## Testing

After adding the column:

1. Submit a new issue using inspect mode
2. Check browser console for `[SDK]` logs
3. Check API logs for `[API Service]` logs
4. Query database: `SELECT element_selector FROM issue_screenshots WHERE issue_id = [new_issue_id]`


