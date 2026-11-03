import { useState } from 'react'

export function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key)
      return stored === null ? initialValue : JSON.parse(stored)
    } catch {
      return initialValue
    }
  })

  function updateValue(nextValue) {
    setValue(nextValue)
    try {
      if (nextValue === null) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, JSON.stringify(nextValue))
    } catch {
      throw new Error('Unable to save this step in the current browser session.')
    }
  }

  return [value, updateValue]
}
