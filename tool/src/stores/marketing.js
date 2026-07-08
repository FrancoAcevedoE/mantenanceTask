import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { useCrmStore } from './crm'

function authHeader() {
  const token = sessionStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

export const useMarketingStore = defineStore('marketing', () => {
  const campaigns = ref([])
  const loading   = ref(false)

  const crmStore = useCrmStore()

  // Contactos: personas individuales extraídas de cada cliente CRM
  const contacts = computed(() =>
    crmStore.visibleClients
      .filter(c => c.contactoPrincipal || c.email)
      .map(c => ({
        _id:            c._id,
        nombre:         c.contactoPrincipal || '',
        empresa:        c.razonSocial || c.nombreComercial || '',
        email:          c.email || '',
        telefono:       c.telefonos?.[0]?.numero || c.telefono || '',
        pipelineEstado: c.pipelineEstado,
        tipoCliente:    c.tipoCliente,
        estado:         c.estado,
        codigoCliente:  c.codigoCliente || '',
      }))
  )

  // Cuentas: los clientes CRM vistos como cuentas de empresa
  const accounts = computed(() => crmStore.visibleClients)

  // Estadísticas globales
  const stats = computed(() => {
    const total     = campaigns.value.length
    const activas   = campaigns.value.filter(c => c.estado === 'activa').length
    const enviados  = campaigns.value.reduce((s, c) => s + (c.stats?.enviados    || 0), 0)
    const convertidos = campaigns.value.reduce((s, c) => s + (c.stats?.convertidos || 0), 0)
    const tasa = enviados > 0 ? ((convertidos / enviados) * 100).toFixed(1) : '0.0'
    return { total, activas, enviados, convertidos, tasa }
  })

  async function fetchCampaigns() {
    loading.value = true
    try {
      const { data } = await axios.get(`${API_BASE_URL}/campaigns`, authHeader())
      campaigns.value = Array.isArray(data) ? data : []
    } finally {
      loading.value = false
    }
  }

  async function createCampaign(payload) {
    const { data } = await axios.post(`${API_BASE_URL}/campaigns`, payload, authHeader())
    campaigns.value.unshift(data)
    return data
  }

  async function updateCampaign(id, payload) {
    const { data } = await axios.put(`${API_BASE_URL}/campaigns/${id}`, payload, authHeader())
    const idx = campaigns.value.findIndex(c => c._id === id)
    if (idx !== -1) campaigns.value[idx] = data
    return data
  }

  async function deleteCampaign(id) {
    await axios.delete(`${API_BASE_URL}/campaigns/${id}`, authHeader())
    campaigns.value = campaigns.value.filter(c => c._id !== id)
  }

  async function uploadCover(id, file) {
    const fd = new FormData()
    fd.append('cover', file)
    const { data } = await axios.post(`${API_BASE_URL}/campaigns/${id}/cover`, fd, {
      headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' },
    })
    const idx = campaigns.value.findIndex(c => c._id === id)
    if (idx !== -1) campaigns.value[idx] = data.campaign
    return data.campaign
  }

  async function removeCover(id) {
    const { data } = await axios.delete(`${API_BASE_URL}/campaigns/${id}/cover`, authHeader())
    const idx = campaigns.value.findIndex(c => c._id === id)
    if (idx !== -1) campaigns.value[idx].coverImage = { url: '', name: '', mimetype: '' }
    return data
  }

  async function uploadAttachment(id, file) {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await axios.post(`${API_BASE_URL}/campaigns/${id}/attachments`, fd, {
      headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' },
    })
    const idx = campaigns.value.findIndex(c => c._id === id)
    if (idx !== -1) campaigns.value[idx] = data.campaign
    return data.campaign
  }

  async function removeAttachment(id, attachId) {
    const { data } = await axios.delete(`${API_BASE_URL}/campaigns/${id}/attachments/${attachId}`, authHeader())
    const idx = campaigns.value.findIndex(c => c._id === id)
    if (idx !== -1) campaigns.value[idx] = data.campaign
    return data.campaign
  }

  // Clientes que coinciden con el segmento de una campaña
  function campaignTargets(campaign) {
    const seg = campaign.segmento || {}
    const hasSegment = !!(seg.tipoCliente || seg.pipelineEstados?.length)
    const hasExplicit = seg.clienteIds?.length > 0

    // Solo clientes específicos (sin filtros de segmento)
    if (hasExplicit && !hasSegment) {
      const ids = seg.clienteIds.map(String)
      return crmStore.visibleClients.filter(c => ids.includes(String(c._id)))
    }

    // Filtros de segmento (con o sin clientes explícitos adicionales)
    let list = crmStore.visibleClients
    if (seg.tipoCliente)             list = list.filter(c => c.tipoCliente === seg.tipoCliente)
    if (seg.pipelineEstados?.length) list = list.filter(c => seg.pipelineEstados.includes(c.pipelineEstado))

    if (hasExplicit) {
      const ids = seg.clienteIds.map(String)
      const extra = crmStore.visibleClients.filter(c => ids.includes(String(c._id)))
      const merged = [...list, ...extra]
      return [...new Map(merged.map(c => [String(c._id), c])).values()]
    }

    return list
  }

  return {
    campaigns, loading, contacts, accounts, stats,
    fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, campaignTargets,
    uploadCover, removeCover, uploadAttachment, removeAttachment,
  }
})
