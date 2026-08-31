import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import RVTable from './components/RVTable.vue'
import TWVTable from './components/TWVTable.vue'
import AIChat from './components/AIChat.vue'
import ComposerList from './components/ComposerList.vue'
import WikipediaIntro from './components/WikipediaIntro.vue'
import AlbumList from './components/AlbumList.vue'
import LocalPlayer from './components/LocalPlayer.vue'
import Layout from './Layout.vue'
import MusicBrainzTest from './components/MusicBrainzTest.vue'


export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('RVTable', RVTable)
        app.component('TWVTable', TWVTable)
        app.component('AIChat', AIChat)
        app.component('ComposerList', ComposerList)
        app.component('WikipediaIntro', WikipediaIntro)
        app.component('AlbumList', AlbumList)
        app.component('LocalPlayer', LocalPlayer)
        app.component('musicBrainzTest', MusicBrainzTest)
    }
} satisfies Theme
