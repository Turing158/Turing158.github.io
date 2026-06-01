import { ref } from 'vue'
import Gitalk from 'gitalk'

export function useGitalk(containerId: string, slug: string, title: string) {
  const initialized = ref(false)

  const init = () => {
    const container = document.getElementById(containerId)
    if (!container || initialized.value) return

    // Remove previous instance
    container.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: import.meta.env.VITE_GITALK_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GITALK_CLIENT_SECRET || '',
      repo: import.meta.env.VITE_GITHUB_REPO || '',
      owner: import.meta.env.VITE_GITHUB_OWNER || '',
      admin: [import.meta.env.VITE_GITHUB_OWNER || ''],
      id: slug,
      title: title,
      body: title,
      distractionFreeMode: false,
      language: 'zh-CN',
      proxy: 'https://proxy-gitalk-api.netlify.app/github_access_token',
    })

    gitalk.render(containerId)
    initialized.value = true
  }

  return { init, initialized }
}
