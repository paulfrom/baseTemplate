import type { ReactNode } from 'react'

/** 无外壳布局：页面自己画满屏（门户入口页用）。 */
export function BlankLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default BlankLayout
