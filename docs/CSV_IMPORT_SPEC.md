# CSV Import Spec

This importer supports three entity types:
- `contacts`
- `tasks`
- `campaigns`

## Format Rules

- Delimiter: comma `,`
- Quote: `"` (escape internal quotes as `""`)
- Encoding: UTF-8
- Header row required
- Date format: `YYYY-MM-DD`
- Multi-value helper fields use pipe delimiter `|`
  - Example: `onboarding|high-priority|risk`

## Contacts Import

Headers:
- `app_id,segment,name,email,phone,stage,source,owner,monthly_value,usage_score,next_follow_up,labels,notes`

Required:
- `app_id,name,email`

Behavior:
- Upsert by `(app_id, email)`
- If segment doesn’t exist in app, importer adds segment to app definition
- `labels` is pipe-delimited

## Tasks Import

Headers:
- `app_id,segment,customer_email,title,status,priority,owner,due_date,labels,notes`

Required:
- `app_id,title,status,priority`

Behavior:
- Creates tasks
- `customer_email` optional; links task to customer when match exists for same app
- `labels` is pipe-delimited

## Campaigns Import

Headers:
- `app_id,segment,date,name,channel,sent,conversions,revenue,notes`

Required:
- `app_id,segment,date,name,channel`

Behavior:
- Creates campaign rows
- Warns when `conversions > sent`

## Agent Prompt (Copy/Paste)

```text
Create CSV for Golden CRM importer.
Use comma delimiter and UTF-8 encoding.
Use YYYY-MM-DD date format.
Use pipe `|` for multi-value helper columns (labels).
Do not add extra columns.
Return headers exactly as required for the import type.
```
