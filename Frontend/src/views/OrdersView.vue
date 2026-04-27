<template>
  <div class="orders-page container page-wrapper">

    <!-- Cabecera de página -->
    <div class="page-head reveal">
      <div>
        <span class="section-eyebrow">{{ t('orders.eyebrow') }}</span>
        <h2 class="section-title">{{ t('orders.title') }}</h2>
        <span class="section-title-line"></span>
        <p class="page-subtitle" v-if="orders.length" style="margin-top:.5rem">
          {{ orders.length }} {{ orders.length !== 1 ? t('orders.total.n') : t('orders.total.1') }}
        </p>
      </div>
    </div>

    <!-- Tabs de filtro -->
    <div v-if="orders.length" class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-msg">{{ t('orders.loading') }}</div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Sin pedidos -->
    <div v-else-if="orders.length === 0" class="empty-state">
      <div class="empty-icon"><Package :size="52" stroke-width="1" /></div>
      <h3>{{ t('orders.empty.h') }}</h3>
      <p>{{ t('orders.empty.p') }}</p>
      <RouterLink to="/" class="btn-primary-link">{{ t('orders.explore') }}</RouterLink>
    </div>

    <!-- Filtro sin resultados -->
    <div v-else-if="filteredOrders.length === 0" class="empty-state small">
      <p>{{ t('orders.nofilter') }}</p>
    </div>

    <!-- Lista de pedidos -->
    <div v-else class="orders-list">
      <div
        v-for="(order, index) in filteredOrders"
        :key="order.id"
        :class="['order-card reveal', `reveal-d${(index % 4) + 1}`, { 'is-cancelled': order.status === 'cancelled' }]"
      >
        <!-- ── Header de la tarjeta ── -->
        <div class="card-head">
          <div class="card-head-left">
            <span class="order-id">Orden #{{ order.id.substring(0, 8).toUpperCase() }}</span>
            <span class="order-date">
              <CalendarDays :size="13" stroke-width="1.5" />
              {{ formatDate(order.createdAt) }}
            </span>
          </div>
          <div class="card-head-right">
            <span :class="['status-badge', order.status]">
              <component :is="statusIcon(order.status)" :size="12" stroke-width="2" />
              {{ statusLabel(order.status) }}
            </span>
          </div>
        </div>

        <!-- ── Línea de tiempo de estado ── -->
        <div class="status-timeline" v-if="order.status !== 'cancelled'">
          <div
            v-for="(step, i) in timelineSteps"
            :key="step.key"
            :class="['timeline-step', { done: isStepDone(order.status, i), active: isStepActive(order.status, i) }]"
          >
            <div class="step-dot">
              <Check v-if="isStepDone(order.status, i)" :size="10" stroke-width="3" />
            </div>
            <span class="step-label">{{ step.label }}</span>
            <div v-if="i < timelineSteps.length - 1" class="step-line" />
          </div>
        </div>

        <!-- ── Productos ── -->
        <div class="card-body">
          <div v-for="item in order.items" :key="item.productId" class="order-item">
            <div class="item-thumb-wrap">
              <img
                :src="resolveImg(item.imageUrl)"
                :alt="item.name"
                class="item-thumb"
                @error="e => e.target.src = '/placeholder.png'"
              />
              <span class="item-qty-badge">{{ item.quantity }}</span>
            </div>
            <div class="item-details">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-unit">{{ mxn(item.price) }} c/u</span>
            </div>
            <span class="item-subtotal">{{ mxn(item.subtotal) }}</span>
          </div>
        </div>

        <!-- ── Resumen de precio ── -->
        <div class="card-pricing">
          <div class="pricing-row">
            <span>{{ t('orders.subtotal') }} ({{ totalUnits(order) }})</span>
            <span>{{ mxn(order.total) }}</span>
          </div>
          <div class="pricing-row">
            <span>{{ t('orders.shipping') }}</span>
            <span class="free-shipping">{{ t('orders.free') }}</span>
          </div>
          <div class="pricing-row total-row">
            <span>{{ t('orders.ordertotal') }}</span>
            <strong>{{ mxn(order.total) }}</strong>
          </div>
        </div>

        <!-- ── Acciones ── -->
        <div class="card-actions">
          <button
            v-if="order.status !== 'cancelled'"
            class="btn-action btn-cancel-order"
            :disabled="cancelling === order.id"
            @click="promptCancel(order)"
          >
            <XCircle :size="15" stroke-width="1.5" />
            {{ cancelling === order.id ? t('orders.canceling') : t('orders.cancel') }}
          </button>

          <!-- Pedido cancelado: nota + botón eliminar -->
          <template v-else>
            <span class="cancelled-note">
              <Info :size="13" stroke-width="1.5" />
              {{ t('orders.cancelled') }}
            </span>
            <button
              class="btn-action btn-delete-order"
              :disabled="deleting === order.id"
              @click="deleteOrder(order.id)"
            >
              <LoadingSpinner v-if="deleting === order.id" small />
              <Trash2 v-else :size="14" stroke-width="1.5" />
              {{ deleting === order.id ? '...' : t('orders.delete') }}
            </button>
          </template>

          <button class="btn-action btn-reorder" @click="reorder(order)">
            <RotateCcw :size="15" stroke-width="1.5" />
            {{ t('orders.reorder') }}
          </button>
        </div>

      </div>
    </div>

    <!-- ── Modal de confirmación ── -->
    <div v-if="confirmOrder" class="modal-overlay" @click.self="confirmOrder = null">
      <div class="modal">
        <div class="modal-header">
          <AlertTriangle :size="22" stroke-width="1.5" class="modal-warn-icon" />
          <h3>{{ t('orders.modal.title') }}</h3>
        </div>
        <p>
          Orden <strong>#{{ confirmOrder.id.substring(0, 8).toUpperCase() }}</strong> por
          <strong>{{ mxn(confirmOrder.total) }}</strong>.
        </p>
        <div class="modal-detail">
          <span v-for="item in confirmOrder.items" :key="item.productId" class="modal-item">
            {{ item.name }} ×{{ item.quantity }}
          </span>
        </div>
        <p class="modal-warning">{{ t('orders.modal.warn') }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="confirmOrder = null">{{ t('orders.modal.keep') }}</button>
          <button class="btn-danger" @click="doCancel">{{ t('orders.modal.yes') }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore }  from '@/stores/orders'
import { useCartStore }    from '@/stores/cart'
import { useLocaleStore }  from '@/stores/locale'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import {
  Package, CalendarDays, Check, CheckCircle2, XCircle,
  Clock, Truck, RotateCcw, Info, AlertTriangle, Trash2,
} from 'lucide-vue-next'
import { useReveal } from '@/composables/useReveal'

const router      = useRouter()
const ordersStore = useOrdersStore()
const cartStore   = useCartStore()
const localeStore = useLocaleStore()
const t = (key) => localeStore.t(key)
const orders      = computed(() => ordersStore.orders)
const loading     = computed(() => ordersStore.loading)
const error       = ref(null)
const cancelling   = ref(null)
const deleting     = ref(null)
const confirmOrder = ref(null)
const activeTab    = ref('all')

const tabs = computed(() => [
  { key: 'all',       label: t('orders.tab.all'),    count: orders.value.length },
  { key: 'active',    label: t('orders.tab.active'), count: orders.value.filter(o => o.status !== 'cancelled').length },
  { key: 'cancelled', label: t('orders.tab.cancel'), count: orders.value.filter(o => o.status === 'cancelled').length },
])

const filteredOrders = computed(() => {
  if (activeTab.value === 'active')    return orders.value.filter(o => o.status !== 'cancelled')
  if (activeTab.value === 'cancelled') return orders.value.filter(o => o.status === 'cancelled')
  return orders.value
})

// ── Timeline (reactive to locale) ──
const timelineSteps = computed(() => [
  { key: 'pending',   label: t('timeline.pending')   },
  { key: 'confirmed', label: t('timeline.confirmed') },
  { key: 'shipping',  label: t('timeline.shipping')  },
  { key: 'completed', label: t('timeline.completed') },
])
const statusOrder = { pending: 0, confirmed: 1, shipping: 2, completed: 3 }
const isStepDone   = (status, i) => (statusOrder[status] ?? 3) > i
const isStepActive = (status, i) => (statusOrder[status] ?? 3) === i

// ── Helpers ──
const mxn = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const statusLabel = (s) =>
  ({ pending: t('status.pending'), confirmed: t('status.confirmed'),
     shipping: t('status.shipping'), completed: t('status.completed'),
     cancelled: t('status.cancelled') })[s] ?? s

const statusIcon = (s) =>
  s === 'cancelled' ? XCircle : s === 'completed' ? CheckCircle2 : s === 'shipping' ? Truck : Clock

const totalUnits = (order) =>
  order.items.reduce((sum, i) => sum + (i.quantity || 1), 0)

const resolveImg = (url) => {
  if (!url) return '/placeholder.png'
  if (url.includes('unsplash.com') || url.includes('picsum.') || url.includes('placeholder.com')) {
    return '/placeholder.png'
  }
  return url
}

// ── Acciones ──
onMounted(() => {
  if (ordersStore.orders.length === 0) ordersStore.fetchOrders()
})
useReveal()

const promptCancel = (order) => { confirmOrder.value = order }

const doCancel = async () => {
  const order = confirmOrder.value
  confirmOrder.value = null
  cancelling.value = order.id
  try {
    await ordersStore.cancelOrder(order.id)
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cancelar la orden.'
  } finally {
    cancelling.value = null
  }
}

const reorder = async (order) => {
  for (const item of order.items) {
    await cartStore.addItem({ ...item, id: item.productId })
  }
  router.push('/cart')
}

const deleteOrder = async (orderId) => {
  deleting.value = orderId
  try {
    await ordersStore.removeOrder(orderId)
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al eliminar la orden.'
  } finally {
    deleting.value = null
  }
}
</script>

<style scoped>
/* ── Layout ── */
.orders-page { max-width: 800px; margin: 0 auto; }

.page-head { margin-bottom: 1.25rem; }
.page-head h2 { margin: 0 0 0.2rem; font-size: 1.5rem; }
.page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }

