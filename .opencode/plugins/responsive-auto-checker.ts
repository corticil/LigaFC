import type { Plugin } from "@opencode-ai/plugin"

// Track last edit time per file per session for debouncing
const lastEdit = new Map<string, number>()
const DEBOUNCE_MS = 5000

const UI_FILE_PATTERN = /src[\\/](components|pages)[\\/].+\.(jsx|tsx)$/i

export default (async (ctx) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return

      const filePath = input.args?.filePath as string | undefined
      if (!filePath || !UI_FILE_PATTERN.test(filePath)) return

      const key = `${input.sessionID}:${filePath}`
      const now = Date.now()
      const last = lastEdit.get(key) || 0

      lastEdit.set(key, now)

      if (now - last < DEBOUNCE_MS) return

      setTimeout(async () => {
        const current = lastEdit.get(key)
        if (current !== now) return

        const fileName = filePath.split(/[\\/]/).pop() || filePath

        try {
          await ctx.client.tui.showToast({
            body: {
              message: `Running responsive audit on ${fileName}...`,
              variant: "info",
              title: "Responsive Check",
              duration: 3000,
            },
          })

          await ctx.client.session.prompt({
            path: { id: input.sessionID },
            body: {
              agent: "responsive-checker",
              parts: [{
                type: "text",
                text: `Analyze ${filePath} for responsive design issues. Read the file and check for: hardcoded widths, missing responsive variants, touch targets, overflow risk, text sizing, spacing on mobile, z-index issues, image handling. Output the structured report.`,
              }],
            },
          })
        } catch {
          // Session ended or agent unavailable — silently ignore
        }
      }, DEBOUNCE_MS - (now - last))
    },
  }
}) satisfies Plugin
