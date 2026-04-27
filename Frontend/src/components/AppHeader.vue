<template>
  <header class="app-header">
    <div class="container header-inner">
      <RouterLink to="/" class="brand">
        <ShoppingBag :size="22" stroke-width="1.5" />
        <span class="brand-name">Carrito Deportivo</span>
      </RouterLink>

      <!-- Barra de búsqueda (oculta en home y en products, esas vistas tienen la suya) -->
      <div v-if="route.name !== 'home' && route.name !== 'products'" class="search-wrap">
        <Search class="search-icon" :size="16" stroke-width="1.5" />
        <input
          v-model="productsStore.search"
          class="search-input"
          type="text"
          :placeholder="t('nav.search')"
          @keydown.escape="productsStore.search = ''"
        />
        <button
          v-if="productsStore.search"
          class="search-clear"
          @click="productsStore.search = ''"
        >
          <X :size="14" stroke-width="1.5" />
        </button>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav-tip" :data-tooltip="t('nav.home')">
          <Home :size="22" stroke-width="1.5" />
        </RouterLink>

        <RouterLink to="/products" class="nav-tip" :data-tooltip="t('nav.products')">
          <LayoutGrid :size="22" stroke-width="1.5" />
        </RouterLink>

        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/cart" class="nav-icon nav-tip" :data-tooltip="t('nav.cart')">
            <ShoppingCart :size="22" stroke-width="1.5" />
            <span v-if="cartStore.itemCount > 0" class="badge">{{ cartStore.itemCount }}</span>
          </RouterLink>

          <RouterLink to="/favorites" class="nav-icon nav-tip" :data-tooltip="t('nav.favorites')">
            <Heart :size="22" stroke-width="1.5" />
            <span v-if="favoritesStore.count > 0" class="badge badge-favorites">{{ favoritesStore.count }}</span>
          </RouterLink>

          <RouterLink to="/orders" class="nav-icon nav-tip" :data-tooltip="t('nav.orders')">
            <ClipboardList :size="22" stroke-width="1.5" />
            <span v-if="ordersStore.activeCount > 0" class="badge badge-orders">{{ ordersStore.activeCount }}</span>
          </RouterLink>
        </template>

        <template v-else>
          <div class="auth-links">
            <RouterLink to="/register" class="auth-btn">{{ t('nav.register') }}</RouterLink>
            <RouterLink to="/login" class="auth-btn auth-btn-solid">
              <div class="user-avatar"><User :size="14" stroke-width="1.5" /></div>
              {{ t('nav.login') }}
            </RouterLink>
          </div>
        </template>

        <!-- Selector de idioma / nación -->
        <div class="locale-picker" :class="{ open: localeOpen }" @click.stop="localeOpen = !localeOpen">
          <img :src="`https://flagcdn.com/w20/${localeStore.current.code}.png`" :alt="localeStore.current.country" class="locale-flag-img" />
          <span class="locale-code">{{ localeStore.current.name }}</span>
          <span class="locale-sep">|</span>
          <span class="locale-lang">{{ localeStore.current.lang }}</span>
          <ChevronDown :size="12" stroke-width="2" class="locale-chevron" />
          <div v-if="localeOpen" class="locale-dropdown">
            <p class="ld-title">{{ t('nav.region') }}</p>
            <button
              v-for="loc in locales"
              :key="loc.country"
              class="locale-option"
              :class="{ active: loc.country === localeStore.current.country }"
              @click.stop="selectLocale(loc)"
            >
              <span class="lo-check">✓</span>
              <img :src="`https://flagcdn.com/w20/${loc.code}.png`" :alt="loc.country" class="lo-flag-img" />
              <span class="lo-name">{{ loc.name }}</span>
              <span class="lo-lang-badge">{{ loc.lang }}</span>
            </button>
          </div>
        </div>

        <!-- Perfil de usuario (autenticado) -->
        <div v-if="authStore.isAuthenticated" class="user-menu" :class="{ open: userMenuOpen }" @click.stop="userMenuOpen = !userMenuOpen">
          <div class="user-avatar">
            <User :size="16" stroke-width="1.5" />
          </div>
          <span class="user-greeting">{{ t('nav.hello') }}, <strong>{{ authStore.user?.name?.split(' ')[0] }}</strong></span>
          <ChevronDown :size="12" stroke-width="2" class="user-chevron" />
          <div v-if="userMenuOpen" class="user-dropdown">
            <div class="ud-header">
              <div class="ud-avatar-lg"><User :size="20" stroke-width="1.5" /></div>
              <div>
                <p class="ud-name">{{ authStore.user?.name }}</p>
                <p class="ud-email">{{ authStore.user?.email }}</p>
              </div>
            </div>
            <div class="ud-divider" />
            <RouterLink to="/orders" class="ud-item" @click="userMenuOpen = false">
              <ClipboardList :size="15" stroke-width="1.5" /> {{ t('nav.orders') }}
            </RouterLink>
            <RouterLink to="/favorites" class="ud-item" @click="userMenuOpen = false">
              <Heart :size="15" stroke-width="1.5" /> {{ t('nav.favorites') }}
            </RouterLink>
            <div class="ud-divider" />
            <button class="ud-item ud-logout" @click="handleLogout">
              <LogOut :size="15" stroke-width="1.5" /> {{ t('nav.logout') }}
            </button>
          </div>
        </div>

      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShoppingBag, ShoppingCart, Heart, ClipboardList, LogOut, LogIn, LayoutGrid,
  Search, X, Home, User, ChevronDown } from 'lucide-vue-next'
