"use client"

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [localStorageAvailable, setLocalStorageAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        setLocalStorageAvailable(true)
        localStorage.getItem('test')
      } else {
        setError('localStorage not available')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      <p>localStorage available: {localStorageAvailable ? 'Yes' : 'No'}</p>
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  )
}