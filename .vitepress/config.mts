import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Parker's",
  description: "Personal website",
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Catalogues', link: '/pages/catalogues/' },
      { text: 'Collections', link: '/pages/albums' },
    ],

    sidebar: {
      '/pages/catalogues/': [
        {
          text: 'Work Catalogues',
          items: [
            { text: 'Catalogue index', link: '/pages/catalogues/' },
            { text: 'RV — Vivaldi', link: '/pages/catalogues/rv' },
            { text: 'TWV — Telemann', link: '/pages/catalogues/twv' },
            { text: 'HWV — Handel', link: '/pages/catalogues/hwv' },
            { text: 'KV — Mozart', link: '/pages/catalogues/kv' },
            { text: 'BWV — Bach', link: '/pages/catalogues/bwv' }
          ]
        }
      ],
      '/': [
        {
          text: 'Projects',
          items: [
            { text: 'Early Music', link: '/pages/earlymusic' },
            { text: 'Classical Composers', link: '/pages/composers' },
            { text: 'Works Catalogues', link: '/pages/catalogues/' }
          ]
        }
      ]
    },

    socialLinks: [
      {
        icon: 'musicbrainz',
        link: 'https://musicbrainz.org/user/KenParker_CN'
      }
    ]
  }
})
