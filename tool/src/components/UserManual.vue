<template>
  <div class="manual-shell">
    <button type="button" class="manual-btn" @click.stop="open = !open" title="Manual de usuario">
      <i class="bi bi-question-circle-fill"></i>
      <span class="manual-btn-label">Manual</span>
    </button>

    <Teleport to="body">
      <Transition name="manual-slide">
        <aside v-if="open" class="manual-panel" @click.stop>
          <header class="manual-header">
            <h2 class="manual-title"><i class="bi bi-book-half"></i> Manual de usuario</h2>
            <button type="button" class="manual-close" @click="open = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </header>

          <nav class="manual-nav">
            <button v-for="s in sections" :key="s.id"
              :class="['manual-nav-btn', { active: activeSection === s.id }]"
              @click="activeSection = s.id">
              <i :class="'bi ' + s.icon"></i> {{ s.label }}
            </button>
          </nav>

          <div class="manual-body">
            <!-- INVENTARIO -->
            <template v-if="activeSection === 'inventory'">
              <div class="manual-section">
                <h3>Inventario de productos</h3>
                <p>Aquí gestionás todos los productos de la empresa.</p>
                <ul>
                  <li><strong>Buscar:</strong> escribí código, nombre, color o grupo en la barra de búsqueda.</li>
                  <li><strong>Filtros:</strong> filtrá por grupo, color, medida, terminación o espesor usando los selectores.</li>
                  <li><strong>Nuevo producto:</strong> botón verde arriba a la derecha (solo admin).</li>
                  <li><strong>Ver detalle:</strong> hacé click en cualquier producto para ver precios, colores, fichas y archivos.</li>
                  <li><strong>Editar:</strong> desde el detalle del producto (solo admin).</li>
                  <li><strong>Color TODOS:</strong> los productos que tienen "TODOS" como color están disponibles en todos los colores del catálogo. Al cotizarlos podrás elegir el color específico.</li>
                </ul>
                <div class="manual-tip">💡 Podés exportar el listado de precios desde la vista de precios masivos.</div>
              </div>
            </template>

            <!-- SKU -->
            <template v-if="activeSection === 'sku'">
              <div class="manual-section">
                <h3>Estructura del SKU</h3>
                <p>El SKU (código único) de cada producto se construye automáticamente:</p>
                <div class="sku-example">
                  <span class="sku-part prefix">LKH</span>
                  <span class="sku-sep">+</span>
                  <span class="sku-part color">TE</span>
                  <span class="sku-sep">+</span>
                  <span class="sku-part term">BR</span>
                </div>
                <ul>
                  <li><strong>Prefijo (3 letras):</strong> identifica la línea. Ej: LKH = línea de alto brillo.</li>
                  <li><strong>Código de color:</strong> código del catálogo de colores. Ej: TE = Teca.</li>
                  <li><strong>Terminación:</strong> BR = Brillante, SE = Semimate, TE = Textura.</li>
                </ul>
                <p>Si el producto tiene múltiples colores o terminaciones, el SKU completo se define al momento de cotizar.</p>
              </div>
            </template>

            <!-- COTIZACIONES -->
            <template v-if="activeSection === 'quotes'">
              <div class="manual-section">
                <h3>Cotizaciones</h3>
                <p>Creá y gestioná cotizaciones para tus clientes.</p>
                <h4>Cómo crear una cotización</h4>
                <ol>
                  <li>Hacé click en <strong>Nueva cotización</strong>.</li>
                  <li>Completá el título y los datos del cliente (podés buscar un cliente del CRM).</li>
                  <li>Agregá productos con el buscador — empezá a tipear el nombre o código.</li>
                  <li>Elegí tipo, color, cantidad y descuento por ítem.</li>
                  <li>Si el producto tiene un <strong>agregado opcional</strong> (ej: Capa exterior), aparece una fila debajo: tildá el checkbox para incluirlo y ajustá la cantidad. El agregado no recibe descuento.</li>
                  <li>El campo <strong>Descripción / Observaciones</strong> por ítem se amplía mientras escribís y vuelve a su tamaño al salir.</li>
                  <li>Usá la sección de <strong>Descuentos</strong> (seleccionable + % manual, uno al lado del otro).</li>
                  <li>Guardá como borrador o marcá como enviada.</li>
                </ol>
                <div class="manual-tip">💡 Los vendedores no pueden eliminar cotizaciones ni editar la plantilla de impresión.</div>
              </div>
            </template>

            <!-- CRM -->
            <template v-if="activeSection === 'crm'">
              <div class="manual-section">
                <h3>CRM — Gestión de clientes</h3>
                <h4>Clientes</h4>
                <ul>
                  <li><strong>Potencial:</strong> cliente sin compra confirmada.</li>
                  <li><strong>Normal/Activo:</strong> cliente con al menos una venta ganada (cambia automáticamente).</li>
                  <li>Los vendedores pueden crear y editar clientes, pero no eliminarlos.</li>
                  <li>El tipo de cliente (potencial → normal) cambia solo al ganar una cotización.</li>
                </ul>
                <h4>Pipeline</h4>
                <ul>
                  <li><strong>Nuevo lead → Contactado → Cotización enviada → Negociación → Ganado / Perdido</strong></li>
                  <li>Cada cliente avanza por las etapas según el seguimiento.</li>
                  <li>Si no registrás actividad en 48h en un cliente activo, recibirás una notificación de recordatorio.</li>
                </ul>
                <h4>Reportes</h4>
                <ul>
                  <li>Los admin de ventas pueden generar reportes de todos los vendedores.</li>
                  <li>Los vendedores solo ven sus propios datos.</li>
                </ul>
              </div>
            </template>

            <!-- PRECIOS -->
            <template v-if="activeSection === 'prices'">
              <div class="manual-section">
                <h3>Precios masivos</h3>
                <p>Aplicá aumentos o descuentos a múltiples productos a la vez.</p>
                <ul>
                  <li>Ingresá el porcentaje de ajuste (positivo = aumento, negativo = baja).</li>
                  <li>Podés filtrar por grupo para afectar solo ciertos productos.</li>
                  <li>La vista previa te muestra los precios resultantes antes de confirmar.</li>
                  <li><strong>Vendedores:</strong> solo pueden simular — no guardan cambios.</li>
                </ul>
                <h4>Grupos comerciales (Grupo I, II, III)</h4>
                <ul>
                  <li>Cada grupo tiene sus propios descuentos por cantidad y condición de pago.</li>
                  <li>Al cotizar, elegí el grupo del cliente para aplicar sus descuentos automáticamente.</li>
                </ul>
                <div class="manual-tip">💡 Los cambios de precio generan una notificación automática a todos los vendedores.</div>
              </div>
            </template>

            <!-- STOCK -->
            <template v-if="activeSection === 'stock'">
              <div class="manual-section">
                <h3>Gestión de stock</h3>
                <ul>
                  <li><strong>Ingreso:</strong> registrá entrada de mercadería.</li>
                  <li><strong>Salida:</strong> registrá salida o venta de stock.</li>
                  <li><strong>Ajuste:</strong> corregí el stock manualmente si hay diferencias.</li>
                  <li>El historial completo de movimientos queda registrado.</li>
                  <li><strong>Vendedores:</strong> solo pueden ver el stock, no modificarlo.</li>
                </ul>
              </div>
            </template>

            <!-- NOTIFICACIONES -->
            <template v-if="activeSection === 'notifs'">
              <div class="manual-section">
                <h3>Notificaciones</h3>
                <p>La campana (🔔) en la esquina superior derecha muestra las alertas activas.</p>
                <h4>Notificaciones de mantenimiento (admin/operarios)</h4>
                <ul>
                  <li>Máquinas detenidas y mantenimientos pendientes — actualización diaria 7 AM.</li>
                  <li>Resumen semanal de trabajos completados — todos los lunes.</li>
                </ul>
                <h4>Notificaciones de ventas (vendedores y admin ventas)</h4>
                <ul>
                  <li>Nuevo producto, cambio de precios, nuevo color, grupo modificado.</li>
                  <li>Nuevo cliente, cotización enviada.</li>
                  <li>Recordatorio de seguimiento (cada 2 días) para clientes sin actividad reciente.</li>
                  <li>Resumen semanal de ventas — todos los lunes.</li>
                  <li><strong>Admin ventas:</strong> además reciben resumen mensual el 1ro de cada mes.</li>
                </ul>
                <div class="manual-tip">💡 Activá las notificaciones push del navegador para recibirlas aunque la app esté en segundo plano.</div>
              </div>
            </template>

            <!-- ROLES -->
            <template v-if="activeSection === 'roles'">
              <div class="manual-section">
                <h3>Roles de usuario</h3>
                <div class="role-table">
                  <div class="role-row header">
                    <span>Rol</span><span>Acceso</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge admin">Admin</span>
                    <span>Acceso total a todo el sistema</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge admin-ventas">Admin ventas</span>
                    <span>CRM + Inventario completo + gestión de vendedores</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge vendedor">Vendedor</span>
                    <span>Ver inventario, crear cotizaciones y clientes, ver sus propios reportes</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge operario">Operario</span>
                    <span>Dashboard de mantenimiento, crear y cerrar trabajos</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge supervisor">Supervisor</span>
                    <span>Ver historial de mantenimiento y dashboard</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </aside>
      </Transition>
      <div v-if="open" class="manual-backdrop" @click="open = false" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const open = ref(false)
