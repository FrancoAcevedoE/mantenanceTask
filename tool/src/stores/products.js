import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedIds = ref([])

  const totalProducts = computed(() => products.value.length)
  const totalStock = computed(() => products.value.reduce((s, p) => s + (p.stock || 0), 0))
  const inventoryValue = computed(() =>
    products.value.reduce((s, p) => s + (p.pricePerM2 || 0) * (p.stock || 0), 0)
  )
  const noStockProducts = computed(() => products.value.filter(p => (p.stock || 0) === 0))
  const lowStockProducts = computed(() =>
    products.value.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5)
  )

  const uniqueGrupos = computed(() => [...new Set(products.value.map(p => p.grupo).filter(Boolean))])
  const uniqueColors = computed(() => [...new Set(products.value.flatMap(p => p.colors || []).filter(Boolean))])
  const uniqueMedidas = computed(() => [...new Set(products.value.map(p => p.dimensions).filter(Boolean))])
  const uniqueEspesores = computed(() => [...new Set(products.value.flatMap(p => p.thicknesses || []).filter(Boolean))])
  const uniqueTerminaciones = computed(() => [...new Set(products.value.map(p => p.terminacion).filter(Boolean))])
  const uniqueTexturas = computed(() => [...new Set(products.value.map(p => p.textura).filter(Boolean))])

  function authHeader() {
    const token = sessionStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.get(`${API_BASE_URL}/products`, authHeader())
      products.value = Array.isArray(data) ? data : []
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id, updates) {
    const { data } = await axios.put(`${API_BASE_URL}/products/${id}`, updates, authHeader())
    const idx = products.value.findIndex(p => p._id === id)
    if (idx !== -1) products.value[idx] = { ...products.value[idx], ...data.product }
    return data.product
  }

  async function createProduct(productData) {
    const { data } = await axios.post(`${API_BASE_URL}/products`, productData, authHeader())
    products.value.unshift(data.product)
    return data.product
  }

  async function deleteAllProducts() {
    const { data } = await axios.delete(`${API_BASE_URL}/products/all`, authHeader())
    products.value = []
    return data
  }

  function getById(id) {
    return products.value.find(p => p._id === id) || null
  }

  function toggleSelect(id) {
    const idx = selectedIds.value.indexOf(id)
    if (idx === -1) selectedIds.value.push(id)
    else selectedIds.value.splice(idx, 1)
  }

  function selectAll(ids) {
    selectedIds.value = [...new Set(ids)]
  }

  function clearSelection() {
    selectedIds.value = []
  }

  return {
    products, loading, error, selectedIds,
    totalProducts, totalStock, inventoryValue, noStockProducts, lowStockProducts,
    uniqueGrupos, uniqueColors, uniqueMedidas, uniqueEspesores, uniqueTerminaciones, uniqueTexturas,
    fetchProducts, updateProduct, createProduct, deleteAllProducts, getById, toggleSelect, selectAll, clearSelection
  }
})
