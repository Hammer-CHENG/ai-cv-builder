/** Static best-practice tooltip — MVP only shows LLM-derived hints, not user history. */
export default function MemoryHint({ reason }: { reason: string }) {
  // Extract JD keyword reference if present
  const keywordMatch = reason.match(/"([^"]+)"/)
  const keyword = keywordMatch ? keywordMatch[1] : null

  if (!keyword) return null

  return (
    <div style={{
      marginTop: '4px',
      fontSize: '10px',
      color: 'var(--sage)',
      fontStyle: 'italic',
    }}>
      AI added "{keyword}" — this keyword appears in the target JD
    </div>
  )
}
