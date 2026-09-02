import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

// @ts-ignore
import './style.css'

import Catalogues from './components/catalogue/Catalogues.vue'
import AIChat from './components/common/AIChat.vue'
import ComposerList from './components/composer/ComposerList.vue'
import ComposerProfile from './components/composer/ComposerProfile.vue'
import ComposerCatalogues from './components/catalogue/ComposerCatalogues.vue'
import WikipediaIntro from './components/common/WikipediaIntro.vue'
import AlbumList from './components/album/AlbumList.vue'
import AdminPanel from './components/admin/AdminPanel.vue'
import LoginPage from './components/admin/LoginPage.vue'
import Layout from './Layout.vue'
import MBSearch from './components/musicbrainz/mbSearch.vue'

export default {
    extends: DefaultTheme,
    Layout,

    enhanceApp({ app }) {
        app.component('Catalogues', Catalogues)
        app.component('AIChat', AIChat)
        app.component('ComposerList', ComposerList)
        app.component('ComposerProfile', ComposerProfile)
        app.component('ComposerCatalogues', ComposerCatalogues)
        app.component('WikipediaIntro', WikipediaIntro)
        app.component('AlbumList', AlbumList)
        app.component('AdminPanel', AdminPanel)
        app.component('LoginPage', LoginPage)
        app.component('MBSearch', MBSearch)
    }
} satisfies Theme