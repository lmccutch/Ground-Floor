import { useContext } from 'react'
import { MvpContext } from './MvpContextValue'

export function useMvp() {
  const context = useContext(MvpContext)
  if (!context) throw new Error('useMvp must be used within MvpProvider')
  return context
}
