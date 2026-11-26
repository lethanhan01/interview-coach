import {
  createTheme,
  DEFAULT_THEME,
  type DefaultMantineColor,
  type MantineColorsTuple,
} from '@mantine/core'
import interactions from './styles/interactions.module.css'

export type SemanticColor =
  'brand' | 'success' | 'warning' | 'danger' | 'neutral'

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<SemanticColor | DefaultMantineColor, MantineColorsTuple>
  }
}

export const theme = createTheme({
  primaryColor: 'brand',
  focusClassName: interactions.focusRing,
  colors: {
    brand: DEFAULT_THEME.colors.cyan,
    success: DEFAULT_THEME.colors.green,
    warning: DEFAULT_THEME.colors.yellow,
    danger: DEFAULT_THEME.colors.red,
    neutral: DEFAULT_THEME.colors.gray,
  },
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  fontFamilyMonospace:
    'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  defaultRadius: 'md',
  components: {
    Blockquote: {
      defaultProps: {
        icon: null,
      },
    },
  },
})
