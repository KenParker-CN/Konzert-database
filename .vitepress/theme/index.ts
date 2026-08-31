import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import Catalogues from './components/Catalogues.vue'
import AIChat from './components/AIChat.vue'
import ComposerList from './components/ComposerList.vue'
import ComposerProfile from './components/ComposerProfile.vue'
import ComposerCatalogues from './components/ComposerCatalogues.vue'
import WikipediaIntro from './components/WikipediaIntro.vue'
import AlbumList from './components/AlbumList.vue'
import LocalPlayer from './components/LocalPlayer.vue'
import Layout from './Layout.vue'
import MusicBrainzTest from './components/MusicBrainzTest.vue'


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
        app.component('LocalPlayer', LocalPlayer)
        app.component('musicBrainzTest', MusicBrainzTest)
    }
} satisfies Theme
