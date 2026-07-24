<template>
  <Teleport to="body">
    <Transition name="pc-fade">
      <div v-if="open" class="pc-backdrop" @click.self="cancel">
        <div class="pc-modal">
          <div class="pc-hd">
            <i class="bi bi-shield-lock-fill pc-shield"></i>
            <div class="pc-hd-text">
              <h3>Confirmación requerida</h3>
              <p>Ingresá tu contraseña para continuar</p>
            </div>
            <button class="pc-close" @click="cancel"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="pc-body">
            <input
              ref="inputRef"
              v-model="password"
              type="password"
              inputmode="numeric"
              maxlength="4"
              placeholder="Contraseña (4 dígitos)"
              class="pc-input"
              autocomplete="current-password"
              @keydown.enter="submit(password)"
              @keydown.escape="cancel"
            />
            <p v-if="error" class="pc-error">
              <i class="bi bi-exclamation-triangle-fill"></i> {{ error }}
            </p>
          </div>

          <div class="pc-ft">
            <button class="pc-btn-cancel" @click="cancel">Cancelar</button>
            <button class="pc-btn-confirm" :disabled="busy" @click="submit(password)">
              <span v-if="busy" class="pc-spin"></span>
              <span v-else><i class="bi bi-check-lg"></i> Confirmar</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const { open, error, busy, submit, cancel } = usePasswordConfirm()
const password = ref('')
const inputRef = ref(null)

watch(open, (v) => {
  if (v) {
    password.value = ''
    nextTick(() => inputRef.value?.focus())
  }
})
</script>

<style scoped>
.pc-backdrop {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.pc-modal {
  background: #fff;
  border-radius: 14px;
  width: min(380px, 100%);
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  overflow: hidden;
}

.pc-hd {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1.1rem 1.25rem 0.9rem;
  border-bottom: 1px solid #f1f5f9;
}
.pc-shield {
  font-size: 1.4rem; color: #dc2626; flex-shrink: 0;
}
.pc-hd-text { flex: 1; }
.pc-hd-text h3 {
  margin: 0; font-size: 0.9rem; font-weight: 700;
  color: #1e293b; text-transform: uppercase; letter-spacing: 0.03em;
}
.pc-hd-text p {
  margin: 0; font-size: 0.78rem; color: #64748b;
  text-transform: none; letter-spacing: 0;
}

.pc-close {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(0,0,0,0.05); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; font-size: 0.75rem; flex-shrink: 0;
  box-shadow: none; padding: 0;
}
.pc-close:hover { background: rgba(220,38,38,0.1); color: #dc2626; }

.pc-body {
  padding: 1.1rem 1.25rem 0.75rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}

.pc-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 1rem; color: #1e293b;
  letter-spacing: 0.2em;
  text-align: center;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pc-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
  background: #fff;
}

.pc-error {
  display: flex; align-items: center; gap: 0.4rem;
  margin: 0; font-size: 0.8rem; color: #dc2626;
  text-transform: none; letter-spacing: 0;
}
.pc-error i { flex-shrink: 0; }

.pc-ft {
  display: flex; gap: 0.6rem; justify-content: flex-end;
  padding: 0.75rem 1.25rem 1rem;
  border-top: 1px solid #f1f5f9;
}

.pc-btn-cancel {
  padding: 0.5rem 1rem; border-radius: 8px; border: none;
  background: #f1f5f9; color: #475569;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  box-shadow: none;
}
.pc-btn-cancel:hover { background: #e2e8f0; }

.pc-btn-confirm {
  padding: 0.5rem 1.1rem; border-radius: 8px; border: none;
  background: #dc2626; color: #fff;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 0.4rem;
  box-shadow: none; min-width: 100px; justify-content: center;
}
.pc-btn-confirm:hover:not(:disabled) { background: #b91c1c; transform: none; }
.pc-btn-confirm:disabled { background: #fca5a5; cursor: not-allowed; }

.pc-spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: pc-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes pc-spin { to { transform: rotate(360deg); } }

.pc-fade-enter-active, .pc-fade-leave-active { transition: opacity 0.18s; }
.pc-fade-enter-from, .pc-fade-leave-to { opacity: 0; }

/* Dark mode */
:root[data-theme="dark"] .pc-modal {
  background: #0f172a;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}
:root[data-theme="dark"] .pc-hd { border-color: rgba(255,255,255,0.08); }
:root[data-theme="dark"] .pc-hd-text h3 { color: #f1f5f9; }
:root[data-theme="dark"] .pc-hd-text p { color: rgba(255,255,255,0.45); }
:root[data-theme="dark"] .pc-close { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
:root[data-theme="dark"] .pc-close:hover { background: rgba(220,38,38,0.2); color: #fca5a5; }
:root[data-theme="dark"] .pc-input { background: rgba(13,18,35,0.8); border-color: rgba(255,255,255,0.12); color: #f1f5f9; }
:root[data-theme="dark"] .pc-input:focus { border-color: #ef4444; background: rgba(13,18,35,0.95); }
:root[data-theme="dark"] .pc-ft { border-color: rgba(255,255,255,0.08); }
:root[data-theme="dark"] .pc-btn-cancel { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.65); }
:root[data-theme="dark"] .pc-btn-cancel:hover { background: rgba(255,255,255,0.12); }
</style>
