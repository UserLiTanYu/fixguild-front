import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import LoginView from './views/LoginView.vue'
import TenantsView from './views/TenantsView.vue'
import AccountView from './views/AccountView.vue'
import { homeRoute, session, userAuth } from './session'
import './styles.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { title: '登录' } },
    { path: '/platform/tenant', component: TenantsView, meta: { title: '租户管理' } },
    { path: '/account', component: AccountView, meta: { title: '我的账号' } },
    { path: '/:pathMatch(.*)*', redirect: () => session.value ? homeRoute() : '/login' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.path !== '/login' && !session.value) return '/login'
  if (to.path === '/login' && session.value) return homeRoute()
  if (to.path === '/platform/tenant' && userAuth.value && homeRoute() !== to.path) return homeRoute()
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '控制台'} · Fixguild 匠盟`
})

createApp(App).use(router).mount('#app')
