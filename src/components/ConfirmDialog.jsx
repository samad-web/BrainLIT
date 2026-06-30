// Reusable in-app confirmation popup (replaces native window.confirm/alert).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const confirmCls = danger
    ? 'bg-circuit-pink text-white'
    : 'bg-brand text-white shadow-glow'

  return (
    <div
      className="fixed inset-0 z-50 bg-indigo-ink/40 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-card shadow-soft max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-bold text-xl text-indigo-ink">{title}</h2>
        {message && <p className="mt-2 font-body text-neutral-600">{message}</p>}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-white text-purple-700 border-2 border-purple-200 rounded-pill font-display font-bold py-2.5 hover:bg-purple-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${confirmCls} rounded-pill font-display font-bold py-2.5 hover:-translate-y-0.5 transition`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
