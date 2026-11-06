import { LOGIN_STATUS, type LoginStatus } from '../utils/constants'
import type { CurrentUser } from '../models/global'

/**
 * 服务层。
 *
 * 对齐公司模板 `src/services/api.ts` 的函数名与返回结构，但全部由本地 Mock 实现：
 * 本仓库不连接认证服务，也不能请求真实网关。
 */

export interface ResponseResult<T> {
  success: boolean
  message?: string
  data?: T
}

export interface LoginParams {
  account: string
  password: string
  verifyCode?: string
  reqId?: string
  tenant?: string
}

export interface LoginResponseData {
  loginStatus: LoginStatus
  user?: CurrentUser
  message?: string
}

/** 模拟账号前缀：只用固定账号演示登录分支，其余账号一律成功。 */
const MOCK_ACCOUNTS: Record<string, LoginStatus> = {
  locked: LOGIN_STATUS.LOCKED,
  frozen: LOGIN_STATUS.FROZEN,
  tenant: LOGIN_STATUS.MULTI_TENANT,
}

let currentVerifyCode = ''
let verifyCodeIssuedFor = ''

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function buildVerifyCodeImage(code: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="34" viewBox="0 0 96 34">
  <rect width="96" height="34" fill="#f4f6f8"/>
  <path d="M4 26 L92 8 M8 8 L88 28" stroke="#c9d3dd" stroke-width="1"/>
  <text x="48" y="24" font-family="monospace" font-size="19" letter-spacing="4" fill="#1f2d3d" text-anchor="middle">${code}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** 获取验证码：本地生成四位数字，与服务契约同名同结构。 */
export async function getVerifyCode(reqId: string): Promise<ResponseResult<string>> {
  await delay(60)
  const code = String(Math.floor(1000 + Math.random() * 9000))
  currentVerifyCode = code
  verifyCodeIssuedFor = reqId
  return { success: true, data: buildVerifyCodeImage(code) }
}

/** 登录：任意账号密码可进入原型；locked / frozen / tenant 三个账号演示异常分支。 */
export async function login(params: LoginParams): Promise<ResponseResult<LoginResponseData>> {
  await delay()
  const account = params.account.trim()
  if (!account || !params.password) {
    return { success: true, data: { loginStatus: LOGIN_STATUS.FAILURE, message: '账号或密码不能为空' } }
  }
  if (currentVerifyCode && verifyCodeIssuedFor === params.reqId) {
    if ((params.verifyCode ?? '').trim() !== currentVerifyCode) {
      return { success: true, data: { loginStatus: LOGIN_STATUS.CAPTCHA_ERROR, message: '验证码错误' } }
    }
  }
  const status = MOCK_ACCOUNTS[account.toLowerCase()] ?? LOGIN_STATUS.SUCCESS
  if (status !== LOGIN_STATUS.SUCCESS) {
    return { success: true, data: { loginStatus: status } }
  }
  return {
    success: true,
    data: {
      loginStatus: LOGIN_STATUS.SUCCESS,
      user: {
        userId: `mock-user-${account}`,
        account,
        userName: account,
        department: '数字化平台中心',
        role: '平台管理员',
      },
    },
  }
}

/** 退出：清空本地会话。 */
export async function logout(): Promise<ResponseResult<null>> {
  await delay(40)
  currentVerifyCode = ''
  verifyCodeIssuedFor = ''
  return { success: true, data: null }
}

/** 当前用户有权限的功能项：原型不做权限校验，返回空集合。 */
export async function getAuthorizedFeatures(): Promise<ResponseResult<string[]>> {
  await delay(40)
  return { success: true, data: [] }
}
