import { useCallback, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { navigate } from '../utils/navigation'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  children: ReactNode
}

/** 与 umi 的 `<Link to>` 等价：点击走 hash 路由，保留新窗口/中键等原生行为。 */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
      event.preventDefault()
      navigate(to)
    },
    [onClick, to],
  )

  return (
    <a {...rest} href={`#${to}`} onClick={handleClick}>
      {children}
    </a>
  )
}

export default Link
