my dad went to buy milk and is now in china

The Grocer cannot go to China, he will stay with you forever

## Commands

| Command | Description |
|---|---|
| `/addguy` | Add a user to the house aka bank system |
| `/removeguy` | Remove a user from the house |
| `/addcost` | Manually log a cost |
| `/receipt` | Scan a receipt image and add the cost |
| `/subcost` | Record a payment (reduce what you owe) |
| `/status` | See outstanding debts |
| `/log` | View last 50 transactions |
| `/help` | Show command reference |

### `/addguy`
```
guy        @user    required   the person to add
```

### `/removeguy`
```
guy        @user    required   the person to remove (also clears their ledger entries)
```

### `/addcost`
```
amount     number   required   dollar amount
guy        @user    optional   who paid (defaults to you)
otherguy   @user    optional   who owes (defaults to splitting among everyone)
description string  optional   note logged with the transaction
```
Split logic: `amount ÷ total participants (INCLUDING CURRENT PERSON)`.

### `/subcost`
```
guy        @user    required   the person you're paying back
amount     number   optional   how much (defaults to your full balance with them)
description string  optional   note logged with the transaction
```

### `/receipt`
Take an image of your receipt and confirm the price
```
guy        @user    optional   who paid (defaults to user)
onlyguy    @user    optional   who owes (defaults to splitting among everyone)
description string  optional   overrides the auto-generated description if set
```

### `/status`
```
all        boolean  optional   show everyone's debts (defaults to just yours)
```

---

## Setup

### Environment Variables
```env
TOKEN=               # Discord bot token
APPID=               # Discord application ID
SUPABASE_URL=        # Supabase project URL
SUPABASE_SERVICE_KEY=# Supabase service role key
VERYFI_CLIENT_ID=    # Veryfi API client ID
VERYFI_AUTH=         # Veryfi API authorization token
PORT=                # Express server port (default: 3000)
```

### SupaDatabase Tables

**participants**
| column | type |
|---|---|
| guild_id | text |
| user_id | text |

**ledger**
| column | type |
|---|---|
| guild_id | text |
| creditor_id | text |
| debtor_id | text |
| amount | numeric |

**logs**
| column | type |
|---|---|
| guild_id | text |
| message | text |
| created_at | timestamp (auto) |

### Register Commands
```bash
node commands.js
```
Re-run any time command definitions change. To remove guild commands:
```bash
node deletecommands.js
```

### Run
```bash
node bot.js
```
