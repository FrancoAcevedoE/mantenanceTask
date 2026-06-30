<template>
  <span class="help-wrap">
    <button type="button" class="help-btn" @click.stop="toggle" :aria-label="tip">?</button>
    <transition name="help-fade">
      <div v-if="open" class="help-popup" @click.stop>
        <img v-if="img" :src="img" :alt="tip" class="help-img" />
        <p class="help-text">{{ tip }}</p>
        <button type="button" class="help-close" @click="open = false">✕</button>
      </div>
    </transition>
  </span>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  tip: { type: String, required: true },
  img: { type: String, default: '' }
})

const open = ref(false)
const toggle = () => { open.value = !open.value }

// cierra al hacer click fuera
const close = (e) => { open.value = false }
if (typeof window !== 'undefined') {
  window.addEventListener('click', close)
}
</script>

<style scoped>
.help-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 0.3rem;
}

.help-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary, #6b8e3a);
  color: #fff;
  border: none;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.8;
  transition: opacity 0.15s;
}

.help-btn:hover { opacity: 1; }

.help-popup {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #e2e8d8;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.14);
  padding: 0.75rem;
  width: 220px;
  z-index: 2000;
  text-align: left;
}

.help-img {
  width: 100%;
  border-radius: 6px;
  margin-bottom: 0.4rem;
  display: block;
}

.help-text {
  margin: 0;
  font-size: 0.8rem;
  color: #444;
  line-height: 1.4;
}

.help-close {
  position: absolute;
  top: 4px;
  right: 6px;
  background: none;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.help-fade-enter-active,
.help-fade-leave-active { transition: opacity 0.15s; }
.help-fade-enter-from,
.help-fade-leave-to { opacity: 0; }
</style>
