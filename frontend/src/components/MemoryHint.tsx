/** Static best-practice hint — MVP only shows LLM-derived hints, not user history. */
export default function MemoryHint({ reason }: { reason: string }) {
  const keywordMatch = reason.match(/"([^"]+)"/)
  const keyword = keywordMatch ? keywordMatch[1] : null

  if (!keyword) return null

  return (
    <div className="memory-hint">
      ✦ AI added "{keyword}" — this keyword appears in the target JD
    </div>
  )
}
