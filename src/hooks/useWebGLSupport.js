import { useState, useEffect } from 'react'

/**
 * Returns true if the browser supports WebGL rendering.
 * Used to decide whether to mount the R3F canvas or show the static fallback.
 */
export function useWebGLSupport() {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setSupported(!!gl)
    } catch {
      setSupported(false)
    }
  }, [])

  return supported
}
