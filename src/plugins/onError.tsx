import { notification } from '@ead/suid'

/**
 * 运行时错误插件。
 *
 * 对齐公司模板 `src/plugins/onError.tsx` 的位置与职责（统一请求错误提示），
 * 但原型没有 dva 的 effect 上下文和 401 重定向，只保留提示能力。
 */

export interface RequestErrorLike {
  message?: string
  statusCode?: number
}

export function notifyRequestError(error: RequestErrorLike | string) {
  const description = typeof error === 'string' ? error : (error.message ?? '请求异常')
  notification.error({ message: '接口请求异常', description })
}

export function notifySessionExpired() {
  notification.error({
    message: '会话异常',
    description: '当前会话超时或失效，请重新登录',
  })
}

/** 保留与公司模板同名的导出口，接入真实 dva 后可直接替换实现。 */
export const onError = {
  onError(error: RequestErrorLike) {
    notifyRequestError(error)
  },
}

export default onError
