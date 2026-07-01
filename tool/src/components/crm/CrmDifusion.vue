<template>
  <Teleport to="body">
    <div v-if="open" class="dif-backdrop" @click.self="emit('close')">
      <div class="dif-modal">

        <!-- Header -->
        <div class="dif-header">
          <div class="dif-header-title">
            <i class="bi bi-megaphone-fill"></i>
            <span>Difusión masiva</span>
          </div>
          <button class="dif-close" @click="emit('close')"><i class="bi bi-x-lg"></i></button>
        </div>

        <!-- Steps indicator -->
        <div class="dif-steps-bar">
          <div v-for="(s, i) in STEPS" :key="i"
            :class="['dif-step-item', { 'dif-step-item--active': step === i + 1, 'dif-step-item--done': step > i + 1 }]">
            <div class="dif-step-circle">
              <i v-if="step > i + 1" class="bi bi-check-lg"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="dif-step-label">{{ s }}</span>
          </div>
        </div>

        <!-- ── STEP 1: Destinatarios ── -->
        <div v-if="step === 1" class="dif-body">
          <p class="dif-section-hint">¿A quiénes querés enviar el mensaje?</p>

          <div class="dif-mode-grid">
            <label v-for="m in MODES" :key="m.key"
              :class="['dif-mode-card', { 'dif-mode-card--on': mode === m.key }]">
              <input type="radio" :value="m.key" v-model="mode" hidden />
              <i :class="m.icon"></i>
              <strong>{{ m.label }}</strong>
              <span>{{ m.desc }}</span>
            </label>
          </div>

          <!-- Por zona: selector de lugares únicos -->
          <div v-if="mode === 'zona'" class="dif-zone-wrap">
            <label class="dif-label">Zona / Provincia</label>
            <div class="dif-zone-chips">
              <button
                v-for="z in uniqueZones"
                :key="z"
                :class="['dif-zone-chip', { 'dif-zone-chip--on': selectedZones.includes(z) }]"
                @click="toggleZone(z)">
                <i class="bi bi-geo-alt-fill"></i> {{ z }}
              </button>
              <span v-if="!uniqueZones.length" class="dif-muted">No hay zonas registradas en los clientes</span>
            </div>
          </div>

          <!-- Selección manual -->
          <div v-if="mode === 'manual'" class="dif-manual-wrap">
            <div class="dif-manual-search">
              <i class="bi bi-search"></i>
              <input v-model="manualSearch" placeholder="Buscar cliente..." class="dif-search-input" />
            </div>
            <div class="dif-manual-list">
              <label
                v-for="c in filteredForManual"
                :key="c._id"
                class="dif-manual-item">
                <input type="checkbox" :value="c._id" v-model="manualSelected" />
                <div class="dif-manual-info">
                  <strong>{{ c.razonSocial || c.name }}</strong>
                  <span class="dif-muted">{{ firstPhone(c) || '(sin teléfono)' }} · {{ c.email || '(sin email)' }}</span>
                </div>
                <div class="dif-manual-icons">
                  <i v-if="firstPhone(c)" class="bi bi-whatsapp" style="color:#25d366"></i>
                  <i v-if="c.email" class="bi bi-envelope-fill" style="color:#3b82f6"></i>
                </div>
              </label>
              <span v-if="!filteredForManual.length" class="dif-muted dif-center">Sin coincidencias</span>
            </div>
          </div>

          <div class="dif-selection-summary">
            <i class="bi bi-people-fill"></i>
            <strong>{{ selectedClients.length }}</strong> destinatarios seleccionados
            <span v-if="selectedWithPhone.length" class="dif-chip dif-chip--wa">
              <i class="bi bi-whatsapp"></i> {{ selectedWithPhone.length }} con WhatsApp
            </span>
            <span v-if="selectedWithEmail.length" class="dif-chip dif-chip--em">
              <i class="bi bi-envelope-fill"></i> {{ selectedWithEmail.length }} con email
            </span>
          </div>
        </div>

        <!-- ── STEP 2: Mensaje ── -->
        <div v-if="step === 2" class="dif-body">
          <p class="dif-section-hint">Escribí el mensaje que se enviará a los <strong>{{ selectedClients.length }}</strong> destinatarios.</p>

          <div class="dif-field">
            <label class="dif-label">Canal de envío</label>
            <div class="dif-channel-row">
              <label :class="['dif-channel-opt', { 'dif-channel-opt--on': channel === 'whatsapp' || channel === 'ambos' }]">
                <input type="checkbox" v-model="useWA" @change="updateChannel" />
                <i class="bi bi-whatsapp" style="color:#25d366"></i> WhatsApp
                <span class="dif-channel-count">({{ selectedWithPhone.length }})</span>
              </label>
              <label :class="['dif-channel-opt', { 'dif-channel-opt--on': channel === 'email' || channel === 'ambos' }]">
                <input type="checkbox" v-model="useEmail" @change="updateChannel" />
                <i class="bi bi-envelope-fill" style="color:#3b82f6"></i> Email
                <span class="dif-channel-count">({{ selectedWithEmail.length }})</span>
              </label>
            </div>
          </div>

          <div class="dif-field">
            <label class="dif-label">Mensaje *</label>
            <textarea
              v-model="message"
              class="dif-textarea"
              rows="6"
              :placeholder="channel === 'email' ? 'Escribí el cuerpo del correo...' : 'Escribí el mensaje de WhatsApp...'"
              maxlength="1000"
            ></textarea>
            <span class="dif-char-count">{{ message.length }} / 1000</span>
          </div>

          <div v-if="channel === 'email' || channel === 'ambos'" class="dif-field">
            <label class="dif-label">Asunto del correo</label>
            <input v-model="emailSubject" placeholder="Ej: Novedades del catálogo" class="dif-input" />
          </div>

          <div v-if="!channel" class="dif-warn">
            <i class="bi bi-exclamation-triangle-fill"></i> Seleccioná al menos un canal de envío.
          </div>
        </div>

        <!-- ── STEP 3: Envío ── -->
        <div v-if="step === 3" class="dif-body">

          <!-- WhatsApp section -->
          <div v-if="useWA" class="dif-send-section">
            <div class="dif-send-header">
              <i class="bi bi-whatsapp" style="color:#25d366;font-size:1.2rem"></i>
              <span><strong>WhatsApp</strong> — {{ selectedWithPhone.length }} contactos en {{ waBatches.length }} batch{{ waBatches.length > 1 ? 'es' : '' }}</span>
              <button class="dif-copy-btn" @click="copyPhones">
                <i class="bi bi-clipboard"></i> Copiar números
              </button>
            </div>

            <div v-if="selectedWithPhone.length > 100" class="dif-warn">
              <i class="bi bi-info-circle-fill"></i>
              WhatsApp limita difusiones a 100 contactos por vez. Los contactos están divididos en batches de 100.
            </div>

            <div v-for="(batch, bi) in waBatches" :key="bi" class="dif-batch">
              <div class="dif-batch-header">
                <span>Batch {{ bi + 1 }} / {{ waBatches.length }} — {{ batch.length }} contactos</span>
                <button class="dif-batch-open-all" @click="openBatch(batch)" title="Abre los links uno a uno">
                  <i class="bi bi-box-arrow-up-right"></i> Abrir en WhatsApp Web
                </button>
              </div>
              <div class="dif-contact-list">
                <a
                  v-for="c in batch"
                  :key="c._id"
                  :href="waLink(firstPhone(c), message)"
                  target="_blank"
                  rel="noopener"
                  class="dif-contact-link">
                  <i class="bi bi-whatsapp"></i>
                  <span>{{ c.razonSocial || c.name }}</span>
                  <span class="dif-muted">{{ firstPhone(c) }}</span>
                  <i class="bi bi-box-arrow-up-right dif-ext-ico"></i>
                </a>
              </div>
            </div>

            <div v-if="noPhone.length" class="dif-warn dif-warn--info">
              <i class="bi bi-telephone-x"></i>
              {{ noPhone.length }} contacto{{ noPhone.length > 1 ? 's' : '' }} sin teléfono no serán incluidos:
              <span class="dif-muted">{{ noPhone.map(c => c.razonSocial || c.name).join(', ') }}</span>
            </div>
          </div>

          <!-- Email section -->
          <div v-if="useEmail" class="dif-send-section">
            <div class="dif-send-header">
              <i class="bi bi-envelope-fill" style="color:#3b82f6;font-size:1.2rem"></i>
              <span><strong>Email</strong> — {{ selectedWithEmail.length }} destinatarios</span>
              <button class="dif-copy-btn" @click="copyEmails">
                <i class="bi bi-clipboard"></i> Copiar emails
              </button>
            </div>

            <div v-for="(batch, bi) in emailBatches" :key="bi" class="dif-batch">
              <div class="dif-batch-header">
                <span>Batch {{ bi + 1 }} / {{ emailBatches.length }} — {{ batch.length }} destinatarios</span>
                <button class="dif-batch-open-all" @click="openMailto(batch)">
                  <i class="bi bi-envelope-arrow-up-fill"></i> Abrir cliente de correo
                </button>
              </div>
              <div class="dif-contact-list">
                <div v-for="c in batch" :key="c._id" class="dif-contact-link dif-contact-link--static">
                  <i class="bi bi-envelope-fill" style="color:#3b82f6"></i>
                  <span>{{ c.razonSocial || c.name }}</span>
                  <span class="dif-muted">{{ c.email }}</span>
                </div>
              </div>
            </div>

            <div v-if="noEmail.length" class="dif-warn dif-warn--info">
              <i class="bi bi-envelope-x"></i>
              {{ noEmail.length }} contacto{{ noEmail.length > 1 ? 's' : '' }} sin email no serán incluidos.
            </div>
          </div>

          <!-- Log activity -->
          <div class="dif-log-row">
            <label class="dif-log-check">
              <input type="checkbox" v-model="logActivity" />
              Registrar difusión como actividad en el CRM
            </label>
            <button v-if="logActivity" class="dif-log-btn" :disabled="savingLog" @click="doLogActivity">
              <div v-if="savingLog" class="btn-spin"></div>
              <span v-else><i class="bi bi-check2-circle"></i> Registrar</span>
            </button>
            <span v-if="logged" class="dif-logged-ok"><i class="bi bi-check-circle-fill"></i> Registrada</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="dif-footer">
          <button v-if="step > 1" class="dif-btn-sec" @click="step--">
            <i class="bi bi-chevron-left"></i> Anterior
          </button>
          <span class="dif-footer-spacer"></span>
          <button v-if="step < 3" class="dif-btn-pri" :disabled="!canNext" @click="nextStep">
            Siguiente <i class="bi bi-chevron-right"></i>
          </button>
          <button v-if="step === 3" class="dif-btn-sec" @click="emit('close')">
            <i class="bi bi-x"></i> Cerrar
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCrmStore } from '@/stores/crm'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])

