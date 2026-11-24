'use client'

import * as React from 'react'
import type { ViewTransitionClassPerType, ViewTransitionProps } from 'react'

type RuntimeReactViewTransitionModule = {
  ViewTransition?: React.ExoticComponent<ViewTransitionProps>
  addTransitionType?: (type: string) => void
}

const runtimeReact = React as unknown as RuntimeReactViewTransitionModule

export const DIRECTIONAL_VIEW_TRANSITION_ENTER: ViewTransitionClassPerType = {
  'nav-forward': 'slide-from-right',
  'nav-back': 'slide-from-left',
  default: 'none',
}

export const DIRECTIONAL_VIEW_TRANSITION_EXIT: ViewTransitionClassPerType = {
  'nav-forward': 'slide-to-left',
  'nav-back': 'slide-to-right',
  default: 'none',
}

export function SafeViewTransition({
  children,
  default: defaultClass = 'none',
  ...rest
}: Readonly<ViewTransitionProps>) {
  const RuntimeViewTransition = runtimeReact.ViewTransition

  if (!RuntimeViewTransition) {
    return <>{children}</>
  }

  return (
    <RuntimeViewTransition default={defaultClass} {...rest}>
      {children}
    </RuntimeViewTransition>
  )
}

export function startTypedTransition(
  type: string | string[],
  updater: () => void
): void {
  const addType = runtimeReact.addTransitionType

  React.startTransition(() => {
    if (typeof addType === 'function') {
      const types = Array.isArray(type) ? type : [type]
      for (const item of types) {
        addType(item)
      }
    }
    updater()
  })
}
