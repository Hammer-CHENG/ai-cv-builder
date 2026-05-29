import { useParams } from 'react-router-dom'

export default function ReviewPreview() {
  const { sessionId } = useParams()
  return (
    <div className="page review-preview">
      <h2>Review Preview</h2>
      <p>Session: {sessionId}</p>
    </div>
  )
}