/* ── Tabs ── */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn:hover { color: var(--color-text); }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.tab-count {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0 6px;
  min-width: 20px;
  text-align: center;
  color: var(--color-text-muted);
}
.tab-btn.active .tab-count {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: var(--color-primary);
}

/* ── Empty states ── */
.empty-state {
  text-align: center;
  padding: 4rem 1rem 3rem;
  color: var(--color-text-muted);
}
.empty-state.small { padding: 2rem 1rem; }
.empty-icon { color: var(--color-border); margin-bottom: 1rem; }
.empty-state h3 { margin: 0 0 0.5rem; color: var(--color-text); font-size: 1.1rem; }
.empty-state p { margin: 0 0 1.25rem; font-size: 0.9rem; }
.btn-primary-link {
  display: inline-block;
  padding: 0.6rem 1.5rem;
  background: var(--color-primary);
  color: #fff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.15s;
}
.btn-primary-link:hover { background: var(--color-primary-h, #1d4ed8); }

.loading-msg { color: var(--color-text-muted); padding: 2rem 0; }

/* ── Lista ── */
.orders-list { display: flex; flex-direction: column; gap: 1.25rem; }

.order-item-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  position: relative;
}
.order-item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ── Tarjeta ── */
.order-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.875rem;
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.07); }

.order-card.is-cancelled {
  opacity: 0.72;
  background: #fafafa;
}