const route = useRoute()

defineExpose({ open })

const sections = [
  { id: 'inventory', label: 'Inventario', icon: 'bi-box-seam' },
  { id: 'sku',       label: 'SKU',        icon: 'bi-upc-scan' },
  { id: 'quotes',    label: 'Cotizaciones', icon: 'bi-file-earmark-text' },
  { id: 'crm',       label: 'CRM',        icon: 'bi-graph-up-arrow' },
  { id: 'prices',    label: 'Precios',    icon: 'bi-tags' },
  { id: 'stock',     label: 'Stock',      icon: 'bi-archive' },
  { id: 'notifs',    label: 'Notificaciones', icon: 'bi-bell' },
  { id: 'roles',     label: 'Roles',      icon: 'bi-people' },
]

// Abre en la sección relevante según la ruta actual
const sectionByRoute = {
  InventoryView: 'inventory', ProductCreate: 'sku', ProductDetail: 'sku',
  ProductEdit: 'sku', BulkPrice: 'prices', StockManagement: 'stock',
  ProductGroups: 'inventory', ColorCatalog: 'inventory',
  CRM: 'crm', CrmView: 'crm',
  NotificationsHistory: 'notifs',
}

const activeSection = ref('inventory')

const toggleWithRoute = () => {
  const mapped = sectionByRoute[route.name] || 'inventory'
  if (!open.value) activeSection.value = mapped
  open.value = !open.value
}
</script>

