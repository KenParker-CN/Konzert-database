/*
 * Material 3 主题系统
 * ---------------------------------------------------------------
 * 使用官方 @material/material-color-utilities（HCT）从 seed color
 * 生成完整 tonal palette 与 light/dark scheme，并注入为 --md-* CSS
 * 变量。用户选择持久化在 localStorage。
 *
 * 注意：该库的 ESM 包内含 extensionless 内部导入，Node 原生 loader
 * 无法解析（VitePress SSR 依赖 externalize 后走 Node 加载）。因此
 * 这里对它做「懒加载动态 import」，仅在浏览器端解析与执行，SSR
 * 阶段完全不加载该模块。
 */

type MaterialLib = typeof import('@material/material-color-utilities')

let materialLibPromise: Promise<MaterialLib> | null = null

function loadMaterial(): Promise<MaterialLib> {
  if (!materialLibPromise) {
    materialLibPromise = import('@material/material-color-utilities')
  }
  return materialLibPromise
}

/* =========================================================
   Types
   ========================================================= */

export type AppearanceMode = 'light' | 'dark' | 'system'

export type ResolvedTheme = 'light' | 'dark'

export interface SeedPreset {
  id: string
  label: string
  /** 低饱和度 seed 色，仅作为 HCT 输入，不是完整主题。 */
  seed: string
}

/* =========================================================
   Seed presets
   ========================================================= */

export const SEED_PRESETS: SeedPreset[] = [
  { id: 'blue', label: 'Blue', seed: '#5669A3' },
  { id: 'purple', label: 'Purple', seed: '#7A5E9C' },
  { id: 'green', label: 'Green', seed: '#4D7255' },
  { id: 'orange', label: 'Orange', seed: '#9A6A41' },
  { id: 'red', label: 'Red', seed: '#9A5252' },
  { id: 'pink', label: 'Pink', seed: '#9C5F72' },
  { id: 'cyan', label: 'Cyan', seed: '#447B7A' }
]

export const DEFAULT_SEED_ID = 'blue'

/* =========================================================
   Storage keys
   ========================================================= */

const KEY_APPEARANCE = 'parker-home-appearance'
const KEY_SEED = 'parker-home-seed'

/* VitePress 原生 appearance 的 localStorage 键（vueuse useDark 所用）。
   写入此键可保持与 VitePress 状态一致，避免两状态源长期漂移。
   若站点配置禁用了 VitePress appearance，此写入为无害空操作。 */
const VP_APPEARANCE_KEY = 'vitepress-theme-appearance'

/* =========================================================
   Storage helpers
   ========================================================= */

function readAppearance(): AppearanceMode {
  if (typeof window === 'undefined') return 'system'
  const raw = window.localStorage.getItem(KEY_APPEARANCE)
  return raw === 'light' || raw === 'dark' || raw === 'system'
      ? raw
      : 'system'
}

function readSeedId(): string {
  if (typeof window === 'undefined') return DEFAULT_SEED_ID
  const raw = window.localStorage.getItem(KEY_SEED)
  return raw && SEED_PRESETS.some(p => p.id === raw)
      ? raw
      : DEFAULT_SEED_ID
}

function writeAppearance(mode: AppearanceMode): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY_APPEARANCE, mode)
  }
}

function writeSeedId(id: string): void {
  const preset = SEED_PRESETS.find(p => p.id === id)
  if (typeof window !== 'undefined' && preset) {
    window.localStorage.setItem(KEY_SEED, id)
  }
}

function seedHex(id: string): string {
  return SEED_PRESETS.find(p => p.id === id)?.seed
      ?? SEED_PRESETS[0].seed
}

/* =========================================================
   System appearance
   ========================================================= */

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/* =========================================================
   Public readers
   ========================================================= */

export function getAppearance(): AppearanceMode {
  return readAppearance()
}

export function getSeedId(): string {
  return readSeedId()
}

export function getResolvedTheme(): ResolvedTheme {
  const mode = readAppearance()
  if (mode === 'system') {
    return systemPrefersDark() ? 'dark' : 'light'
  }
  return mode
}

/** 供 ThemeSelector 展示每个 seed 的亮色 primary 预览。 */
export async function seedPreviewColor(id: string): Promise<string> {
  const { argbFromHex, hexFromArgb, themeFromSourceColor } = await loadMaterial()
  const theme = themeFromSourceColor(argbFromHex(seedHex(id)))
  return hexFromArgb(theme.schemes.light.primary)
}

/* =========================================================
   HCT → CSS variables
   ========================================================= */

interface TokenSet {
  [token: string]: string
}

