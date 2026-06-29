<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="visible" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-box">
          <div class="confirm-icon" :class="type">
            <i class="bi" :class="iconClass"></i>
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-msg">{{ message }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn-cancel" @click="cancel">Cancelar</button>
            <button class="confirm-btn-ok" :class="type" @click="ok">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar accion' },
  message: { type: String, default: '¿Estas seguro?' },
  confirmText: { type: String, default: 'Confirmar' },
  type: { type: String, default: 'danger' },
})

const emit = defineEmits(['confirm', 'cancel'])

const iconClass = computed(() => {
  if (props.type === 'danger') return 'bi-exclamation-triangle-fill'
  if (props.type === 'warning') return 'bi-question-circle-fill'
  return 'bi-info-circle-fill'
})

function ok() { emit('confirm') }
function cancel() { emit('cancel') }
</script>

<style scoped>
.confirm-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.confirm-box {
  background: #fff;
  border-radius: 18px;
  padding: 1.8rem 1.6rem 1.4rem;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.confirm-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.8rem;
  font-size: 1.4rem;
}
.confirm-icon.danger { background: rgba(220,38,38,0.1); color: #dc2626; }
.confirm-icon.warning { background: rgba(245,158,11,0.1); color: #f59e0b; }
.confirm-icon.info { background: rgba(59,130,246,0.1); color: #3b82f6; }

.confirm-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  color: #1a1a1a;
}

.confirm-msg {
  font-size: 0.88rem;
  color: #555;
  margin: 0 0 1.3rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
}

.confirm-btn-cancel, .confirm-btn-ok {
  padding: 0.55rem 1.3rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.confirm-btn-cancel {
  background: rgba(0,0,0,0.06);
  color: #555;
}
.confirm-btn-cancel:hover { background: rgba(0,0,0,0.1); }

.confirm-btn-ok.danger { background: #dc2626; color: #fff; }
.confirm-btn-ok.danger:hover { background: #b91c1c; }
.confirm-btn-ok.warning { background: #f59e0b; color: #fff; }
.confirm-btn-ok.warning:hover { background: #d97706; }
.confirm-btn-ok.info { background: #3b82f6; color: #fff; }
.confirm-btn-ok.info:hover { background: #2563eb; }

.confirm-fade-enter-active, .confirm-fade-leave-active { transition: opacity 0.2s; }
.confirm-fade-enter-from, .confirm-fade-leave-to { opacity: 0; }
</style>