const crmStore = useCrmStore()

const STEPS = ['Destinatarios', 'Mensaje', 'Enviar']
const MODES = [
  { key: 'todos',  label: 'Todos',           icon: 'bi bi-people-fill',    desc: 'Todos los clientes activos' },
  { key: 'zona',   label: 'Por zona',         icon: 'bi bi-geo-alt-fill',   desc: 'Filtrar por zona o provincia' },
  { key: 'manual', label: 'Selección manual', icon: 'bi bi-list-check',     desc: 'Elegís uno a uno' },
]
const BATCH_WA    = 100
const BATCH_EMAIL = 100

const step          = ref(1)
const mode          = ref('todos')
const selectedZones = ref([])
const manualSearch  = ref('')
const manualSelected = ref([])
const message       = ref('')
const emailSubject  = ref('')
const useWA         = ref(true)
const useEmail      = ref(false)
const channel       = ref('whatsapp')
const logActivity   = ref(false)
const savingLog     = ref(false)
const logged        = ref(false)

watch(() => props.open, (v) => {
  if (v) resetAll()
})

function resetAll() {
  step.value = 1
  mode.value = 'todos'
  selectedZones.value = []
  manualSearch.value = ''
  manualSelected.value = []
  message.value = ''
  emailSubject.value = ''
  useWA.value = true
  useEmail.value = false
  channel.value = 'whatsapp'
  logActivity.value = false
  logged.value = false
}