<style scoped>
.manual-shell {
  position: fixed;
  top: 5.5rem;
  right: 1rem;
  z-index: 1200;
}

.manual-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #1e3a5f;
  color: #fff;
  border: none;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.35;
  transition: opacity 0.2s, background 0.15s;
}
.manual-btn:hover { opacity: 1; background: #274f82; }

@media (max-width: 768px) {
  .manual-shell { display: none; }
}

.manual-btn-label {
  font-size: 0.55rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  line-height: 1;
}

.manual-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1399;
  background: rgba(0,0,0,0.35);
}

.manual-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 100vw);
  height: 100vh;
  background: #ffffff !important;
  color: #1a1a1a !important;
  box-shadow: -8px 0 30px rgba(0,0,0,0.18);
  z-index: 1400;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.2rem 0.75rem;
  border-bottom: 1px solid #eee;
  background: #1e3a5f;
  color: #fff;
  flex-shrink: 0;
}

.manual-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.manual-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  opacity: 0.8;
}
.manual-close:hover { opacity: 1; background: rgba(255,255,255,0.15); }

.manual-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  background: #f8fafc;
  flex-shrink: 0;
}

.manual-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  border: 1px solid #d0d7e3;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  transition: all 0.12s;
}
.manual-nav-btn:hover { background: #e8f0fe; border-color: #a5b4fc; }
.manual-nav-btn.active { background: #1e3a5f; color: #fff; border-color: #1e3a5f; }

.manual-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  background: #ffffff;
  color: #1a1a1a;
}

.manual-section h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a5f;
  border-bottom: 2px solid #e8f0fe;
  padding-bottom: 0.4rem;
}

.manual-section h4 {
  margin: 1rem 0 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
}

.manual-section p {
  margin: 0 0 0.6rem;
  font-size: 0.83rem;
  color: #555;
  line-height: 1.5;
}

.manual-section ul, .manual-section ol {
  margin: 0 0 0.75rem;
  padding-left: 1.2rem;
}

.manual-section li {
  font-size: 0.82rem;
  color: #444;
  margin-bottom: 0.3rem;
  line-height: 1.45;
}

.manual-tip {
  background: #fef9c3;
  border-left: 3px solid #f59e0b;
  padding: 0.5rem 0.75rem;
  border-radius: 0 6px 6px 0;
  font-size: 0.8rem;
  color: #78350f;
  margin-top: 0.75rem;
}

/* SKU example */
.sku-example {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.75rem 0;
  flex-wrap: wrap;
}
.sku-part {
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
}
.sku-part.prefix { background: #dcfce7; color: #166534; }
.sku-part.color  { background: #dbeafe; color: #1e40af; }
.sku-part.term   { background: #fce7f3; color: #9d174d; }
.sku-sep { font-size: 1rem; color: #9ca3af; font-weight: 700; }

/* Role table */
.role-table { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
.role-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  background: #f9fafb;
}
.role-row.header { background: #1e3a5f; color: #fff; font-weight: 700; border-radius: 6px 6px 0 0; }
.role-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.73rem;
  font-weight: 700;
  text-align: center;
}
.role-badge.admin        { background: #fee2e2; color: #991b1b; }
.role-badge.admin-ventas { background: #dbeafe; color: #1e40af; }
.role-badge.vendedor     { background: #dcfce7; color: #166534; }
.role-badge.operario     { background: #fef9c3; color: #92400e; }
.role-badge.supervisor   { background: #f3e8ff; color: #6b21a8; }

/* Slide animation */
.manual-slide-enter-active, .manual-slide-leave-active { transition: transform 0.25s ease; }
.manual-slide-enter-from, .manual-slide-leave-to { transform: translateX(100%); }

.swatch-count { font-size: 0.8rem; font-weight: 400; color: #888; margin-left: 0.3rem; }
</style>
