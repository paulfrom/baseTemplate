import type { ReactNode } from 'react'

/** 登录页外壳：与公司模板一致，只做居中容器。 */
export function LoginLayout({ children }: { children: ReactNode }) {
  return <div className="layout-login">{children}</div>
}

export default LoginLayout
