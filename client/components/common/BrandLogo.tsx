import { Group, Image } from '@mantine/core'
import common from './common.module.css'

export type BrandLogoVariant = 'lockup' | 'mark' | 'wordmark'
export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  decorative?: boolean
}

const GAP_BY_SIZE: Record<BrandLogoSize, number> = {
  xs: 6,
  sm: 7,
  md: 8,
  lg: 10,
}

export function BrandLogo({
  variant = 'lockup',
  size = 'md',
  decorative = false,
}: Readonly<BrandLogoProps>) {
  const showMark = variant === 'lockup' || variant === 'mark'
  const showWordmark = variant === 'lockup' || variant === 'wordmark'

  return (
    <Group
      component="span"
      gap={GAP_BY_SIZE[size]}
      wrap="nowrap"
      align="center"
      className={common.brandLogo}
    >
      {showMark ? (
        <Image
          src="/brand/intervia-mark.png"
          alt={decorative || showWordmark ? '' : 'Intervia'}
          aria-hidden={decorative || showWordmark ? 'true' : undefined}
          width={512}
          height={411}
          w="auto"
          fit="contain"
          className={common.brandMark}
          mod={{ size }}
        />
      ) : null}

      {showWordmark ? (
        <Image
          src="/brand/intervia-wordmark.png"
          alt={decorative ? '' : 'Intervia'}
          aria-hidden={decorative ? 'true' : undefined}
          width={845}
          height={160}
          w="auto"
          fit="contain"
          className={common.brandWordmark}
          mod={{ size }}
        />
      ) : null}
    </Group>
  )
}
