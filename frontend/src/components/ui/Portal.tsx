import {  useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type {ReactNode} from 'react'

interface PortalProps {
  children: ReactNode
}

const Portal = ({ children }: PortalProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}

export default Portal