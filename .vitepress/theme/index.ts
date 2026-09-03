import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ElementPlus from 'element-plus'

/* EP 样式必须先于 style.css：后者的 :root / :root.dark --el-* 桥接
   （specificity 0,2,0）需覆盖 EP 自带 html.dark 默认值（0,1,1） */
// @ts-ignore
import 'element-plus/dist/index.css'
// @ts-ignore
import './tokens.css'
// @ts-ignore
import './style.css'

import { initTheme } from './theme'
import { ArrowDown, ArrowRight, Close, Filter, Monitor, Moon, Search, Sunny } from '@element-plus/icons-vue'

/* 站内使用的 EP 图标全局注册（模板内直接 <el-icon><Search /></el-icon>），
   具名导入保持 tree-shaking，不打包全量图标集 */
const uiIcons = { ArrowDown, ArrowRight, Close, Filter, Monitor, Moon, Search, Sunny }

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
        /* SSR 安全（theme.ts 内部已判 window）；动态 import 失败时静默回落 tokens.css 兜底色 */
        initTheme().catch(() => {})
        app.use(ElementPlus)
        for (const [name, component] of Object.entries(uiIcons)) {
            app.component(name, component)
        }
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