# Skill: 路由与守卫

## 位置

`src/router/index.ts`

## 路由结构

```
/login                       Login               public
/403                         Forbidden           public
/                            BasicLayout (layout)
  /dashboard                 Dashboard
  /drama/list                DramaList           keep-alive
  /drama/upload              DramaUpload
  /drama/:id                 DramaDetail
  /drama/tags                DramaTags
  /drama/home-banner         HomeBanner
  /drama/home-hot            HomeHot
  /drama/home-rank           HomeRank
  /drama/ad-settings         DramaAdSettings     keep-alive
  /user/list                 UserList            keep-alive
  /user/:id                  UserDetail
  /ad/list                   AdList              keep-alive
  /ad/create                 AdCreate
  /ad/:id/edit               AdEdit
  /ad/push-settings          AdPushSettings
  /system/user               SystemUser          账号管理
  /system/app                SystemApp           应用管理
/:pathMatch(.*)*             → /dashboard
```

所有路由 `meta.title` 提供面包屑标题；`public: true` 的路由跳过认证。

## 守卫实现

```ts
router.beforeEach(async (to, _from, next) => {
  loadingStore.start()

  if (to.meta.public) { next(); return }

  const token = localStorage.getItem('token')
  if (!token) { next('/login'); return }

  if (!accountStore.isLoggedIn) {
    try {
      await accountStore.loadFromServer()   // GET /system/user/getInfo
      appStore.loadFromAccountStore()
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('client_id')
      loadingStore.finish()
      next('/login')
      return
    }
  }

  next()
})

router.afterEach(() => loadingStore.finish())
```

## 关键点

1. **无独立路由权限**：权限控制下放到 `BasicLayout` 的菜单 `v-if` 与按钮 `v-if`，路由本身仅做登录态校验。若需要更严格的按路由拒绝，可在 `beforeEach` 加 `to.meta.permission` 判断。
2. **进度条**：`beforeEach / afterEach` 分别调用 `loadingStore.start() / finish()`，配合顶部 TikTok 双色渐变进度条。
3. **`keep-alive`**：由 `BasicLayout` 中的 `cachedViews = ['DramaList', 'UserList', 'AdList', 'DramaAdSettings']` 控制，保证列表页从详情页返回时保留状态。
