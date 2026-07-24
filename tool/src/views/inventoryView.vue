<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">{{ t.title }}</h2>
        <div class="toolbar-actions">
          <div class="search-wrap">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="search"
              class="search-input"
              :placeholder="t.searchPlaceholder"
            />
          </div>
          <button class="secondary-button" @click="filtersOpen = !filtersOpen">
            <i class="bi bi-funnel"></i> {{ t.filters }}
          </button>
          <router-link v-if="canManage" to="/product/new">
            <button class="primary-button"><i class="bi bi-plus-lg"></i> {{ t.newProduct }}</button>
          </router-link>
          <button v-if="canManage" class="danger-button btn-vaciar" @click="showDeleteAllConfirm = true" :title="t.vaciarTitle">
            <i class="bi bi-trash"></i><span class="vaciar-label"> {{ t.vaciar }}</span>
          </button>
          <ConfirmDialog
            :visible="showDeleteAllConfirm"
            :title="t.vaciarTitle"
            :message="t.vaciarMsg"
            :confirm-text="t.deleteAll"
            type="danger"
            @confirm="deleteAll(); showDeleteAllConfirm = false"
            @cancel="showDeleteAllConfirm = false"
          />
          <router-link to="/inv-dashboard">
            <button class="secondary-button"><i class="bi bi-bar-chart-line"></i> {{ t.dashboard }}</button>
          </router-link>
          <button class="secondary-button" @click="openPrintModal">
            <i class="bi bi-printer"></i> {{ t.printPrices }}
          </button>
        </div>
      </div>

      <!-- MODAL IMPRIMIR LISTA DE PRECIOS -->
      <div v-if="showPrintModal" class="print-modal-overlay" @click.self="showPrintModal = false">
        <div class="print-modal">
          <div class="print-modal-header">
            <h3>{{ t.printModalTitle }}</h3>
            <button class="ghost-button small" @click="showPrintModal = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <p class="print-modal-hint">{{ t.printModalHint }}</p>
          <div class="print-modal-actions-top">
            <button class="ghost-button small" @click="printSelectedGrupos = [...gruposDisponibles]">{{ t.all }}</button>
            <button class="ghost-button small" @click="printSelectedGrupos = []">{{ t.none }}</button>
          </div>
          <div class="print-grupo-list">
            <label v-for="g in gruposDisponibles" :key="g" class="print-grupo-item">
              <input type="checkbox" :value="g" v-model="printSelectedGrupos" />
              <span>{{ g }}</span>
            </label>
          </div>
          <div class="print-modal-footer">
            <button class="ghost-button" @click="showPrintModal = false">{{ t.cancel }}</button>
            <button class="primary-button" :disabled="!printSelectedGrupos.length || printLoading" @click="printPriceList">
              <i class="bi bi-printer"></i> {{ printLoading ? t.preparing : t.print }}
            </button>
          </div>
        </div>
      </div>

      <InventorySubNav />

      <div v-if="store.loading" class="empty-state">{{ t.loadingProducts }}</div>
      <div v-else-if="store.error" class="empty-state" style="color:#dc2626">{{ store.error }}</div>

      <div v-else class="inv-layout">
        <!-- Sidebar Filters -->
        <aside :class="['inv-sidebar', { open: filtersOpen }]">
          <div class="filter-header">
            <strong>{{ t.filters }}</strong>
            <button class="ghost-button small" @click="clearFilters">{{ t.clear }}</button>
          </div>

          <div class="filter-group">
            <label>{{ t.grupo }}</label>
            <select v-model="filters.grupo">
              <option value="">{{ t.allM }}</option>
              <option v-for="g in store.uniqueGrupos" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>{{ t.color }}</label>
            <select v-model="filters.color">
              <option value="">{{ t.allM }}</option>
              <option v-for="c in store.uniqueColors" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>{{ t.medida }}</label>
            <select v-model="filters.medida">
              <option value="">{{ t.allF }}</option>
              <option v-for="m in store.uniqueMedidas" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>{{ t.terminacion }}</label>
            <select v-model="filters.terminacion">
              <option value="">{{ t.allF }}</option>
              <option v-for="tr in store.uniqueTerminaciones" :key="tr" :value="tr">{{ tr }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>{{ t.textura }}</label>
            <select v-model="filters.textura">
              <option value="">{{ t.allF }}</option>
              <option v-for="tx in store.uniqueTexturas" :key="tx" :value="tx">{{ tx }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>{{ t.espesor }}</label>
            <select v-model="filters.espesor">
              <option value="">{{ t.allM }}</option>
              <option v-for="e in store.uniqueEspesores" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>

          <div class="filter-count">
            <span>{{ filtered.length }} {{ filtered.length !== 1 ? t.products : t.product }}</span>
          </div>
        </aside>

        <!-- Table -->
        <div class="inv-content">
          <div class="selection-bar" v-if="store.selectedIds.length > 0">
            <span>{{ store.selectedIds.length }} {{ store.selectedIds.length !== 1 ? t.selectedPl : t.selected }}</span>
            <router-link to="/bulk-price">
              <button><i class="bi bi-tags"></i> {{ t.updatePrices }}</button>
            </router-link>
            <button class="secondary-button" @click="store.clearSelection()">{{ t.deselect }}</button>
          </div>

          <div class="table-scroll">
            <table class="history-table inv-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input type="checkbox" :checked="allSelected" @change="toggleAll" />
                  </th>
                  <th @click="sortBy('code')" class="sortable">
                    {{ t.colCode }} <i :class="sortIcon('code')"></i>
                  </th>
                  <th @click="sortBy('name')" class="sortable">
                    {{ t.colDesc }} <i :class="sortIcon('name')"></i>
                  </th>
                  <th>{{ t.colColor }}</th>
                  <th>{{ t.colMedida }}</th>
                  <th @click="sortBy('precioGrupoI')" class="sortable">
                    {{ t.colPrice }} <i :class="sortIcon('precioGrupoI')"></i>
                  </th>
                  <th @click="sortBy('stock')" class="sortable">
                    {{ t.colStock }} <i :class="sortIcon('stock')"></i>
                  </th>
                  <th>{{ t.colActions }}</th>
                </tr>
              </thead>
              <tbody>
                <!-- Vista agrupada: sin filtro de grupo ni búsqueda -->
                <template v-if="showGrouped">
                  <template v-for="group in groupedFiltered" :key="group.grupo">
                    <tr class="group-header-row">
                      <td colspan="9" class="group-header-cell">
                        <i class="bi bi-layers group-icon"></i>
                        <span class="group-header-label">{{ group.grupo }}</span>
                        <span class="group-count">{{ group.items.length }} {{ group.items.length !== 1 ? t.products : t.product }}</span>
                      </td>
                    </tr>
                    <template v-for="p in group.items" :key="p._id">
                    <tr :class="{ selected: store.selectedIds.includes(p._id) }">
                      <td><input type="checkbox" :checked="store.selectedIds.includes(p._id)" @change="store.toggleSelect(p._id)" /></td>
                      <td><code class="code-badge">{{ p.code }}</code></td>
                      <td :class="['desc-cell', hasPdfs(p) ? 'desc-cell--clickable' : '']" @click="hasPdfs(p) && togglePdf(p._id)" :title="hasPdfs(p) ? (pdfId === p._id ? 'Ocultar archivos' : 'Ver archivos PDF') : undefined">
                        <span class="desc-name">{{ p.name }}</span>
                        <span v-if="hasPdfs(p)" :class="['pdf-pill', pdfId === p._id ? 'pdf-pill--active' : '']">
                          <i class="bi bi-file-earmark-pdf-fill"></i>
                        </span>
                        <div v-if="p.tipo || p.terminacion" class="desc-meta-row">
                          <span v-if="p.tipo" class="desc-meta">{{ p.tipo }}</span>
                          <span v-if="p.tipo && p.terminacion" class="desc-meta-sep">·</span>
                          <span v-if="p.terminacion" class="desc-meta desc-terminacion">{{ p.terminacion }}</span>
                        </div>
                        <span v-if="p.espesor" class="desc-espesor">{{ p.espesor }}mm</span>
                        <span v-if="p.dimensions" class="desc-medida">{{ p.dimensions }}</span>
                      </td>
                      <td>
                        <span v-if="p.colors?.length" class="color-chip">
                          <span class="color-dot" :style="colorStyle(p.colors[0])"></span>
                          {{ p.colors[0] }}
                        </span>
                        <span v-else class="muted">—</span>
                      </td>
                      <td>{{ p.dimensions || '—' }}</td>
                      <td class="price-cell">
                        <span v-if="precioBase(p) !== null">
                          ${{ formatPrice(precioBase(p)) }}
                          <span class="unit-label">/{{ unitLabel(p.unidadPrecio) }}</span>
                        </span>
                        <span v-else class="muted">—</span>
                      </td>
                      <td><span :class="stockBadge(p.stock)">{{ p.stock ?? 0 }}</span></td>
                      <td>
                        <div class="action-buttons">
                          <button class="btn-sm secondary-button" @click="toggleDetail(p._id)" :title="expandedId === p._id ? 'Ocultar' : 'Ver detalle'">
                            <i class="bi" :class="expandedId === p._id ? 'bi-chevron-up' : 'bi-eye'"></i>
                          </button>
                          <router-link v-if="canManage" :to="`/product/${p._id}/edit`">
                            <button class="btn-sm secondary-button"><i class="bi bi-pencil"></i></button>
                          </router-link>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="expandedId === p._id" class="detail-expand-row">
                      <td colspan="8">
                        <div class="detail-expand-box">
                          <div class="dex-grid">
                            <div v-if="p.image" class="dex-img">
                              <img :src="resolveUrl(p.image)" :alt="p.name" />
                            </div>
                            <div class="dex-info">
                              <div class="dex-row"><span class="dex-label">{{ t.labelSKU }}</span><code>{{ p.code }}</code></div>
                              <div v-if="p.grupo" class="dex-row"><span class="dex-label">{{ t.labelGrupo }}</span><span>{{ p.grupo }}</span></div>
                              <div v-if="p.tipo" class="dex-row"><span class="dex-label">{{ t.labelTipo }}</span><span>{{ p.tipo }}</span></div>
                              <div v-if="p.terminacion" class="dex-row"><span class="dex-label">{{ t.labelTerminacion }}</span><span>{{ p.terminacion }}</span></div>
                              <div v-if="p.espesor" class="dex-row"><span class="dex-label">{{ t.labelEspesor }}</span><span>{{ p.espesor }}mm</span></div>
                              <div v-if="p.dimensions" class="dex-row"><span class="dex-label">{{ t.labelMedida }}</span><span>{{ p.dimensions }}</span></div>
                              <div v-if="p.m2" class="dex-row"><span class="dex-label">m2</span><span>{{ p.m2 }}</span></div>
                              <div v-if="p.colorMode" class="dex-row"><span class="dex-label">{{ t.labelColor }}</span><span>{{ p.colorMode === 'todos' ? 'TODOS' : (p.selectedColors?.join(', ') || p.color || '—') }}</span></div>
                              <div v-if="p.detalle" class="dex-row full"><span class="dex-label">{{ t.labelDetalle }}</span><span>{{ p.detalle }}</span></div>
                              <div v-if="p.comentario" class="dex-row full">
                                <span class="dex-label">{{ t.labelComentario }}</span>
                                <span class="comment-wrap">
                                  <span :class="['comment-text', { 'comment-collapsed': !expandedComments.has(p._id) }]">{{ p.comentario }}</span>
                                  <button v-if="p.comentario.length > 100" class="comment-toggle" @click="toggleComment(p._id)">
                                    {{ expandedComments.has(p._id) ? t.viewLess : t.viewMore }}
                                  </button>
                                </span>
                              </div>
                            </div>
                            <div class="dex-prices">
                              <div v-if="p.precioGeneral != null" class="dex-price"><span class="dex-label">{{ t.labelGeneral }}</span><span class="dex-val">${{ formatPrice(p.precioGeneral) }}</span></div>
                              <div v-if="p.precioGrupoI != null" class="dex-price"><span class="dex-label">{{ t.labelGrupoI }}</span><span class="dex-val">${{ formatPrice(p.precioGrupoI) }}</span></div>
                              <div v-if="p.precioGrupoII != null" class="dex-price"><span class="dex-label">{{ t.labelGrupoII }}</span><span class="dex-val">${{ formatPrice(p.precioGrupoII) }}</span></div>
                              <div v-if="p.precioGrupoIII != null" class="dex-price"><span class="dex-label">{{ t.labelGrupoIII }}</span><span class="dex-val">${{ formatPrice(p.precioGrupoIII) }}</span></div>
                            </div>
                          </div>
                          <div class="dex-footer">
                            <router-link :to="`/product/${p._id}`"><button class="btn-sm"><i class="bi bi-box-arrow-up-right"></i> {{ t.viewFull }}</button></router-link>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="pdfId === p._id" class="pdf-expand-row">
                      <td colspan="9">
                        <div class="pdf-expand-box">
                          <div class="pdf-expand-head">
                            <div class="pdf-expand-title"><i class="bi bi-paperclip"></i> Archivos adjuntos — {{ p.name }}</div>
                            <div v-if="p.image" class="pdf-thumb-wrap" @click="lightboxImgSrc = resolveUrl(p.image)" title="Ampliar imagen">
                              <img :src="resolveUrl(p.image)" class="pdf-thumb" :alt="p.name" />
                              <span class="pdf-thumb-zoom"><i class="bi bi-zoom-in"></i></span>
                            </div>
                          </div>
                          <div v-if="!hasPdfs(p)" class="pdf-empty">{{ t.noPDF }}</div>
                          <div v-else class="pdf-list">
                            <a v-if="p.catalogo" :href="resolveUrl(p.catalogo)" target="_blank" rel="noopener" class="pdf-item">
                              <i class="bi bi-file-earmark-pdf-fill pdf-icon-red"></i>
                              <span>Catálogo</span>
                            </a>
                            <a v-if="p.fichaTecnica" :href="resolveUrl(p.fichaTecnica)" target="_blank" rel="noopener" class="pdf-item">
                              <i class="bi bi-file-earmark-text-fill pdf-icon-blue"></i>
                              <span>Ficha técnica</span>
                            </a>
                            <a v-for="arch in (p.archivos || [])" :key="arch.url" :href="resolveUrl(arch.url)" target="_blank" rel="noopener" class="pdf-item">
                              <i class="bi bi-file-earmark-fill pdf-icon-gray"></i>
                              <span>{{ arch.titulo || t.file }}</span>
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                    </template>
                  </template>
                  <tr v-if="groupedFiltered.length === 0">
                    <td colspan="8" class="empty-row">{{ t.noResults }}</td>
                  </tr>
                </template>

                <!-- Vista plana paginada: con filtro o búsqueda activos -->
                <template v-else>
                  <template v-for="p in paged" :key="p._id">
                  <tr :class="{ selected: store.selectedIds.includes(p._id) }">
                    <td><input type="checkbox" :checked="store.selectedIds.includes(p._id)" @change="store.toggleSelect(p._id)" /></td>
                    <td><code class="code-badge">{{ p.code }}</code></td>
                    <td :class="['desc-cell', hasPdfs(p) ? 'desc-cell--clickable' : '']" @click="hasPdfs(p) && togglePdf(p._id)" :title="hasPdfs(p) ? (pdfId === p._id ? 'Ocultar archivos' : 'Ver archivos PDF') : undefined">
                      <span class="desc-name">{{ p.name }}</span>
                      <span v-if="hasPdfs(p)" :class="['pdf-pill', pdfId === p._id ? 'pdf-pill--active' : '']">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                      </span>
                      <span v-if="p.tipo" class="desc-meta">{{ p.tipo }}</span>
                      <span v-if="p.terminacion" class="desc-meta desc-terminacion">{{ p.terminacion }}</span>
                      <span v-if="p.espesor" class="desc-espesor">{{ p.espesor }}mm</span>
                      <span v-if="p.dimensions" class="desc-medida">{{ p.dimensions }}</span>
                    </td>
                    <td>
                      <span v-if="p.colors?.length" class="color-chip">
                        <span class="color-dot" :style="colorStyle(p.colors[0])"></span>
                        {{ p.colors[0] }}
                      </span>
                      <span v-else class="muted">—</span>
                    </td>
                    <td>{{ p.dimensions || '—' }}</td>
                    <td class="price-cell">
                      <span v-if="precioBase(p) !== null">
                        ${{ formatPrice(precioBase(p)) }}
                        <span class="unit-label">/{{ unitLabel(p.unidadPrecio) }}</span>
                      </span>
                      <span v-else class="muted">—</span>
                    </td>
                    <td><span :class="stockBadge(p.stock)">{{ p.stock ?? 0 }}</span></td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-sm secondary-button" @click="toggleDetail(p._id)" :title="expandedId === p._id ? 'Ocultar' : 'Ver detalle'">
                          <i class="bi" :class="expandedId === p._id ? 'bi-chevron-up' : 'bi-eye'"></i>
                        </button>
                        <router-link v-if="canManage" :to="`/product/${p._id}/edit`">
                          <button class="btn-sm secondary-button"><i class="bi bi-pencil"></i></button>
                        </router-link>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedId === p._id" class="detail-expand-row">
                    <td colspan="8">
                      <div class="detail-expand-box">
                        <div class="dex-grid">
                          <div v-if="p.image" class="dex-img">
                            <img :src="resolveUrl(p.image)" :alt="p.name" />
                          </div>
                          <div class="dex-info">
                            <div class="dex-row"><span class="dex-label">{{ t.labelSKU }}</span><code>{{ p.code }}</code></div>
                            <div v-if="p.grupo" class="dex-row"><span class="dex-label">Grupo</span><span>{{ p.grupo }}</span></div>
                            <div v-if="p.tipo" class="dex-row"><span class="dex-label">Tipo</span><span>{{ p.tipo }}</span></div>
                            <div v-if="p.terminacion" class="dex-row"><span class="dex-label">Terminacion</span><span>{{ p.terminacion }}</span></div>
                            <div v-if="p.espesor" class="dex-row"><span class="dex-label">Espesor</span><span>{{ p.espesor }}mm</span></div>
                            <div v-if="p.dimensions" class="dex-row"><span class="dex-label">Medida</span><span>{{ p.dimensions }}</span></div>
                            <div v-if="p.m2" class="dex-row"><span class="dex-label">m2</span><span>{{ p.m2 }}</span></div>
                            <div v-if="p.colorMode" class="dex-row"><span class="dex-label">{{ t.labelColor }}</span><span>{{ p.colorMode === 'todos' ? 'TODOS' : (p.selectedColors?.join(', ') || p.color || '—') }}</span></div>
                            <div v-if="p.detalle" class="dex-row full"><span class="dex-label">{{ t.labelDetalle }}</span><span>{{ p.detalle }}</span></div>
                          </div>
                          <div class="dex-prices">
                            <div v-if="p.precioGeneral != null" class="dex-price"><span class="dex-label">General</span><span class="dex-val">${{ formatPrice(p.precioGeneral) }}</span></div>
                            <div v-if="p.precioGrupoI != null" class="dex-price"><span class="dex-label">Grupo I</span><span class="dex-val">${{ formatPrice(p.precioGrupoI) }}</span></div>
                            <div v-if="p.precioGrupoII != null" class="dex-price"><span class="dex-label">Grupo II</span><span class="dex-val">${{ formatPrice(p.precioGrupoII) }}</span></div>
                            <div v-if="p.precioGrupoIII != null" class="dex-price"><span class="dex-label">Grupo III</span><span class="dex-val">${{ formatPrice(p.precioGrupoIII) }}</span></div>
                          </div>
                        </div>
                        <div class="dex-footer">
                          <router-link :to="`/product/${p._id}`"><button class="btn-sm"><i class="bi bi-box-arrow-up-right"></i> {{ t.viewFull }}</button></router-link>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="pdfId === p._id" class="pdf-expand-row">
                    <td colspan="9">
                      <div class="pdf-expand-box">
                        <div class="pdf-expand-head">
                          <div class="pdf-expand-title"><i class="bi bi-paperclip"></i> Archivos adjuntos — {{ p.name }}</div>
                          <div v-if="p.image" class="pdf-thumb-wrap" @click="lightboxImgSrc = resolveUrl(p.image)" title="Ampliar imagen">
                            <img :src="resolveUrl(p.image)" class="pdf-thumb" :alt="p.name" />
                            <span class="pdf-thumb-zoom"><i class="bi bi-zoom-in"></i></span>
                          </div>
                        </div>
                        <div v-if="!hasPdfs(p)" class="pdf-empty">{{ t.noPDF }}</div>
                        <div v-else class="pdf-list">
                          <a v-if="p.catalogo" :href="resolveUrl(p.catalogo)" target="_blank" rel="noopener" class="pdf-item">
                            <i class="bi bi-file-earmark-pdf-fill pdf-icon-red"></i>
                            <span>{{ t.catalog }}</span>
                          </a>
                          <a v-if="p.fichaTecnica" :href="resolveUrl(p.fichaTecnica)" target="_blank" rel="noopener" class="pdf-item">
                            <i class="bi bi-file-earmark-text-fill pdf-icon-blue"></i>
                            <span>{{ t.techSheet }}</span>
                          </a>
                          <a v-for="arch in (p.archivos || [])" :key="arch.url" :href="resolveUrl(arch.url)" target="_blank" rel="noopener" class="pdf-item">
                            <i class="bi bi-file-earmark-fill pdf-icon-gray"></i>
                            <span>{{ arch.titulo || t.file }}</span>
                          </a>
                        </div>
                      </div>
                    </td>
                  </tr>
                  </template>
                  <tr v-if="paged.length === 0">
                    <td colspan="8" class="empty-row">{{ t.noResults }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Pagination: solo en vista plana -->
          <div class="pagination" v-if="!showGrouped && totalPages > 1">
            <button class="secondary-button" :disabled="page === 1" @click="page--">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span>{{ t.page }} {{ page }} {{ t.of }} {{ totalPages }}</span>
            <button class="secondary-button" :disabled="page === totalPages" @click="page++">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="lightboxImgSrc" class="lb-overlay" @click="lightboxImgSrc = ''">
      <button class="lb-close" @click.stop="lightboxImgSrc = ''"><i class="bi bi-x-lg"></i></button>
      <img :src="lightboxImgSrc" class="lb-img" @click.stop />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { API_BASE_URL } from '@/utils/api'
import { useToast } from 'vue-toastification'
import InventorySubNav from '@/components/InventorySubNav.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePermissions } from '@/utils/permissions'
import { useLocale } from '@/composables/useLocale'
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const { locale } = useLocale()

const TRANSLATIONS = {
  es: {
    title: 'Inventario',
    searchPlaceholder: 'Buscar código, descripción, color...',
    filters: 'Filtros',
    newProduct: 'Nuevo producto',
    vaciar: 'Vaciar',
    vaciarTitle: 'Vaciar inventario',
    vaciarMsg: '¿Estas seguro de eliminar TODOS los productos? Esta accion no se puede deshacer.',
    deleteAll: 'Eliminar todo',
    dashboard: 'Dashboard',
    printPrices: 'Imprimir precios',
    printModalTitle: 'Imprimir lista de precios',
    printModalHint: 'Seleccioná uno o más grupos para incluir en la impresión.',
    all: 'Todos',
    none: 'Ninguno',
    cancel: 'Cancelar',
    preparing: 'Preparando...',
    print: 'Imprimir',
    loadingProducts: 'Cargando productos...',
    clear: 'Limpiar',
    grupo: 'Grupo',
    color: 'Color',
    medida: 'Medida',
    terminacion: 'Terminación',
    textura: 'Textura',
    espesor: 'Espesor',
    allM: 'Todos',
    allF: 'Todas',
    product: 'producto',
    products: 'productos',
    selected: 'seleccionado',
    selectedPl: 'seleccionados',
    updatePrices: 'Actualizar precios',
    deselect: 'Deseleccionar',
    colCode: 'Código',
    colDesc: 'Descripción / Tipo / Terminación / Espesor',
    colColor: 'Color',
    colMedida: 'Medida',
    colPrice: 'Precio unitario',
    colStock: 'Stock',
    colActions: 'Acciones',
    viewFull: 'Ver completo',
    viewMore: 'Ver más',
    viewLess: 'Ver menos',
    noPDF: 'Sin archivos PDF adjuntos.',
    catalog: 'Catálogo',
    techSheet: 'Ficha técnica',
    file: 'Archivo',
    noResults: 'Sin resultados para los filtros aplicados.',
    page: 'Página',
    of: 'de',
    labelSKU: 'SKU',
    labelGrupo: 'Grupo',
    labelTipo: 'Tipo',
    labelTerminacion: 'Terminacion',
    labelEspesor: 'Espesor',
    labelMedida: 'Medida',
    labelColor: 'Color',
    labelDetalle: 'Detalle',
    labelComentario: 'Comentario',
    labelGeneral: 'General',
    labelGrupoI: 'Grupo I',
    labelGrupoII: 'Grupo II',
    labelGrupoIII: 'Grupo III',
  },
  pt: {
    title: 'Inventário',
    searchPlaceholder: 'Pesquisar código, descrição, cor...',
    filters: 'Filtros',
    newProduct: 'Novo produto',
    vaciar: 'Esvaziar',
    vaciarTitle: 'Esvaziar inventário',
    vaciarMsg: 'Tem certeza que deseja excluir TODOS os produtos? Esta ação não pode ser desfeita.',
    deleteAll: 'Excluir tudo',
    dashboard: 'Dashboard',
    printPrices: 'Imprimir preços',
    printModalTitle: 'Imprimir lista de preços',
    printModalHint: 'Selecione um ou mais grupos para incluir na impressão.',
    all: 'Todos',
    none: 'Nenhum',
    cancel: 'Cancelar',
    preparing: 'Preparando...',
    print: 'Imprimir',
    loadingProducts: 'Carregando produtos...',
    clear: 'Limpar',
    grupo: 'Grupo',
    color: 'Cor',
    medida: 'Medida',
    terminacion: 'Acabamento',
    textura: 'Textura',
    espesor: 'Espessura',
    allM: 'Todos',
    allF: 'Todas',
    product: 'produto',
    products: 'produtos',
    selected: 'selecionado',
    selectedPl: 'selecionados',
    updatePrices: 'Atualizar preços',
    deselect: 'Desmarcar',
    colCode: 'Código',
    colDesc: 'Descrição / Tipo / Acabamento / Espessura',
    colColor: 'Cor',
    colMedida: 'Medida',
    colPrice: 'Preço unitário',
    colStock: 'Estoque',
    colActions: 'Ações',
    viewFull: 'Ver completo',
    viewMore: 'Ver mais',
    viewLess: 'Ver menos',
    noPDF: 'Sem arquivos PDF anexados.',
    catalog: 'Catálogo',
    techSheet: 'Ficha técnica',
    file: 'Arquivo',
    noResults: 'Sem resultados para os filtros aplicados.',
    page: 'Página',
    of: 'de',
    labelSKU: 'SKU',
    labelGrupo: 'Grupo',
    labelTipo: 'Tipo',
    labelTerminacion: 'Acabamento',
    labelEspesor: 'Espessura',
    labelMedida: 'Medida',
    labelColor: 'Cor',
    labelDetalle: 'Detalhe',
    labelComentario: 'Comentário',
    labelGeneral: 'Geral',
    labelGrupoI: 'Grupo I',
    labelGrupoII: 'Grupo II',
    labelGrupoIII: 'Grupo III',
  }
}
const t = computed(() => TRANSLATIONS[locale.value] || TRANSLATIONS.es)

const { canManage } = usePermissions()
const { askPassword } = usePasswordConfirm()

const store = useProductsStore()
const toast = useToast()

const expandedId     = ref(null)
const pdfId          = ref(null)
const lightboxImgSrc = ref('')

function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
  if (expandedId.value === id) pdfId.value = null // mutually exclusive
}

function togglePdf(id) {
  pdfId.value = pdfId.value === id ? null : id
  if (pdfId.value === id) expandedId.value = null // mutually exclusive
}

function hasPdfs(p) {
  return !!(p.catalogo || p.fichaTecnica || p.archivos?.length)
}

function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api', '')}${path}`
}

const search = ref('')
const filtersOpen = ref(false)
const page = ref(1)
const pageSize = 20
const sortKey = ref('code')
const sortDir = ref('asc')

const filters = ref({
  grupo: '',
  color: '',
  medida: '',
  terminacion: '',
  textura: '',
  espesor: ''
})

const GRUPO_ORDER = [
  'LAMINADOS DECORATIVOS', 'KARIPLAC MDP', 'KARIPLAC MDF', 'KARIPLAK H', 'KARIPLAK MAX',
  'Kompak', 'Kompak Unicolor', 'Acustik', 'Top Floor Pisos', 'Top Wall',
  'Top Kit / Solid / Table', 'Coverwall', 'Top Box', 'Panel Expositor / Top Rack',
  'Karystyle', 'Kariform'
]

onMounted(() => {
  if (!store.products.length) store.fetchProducts()
})

function clearFilters() {
  Object.keys(filters.value).forEach(k => (filters.value[k] = ''))
  search.value = ''
}

const showDeleteAllConfirm = ref(false)

async function deleteAll() {
  try { await askPassword() } catch { showDeleteAllConfirm.value = false; return }
  try {
    const res = await store.deleteAllProducts()
    toast.success(res.message || 'Productos eliminados')
  } catch {
    toast.error('Error al vaciar productos')
  }
}

const filtered = computed(() => {
  let list = store.products

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p =>
      p.code?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.tipo?.toLowerCase().includes(q) ||
      p.terminacion?.toLowerCase().includes(q) ||
      p.grupo?.toLowerCase().includes(q) ||
      p.dimensions?.toLowerCase().includes(q) ||
      p.comentario?.toLowerCase().includes(q) ||
      (p.colorMode === 'todos' ? 'todos'.includes(q) : p.colors?.some(c => c.toLowerCase().includes(q))) ||
      p.thicknesses?.some(t => t.toLowerCase().includes(q))
    )
  }

  if (filters.value.grupo) list = list.filter(p => p.grupo === filters.value.grupo)
  if (filters.value.color) list = list.filter(p => p.colorMode === 'todos' || p.colors?.includes(filters.value.color))
  if (filters.value.medida) list = list.filter(p => p.dimensions === filters.value.medida)
  if (filters.value.terminacion) list = list.filter(p => p.terminacion === filters.value.terminacion)
  if (filters.value.textura) list = list.filter(p => p.textura === filters.value.textura)
  if (filters.value.espesor) list = list.filter(p => p.thicknesses?.includes(filters.value.espesor))

  return [...list].sort((a, b) => {
    const av = a[sortKey.value] ?? ''
    const bv = b[sortKey.value] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

// Mostrar vista agrupada cuando no hay filtro de grupo ni búsqueda activa
const showGrouped = computed(() => !filters.value.grupo && !search.value.trim())

const groupedFiltered = computed(() => {
  const map = {}
  for (const p of filtered.value) {
    const g = p.grupo || 'Sin grupo'
    if (!map[g]) map[g] = []
    map[g].push(p)
  }
  const ordered = GRUPO_ORDER.filter(g => map[g]).map(g => ({ grupo: g, items: map[g] }))
  const extra = Object.keys(map).filter(g => !GRUPO_ORDER.includes(g)).map(g => ({ grupo: g, items: map[g] }))
  return [...ordered, ...extra]
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(filtered, () => { page.value = 1 })

const allSelected = computed(() => {
  const rows = showGrouped.value ? filtered.value : paged.value
  return rows.length > 0 && rows.every(p => store.selectedIds.includes(p._id))
})

function toggleAll() {
  const rows = showGrouped.value ? filtered.value : paged.value
  if (allSelected.value) {
    rows.forEach(p => {
      const idx = store.selectedIds.indexOf(p._id)
      if (idx !== -1) store.selectedIds.splice(idx, 1)
    })
  } else {
    rows.forEach(p => {
      if (!store.selectedIds.includes(p._id)) store.selectedIds.push(p._id)
    })
  }
}

function sortBy(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function sortIcon(key) {
  if (sortKey.value !== key) return 'bi bi-chevron-expand text-muted'
  return sortDir.value === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'
}

function precioBase(p) {
  if (p.precio != null) return p.precio
  if (p.precioGrupoI != null) return p.precioGrupoI
  if (p.precioGrupoII != null) return p.precioGrupoII
  if (p.precioGrupoIII != null) return p.precioGrupoIII
  if (p.pricePerM2 != null) return p.pricePerM2
  return null
}

function unitLabel(u) {
  if (!u || u === 'm2') return 'm²'
  if (u === 'ml') return 'ml'
  return u
}

function formatPrice(n) {
  return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── COMENTARIO EXPANDIBLE ───────────────────────────────────────────────────

const expandedComments = ref(new Set())

function toggleComment(id) {
  const s = new Set(expandedComments.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedComments.value = s
}

// ── IMPRESIÓN LISTA DE PRECIOS ──────────────────────────────────────────────

const showPrintModal = ref(false)
const printSelectedGrupos = ref([])
const printLoading = ref(false)
const productGroups = ref([])

const gruposDisponibles = computed(() => {
  const fromGrupoOrder = GRUPO_ORDER.filter(g => store.uniqueGrupos.includes(g))
  const extra = store.uniqueGrupos.filter(g => !GRUPO_ORDER.includes(g)).sort()
  return [...fromGrupoOrder, ...extra]
})

async function openPrintModal() {
  showPrintModal.value = true
  if (!productGroups.value.length) {
    try {
      const token = sessionStorage.getItem('token')
      const { data } = await import('axios').then(m => m.default.get(
        `${API_BASE_URL}/product-groups`,
        { headers: { Authorization: `Bearer ${token}` } }
      ))
      productGroups.value = Array.isArray(data) ? data : []
    } catch { /* sin tablas de descuento */ }
  }
}

function printPriceList() {
  printLoading.value = true
  try {
    const grupos = printSelectedGrupos.value
    const win = window.open('', '_blank')
    if (!win) { toast.error('El navegador bloqueó la ventana emergente'); return }

    const rows = []
    for (const grupo of grupos) {
      const pgData = productGroups.value.find(g => g.nombre === grupo)
      const products = store.products.filter(p => p.grupo === grupo)
        .sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true }))

      // Tabla de descuentos
      let discountHtml = ''
      if (pgData?.descuentos?.length) {
        const filas = pgData.descuentos.map(t => `
          <tr>
            <td>${t.nota || (t.hastaHojas ? `${t.desdeHojas} a ${t.hastaHojas} hojas` : `Mayor a ${(t.desdeHojas || 1) - 1} hojas`)}</td>
            <td>${t.porcCantidad ?? 0}%</td>
            <td>${t.porcContado ?? 0}%</td>
            <td>${t.porc30dias ?? 0}%</td>
            <td>${t.porcCantidadContado ?? 0}%</td>
            <td>${t.porcCantidad30dias ?? 0}%</td>
          </tr>`).join('')
        discountHtml = `
          <table class="dt">
            <thead><tr>
              <th>Comentario</th><th>% Dto cantidad</th><th>% Dto contado</th>
              <th>% Dto 30 días f.f.</th><th>% Cant+Contado</th><th>% Cant+30días</th>
            </tr></thead>
            <tbody>${filas}</tbody>
          </table>`
      }

      // Filas de productos
      const productRows = products.map(p => {
        const colors = p.colorMode === 'todos' ? 'Todos' : (p.colors || []).join(', ')
        const esp = (p.thicknesses || []).join(', ') || p.espesor || ''
        const medida = p.dimensions || p.medida || ''
        const gI  = p.precioGrupoI  != null ? `$${formatPrice(p.precioGrupoI)}`  : ''
        const gII = p.precioGrupoII != null ? `$${formatPrice(p.precioGrupoII)}` : ''
        const gIII= p.precioGrupoIII!= null ? `$${formatPrice(p.precioGrupoIII)}`  : ''
        const gen = p.precioGeneral != null  ? `$${formatPrice(p.precioGeneral)}`  : ''
        const comentarioRow = p.comentario
          ? `<tr class="comment-row"><td colspan="10"><span class="comment-label">Obs:</span> ${p.comentario}</td></tr>`
          : ''
        return `<tr>
          <td>${p.code || ''}</td>
          <td>${p.name || ''}</td>
          <td>${colors}</td>
          <td>${medida}</td>
          <td>${esp}</td>
          <td>${p.terminacion || ''}</td>
          <td class="price">${gen}</td>
          <td class="price">${gI}</td>
          <td class="price">${gII}</td>
          <td class="price">${gIII}</td>
        </tr>${comentarioRow}`
      }).join('')

      rows.push(`
        <div class="grupo-block">
          <h2 class="grupo-title">${grupo}</h2>
          ${discountHtml}
          <table class="pt">
            <thead><tr>
              <th>Código</th><th>Descripción</th><th>Color</th><th>Medida</th>
              <th>Espesor</th><th>Terminación</th>
              <th>Gral</th><th>Grupo I</th><th>Grupo II</th><th>Grupo III</th>
            </tr></thead>
            <tbody>${productRows}</tbody>
          </table>
        </div>`)
    }

    win.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8">
      <title>Lista de Precios</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 9pt; color: #111; padding: 12mm 10mm; }
        .print-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; border-bottom: 2px solid #3b6b2e; padding-bottom: 8px; }
        .print-header h1 { font-size: 15pt; color: #2d5220; }
        .print-header .date { font-size: 8pt; color: #555; }
        .grupo-block { margin-bottom: 20px; page-break-inside: avoid; }
        .grupo-title { font-size: 11pt; font-weight: 700; color: #fff; background: #3b6b2e; padding: 5px 10px; margin-bottom: 6px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8pt; }
        table.dt thead th { background: #e8f0e0; color: #2d5220; padding: 4px 6px; text-align: left; border: 1px solid #c8d8b0; font-size: 7.5pt; }
        table.dt td { padding: 3px 6px; border: 1px solid #ddd; }
        table.dt tr:nth-child(even) td { background: #f6f9f2; }
        table.pt thead th { background: #2d5220; color: #fff; padding: 4px 5px; text-align: left; border: 1px solid #1e3d15; font-size: 7.5pt; }
        table.pt td { padding: 3px 5px; border: 1px solid #e0e0e0; vertical-align: top; }
        table.pt tr:nth-child(even) td { background: #f9fbf6; }
        td.price { text-align: right; white-space: nowrap; }
        tr.comment-row td { background: #f5f8f0; color: #444; font-size: 7.5pt; font-style: italic; padding: 2px 5px 4px 5px; border-top: none; }
        .comment-label { font-weight: 700; font-style: normal; color: #3b6b2e; }
        @media print {
          .grupo-block { page-break-inside: avoid; }
          body { padding: 0; }
        }
      </style>
    </head><body>
      <div class="print-header">
        <h1>Lista de Precios</h1>
        <span class="date">Fecha: ${new Date().toLocaleDateString('es-AR')}</span>
      </div>
      ${rows.join('')}
      <script>window.onload = () => { window.print() }<\/script>
    </body></html>`)
    win.document.close()
  } finally {
    printLoading.value = false
    showPrintModal.value = false
  }
}

function stockBadge(stock) {
  const n = stock ?? 0
  if (n === 0) return 'badge badge-danger'
  if (n <= 5) return 'badge badge-warning'
  return 'badge badge-ok'
}

function colorStyle(colorName) {
  const map = {
    negro: '#1a1a1a', blanco: '#f5f5f5', gris: '#9e9e9e', rojo: '#e53935',
    azul: '#1e88e5', verde: '#43a047', amarillo: '#fdd835', marrón: '#6d4c41',
    naranja: '#fb8c00', rosa: '#e91e63', violeta: '#8e24aa', beige: '#d7c4a1',
    platino: '#e5e4e2', almendra: '#d4a96a', tiza: '#b0b0b0',
  }
  const key = Object.keys(map).find(k => colorName?.toLowerCase().includes(k))
  return { backgroundColor: key ? map[key] : '#ccc', width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }
}
</script>

<style scoped>
.topbar { margin-bottom: 0.6rem; }

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.toolbar-actions a { text-decoration: none; }

.search-wrap {
  position: relative;
  flex: 1 1 240px;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-size: 0.95rem;
  pointer-events: none;
}

.search-input {
  padding-left: 2.4rem !important;
  width: 100%;
}

.inv-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 0.85rem;
  align-items: start;
}

.inv-sidebar {
  background: rgba(107, 142, 58, 0.06);
  border: 1px solid rgba(107, 142, 58, 0.14);
  border-radius: 16px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  position: sticky;
  top: 0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-header strong {
  font-family: 'Poppins', sans-serif;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.filter-group select {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  border-radius: 10px;
}

.filter-count {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-muted);
  padding-top: 0.5rem;
  border-top: 1px solid rgba(107,142,58,0.1);
}

.inv-content { min-width: 0; }

.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  background: rgba(107, 142, 58, 0.1);
  border-radius: 14px;
  margin-bottom: 1rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.selection-bar a { text-decoration: none; }

.table-scroll {
  max-height: 200dvh;
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 16px;
  border: 1px solid rgba(107, 142, 58, 0.14);
}

.inv-table { min-width: 800px; }

.inv-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgba(245, 250, 242, 0.97);
  backdrop-filter: blur(4px);
  font-size: 0.75rem;
  padding: 0.5rem 0.7rem;
  white-space: nowrap;
}

.inv-table tbody td { padding: 0.4rem 0.7rem; vertical-align: middle; }
.inv-table tbody tr:hover { background: rgba(107, 142, 58, 0.04); }
.inv-table tbody tr.selected { background: rgba(107, 142, 58, 0.1); }

/* Group header rows */
.group-header-row {
  background: rgba(107, 142, 58, 0.1) !important;
}

.group-header-row:hover {
  background: rgba(107, 142, 58, 0.13) !important;
}

.group-header-cell {
  padding: 0.65rem 1rem !important;
  border-top: 2px solid rgba(107, 142, 58, 0.25);
}

.group-header-cell:first-child {
  border-top-left-radius: 0;
}

.group-icon {
  color: var(--color-primary, #6b8e3a);
  margin-right: 0.5rem;
  font-size: 0.88rem;
}

.group-header-label {
  font-family: 'Poppins', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-primary, #6b8e3a);
}

.group-count {
  margin-left: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-muted);
  font-weight: 500;
}

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: rgba(107, 142, 58, 0.12); }

.col-check { width: 40px; }

.code-badge {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  background: rgba(107, 142, 58, 0.1);
  padding: 0.2rem 0.55rem;
  border-radius: 8px;
  color: var(--color-text);
  font-weight: 600;
}

.desc-cell {
  min-width: 160px;
  max-width: 260px;
}

.desc-name {
  display: block;
  font-weight: 600;
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* tipo · terminacion en una sola fila */
.desc-meta-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  overflow: hidden;
}

.desc-meta {
  font-size: 0.72rem;
  color: var(--color-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.desc-meta-sep {
  font-size: 0.65rem;
  color: var(--color-muted);
  opacity: 0.5;
  flex-shrink: 0;
}

.desc-terminacion { font-style: italic; }

.desc-medida {
  display: inline-block;
  margin-top: 0.15rem;
  font-size: 0.67rem;
  color: var(--color-muted);
}

.desc-espesor {
  display: inline-block;
  margin-top: 0.15rem;
  font-size: 0.67rem;
  font-weight: 700;
  background: rgba(107, 142, 58, 0.1);
  color: var(--color-primary, #6b8e3a);
  padding: 0.05rem 0.4rem;
  border-radius: 5px;
  letter-spacing: 0.03em;
}

.color-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.83rem;
  white-space: nowrap;
}

.price-cell { font-weight: 600; white-space: nowrap; }

.unit-label {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--color-muted);
  margin-left: 1px;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}
.badge-ok { background: rgba(34,197,94,0.12); color: #15803d; }
.badge-warning { background: rgba(234,179,8,0.14); color: #b45309; }
.badge-danger { background: rgba(239,68,68,0.12); color: #b91c1c; }

.btn-sm {
  padding: 0.35rem 0.65rem !important;
  font-size: 0.8rem;
  border-radius: 10px !important;
  min-width: 0 !important;
}

.btn-selected {
  background: var(--color-primary) !important;
  color: #fff !important;
}

.action-buttons { display: flex; gap: 0.35rem; align-items: center; }
.action-buttons a {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  height: 32px;
  flex-shrink: 0;
}
.action-buttons a .btn-sm,
.action-buttons .btn-sm {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  min-width: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
  border-radius: 9px !important;
  font-size: 0.9rem;
}

.muted { color: var(--color-muted); }

.empty-row {
  text-align: center;
  padding: 2rem;
  color: var(--color-muted);
  font-style: italic;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.2rem;
  font-size: 0.88rem;
}

.ghost-button.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .inv-layout { grid-template-columns: 1fr; }

  .inv-sidebar {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 500;
    border-radius: 0;
    overflow-y: auto;
    background: rgba(255,255,255,0.98);
    padding: 2rem 1.5rem;
  }

  .inv-sidebar.open { display: flex; }

  .table-scroll { -webkit-overflow-scrolling: touch; }

  .toolbar-actions { flex-wrap: wrap; gap: 0.4rem; }
}

/* PDF indicator pill on product name */
.desc-cell--clickable { cursor: pointer; }
.desc-cell--clickable:hover .desc-name { color: var(--color-primary); text-decoration: underline; }

.pdf-pill {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px;
  background: rgba(239, 68, 68, 0.1); color: #ef4444;
  font-size: 0.7rem; margin-left: 4px; vertical-align: middle;
  flex-shrink: 0; transition: background 0.15s, color 0.15s;
}
.pdf-pill--active {
  background: #ef4444; color: #fff;
}

/* PDF expand row */
.pdf-expand-row td { padding: 0 !important; }
.pdf-expand-box {
  background: rgba(239, 68, 68, 0.03);
  border-top: 1px solid rgba(239, 68, 68, 0.15);
  border-bottom: 1px solid rgba(239, 68, 68, 0.15);
  padding: 0.75rem 1rem;
}
.pdf-expand-title {
  font-size: 0.75rem; font-weight: 700; color: #6b7280;
  text-transform: uppercase; letter-spacing: 0.04em;
  margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.35rem;
}
.pdf-empty {
  font-size: 0.82rem; color: #9ca3af; font-style: italic;
}
.pdf-list {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.pdf-item {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.75rem; border-radius: 8px;
  background: #fff; border: 1px solid #e5e7eb;
  font-size: 0.82rem; font-weight: 500; color: #374151;
  text-decoration: none; transition: background 0.15s, border-color 0.15s;
}
.pdf-item:hover {
  background: #f9fafb; border-color: #d1d5db;
}
.pdf-item i { font-size: 1.1rem; flex-shrink: 0; }
.pdf-icon-red  { color: #ef4444; }
.pdf-icon-blue { color: #3b82f6; }
.pdf-icon-gray { color: #6b7280; }

/* Detail expand */
.detail-expand-row td { padding: 0 !important; }
.detail-expand-box {
  background: rgba(107, 142, 58, 0.04);
  border-top: 1px solid rgba(107, 142, 58, 0.12);
  border-bottom: 1px solid rgba(107, 142, 58, 0.12);
  padding: 0.8rem 1rem;
}
.dex-grid {
  display: flex; gap: 1rem; flex-wrap: wrap;
}
.dex-img {
  width: 80px; height: 80px; border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(107, 142, 58, 0.15); flex-shrink: 0;
}
.dex-img img { width: 100%; height: 100%; object-fit: cover; }
.dex-info {
  flex: 1; min-width: 180px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 0.8rem;
}
.dex-row { display: flex; gap: 0.4rem; align-items: baseline; font-size: 0.8rem; }
.dex-row.full { grid-column: 1 / -1; }
.dex-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted); white-space: nowrap; }
.dex-prices {
  display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-start;
}
.dex-price {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.35rem 0.6rem; border-radius: 8px;
  background: rgba(255,255,255,0.8); border: 1px solid rgba(107, 142, 58, 0.12);
}
.dex-val { font-weight: 700; font-size: 0.9rem; }
.dex-footer { margin-top: 0.5rem; }
.dex-footer a { text-decoration: none; }

@media (max-width: 768px) {
  .inv-table { min-width: 0; font-size: 0.78rem; }
  .inv-table thead th { padding: 0.4rem 0.45rem; font-size: 0.68rem; white-space: normal; word-break: break-word; }
  .inv-table tbody td { padding: 0.35rem 0.45rem; }

  .inv-table th:nth-child(1),
  .inv-table td:nth-child(1):not(.detail-expand-row td):not(.pdf-expand-row td),
  .inv-table th:nth-child(2),
  .inv-table td:nth-child(2):not(.detail-expand-row td):not(.pdf-expand-row td),
  .inv-table th:nth-child(4),
  .inv-table td:nth-child(4):not(.detail-expand-row td):not(.pdf-expand-row td),
  .inv-table th:nth-child(6),
  .inv-table td:nth-child(6):not(.detail-expand-row td):not(.pdf-expand-row td),
  .inv-table th:nth-child(7),
  .inv-table td:nth-child(7):not(.detail-expand-row td):not(.pdf-expand-row td) {
    display: none;
  }

  .detail-expand-row td { display: table-cell !important; }
  .pdf-expand-row td { display: table-cell !important; }
  .detail-expand-box { padding: 0.6rem 0.5rem; }
  .pdf-expand-box { padding: 0.6rem 0.5rem; }
  .dex-info { grid-template-columns: 1fr; }

  .desc-cell { max-width: none; min-width: 0; }
  .desc-name { white-space: normal; }

  .action-buttons { gap: 0.2rem; }
  .action-buttons .btn-sm { padding: 0.3rem 0.5rem; font-size: 0.75rem; }
}

@media (max-width: 480px) {
  .container { padding: 0.6rem 0.4rem; }
  .toolbar-actions { gap: 0.3rem; }
  .search-input { font-size: 0.8rem; }
  /* Hide medida column on very small phones */
  .inv-table th:nth-child(5),
  .inv-table td:nth-child(5):not(.detail-expand-row td) { display: none; }
}

@media (max-width: 768px) {
  .btn-vaciar { padding: 0.45rem 0.7rem; }
  .vaciar-label { display: none; }
}

/* Comentario expandible */
.comment-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.comment-text {
  white-space: pre-line;
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.45;
}

.comment-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.comment-toggle {
  all: unset;
  font-size: 0.78rem;
  color: #3b6b2e;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}

.comment-toggle:hover { text-decoration: underline; }

/* Modal imprimir */
.print-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.print-modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  width: 420px;
  max-width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.print-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.print-modal-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #2d5220;
}

.print-modal-hint {
  font-size: 0.83rem;
  color: #555;
  margin: 0;
}

.print-modal-actions-top {
  display: flex;
  gap: 0.5rem;
}

.print-grupo-list {
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  max-height: 320px;
}

.print-grupo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  cursor: pointer;
  padding: 0.2rem 0;
}

.print-grupo-item input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: #3b6b2e;
  cursor: pointer;
}

.print-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.25rem;
  border-top: 1px solid #f0f0f0;
}

/* ── Scroll-lock: topbar stays fixed, only table scrolls ─────────────────── */
.page-container {
  height: 100%;
  align-items: stretch;
  overflow: hidden;
}
.container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.inv-layout {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}
.inv-sidebar { align-self: start; }
.inv-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.table-scroll {
  flex: 1;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
}
.pagination { flex-shrink: 0; }

/* ── PDF expand: image thumbnail ─────────────────────────────────────────── */
.pdf-expand-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}
.pdf-expand-head .pdf-expand-title { margin-bottom: 0; }

.pdf-thumb-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(107, 142, 58, 0.2);
  cursor: zoom-in;
  flex-shrink: 0;
}
.pdf-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.15s;
}
.pdf-thumb-wrap:hover .pdf-thumb { opacity: 0.75; }
.pdf-thumb-zoom {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.15s;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}
.pdf-thumb-wrap:hover .pdf-thumb-zoom { opacity: 1; }

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
.lb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
.lb-img {
  max-width: 90vw;
  max-height: 88vh;
  border-radius: 10px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  cursor: default;
  display: block;
}
.lb-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.lb-close:hover { background: rgba(255,255,255,0.28); }
</style>

<style>
[data-theme="dark"] .inv-table thead th {
  background: rgba(13,18,35,0.85) !important;
  color: rgba(255,255,255,0.55) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .inv-sidebar {
  background: rgba(13,18,35,0.55) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .inv-table tbody tr:hover {
  background: rgba(255,102,0,0.06) !important;
}
[data-theme="dark"] .inv-table tbody tr.selected {
  background: rgba(255,102,0,0.1) !important;
}
[data-theme="dark"] .group-header-row {
  background: rgba(255,102,0,0.08) !important;
}
[data-theme="dark"] .group-header-row:hover {
  background: rgba(255,102,0,0.12) !important;
}
[data-theme="dark"] .group-header-cell {
  border-top-color: rgba(255,102,0,0.2) !important;
}
[data-theme="dark"] .group-header-label,
[data-theme="dark"] .group-icon { color: #FF8C42 !important; }
[data-theme="dark"] .selection-bar {
  background: rgba(255,102,0,0.1) !important;
  border-color: rgba(255,102,0,0.18) !important;
}
[data-theme="dark"] .table-scroll {
  border-color: rgba(255,255,255,0.07) !important;
}
[data-theme="dark"] .filter-count {
  border-top-color: rgba(255,255,255,0.08) !important;
  color: rgba(255,255,255,0.45) !important;
}
</style>