function updateChannel() {
  if (useWA.value && useEmail.value) channel.value = 'ambos'
  else if (useWA.value) channel.value = 'whatsapp'
  else if (useEmail.value) channel.value = 'email'
  else channel.value = ''
}

const allClients = computed(() => crmStore.visibleClients.filter(c => !c.isDeleted && c.estado !== 'inactivo'))

const uniqueZones = computed(() => {
  const zones = allClients.value.map(c => c.lugar).filter(Boolean)
  return [...new Set(zones)].sort()
})

const filteredForManual = computed(() => {
  const q = manualSearch.value.toLowerCase()
  if (!q) return allClients.value
  return allClients.value.filter(c =>
    (c.razonSocial || c.name || '').toLowerCase().includes(q) ||
    (c.contactoPrincipal || '').toLowerCase().includes(q)
  )
})

const selectedClients = computed(() => {
  if (mode.value === 'todos') return allClients.value
  if (mode.value === 'zona') {
    if (!selectedZones.value.length) return []
    return allClients.value.filter(c => selectedZones.value.includes(c.lugar))
  }
  if (mode.value === 'manual') {
    return allClients.value.filter(c => manualSelected.value.includes(c._id))
  }
  return []
})

const firstPhone = (c) => {
  if (c.telefonos?.length) return c.telefonos[0].numero
  return c.telefono || ''
}

