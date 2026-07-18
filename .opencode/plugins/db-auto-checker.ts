import type { Plugin } from "@opencode-ai/plugin"

/**
 * DB Guardian Auto-Checker Plugin
 * 
 * Auto-triggers the db-guardian agent whenever SQL migration files
 * or database schema files are edited.
 */

const DB_FILE_PATTERNS = [
  /supabase\/migrations\/.*\.sql$/i,
  /supabase\/.*\.sql$/i,
  /schema\.(ts|js|sql)$/i,
  /.*\.schema\.(ts|js)$/i,
  /drizzle\/.*\.sql$/i,
]

const DEBOUNCE_MS = 5000

let lastTrigger = 0

export default (async ({ client }) => {
  return {
    "tool.execute.after": async (input, output) => {
      // Only trigger on file edits
      if (input.tool !== "edit" && input.tool !== "write") return

      const filePath = input.args?.filePath || ""

      // Check if the edited file matches DB patterns
      const isDbFile = DB_FILE_PATTERNS.some(pattern => pattern.test(filePath))
      if (!isDbFile) return

      // Debounce: don't trigger more than once every 5 seconds
      const now = Date.now()
      if (now - lastTrigger < DEBOUNCE_MS) return
      lastTrigger = now

      // Show toast notification
      try {
        await client.client.tui.showToast(
          "DB Guardian: validating migration changes...",
          "info"
        )
      } catch {}

      // Brief delay to let the file write settle
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Trigger the db-guardian agent
      try {
        await client.session.prompt(
          `A database file was just edited: ${filePath}. Please run a DB audit on the recent changes in supabase/migrations/. Check schema design, indexes, RLS, FKs, naming conventions, and migration safety.`,
          { agent: "db-guardian" }
        )
      } catch (err) {
        try {
          await client.client.tui.showToast(
            `DB Guardian audit failed: ${err instanceof Error ? err.message : "unknown error"}`,
            "error"
          )
        } catch {}
      }
    },
  }
}) satisfies Plugin
