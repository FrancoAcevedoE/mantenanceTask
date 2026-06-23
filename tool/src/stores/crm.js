import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

const PIPELINE_STAGES = [
  'nuevo_lead', 'contactado', 'cotizacion_enviada', 'negociacion', 'ganado', 'perdido'
]

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

export const useCrmStore = defineStore('crm', () => {
  const clients = ref([])
  const activities = ref([])
  const loadingClients = ref(false)
  const loadingActivities = ref(false)

  const visibleClients = computed(() => clients.value.filter(c => !c.isDeleted))

  const clientsByStage = computed(() =>
    PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage] = visibleClients.value.filter(c => c.pipelineEstado === stage)
      return acc
    }, {})
  )

  const recentActivities = computed(() =>
    [...activities.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15)
  )

  const pendingActivitiesCount = computed(() =>
    activities.value.filter(a => !a.completada).length
  )

  async function fetchClients(params = {}) {
    loadingClients.value = true
    try {
      const { data } = await axios.get(`${API_BASE_URL}/clients`, { ...authHeader(), params })
      clients.value = Array.isArray(data) ? data : []
    } finally {
      loadingClients.value = false
    }
  }

  async function createClient(payload) {
    const { data } = await axios.post(`${API_BASE_URL}/clients`, payload, authHeader())
    clients.value.unshift(data)
    return data
  }

  async function updateClient(id, payload) {
    const { data } = await axios.put(`${API_BASE_URL}/clients/${id}`, payload, authHeader())
    const idx = clients.value.findIndex(c => c._id === id)
    if (idx !== -1) clients.value[idx] = data
    return data
  }

  async function deleteClient(id) {
    await axios.delete(`${API_BASE_URL}/clients/${id}`, authHeader())
    const idx = clients.value.findIndex(c => c._id === id)
    if (idx !== -1) clients.value[idx] = { ...clients.value[idx], isDeleted: true }
  }

  async function updatePipelineStage(id, pipelineEstado) {
    const idx = clients.value.findIndex(c => c._id === id)
    const prev = idx !== -1 ? clients.value[idx].pipelineEstado : null
    if (idx !== -1) clients.value[idx] = { ...clients.value[idx], pipelineEstado }
    try {
      return await updateClient(id, { pipelineEstado })
    } catch {
      if (idx !== -1) clients.value[idx] = { ...clients.value[idx], pipelineEstado: prev }
    }
  }

  async function fetchActivities(params = {}) {
    loadingActivities.value = true
    try {
      const { data } = await axios.get(`${API_BASE_URL}/activities`, { ...authHeader(), params })
      activities.value = Array.isArray(data) ? data : []
    } finally {
      loadingActivities.value = false
    }
  }

  async function createActivity(payload) {
    const { data } = await axios.post(`${API_BASE_URL}/activities`, payload, authHeader())
    activities.value.unshift(data)
    return data
  }

  async function updateActivity(id, payload) {
    const { data } = await axios.put(`${API_BASE_URL}/activities/${id}`, payload, authHeader())
    const idx = activities.value.findIndex(a => a._id === id)
    if (idx !== -1) activities.value[idx] = data
    return data
  }

  async function deleteActivity(id) {
    await axios.delete(`${API_BASE_URL}/activities/${id}`, authHeader())
    activities.value = activities.value.filter(a => a._id !== id)
  }

  async function toggleActivityComplete(id) {
    const act = activities.value.find(a => a._id === id)
    if (!act) return
    return updateActivity(id, { completada: !act.completada })
  }

  return {
    clients, activities, loadingClients, loadingActivities,
    visibleClients, clientsByStage, recentActivities, pendingActivitiesCount,
    fetchClients, createClient, updateClient, deleteClient, updatePipelineStage,
    fetchActivities, createActivity, updateActivity, deleteActivity, toggleActivityComplete,
  }
})
