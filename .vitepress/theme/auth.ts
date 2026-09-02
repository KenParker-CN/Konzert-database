/*
 * Admin 前端认证逻辑
 * ---------------------------------------------------------------
 * - 登录状态保存在 sessionStorage（关闭标签页即失效）。
 * - 仅用于演示 / 前端访问控制，不提供真实安全性。
 * - 登录凭据集中配置在下方 ADMIN_ACCOUNT 常量中。
 */

const STORAGE_KEY = 'parker_home_admin_auth'

export interface AdminAccount {
  username: string
  /** 可选：设置为非空字符串时，也接受该邮箱登录。 */
  email?: string
  password: string
}

/** 登录凭据：请在此修改为你自己的固定账号密码。 */
export const ADMIN_ACCOUNT: AdminAccount = {
  username: 'admin',
  email: '',
  password: 'admin123'
}

/** 校验凭据：identifier 匹配 username（或 email）且 password 完全匹配。 */
export function authenticate(
    identifier: string,
    password: string
): boolean {
  const user = identifier.trim()

  if (!user || !password) {
    return false
  }

  const matchesUsername = user === ADMIN_ACCOUNT.username

  const matchesEmail =
      Boolean(ADMIN_ACCOUNT.email) &&
      user.toLowerCase() ===
          (ADMIN_ACCOUNT.email as string).toLowerCase()

  return (
      (matchesUsername || matchesEmail) &&
      password === ADMIN_ACCOUNT.password
  )
}

/** 登录：校验通过则写入 sessionStorage，返回是否成功。 */
export function login(
    identifier: string,
    password: string
): boolean {
  if (!authenticate(identifier, password)) {
    return false
  }

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          loggedIn: true,
          user: identifier.trim(),
          at: new Date().toISOString()
        })
    )
  }

  return true
}

/** 登出：清除 sessionStorage。 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

/** 当前是否已登录（SSR 环境下恒为 false）。 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    return data?.loggedIn === true
  } catch {
    return false
  }
}

/** 返回当前登录用户名；未登录返回 null。 */
export function currentUser(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data?.user ?? null
  } catch {
    return null
  }
}