const selectedWithPhone = computed(() => selectedClients.value.filter(c => firstPhone(c)))
const selectedWithEmail = computed(() => selectedClients.value.filter(c => c.email))
const noPhone = computed(() => selectedClients.value.filter(c => !firstPhone(c)))
const noEmail = computed(() => selectedClients.value.filter(c => !c.email))

const waBatches = computed(() => {
  const list = selectedWithPhone.value
  const batches = []
  for (let i = 0; i < list.length; i += BATCH_WA) batches.push(list.slice(i, i + BATCH_WA))
  return batches
})

const emailBatches = computed(() => {
  const list = selectedWithEmail.value
  const batches = []
  for (let i = 0; i < list.length; i += BATCH_EMAIL) batches.push(list.slice(i, i + BATCH_EMAIL))
  return batches
})

const canNext = computed(() => {
  if (step.value === 1) return selectedClients.value.length > 0
  if (step.value === 2) return message.value.trim().length > 0 && !!channel.value
  return true
})

function nextStep() {
  if (canNext.value && step.value < 3) step.value++
}

function toggleZone(z) {
  const idx = selectedZones.value.indexOf(z)
  if (idx === -1) selectedZones.value.push(z)
  else selectedZones.value.splice(idx, 1)
}

function normalizePhone(raw) {
  let n = raw.replace(/\D/g, '')
  if (n.startsWith('54')) return n
  if (n.startsWith('0')) n = '54' + n.slice(1)
  else if (n.length === 10) n = '549' + n
  else n = '54' + n
  return n
}

