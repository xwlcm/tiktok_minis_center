import request from '@/utils/request.ts'

/**
 * 登录请求体 - 对应后端 PasswordLoginBody
 */
export interface LoginRequest {
  clientId: string          // 必填：客户端ID (e.g., 'pc')
  grantType: string         // 必填：授权类型 (e.g., 'password')
  tenantId?: string         // 可选：租户ID (默认: '000000')
  username: string          // 必填：用户名
  password: string          // 必填：密码
  code?: string             // 可选：验证码
  uuid?: string             // 可选：验证码唯一标识
}

/**
 * 登录响应体 - 对应后端 LoginVo
 */
export interface LoginResponse {
  access_token: string      // JWT 访问令牌
  refresh_token?: string    // JWT 刷新令牌
  expire_in: number         // access_token 过期时间（秒）
  refresh_expire_in?: number // refresh_token 过期时间（秒）
  client_id: string         // 客户端ID
  scope?: string            // 权限范围
  openid?: string           // 用户唯一标识
}

/**
 * 登录接口
 * 实际后端路径: POST /auth/login
 * 前端请求路径: POST /api/auth/login (通过 vite proxy 转发)
 * 
 * @param data 登录请求数据
 * @returns 登录响应数据
 */
export function login(data: LoginRequest) {
  // 注意：baseURL 是 /api，所以实际请求路径是 /api/auth/login
  // vite proxy 会将 /api 前缀去掉，转发到后端的 /auth/login
  return request.post<LoginResponse>('/auth/login', data)
}

/**
 * 登出接口
 * POST /auth/logout
 * 
 * @returns 无返回数据
 */
export function logout() {
  return request.post<void>('/auth/logout', {})
}

/**
 * 获取租户列表
 * GET /auth/tenant/list
 * 
 * @returns 租户列表
 */
export interface TenantListResponse {
  tenantEnabled: boolean
  voList: Array<{
    id: string
    name: string
    domain: string
  }>
}

export function getTenantList() {
  return request.get<TenantListResponse>('/auth/tenant/list')
}
