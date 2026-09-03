import { defineConfig } from 'vitepress'
import { catalogues } from './theme/data/catalogues'

const catalogueItems = catalogues.map(catalogue => ({
  text: `${catalogue.id} · ${catalogue.name}`,
  link: `/catalogues?tab=${catalogue.id}`
}))

const catalogueComposerItems = catalogues.map(catalogue => ({
  text: catalogue.composer,
  link: `/pages/composers/${catalogue.composerSlug}`
}))

export default defineConfig({
  title: "Parker's",
  description: "A personal archive of classical music, works, and recordings",
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Composers', link: '/pages/composers' },
      { text: 'Catalogues', link: '/catalogues?tab=RV' },
      { text: 'Collections', link: '/pages/albums' },
      { text: 'MB Search', link: '/docs/mbSearch' }
    ],

    outline: 'deep',

    sidebar: {
      '/pages/composers': [
        {
          text: 'Composers',
          items: [
            { text: 'Composer', link: '/pages/composers' }
          ]
        },
        {
          text: 'Catalogues',
          items: catalogueItems
        },
        {
          text: 'Collections',
          items: [
            { text: 'Albums', link: '/pages/albums' }
          ]
        }
      ],
      '/catalogues': [
        {
          text: 'Catalogues',
          items: [
            { text: 'Browse catalogues', link: '/catalogues?tab=RV' },
            ...catalogueItems
          ]
        },
        {
          text: 'Composers',
          items: [
            { text: 'Composer', link: '/pages/composers' },
            ...catalogueComposerItems
          ]
        },
        {
          text: 'Collections',
          items: [
            { text: 'Albums', link: '/pages/albums' }
          ]
        }
      ],
      '/pages/albums': [
        {
          text: 'Collections',
          items: [
            { text: 'Albums', link: '/pages/albums' }
          ]
        },
        {
          text: 'Related',
          items: [
            { text: 'Composer', link: '/pages/composers' },
            { text: 'Catalogues', link: '/catalogues?tab=RV' }
          ]
        }
      ],
      '/': [
        {
          text: 'Projects',
          items: [
            { text: 'Composer', link: '/pages/composers' },
            { text: 'Catalogues', link: '/catalogues?tab=RV' },
            { text: 'Albums', link: '/pages/albums' }
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
