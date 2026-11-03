import { useCallback, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { ToastContext } from '../context/toastContext'

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const notify = useCallback((message, type = 'success') => setToast({ message, type }), [])
  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])
  return <ToastContext.Provider value={notify}>
    {children}
    {toast && <div role="status" className={`toast toast-${toast.type}`}><span className="toast-icon">{toast.type === 'error' ? <X size={16} /> : <Check size={16} />}</span>{toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button></div>}
  </ToastContext.Provider>
}