import { useAuthStore }      from '@/stores/auth'
import { useCartStore }      from '@/stores/cart'
import { useOrdersStore }    from '@/stores/orders'
import { useFavoritesStore } from '@/stores/favorites'
import { useProductsStore }  from '@/stores/products'
import { useLocaleStore, LOCALES } from '@/stores/locale'

const router         = useRouter()
const route          = useRoute()
const authStore      = useAuthStore()
const cartStore      = useCartStore()
const ordersStore    = useOrdersStore()
const favoritesStore = useFavoritesStore()
const productsStore  = useProductsStore()
const localeStore    = useLocaleStore()
const t = (key) => localeStore.t(key)

// ── Locale picker ──
const locales        = LOCALES
const localeOpen     = ref(false)
const selectLocale   = (loc) => { localeStore.setLocale(loc); localeOpen.value = false }

// ── User menu ──
const userMenuOpen = ref(false)

// ── Cerrar dropdowns al hacer click fuera (reemplaza el overlay div) ──
// Se usa document click listener en lugar de un overlay para no bloquear eventos de hover
const _closeDropdowns = () => { localeOpen.value = false; userMenuOpen.value = false }
onMounted(() => document.addEventListener('click', _closeDropdowns))
onUnmounted(() => document.removeEventListener('click', _closeDropdowns))

// Rastrear posición del mouse para forzar re-evaluación de :hover tras cambios de DOM
let _mouseX = 0
let _mouseY = 0
const _trackMouse = (e) => { _mouseX = e.clientX; _mouseY = e.clientY }
onMounted(() => window.addEventListener('mousemove', _trackMouse, { passive: true }))
onUnmounted(() => window.removeEventListener('mousemove', _trackMouse))

const handleLogout = async () => {
  userMenuOpen.value = false
  authStore.logout()
  await router.push('/')
  // Forzar re-evaluación de :hover en los botones recién renderizados.
  // El navegador solo actualiza :hover en el próximo mousemove; lo disparamos
  // sintéticamente con la posición real del cursor.
  await nextTick()
  document.dispatchEvent(new MouseEvent('mousemove', {
    bubbles: true, cancelable: true, clientX: _mouseX, clientY: _mouseY,
  }))
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 400;
  background: linear-gradient(135deg, #0d1b2a 0%, #1a2e4a 60%, #0d1b2a 100%);
  border-bottom: none;
  box-shadow: 0 4px 24px rgba(0,0,0,.4), 0 1px 0 rgba(59,130,246,.2);
}

/* Línea de acento azul en la base del header */
.app-header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #3b82f6 25%, #93c5fd 50%, #3b82f6 75%, transparent 100%);
  opacity: 0.75;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  gap: 1rem;
}

