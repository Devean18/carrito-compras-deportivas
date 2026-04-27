<template>
  <div class="cart-item">
    <img :src="item.imageUrl || '/placeholder.png'" :alt="item.name" />

    <div class="item-info">
      <p class="item-name">{{ item.name }}</p>
      <p class="item-price">{{ mxn(item.price) }} c/u</p>
    </div>

    <div class="item-stepper">
      <button class="step-btn" @click="$emit('update', item.quantity - 1)">−</button>
      <span class="step-qty">{{ item.quantity }}</span>
      <button class="step-btn" @click="$emit('update', item.quantity + 1)">+</button>
    </div>

    <div class="item-subtotal">{{ mxn(item.subtotal) }}</div>

    <button class="btn-ghost btn-danger" @click="$emit('remove')" title="Eliminar">
      <Trash2 :size="15" stroke-width="1.5" />
    </button>
  </div>
</template>

<script setup>
import { Trash2 } from 'lucide-vue-next'

const mxn = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

defineProps({
  item: { type: Object, required: true },
})
defineEmits(['remove', 'update'])
</script>

<style scoped>
.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}

.cart-item img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.item-info { flex: 1; }
.item-name  { font-weight: 600; font-size: 0.95rem; }
.item-price { font-size: 0.82rem; color: var(--color-text-muted); }

.item-stepper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.15rem 0.3rem;
}

.step-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  color: var(--color-text);
  transition: background 0.15s;
}

.step-btn:hover { background: var(--color-bg); }

.step-qty {
  font-size: 0.88rem;
  font-weight: 600;
  min-width: 22px;
  text-align: center;
  color: var(--color-text);
}

.item-subtotal { font-weight: 700; min-width: 80px; text-align: right; }

.btn-danger { color: #ef4444; display: flex; align-items: center; }
.btn-danger:hover { background: #fee2e2; }
</style>
