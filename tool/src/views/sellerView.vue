<template>
  <div class="page-container">
    <div class="box">
      <h2>Vista de Vendedor</h2>

      <div class="tabs">
        <button @click="activeTab = 'history'" :class="{ active: activeTab === 'history' }">Historial de Cotizaciones</button>
        <button @click="activeTab = 'new'" :class="{ active: activeTab === 'new' }">Nueva Cotización</button>
        <button v-if="user.role === 'admin'" @click="activeTab = 'products'" :class="{ active: activeTab === 'products' }">Gestionar Productos</button>
      </div>

      <div v-if="activeTab === 'history'" class="tab-content">
        <h3>Historial de Cotizaciones</h3>
        <div v-if="quotes.length === 0" class="no-data">
          No hay cotizaciones realizadas.
        </div>
        <div v-else class="quotes-list">
          <div v-for="quote in quotes" :key="quote._id" class="quote-item">
            <div class="quote-header">
              <strong>{{ quote.productId?.name || 'Producto eliminado' }}</strong> - {{ formatDate(quote.createdAt) }}
            </div>
            <div class="quote-details">
              <p>Cantidad: {{ quote.quantityM2 }} m²</p>
              <p>Precio sin descuento: ${{ quote.totalPriceWithoutDiscount?.toFixed(2) || '0.00' }}</p>
              <p>Precio con descuento: ${{ quote.totalPriceWithDiscount?.toFixed(2) || '0.00' }}</p>
              <p>Descuento aplicado: {{ quote.discountApplied || 0 }}%</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'new'" class="tab-content">
        <h3>Nueva Cotización</h3>
        <form @submit.prevent="createQuote">
          <label>Producto</label>
          <select v-model="quoteForm.productId" required @change="onProductChange">
            <option value="">Seleccionar producto</option>
            <option v-for="product in products" :key="product._id" :value="product._id">
              {{ product.name }} - Código: {{ product.code }}
            </option>
          </select>

          <div v-if="selectedProduct" class="product-details">
            <img v-if="selectedProduct.image" :src="selectedProduct.image" alt="Producto" class="product-image">
            <p><strong>Código:</strong> {{ selectedProduct.code }}</p>
            <p><strong>Colores:</strong> {{ selectedProduct.colors?.join(', ') || 'No especificado' }}</p>
            <p><strong>Medidas:</strong> {{ selectedProduct.dimensions || 'No especificado' }}</p>
            <p><strong>Espesores:</strong> {{ selectedProduct.thicknesses?.join(', ') || 'No especificado' }}</p>
            <p><strong>Precio por m²:</strong> ${{ selectedProduct.pricePerM2 || 0 }}</p>
            <p><strong>Descuentos:</strong></p>
            <ul v-if="selectedProduct.discounts?.length">
              <li v-for="discount in selectedProduct.discounts" :key="discount.quantity">
                {{ discount.quantity }} m² o más: {{ discount.discountPercent }}% descuento
              </li>
            </ul>
            <p v-else>No hay descuentos configurados</p>
          </div>

          <label>Cantidad en m²</label>
          <input type="number" min="0.01" step="0.01" v-model.number="quoteForm.quantityM2" required>

          <div v-if="quoteForm.productId && quoteForm.quantityM2" class="quote-preview">
            <p><strong>Cantidad total en m²:</strong> {{ quoteForm.quantityM2 }}</p>
            <p><strong>Precio estimado sin descuento:</strong> ${{ calculatePriceWithoutDiscount().toFixed(2) }}</p>
            <p><strong>Precio estimado con descuento:</strong> ${{ calculatePriceWithDiscount().toFixed(2) }}</p>
          </div>

          <button type="submit" :disabled="isCreating">Crear Cotización</button>
        </form>
      </div>

      <div v-if="activeTab === 'products'" class="tab-content">
        <h3>Gestionar Productos</h3>
        <form @submit.prevent="createProduct">
          <label>Nombre del Producto</label>
          <input type="text" v-model="productForm.name" required>

          <label>Código</label>
          <input type="text" v-model="productForm.code" required>

          <label>Colores (separados por coma)</label>
          <input type="text" v-model="productForm.colorsText" placeholder="Rojo, Azul, Verde">

          <label>Medidas</label>
          <input type="text" v-model="productForm.dimensions" placeholder="200x300 cm">

          <label>Espesores (separados por coma)</label>
          <input type="text" v-model="productForm.thicknessesText" placeholder="10mm, 15mm">

          <label>Precio por m²</label>
          <input type="number" min="0" step="0.01" v-model.number="productForm.pricePerM2" required>

          <label>Imagen (URL)</label>
          <input type="url" v-model="productForm.image">

          <button type="submit" :disabled="isCreatingProduct">Crear Producto</button>
        </form>

        <div class="products-list">
          <h4>Productos Existentes</h4>
          <div v-for="product in products" :key="product._id" class="product-item">
            <p><strong>{{ product.name }}</strong> - Código: {{ product.code }}</p>
            <p>Precio: ${{ product.pricePerM2 }}/m²</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SellerView',
  data() {
    return {
      activeTab: 'history',
      quotes: [],
      products: [],
      selectedProduct: null,
      quoteForm: {
        productId: '',
        quantityM2: null
      },
      productForm: {
        name: '',
        code: '',
        colorsText: '',
        dimensions: '',
        thicknessesText: '',
        pricePerM2: null,
        image: ''
      },
      isCreating: false,
      isCreatingProduct: false,
      user: JSON.parse(localStorage.getItem('user') || '{}')
    }
  },
  mounted() {
    this.loadQuotes()
    this.loadProducts()
  },
  methods: {
    async loadQuotes() {
      try {
        const response = await axios.get('/api/quotes')
        this.quotes = response.data
      } catch (error) {
        console.error('Error loading quotes:', error)
        this.$toast.error('Error al cargar cotizaciones')
      }
    },
    async loadProducts() {
      try {
        const response = await axios.get('/api/products')
        this.products = response.data
      } catch (error) {
        console.error('Error loading products:', error)
        this.$toast.error('Error al cargar productos')
      }
    },
    onProductChange() {
      this.selectedProduct = this.products.find(p => p._id === this.quoteForm.productId) || null
    },
    calculatePriceWithoutDiscount() {
      if (!this.selectedProduct || !this.quoteForm.quantityM2) return 0
      return this.selectedProduct.pricePerM2 * this.quoteForm.quantityM2
    },
    calculatePriceWithDiscount() {
      const basePrice = this.calculatePriceWithoutDiscount()
      if (!this.selectedProduct || !this.quoteForm.quantityM2) return basePrice

      let discountPercent = 0
      if (this.selectedProduct.discounts && Array.isArray(this.selectedProduct.discounts)) {
        for (const disc of this.selectedProduct.discounts.sort((a, b) => b.quantity - a.quantity)) {
          if (this.quoteForm.quantityM2 >= disc.quantity) {
            discountPercent = disc.discountPercent
            break
          }
        }
      }
      return basePrice * (1 - discountPercent / 100)
    },
    async createQuote() {
      this.isCreating = true
      try {
        await axios.post('/api/quotes', this.quoteForm)
        this.$toast.success('Cotización creada exitosamente')
        this.quoteForm = { productId: '', quantityM2: null }
        this.selectedProduct = null
        this.loadQuotes()
      } catch (error) {
        console.error('Error creating quote:', error)
        this.$toast.error('Error al crear cotización')
      } finally {
        this.isCreating = false
      }
    },
    async createProduct() {
      this.isCreatingProduct = true
      try {
        const productData = {
          ...this.productForm,
          colors: this.productForm.colorsText.split(',').map(c => c.trim()).filter(c => c),
          thicknesses: this.productForm.thicknessesText.split(',').map(t => t.trim()).filter(t => t)
        }
        delete productData.colorsText
        delete productData.thicknessesText

        await axios.post('/api/products', productData)
        this.$toast.success('Producto creado exitosamente')
        this.productForm = {
          name: '',
          code: '',
          colorsText: '',
          dimensions: '',
          thicknessesText: '',
          pricePerM2: null,
          image: ''
        }
        this.loadProducts()
      } catch (error) {
        console.error('Error creating product:', error)
        this.$toast.error('Error al crear producto')
      } finally {
        this.isCreatingProduct = false
      }
    },
    formatDate(date) {
      if (!date) return 'Fecha no disponible'
      return new Date(date).toLocaleDateString('es-ES')
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 1rem;
}

.box {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: #f9f9f9;
  cursor: pointer;
  border-radius: 4px;
}

.tabs button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.tab-content {
  margin-top: 1rem;
}

.quotes-list, .products-list {
  margin-top: 1rem;
}

.quote-item, .product-item {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.product-details {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.product-image {
  max-width: 200px;
  max-height: 200px;
  margin-bottom: 1rem;
}

.quote-preview {
  background: #e9ecef;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  font-weight: bold;
}

input, select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 0.75rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #218838;
}

.no-data {
  text-align: center;
  color: #6c757d;
  font-style: italic;
}
</style>