import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Parker's",
  description: "Personal website",
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Catalogues', link: '/catalogues?tab=RV' },
      { text: 'Collections', link: '/pages/albums' },
    ],

    sidebar: {
      '/catalogues': [
        {
          text: 'Work Catalogues',
          items: [
            { text: 'Browse catalogues', link: '/catalogues?tab=RV' }
          ]
        }
      ],
      '/': [
        {
          text: 'Projects',
          items: [
            { text: 'Early Music', link: '/pages/earlymusic' },
            { text: 'Classical Composers', link: '/pages/composers' },
            { text: 'Works Catalogues', link: '/catalogues?tab=RV' }
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
