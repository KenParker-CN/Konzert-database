import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Parker's",
  description: "Personal website",
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Catalogues', link: '/pages/catalogue' },
      { text: 'Collections', link: '/pages/albums' },
      { text: 'Contact', link: '/pages/contact' },
    ],

    sidebar: [
      {
        text: 'Projects',
        items: [
          { text: 'Early Music', link: '/pages/earlymusic' },
          { text: 'Classical Composers', link: '/pages/composers' },
          { text: 'Works Catalogues', link: '/pages/catalogue' }
        ]
      }
    ],

    socialLinks: [
      {
        icon: 'musicbrainz',
        link: 'https://musicbrainz.org/user/KenParker_CN'
      }
    ]
  }
})