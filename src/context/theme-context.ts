import { createContext } from 'react'
import type { ThemeMode } from '../types'

export interface ThemeContextValue {
  /** The user's stored preference: 'light', 'dark', or 'system'. */
  mode: ThemeMode
  /** The actually-applied theme, resolved from `mode` (and OS preference if 'system'). */
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
