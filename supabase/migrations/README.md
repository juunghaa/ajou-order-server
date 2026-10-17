# Public access restriction, phase 1

`20261016_restrict_public_access.sql` closes client writes to `orders`,
`cafes`, and `menus`. It preserves public cafe/menu browsing and each signed-in
user's own order history. It intentionally pauses new orders and staff updates
until authenticated server routes are ready.

Apply only after the web maintenance routes have been deployed. Run the SQL in
the Supabase SQL Editor as one transaction. The dashboard's SQL Editor runs with
elevated privileges, so testing there alone does not prove the `anon` and
`authenticated` behavior.

After application, verify through the Data API using an anon key and an
authenticated user session:

| Role | Expected result |
| --- | --- |
| `anon` | Can read cafes/menus; cannot read, insert, or update orders; cannot insert/update cafes or menus. |
| `authenticated` | Can read only their own orders; cannot insert/update orders; can read cafes/menus. |

The following read-only query checks table grants (RLS behavior still needs the
role-based Data API checks above):

```sql
select t,
  has_table_privilege('anon', 'public.' || t, 'SELECT') as anon_select,
  has_table_privilege('anon', 'public.' || t, 'INSERT') as anon_insert,
  has_table_privilege('anon', 'public.' || t, 'UPDATE') as anon_update
from (values ('orders'), ('cafes'), ('menus')) as x(t);
```

The old public server order endpoints and cafe write endpoints are paused in
the same phase. Later phases must replace them with verified user/admin routes
and server-side order/payment validation before restoring writes.

## Authenticated order intent preparation

`20261017_order_intents.sql` creates a private table for server-calculated,
unpaid order drafts. It does not enable checkout or alter historical orders.
Apply it before setting `ENABLE_ORDER_INTENTS=true` and
`SUPABASE_SERVICE_ROLE_KEY` on the server. Keep the service-role key on the
server only. The browser must never receive it. The new route is disabled by
default and payment confirmation still requires a separate implementation.

After applying the migration, check that `order_intents` has RLS enabled and
`anon` and `authenticated` have no table privileges. Do not enable the route
until the server has the correct key and the API tests pass in a non-production
environment.
