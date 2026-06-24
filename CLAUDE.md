# Task Dashboard

Personal task manager. React + Supabase.

## Database
URL: `https://zncwlitwciyfukmibgwv.supabase.co`  
Key: `sb_publishable_gMAB1SeejfB6-_Zc1uwhOw_S68JHdhM`  
Headers: `apikey: <key>`, `Authorization: Bearer <key>`, `Content-Type: application/json`

## Schema

**tasks**
| field | type | values |
|---|---|---|
| id | bigint | auto |
| title | text | — |
| project | text | `personal` `work` `music` `video` |
| priority | text | `high` `ongoing` `waiting` `norush` |
| due | text | `"Jun 24"` format |
| est | text | `"3h"` — ignored if subtasks exist |
| snooze | int | 0+ |
| notes | text | one-liner |

**subtasks**
| field | type | values |
|---|---|---|
| id | text | unique string e.g. `sub_123` |
| task_id | bigint | fk → tasks.id |
| name | text | — |
| pri | text | same as priority |
| dur | text | `"2h"` |
| due | text | `"Jun 26"` or `""` |
| done | boolean | — |
| notes | text | — |
| position | int | sort order |

## Common operations

**Add task**
```
POST /rest/v1/tasks
{"title":"...","project":"work","priority":"high","due":"Jul 15","est":"","snooze":0,"notes":""}
```
Returns `{id}` — use for subtask inserts.

**Add subtasks** (after getting task id)
```
POST /rest/v1/subtasks
[{"id":"sub_1","task_id":42,"name":"...","pri":"ongoing","dur":"2h","due":"","done":false,"notes":"","position":0}]
```

**Update task**
```
PATCH /rest/v1/tasks?id=eq.{id}
{"priority":"waiting","due":"Jul 20"}
```

**Mark subtask done**
```
PATCH /rest/v1/subtasks?id=eq.{sub_id}
{"done":true}
```

**Delete task** (subtasks cascade)
```
DELETE /rest/v1/tasks?id=eq.{id}
```

**Read all tasks with subtasks**
```
GET /rest/v1/tasks?select=*,subtasks(*)&order=id
```
