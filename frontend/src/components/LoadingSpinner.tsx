export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <p className="spinner-text">{message}</p>
    </div>
  )
}
