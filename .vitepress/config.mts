import { defineConfig } from 'vitepress'
import { composers, eras } from './theme/data/composers'
import { catalogues } from './theme/data/catalogues'

const composerItems = eras
  .map(era => ({
    text: era,
    collapsed: false,
    items: composers
      .filter(composer => composer.era === era && composer.slug)
      .map(composer => ({ text: composer.name, link: `/pages/composers/${composer.slug}` }))
  }))
  .filter(group => group.items.length > 0)

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
      { text: 'Early Music', link: '/pages/earlymusic' }
    ],

    outline: 'deep',

    sidebar: {
      '/pages/composers': [
        {
          text: 'Composers',
          items: [
            { text: 'Composer list', link: '/pages/composers' }
          ]
        },
        ...composerItems,
        {
          text: 'Work Catalogues',
          items: catalogueItems
        },
        {
          text: 'Collections',
          items: [
            { text: 'Album collections', link: '/pages/albums' }
          ]
        }
      ],
      '/catalogues': [
        {
          text: 'Work Catalogues',
          items: [
            { text: 'Browse catalogues', link: '/catalogues?tab=RV' },
            ...catalogueItems
          ]
        },
        {
          text: 'Composers',
          items: [
            { text: 'Composer list', link: '/pages/composers' },
            ...catalogueComposerItems
          ]
        },
        {
          text: 'Collections',
          items: [
            { text: 'Album collections', link: '/pages/albums' }
          ]
        }
      ],
      '/pages/albums': [
        {
          text: 'Collections',
          items: [
            { text: 'Album gallery', link: '/pages/albums' }
          ]
        },
        {
          text: 'Related',
          items: [
            { text: 'Composer list', link: '/pages/composers' },
            { text: 'Work catalogues', link: '/catalogues?tab=RV' }
          ]
        }
      ],
      '/': [
        {
          text: 'Projects',
          items: [
            { text: 'Early Music', link: '/pages/earlymusic' },
            { text: 'Classical Composers', link: '/pages/composers' },
            { text: 'Works Catalogues', link: '/catalogues?tab=RV' },
            { text: 'Album Collections', link: '/pages/albums' }
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