async function buildTokens(seedId: string, dark: boolean): Promise<TokenSet> {
  const { argbFromHex, hexFromArgb, themeFromSourceColor } = await loadMaterial()
  const theme = themeFromSourceColor(argbFromHex(seedHex(seedId)))
  const scheme = dark ? theme.schemes.dark : theme.schemes.light
  const neutral = theme.palettes.neutral

  const hex = (argb: number) => hexFromArgb(argb)

  const surfaceTones = dark
      ? {
          surface: 8,
          'surface-container-lowest': 4,
          'surface-container-low': 12,
          'surface-container': 17,
          'surface-container-high': 24,
          'surface-container-highest': 30
        }
      : {
          // Light 模式：页面主背景为纯白（tone 100），
          // container 层保持中性灰阶层级（Google 产品风格）。
          surface: 100,
          'surface-container-lowest': 100,
          'surface-container-low': 97,
          'surface-container': 95,
          'surface-container-high': 93,
          'surface-container-highest': 91
        }

  const tokens: TokenSet = {
    '--md-primary': hex(scheme.primary),
    '--md-on-primary': hex(scheme.onPrimary),
    '--md-primary-container': hex(scheme.primaryContainer),
    '--md-on-primary-container': hex(scheme.onPrimaryContainer),
    '--md-secondary': hex(scheme.secondary),
    '--md-on-secondary': hex(scheme.onSecondary),
    '--md-secondary-container': hex(scheme.secondaryContainer),
    '--md-on-secondary-container': hex(scheme.onSecondaryContainer),
    '--md-tertiary': hex(scheme.tertiary),
    '--md-on-tertiary': hex(scheme.onTertiary),
    '--md-tertiary-container': hex(scheme.tertiaryContainer),
    '--md-on-tertiary-container': hex(scheme.onTertiaryContainer),
    '--md-on-surface': hex(scheme.onSurface),
    '--md-on-surface-variant': hex(scheme.onSurfaceVariant),
    '--md-outline': hex(scheme.outline),
    '--md-outline-variant': hex(scheme.outlineVariant),
    '--md-inverse-surface': hex(scheme.inverseSurface),
    '--md-inverse-on-surface': hex(scheme.inverseOnSurface),
    '--md-inverse-primary': hex(scheme.inversePrimary),
    '--md-error': hex(scheme.error),
    '--md-on-error': hex(scheme.onError),
    '--md-error-container': hex(scheme.errorContainer),
    '--md-on-error-container': hex(scheme.onErrorContainer),
    '--md-scrim': hex(scheme.scrim),
    '--md-shadow': hex(scheme.shadow)
  }

  for (const [name, tone] of Object.entries(surfaceTones)) {
    const key = name === 'surface'
        ? '--md-surface'
        : `--md-${name}`
    tokens[key] = hex(neutral.tone(tone))
  }

  return tokens
}

async function applyTokens(seedId: string, dark: boolean): Promise<void> {
  const tokens = await buildTokens(seedId, dark)
  const root = document.documentElement

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
}

/* =========================================================
   Public API
   ========================================================= */

export async function applyTheme(seedId: string, dark: boolean): Promise<void> {
  if (typeof document === 'undefined') return
  await applyTokens(seedId, dark)
  const root = document.documentElement
  root.setAttribute('data-theme', dark ? 'dark' : 'light')
  root.classList.toggle('dark', dark)
  /* 同步 VitePress 原生 appearance 键，保持双状态源一致。
     若 VitePress appearance 被禁用，此写入为无害空操作。 */
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VP_APPEARANCE_KEY, dark ? 'dark' : 'light')
    }
  } catch {
    // localStorage 不可用时静默忽略
  }
}

export async function setAppearance(mode: AppearanceMode, seedId = readSeedId()): Promise<void> {
  writeAppearance(mode)
  if (mode === 'system') {
    await applyTheme(seedId, systemPrefersDark())
    bindSystemListener()
  } else {
    await applyTheme(seedId, mode === 'dark')
    unbindSystemListener()
  }
}

export async function setSeed(id: string, mode = readAppearance()): Promise<void> {
  writeSeedId(id)
  await applyTheme(id, mode === 'system' ? systemPrefersDark() : mode === 'dark')
}

export async function initTheme(): Promise<void> {
  await applyTheme(readSeedId(), getResolvedTheme() === 'dark')
  if (readAppearance() === 'system') {
    bindSystemListener()
  }
}

/* =========================================================
   System listener
   ========================================================= */

let mediaQuery: MediaQueryList | null = null
let systemHandler: ((event: MediaQueryListEvent) => void) | null = null

function bindSystemListener(): void {
  if (typeof window === 'undefined' || mediaQuery) return
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemHandler = (event: MediaQueryListEvent) => {
    // 系统主题切换时以当前 seed 重新套用；失败则保留现有 token。
    applyTheme(readSeedId(), event.matches).catch(() => {})
  }
  mediaQuery.addEventListener('change', systemHandler)
}

function unbindSystemListener(): void {
  // 真正移除监听器：切到显式 Light/Dark 后，系统主题变化
  // 不应再覆盖用户的选择。
  if (mediaQuery && systemHandler) {
    mediaQuery.removeEventListener('change', systemHandler)
  }
  mediaQuery = null
  systemHandler = null
}