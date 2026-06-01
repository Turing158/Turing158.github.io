import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/articles',
    name: 'articles',
    component: () => import('@/views/ArticlesView.vue'),
    meta: { title: 'Articles' },
  },
  {
    path: '/article/:slug',
    name: 'article-detail',
    component: () => import('@/views/ArticleDetailView.vue'),
    meta: { title: 'Article' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { title: 'Projects' },
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { title: 'Tools' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About' },
  },
  {
    path: '/commits/:repo?',
    name: 'commits',
    component: () => import('@/views/CommitsView.vue'),
    meta: { title: 'Commits' },
    props: true,
  },
]

const router = createRouter({
  history: createWebHashHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

const progressListeners: { onStart: () => void; onDone: () => void }[] = []

export function registerProgress(listener: { onStart: () => void; onDone: () => void }) {
  progressListeners.push(listener)
}

router.beforeEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | Blog` : 'Blog'
  progressListeners.forEach(l => l.onStart())
})

router.afterEach(() => {
  progressListeners.forEach(l => l.onDone())
})

export default router
