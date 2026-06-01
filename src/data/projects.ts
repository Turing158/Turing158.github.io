export interface Project {
  name: string
  description: string
  tech: string[]
  url: string
}

export interface Category {
  key: string
  icon: string
  label: string
  projects: Project[]
}

export const developingProjects: Project[] = [
  {
    name: 'StarFall-Minecraft-Launcher',
    description: 'SFMC Minecraft 启动器，支持多版本管理、模组集成等功能。',
    tech: ['Java', 'Minecraft', 'Launcher'],
    url: 'https://github.com/Turing158/StarFall-Minecraft-Launcher',
  },
  {
    name: 'Turing158.github.io',
    description: '个人博客主页，基于 Vue 3 + Vite 构建的静态博客站点。',
    tech: ['Vue', 'Vite', 'TypeScript'],
    url: 'https://github.com/Turing158/Turing158.github.io',
  },
]

export const categories: Category[] = [
  {
    key: 'developing',
    icon: '🚧',
    label: 'projects.categoryDeveloping',
    projects: developingProjects,
  },
  {
    key: 'completed',
    icon: '✅',
    label: 'projects.categoryCompleted',
    projects: [
      {
        name: 'StarFall-vue',
        description: '基于 Vue 框架构建的前端界面，与 StarFall-SpringBoot 后端配合使用。',
        tech: ['Vue', 'TypeScript', 'Element UI'],
        url: 'https://github.com/Turing158/StarFall-vue',
      },
      {
        name: 'StarFall-SpringBoot',
        description: '基于 SpringBoot 框架的后端服务，与 StarFall-vue 前端配合使用。',
        tech: ['SpringBoot', 'Java', 'MySQL'],
        url: 'https://github.com/Turing158/StarFall-SpringBoot',
      },
      {
        name: 'dorm408-LibrarySystem',
        description: '宿舍图书馆管理系统，支持图书借阅、归还、查询等功能。',
        tech: ['Java', 'SpringBoot', 'MySQL'],
        url: 'https://github.com/Turing158/dorm408-LibrarySystem',
      },
      {
        name: 'LibrarySystem',
        description: '图书馆管理系统，提供图书管理、用户管理、借阅记录等功能。',
        tech: ['Java', 'SpringBoot', 'MySQL'],
        url: 'https://github.com/Turing158/LibrarySystem',
      },
      {
        name: 'starfall-springboot-web',
        description: '基于 SpringBoot 框架构建的论坛系统，数据库操作采用 JPA。',
        tech: ['SpringBoot', 'JPA', 'MySQL'],
        url: 'https://github.com/Turing158/starfall-springboot-web',
      },
      {
        name: 'SFMC',
        description: '简洁的 Minecraft 启动器，轻量易用。',
        tech: ['Java', 'Minecraft'],
        url: 'https://github.com/Turing158/SFMC',
      },
    ],
  },
  {
    key: 'blog',
    icon: '🌐',
    label: 'projects.categoryBlog',
    projects: [
      {
        name: 'Turing158.github.io',
        description: '个人博客主页，基于 GitHub Pages 部署的静态博客站点。',
        tech: ['Vue', 'GitHub Pages'],
        url: 'https://github.com/Turing158/Turing158.github.io',
      },
      {
        name: 'Turing158',
        description: 'GitHub 个人主页仓库，展示个人介绍与项目概览。',
        tech: ['Markdown', 'GitHub'],
        url: 'https://github.com/Turing158/Turing158',
      },
    ],
  },
  {
    key: 'tutorial',
    icon: '📚',
    label: 'projects.categoryTutorial',
    projects: [
      {
        name: 'SpringBootStart',
        description: 'SpringBoot 入门教程项目，学习 SpringBoot 基础用法。',
        tech: ['SpringBoot', 'Java'],
        url: 'https://github.com/Turing158/SpringBootStart',
      },
      {
        name: 'SpringBootThymeleaf',
        description: 'SpringBoot 整合 Thymeleaf 模板引擎的教程项目。',
        tech: ['SpringBoot', 'Thymeleaf', 'Java'],
        url: 'https://github.com/Turing158/SpringBootThymeleaf',
      },
      {
        name: 'SpringBootRabbitMQ',
        description: 'SpringBoot 整合 RabbitMQ 消息队列的教程项目。',
        tech: ['SpringBoot', 'RabbitMQ', 'Java'],
        url: 'https://github.com/Turing158/SpringBootRabbitMQ',
      },
      {
        name: 'vue_study',
        description: 'Vue.js 学习项目，记录 Vue 框架的学习过程与实践。',
        tech: ['Vue', 'JavaScript'],
        url: 'https://github.com/Turing158/vue_study',
      },
      {
        name: 'ppt_bootstrap',
        description: 'Bootstrap 教程演示项目，学习响应式布局与组件开发。',
        tech: ['Bootstrap', 'HTML', 'CSS'],
        url: 'https://github.com/Turing158/ppt_bootstrap',
      },
      {
        name: 'ppt-JavaScript',
        description: 'JavaScript 教程演示项目，学习 JS 核心概念与 DOM 操作。',
        tech: ['JavaScript', 'HTML', 'CSS'],
        url: 'https://github.com/Turing158/ppt-JavaScript',
      },
    ],
  },
  {
    key: 'shelved',
    icon: '📦',
    label: 'projects.categoryShelved',
    projects: [
      {
        name: 'SFMC-qml',
        description: '基于 QML 开发的 Minecraft 启动器。',
        tech: ['QML', 'Qt', 'Minecraft'],
        url: 'https://github.com/Turing158/SFMC-qml',
      },
      {
        name: 'Housekeeping-springboot',
        description: '基于 SpringBoot 的家政服务管理系统后端。',
        tech: ['SpringBoot', 'Java', 'MySQL'],
        url: 'https://github.com/Turing158/Housekeeping-springboot',
      },
      {
        name: 'Housekeeping-vue',
        description: '基于 Vue 的家政服务管理系统前端。',
        tech: ['Vue', 'JavaScript'],
        url: 'https://github.com/Turing158/Housekeeping-vue',
      },
      {
        name: 'Only-Only',
        description: '待补充描述的项目。',
        tech: [],
        url: 'https://github.com/Turing158/Only-Only',
      },
    ],
  },
]