function waLink(phone, msg) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(msg)}`
}

function openBatch(batch) {
  batch.forEach((c, i) => {
    setTimeout(() => {
      window.open(waLink(firstPhone(c), message.value), '_blank', 'noopener')
    }, i * 300)
  })
}

function openMailto(batch) {
  const bcc = batch.map(c => c.email).join(',')
  const sub = encodeURIComponent(emailSubject.value || 'Mensaje de difusión')
  const body = encodeURIComponent(message.value)
  window.location.href = `mailto:?bcc=${bcc}&subject=${sub}&body=${body}`
}

function copyPhones() {
  const nums = selectedWithPhone.value.map(c => firstPhone(c)).join('\n')
  navigator.clipboard.writeText(nums).then(() => {
    alert(`${selectedWithPhone.value.length} números copiados al portapapeles`)
  })
}

function copyEmails() {
  const emails = selectedWithEmail.value.map(c => c.email).join(', ')
  navigator.clipboard.writeText(emails).then(() => {
    alert(`${selectedWithEmail.value.length} emails copiados al portapapeles`)
  })
}

async function doLogActivity() {
  savingLog.value = true
  try {
    await crmStore.createActivity({
      tipo: 'difusion',
      titulo: `Difusión masiva — ${selectedClients.value.length} destinatarios (${channel.value})`,
      clienteId: selectedClients.value[0]?._id || '',
      descripcion: `Mensaje: "${message.value.slice(0, 200)}${message.value.length > 200 ? '...' : ''}"`,
      fechaProgramada: null,
    })
    logged.value = true
  } catch (e) {
    console.error(e)
  } finally {
    savingLog.value = false
  }
}
</script>

<style scoped>
.dif-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.dif-modal {
  background: #fff;
  border-radius: 20px;
  width: min(640px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

/* Header */
.dif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem 0.85rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dif-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.dif-header-title i { color: #8b5cf6; font-size: 1.15rem; }

.dif-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 0.85rem;
  box-shadow: none;
  transition: background 0.15s;
}
.dif-close:hover { background: #e2e8f0; color: #1e293b; }

/* Steps bar */
.dif-steps-bar {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.4rem;
  gap: 0;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.dif-step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
}

.dif-step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  width: calc(100% - 80px);
  height: 1px;
  background: #e2e8f0;
  left: 80px;
}

.dif-step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;
}

.dif-step-item--active .dif-step-circle { background: #8b5cf6; color: #fff; }
.dif-step-item--done .dif-step-circle { background: #22c55e; color: #fff; }

.dif-step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}
.dif-step-item--active .dif-step-label { color: #1e293b; }
.dif-step-item--done .dif-step-label { color: #64748b; }

/* Body */
.dif-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dif-section-hint {
  font-size: 0.83rem;
  color: #64748b;
  margin: 0;
}

/* Mode selector */
.dif-mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

.dif-mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.9rem 0.5rem;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  background: #f8fafc;
  color: #64748b;
}
.dif-mode-card i { font-size: 1.4rem; }
.dif-mode-card strong { font-size: 0.82rem; color: #1e293b; }
.dif-mode-card span { font-size: 0.7rem; color: #94a3b8; }
.dif-mode-card:hover { border-color: #c4b5fd; }
.dif-mode-card--on { border-color: #8b5cf6; background: #f5f3ff; color: #7c3aed; }
.dif-mode-card--on strong, .dif-mode-card--on i { color: #7c3aed; }

/* Zone chips */
.dif-zone-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
.dif-zone-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.dif-zone-chip {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.78rem;
  cursor: pointer;
  color: #475569;
  box-shadow: none;
  transition: all 0.15s;
}
.dif-zone-chip:hover { border-color: #8b5cf6; }
.dif-zone-chip--on { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }

/* Manual list */
.dif-manual-wrap { display: flex; flex-direction: column; gap: 0.5rem; max-height: 260px; }
.dif-manual-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.75rem;
  color: #94a3b8;
}
.dif-search-input {
  border: none;
  background: transparent;
  flex: 1;
  font-size: 0.83rem;
  color: #1e293b;
  outline: none;
  margin: 0;
  padding: 0;
}
.dif-manual-list {
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 200px;
}
.dif-manual-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.65rem;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.12s;
}
.dif-manual-item:hover { background: #f8fafc; }
.dif-manual-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dif-manual-info strong { font-size: 0.82rem; color: #1e293b; }
.dif-manual-icons { display: flex; gap: 0.35rem; font-size: 0.9rem; }

/* Selection summary */
.dif-selection-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.82rem;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
}
.dif-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}
.dif-chip--wa { background: rgba(37,211,102,0.12); color: #15803d; }
.dif-chip--em { background: rgba(59,130,246,0.12); color: #1d4ed8; }

/* Message step */
.dif-field { display: flex; flex-direction: column; gap: 0.4rem; }
.dif-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
.dif-textarea {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 120px;
  color: #1e293b;
  background: #f8fafc;
  transition: border-color 0.15s;
}
.dif-textarea:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
.dif-char-count { font-size: 0.7rem; color: #94a3b8; text-align: right; }
.dif-input {
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: #1e293b;
  background: #f8fafc;
  width: 100%;
}
.dif-input:focus { outline: none; border-color: #8b5cf6; }

.dif-channel-row { display: flex; gap: 0.75rem; }
.dif-channel-opt {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  color: #475569;
  background: #f8fafc;
  transition: all 0.15s;
}
.dif-channel-opt input { accent-color: #8b5cf6; }
.dif-channel-opt:hover { border-color: #c4b5fd; }
.dif-channel-opt--on { border-color: #8b5cf6; background: #f5f3ff; color: #7c3aed; }
.dif-channel-count { font-size: 0.72rem; color: #94a3b8; font-weight: 400; }

/* Send step */
.dif-send-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem;
}
.dif-send-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #1e293b;
  flex-wrap: wrap;
}
.dif-copy-btn {
  margin-left: auto;
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.15s;
}
.dif-copy-btn:hover { background: #e2e8f0; color: #1e293b; }

.dif-batch {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
}
.dif-batch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.85rem;
  background: #f8fafc;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  border-bottom: 1px solid #f1f5f9;
}
.dif-batch-open-all {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  background: #3b6b2e;
  color: #fff;
  font-size: 0.72rem;
  border: none;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.15s;
}
.dif-batch-open-all:hover { background: #2d5224; }

.dif-contact-list {
  max-height: 180px;
  overflow-y: auto;
}
.dif-contact-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  color: #1e293b;
  text-decoration: none;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.12s;
}
.dif-contact-link:hover { background: #f0fdf4; }
.dif-contact-link--static { cursor: default; }
.dif-contact-link--static:hover { background: #f8fafc; }
.dif-contact-link i:first-child { font-size: 0.9rem; flex-shrink: 0; }
.dif-contact-link span:first-of-type { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.dif-ext-ico { margin-left: auto; color: #94a3b8; font-size: 0.72rem; }

/* Warnings */
.dif-warn {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #78350f;
  font-size: 0.78rem;
}
.dif-warn--info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }

/* Log activity */
.dif-log-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  flex-wrap: wrap;
}
.dif-log-check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #166534;
  cursor: pointer;
  font-weight: 600;
}
.dif-log-check input { accent-color: #22c55e; }
.dif-log-btn {
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  background: #22c55e;
  color: #fff;
  font-size: 0.78rem;
  border: none;
  cursor: pointer;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.15s;
}
.dif-log-btn:hover:not(:disabled) { background: #16a34a; }
.dif-logged-ok { font-size: 0.78rem; color: #16a34a; font-weight: 700; display: flex; align-items: center; gap: 0.3rem; }

/* Footer */
.dif-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.4rem;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.dif-footer-spacer { flex: 1; }
.dif-btn-pri {
  padding: 0.6rem 1.3rem;
  border-radius: 12px;
  background: #8b5cf6;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s;
}
.dif-btn-pri:hover:not(:disabled) { background: #7c3aed; }
.dif-btn-pri:disabled { opacity: 0.45; cursor: not-allowed; }
.dif-btn-sec {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s;
}
.dif-btn-sec:hover { background: #e2e8f0; }

/* Helpers */
.dif-muted { font-size: 0.72rem; color: #94a3b8; }
.dif-center { text-align: center; padding: 0.5rem; }

.btn-spin {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .dif-mode-grid { grid-template-columns: 1fr; }
  .dif-channel-row { flex-direction: column; }
  .dif-step-item:not(:last-child)::after { display: none; }
}
</style>
