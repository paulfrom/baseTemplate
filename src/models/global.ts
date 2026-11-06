import { useSyncExternalStore } from 'react'
import { getVerifyCode as requestVerifyCode, login as loginRequest, logout as logoutRequest } from '../services/api'
import { LOGIN_STATUS, type LoginStatus } from '../utils/constants'

/**
 * 全局模型。
 *
 * 公司模板用 dva 的 `models/global.ts` + `connect/useSelector`；
 * 这里保留同样的状态字段与动作名，改用 `useSyncExternalStore` 暴露给页面，
 * 避免为原型引入 dva / umi 运行时。
 */

export type LocaleId = 'zh-CN' | 'en-US'

export interface CurrentUser {
  userId: string
  account: string
  userName: string
  department?: string
  role?: string
}

export interface GlobalState {
  locale: LocaleId
  currentUser: CurrentUser | null
  /** 多租户登录时展示租户输入框。 */
  showTenant: boolean
  /** 当前验证码图片（data URI）。 */
  verifyCode: string
  showVerifyCode: boolean
}

export interface LoginPayload {
  account: string
  password: string
  verifyCode?: string
  tenant?: string
  /** 验证码请求标识，服务端用来校验验证码是否属于本次会话。 */
  reqId?: string
}

export interface LoginResult {
  loginStatus: LoginStatus
  user?: CurrentUser
  message?: string
}

const initialState: GlobalState = {
  locale: 'zh-CN',
  currentUser: null,
  showTenant: false,
  verifyCode: '',
  showVerifyCode: true,
}

let state: GlobalState = { ...initialState }
const listeners = new Set<() => void>()

function commit(next: GlobalState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export function useGlobalModel(): GlobalState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useCurrentUser(): CurrentUser | null {
  return useGlobalModel().currentUser
}

export function getGlobalState(): GlobalState {
  return state
}

export function resetGlobalModel() {
  commit({ ...initialState })
}

export function updateState(patch: Partial<GlobalState>) {
  commit({ ...state, ...patch })
}

export function setLocale(locale: LocaleId) {
  updateState({ locale })
}

/** 取一张新的模拟验证码图片。 */
export async function refreshVerifyCode(reqId: string): Promise<string> {
  const result = await requestVerifyCode(reqId)
  if (result.success && result.data) {
    updateState({ verifyCode: result.data })
    return result.data
  }
  return ''
}

/** 模拟登录：结果码与真实登录契约保持一致，方便后续替换成真实服务。 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  const result = await loginRequest(payload)
  if (!result.success) {
    return { loginStatus: LOGIN_STATUS.FAILURE, message: result.message }
  }
  const data = result.data
  if (!data) {
    return { loginStatus: LOGIN_STATUS.FAILURE, message: result.message }
  }
  if (data.loginStatus === LOGIN_STATUS.SUCCESS && data.user) {
    updateState({ currentUser: data.user, showTenant: false })
    return { loginStatus: data.loginStatus, user: data.user }
  }
  if (data.loginStatus === LOGIN_STATUS.MULTI_TENANT) {
    updateState({ showTenant: true })
  }
  if (data.loginStatus === LOGIN_STATUS.CAPTCHA_ERROR) {
    updateState({ showVerifyCode: true })
  }
  return { loginStatus: data.loginStatus, message: data.message }
}

export async function logout(): Promise<void> {
  await logoutRequest()
  updateState({ currentUser: null })
}