/* ── Cabecera tarjeta ── */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.card-head-left { display: flex; flex-direction: column; gap: 0.3rem; }

.order-id {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.01em;
}

.order-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

/* ── Badge de estado ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.65rem;
  border-radius: 2rem;
  font-size: 0.775rem;
  font-weight: 600;
  white-space: nowrap;
}
.status-badge.completed  { background: #d1fae5; color: #065f46; }
.status-badge.cancelled  { background: #fee2e2; color: #991b1b; }
.status-badge.pending    { background: #fef9c3; color: #713f12; }
.status-badge.confirmed  { background: #dbeafe; color: #1e40af; }
.status-badge.shipping   { background: #e0f2fe; color: #0369a1; }

/* ── Timeline de estado ── */
.status-timeline {
  display: flex;
  align-items: flex-start;
  padding: 1rem 1.5rem 0.5rem;
  gap: 0;
  position: relative;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  gap: 0.35rem;
}

.step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: #fff;
  z-index: 1;
  transition: background 0.2s, border-color 0.2s;
}

.timeline-step.done .step-dot   { background: var(--color-primary); border-color: var(--color-primary); }
.timeline-step.active .step-dot { border-color: var(--color-primary); background: #eff6ff; }
.timeline-step.active .step-dot::after {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.step-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-align: center;
}
.timeline-step.done .step-label, .timeline-step.active .step-label { color: var(--color-primary); }

.step-line {
  position: absolute;
  top: 11px;
  left: calc(50% + 11px);
  right: calc(-50% + 11px);
  height: 2px;
  background: var(--color-border);
  z-index: 0;
}
.timeline-step.done .step-line { background: var(--color-primary); }

/* ── Productos ── */
.card-body {
  padding: 0.875rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.item-thumb-wrap {
  position: relative;
  flex-shrink: 0;
}

.item-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.item-qty-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--color-text);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 1.5px solid var(--color-surface);
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.item-name { font-size: 0.9rem; font-weight: 500; color: var(--color-text); }
.item-unit { font-size: 0.78rem; color: var(--color-text-muted); }

.item-subtotal { font-size: 0.95rem; font-weight: 700; color: var(--color-text); white-space: nowrap; }

/* ── Precio desglosado ── */
.card-pricing {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: var(--color-bg);
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.free-shipping { color: #16a34a; font-weight: 600; }

.total-row {
  font-size: 0.95rem;
  color: var(--color-text);
  padding-top: 0.35rem;
  border-top: 1px dashed var(--color-border);
  margin-top: 0.2rem;
}

/* ── Acciones ── */
.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn-cancel-order {
  border-color: #fca5a5;
  background: #fff1f2;
  color: #b91c1c;
}
.btn-cancel-order:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #ef4444;
}
.btn-cancel-order:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete-order {
  border-color: #fca5a5;
  background: #fff1f2;
  color: #b91c1c;
}
.btn-delete-order:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.btn-reorder {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  margin-left: auto;
}
.btn-reorder:hover {
  background: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-primary);
}

.cancelled-note {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--color-surface);
  border-radius: 0.875rem;
  padding: 1.75rem 2rem;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.modal-warn-icon { color: #f59e0b; flex-shrink: 0; }

.modal-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-bg);
  border-radius: 0.4rem;
  margin: 0.75rem 0;
}
.modal-item { font-size: 0.82rem; color: var(--color-text-muted); }

.modal-warning { color: #b91c1c; font-size: 0.82rem; margin-bottom: 1.25rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

.btn-secondary {
  padding: 0.55rem 1.1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  transition: background 0.15s;
}
.btn-secondary:hover { background: var(--color-bg); }

.btn-danger {
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 0.5rem;
  background: #dc2626;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background 0.15s;
}
.btn-danger:hover { background: #b91c1c; }
</style>
