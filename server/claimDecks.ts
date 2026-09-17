// Authoritative reassignment of a promoted guest's rindle rows to their real account (Phase 5 /
// strut-auth-guest-first). Runs server-side ONLY — fired from server/claim.ts's onLinkAccount hook,
// never reachable from the public /api/rindle route — so a client can never call it to steal another
// user's decks. Isolated in its own module so the SQL client loads only on the (rare) promotion path.
//
// The reassignment is a single atomic SQL batch through the fleet's SQL leg (the same one the API
// server's mutations write through), so live subscribers reconcile: the guest's decksQuery loses the
// decks, the account's gains them. Only the user-keyed columns move — deck.owner_id (the decks
// themselves) and deck_share.user_id (collaborations the guest was granted). The guest's user_profile
// PK is left alone (the real account keeps its own).
// Both UPDATEs are keyed on the guest id, so a retried claim matches no rows — no dedup key needed.

import { createSqlClient } from '@rindle/sql-client'
import { daemonToken, daemonUrl } from './rindleEnv.ts'

export async function claimDecks(from: string, to: string): Promise<void> {
  const sql = createSqlClient({
    url: daemonUrl(),
    authToken: daemonToken(),
  })
  try {
    const out = await sql.batch([
      {
        sql: 'UPDATE deck SET owner_id = ? WHERE owner_id = ?',
        args: [to, from],
      },
      {
        sql: 'UPDATE deck_share SET user_id = ? WHERE user_id = ?',
        args: [to, from],
      },
    ])
    console.log(
      `[claim] reassigned guest ${from} → account ${to} (decks=${out.results[0].rowsAffected}, shares=${out.results[1].rowsAffected}, cursor=${out.commitCursor})`,
    )
  } finally {
    sql.close()
  }
}
