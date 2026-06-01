import { ref } from 'vue'
import Gitalk from 'gitalk'
import { config } from '@/config'

export function useGitalk(containerId: string, slug: string, title: string) {
  const initialized = ref(false)

  const init = () => {
    const container = document.getElementById(containerId)
    if (!container || initialized.value) return

    // Remove previous instance
    container.innerHTML = ''

    const gitalk = new Gitalk({
      clientID: config.gitalk.clientID,
      clientSecret: config.gitalk.clientSecret,
      repo: config.github.repo,
      owner: config.github.owner,
      admin: [config.github.owner],
      id: slug,
      title: title,
      body: title,
      distractionFreeMode: false,
      language: 'zh-CN',
      proxy: config.gitalk.proxy,
    })

    gitalk.render(containerId)
    initialized.value = true
  }

  return { init, initialized }
}