/* ─── Brand ─── */
.brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  color: var(--color-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.brand svg { color: #60a5fa; }

.brand-name {
  font-size: 1.08rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

/* ─── Search ─── */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 380px;
  margin: 0 1.5rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: rgba(255,255,255,.4);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.45rem 2.2rem 0.45rem 2.2rem;
  background: rgba(255,255,255,.08);
  border: 1.5px solid rgba(255,255,255,.18);
  border-radius: 2rem;
  font-size: 0.9rem;
  color: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.search-input::placeholder { color: rgba(255,255,255,.4); }

.search-input:focus {
  border-color: #3b82f6;
  background: rgba(59,130,246,.12);
  box-shadow: 0 0 0 3px rgba(59,130,246,.2);
}

.search-clear {
  position: absolute;
  right: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0.1rem;
  border-radius: 50%;
  transition: color 0.15s;
}
.search-clear { color: rgba(255,255,255,.45); }
.search-clear:hover { color: #fff; }

/* ─── Nav ─── */
.nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav a,
.nav .btn-logout {
  text-decoration: none;
  color: rgba(255,255,255,.7);
  transition: color 0.15s, background 0.15s;
}

/* ─── Íconos ─── */
.nav-icon,
.nav-tip {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  transition: background 0.15s, color 0.15s;
}

.nav-tip:hover {
  background: rgba(59,130,246,.18);
  color: #93c5fd;
}
.nav-tip.router-link-active {
  background: rgba(59,130,246,.22);
  color: #60a5fa;
  box-shadow: inset 0 0 0 1.5px rgba(96,165,250,.35);
}

/* Botón de logout */
.btn-logout {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* ─── Badge ─── */
.badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 1rem;
  font-size: 0.6rem;
  padding: 0 3.5px;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 1.5px solid #0d1b2a;
  box-shadow: 0 1px 4px rgba(0,0,0,.4);
}

.badge-favorites { background: #e5355a; }
.badge-orders    { background: #d97706; }

/* ─── Tooltip ─── */
.nav-tip::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: #1f2937;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 200;
}

.nav-tip::before {
  content: '';
  position: absolute;
  top: calc(100% + 3px);
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  border: 5px solid transparent;
  border-bottom-color: #1f2937;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 200;
}

.nav-tip:hover::after,
.nav-tip:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ─── Locale Picker ─── */
.locale-picker {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.65rem;
  border: 1.5px solid rgba(255,255,255,.18);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  background: rgba(255,255,255,.08);
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
  margin-left: 0.4rem;
}
.locale-picker:hover,
.locale-picker.open { border-color: #3b82f6; background: rgba(59,130,246,.18); }

.locale-flag-img {
  width: 20px;
  height: 14px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}
.lo-flag-img {
  width: 20px;
  height: 14px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}
.locale-code { font-size: 0.82rem; font-weight: 700; color: #fff; }
.locale-sep  { font-size: 0.75rem; color: rgba(255,255,255,.25); margin: 0 0.05rem; }
.locale-lang { font-size: 0.78rem; color: rgba(255,255,255,.6); }
.locale-chevron { color: rgba(255,255,255,.5); transition: transform 0.2s; margin-left: 0.1rem; }
.locale-picker.open .locale-chevron { transform: rotate(180deg); }

.locale-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 210px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  box-shadow: 0 12px 32px rgba(0,0,0,.14);
  overflow: hidden;
  z-index: 500;
  padding: 0.75rem 0 0.5rem;
}

.ld-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 1rem 0.65rem;
  margin: 0;
}

.locale-option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--color-text);
  transition: background 0.12s;
  text-align: left;
}
.locale-option:hover { background: var(--color-bg); }
.locale-option.active {
  background: #eff6ff;
  color: var(--color-primary);
}
.locale-option.active .lo-check { visibility: visible; }

.lo-check {
  visibility: hidden;
  font-size: 0.75rem;
  color: var(--color-primary);
  font-weight: 700;
  width: 12px;
  flex-shrink: 0;
}
.lo-name { font-weight: 600; font-size: 0.88rem; flex: 1; }
.lo-lang-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.3rem;
  padding: 0.1rem 0.35rem;
  margin-left: auto;
}
.locale-option.active .lo-lang-badge {
  background: #dbeafe;
  border-color: #93c5fd;
  color: var(--color-primary);
}

.ld-divider { height: 1px; background: var(--color-border); margin: 0.5rem 0; }

.ld-see-all {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 600;
  text-align: center;
  transition: background 0.12s;
}
.ld-see-all:hover { background: #eff6ff; }

/* ─── User Menu ─── */
.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.38rem 0.65rem;
  border: 1.5px solid rgba(255,255,255,.18);
  border-radius: 0.5rem;
  cursor: pointer;
  background: rgba(255,255,255,.08);
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
  margin-left: 0.4rem;
}
.user-menu:hover,
.user-menu.open { border-color: #3b82f6; background: rgba(59,130,246,.18); }

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-greeting {
  font-size: 0.82rem;
  color: rgba(255,255,255,.7);
  white-space: nowrap;
}
.user-greeting strong {
  color: #fff;
  font-weight: 700;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-chevron { color: rgba(255,255,255,.5); transition: transform 0.2s; }
.user-menu.open .user-chevron { transform: rotate(180deg); }

.auth-links {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: 0.25rem;
}
.auth-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  cursor: pointer;
  border: 1.5px solid rgba(255,255,255,.22);
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.9);
}
.auth-btn:hover {
  border-color: #93c5fd;
  color: #fff;
  background: rgba(59,130,246,.2);
}
.auth-btn-solid {
  border-color: #3b82f6;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}
.auth-btn-solid:hover {
  border-color: #60a5fa;
  background: #1d4ed8;
  color: #fff;
}
.auth-btn-solid .user-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 210px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 0.6rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  overflow: hidden;
  z-index: 500;
}

.ud-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
}
.ud-avatar-lg {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ud-name { font-size: 0.87rem; font-weight: 700; margin: 0; color: var(--color-text); }
.ud-email { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.1rem 0 0; }

.ud-divider { height: 1px; background: var(--color-border); margin: 0; }

.ud-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.83rem;
  color: var(--color-text);
  text-decoration: none;
  transition: background 0.12s;
}
.ud-item:hover { background: var(--color-bg); }
.ud-logout { color: #dc2626; }
.ud-logout:hover { background: #fef2f2; }


</style>
