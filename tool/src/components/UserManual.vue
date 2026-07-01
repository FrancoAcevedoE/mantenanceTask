<template>
  <div class="manual-shell">
    <button type="button" class="manual-btn" @click.stop="toggleWithRoute" title="Manual de usuario">
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
                <h4>Buscar y filtrar</h4>
                <ol>
                  <li>Ingresá al <strong>Inventario</strong> desde el menú lateral.</li>
                  <li>Escribí en la barra de búsqueda: código SKU, nombre, color o grupo.</li>
                  <li>Usá los selectores de <strong>Grupo / Color / Medida / Terminación / Espesor</strong> para filtrar resultados.</li>
                  <li>Los resultados se actualizan en tiempo real.</li>
                </ol>
                <h4>Ver detalle de un producto</h4>
                <ol>
                  <li>Click en el botón <strong>👁</strong> del producto en la lista.</li>
                  <li>Se abre la ficha completa: precios por tipo, colores disponibles, fichas técnicas y archivos adjuntos.</li>
                  <li>Si el producto tiene <strong>color TODOS</strong>, verás todos los colores del catálogo disponibles.</li>
                </ol>
                <h4>Crear un producto nuevo (solo admin)</h4>
                <ol>
                  <li>Click en el botón <strong>+</strong> verde arriba a la derecha.</li>
                  <li>Completá el SKU (o dejá que se construya automáticamente), nombre, descripción.</li>
                  <li>Elegí el modo de color: colores específicos o <em>TODOS</em>.</li>
                  <li>Agregá los tipos y sus precios (ej: Placa 4mm, Placa 6mm).</li>
                  <li>Opcionalmente agregá un <strong>agregado opcional</strong> (ej: Capa exterior) con su precio.</li>
                  <li>Click <strong>Guardar</strong>.</li>
                </ol>
                <h4>Editar un producto (solo admin)</h4>
                <ol>
                  <li>Abrí el detalle del producto → botón <strong>Editar</strong>.</li>
                  <li>Modificá los campos deseados.</li>
                  <li>Click <strong>Guardar cambios</strong>. Los vendedores recibirán una notificación si cambiaron precios.</li>
                </ol>
                <div class="manual-tip">💡 Los precios masivos permiten actualizar múltiples productos a la vez (sección Precios).</div>
              </div>
            </template>

            <!-- SKU -->
            <template v-if="activeSection === 'sku'">
              <div class="manual-section">
                <h3>Estructura del SKU</h3>
                <p>El SKU identifica de forma única cada producto. Se construye con tres partes:</p>
                <div class="sku-example">
                  <span class="sku-part prefix">LKH</span>
                  <span class="sku-sep">+</span>
                  <span class="sku-part color">TE</span>
                  <span class="sku-sep">+</span>
                  <span class="sku-part term">BR</span>
                </div>
                <h4>Cómo armar el SKU al crear un producto</h4>
                <ol>
                  <li><strong>Prefijo de línea (3 letras):</strong> identifica la línea de producto. Ej: <em>LKH</em> = línea de alto brillo, <em>LKM</em> = línea mate.</li>
                  <li><strong>Código de color:</strong> tomalo del catálogo de colores. Ej: <em>TE</em> = Teca, <em>BL</em> = Blanco.</li>
                  <li><strong>Terminación:</strong> <em>BR</em> = Brillante, <em>SE</em> = Semimate, <em>TE</em> = Textura.</li>
                  <li>El sistema ensambla automáticamente: <strong>LKH + TE + BR = LKHTEБR</strong>.</li>
                </ol>
                <h4>Productos con color TODOS</h4>
                <ol>
                  <li>Si el producto está disponible en todos los colores del catálogo, elegí la opción <strong>TODOS</strong> en el campo Color.</li>
                  <li>En inventario y cotizaciones, el vendedor elige el color específico al momento de cotizar.</li>
                  <li>El SKU final incluirá el código del color elegido.</li>
                </ol>
                <h4>Catálogo de colores</h4>
                <ol>
                  <li>Los colores se administran desde <strong>Inventario → Catálogo de colores</strong> (solo admin).</li>
                  <li>Para agregar un color: nombre + código de 2-4 letras + muestra de color hex.</li>
                  <li>Al agregar un color nuevo, los vendedores reciben una notificación automática.</li>
                </ol>
              </div>
            </template>

            <!-- COTIZACIONES -->
            <template v-if="activeSection === 'quotes'">
              <div class="manual-section">
                <h3>Cotizaciones</h3>
                <h4>Crear una cotización nueva</h4>
                <ol>
                  <li>Ir a <strong>CRM → Cotizaciones</strong> o desde el perfil de un cliente.</li>
                  <li>Click en <strong>Nueva cotización</strong>.</li>
                  <li>Completá el <strong>título</strong> de la cotización.</li>
                  <li>Buscá y seleccioná el <strong>cliente</strong> (o creá uno nuevo desde ahí).</li>
                  <li>Agregá productos uno a uno con el buscador: tipear nombre o SKU.</li>
                  <li>Para cada producto elegí: <em>tipo</em>, <em>color</em>, <em>cantidad</em> y <em>descuento</em> individual.</li>
                  <li>Si el producto tiene <strong>agregado opcional</strong> (ej: Capa exterior), tildá el checkbox para incluirlo y ajustá la cantidad. El agregado no recibe descuento.</li>
                  <li>Completá las <strong>Observaciones</strong> por ítem si es necesario (el campo se expande al escribir).</li>
                  <li>Aplicá descuentos globales si corresponde.</li>
                  <li>Click <strong>Guardar borrador</strong> para seguir después, o <strong>Marcar como enviada</strong> para registrar el envío al cliente.</li>
                </ol>
                <h4>Editar o duplicar una cotización</h4>
                <ol>
                  <li>Abrí la cotización desde el listado.</li>
                  <li>Click <strong>Editar</strong> para modificarla (si está en borrador).</li>
                  <li>Click <strong>Duplicar</strong> para crear una copia y adaptarla a otro cliente.</li>
                </ol>
                <h4>Imprimir / exportar</h4>
                <ol>
                  <li>Abrí el detalle de la cotización.</li>
                  <li>Click en el botón <strong>Imprimir</strong> — se genera un PDF listo para enviar.</li>
                </ol>
                <div class="manual-tip">💡 Al marcar una cotización como enviada, el cliente avanza automáticamente a la etapa "Cotización enviada" en el pipeline del CRM.</div>
              </div>
            </template>

            <!-- CRM -->
            <template v-if="activeSection === 'crm'">
              <div class="manual-section">
                <h3>CRM — Gestión de clientes</h3>
                <h4>Crear un cliente nuevo</h4>
                <ol>
                  <li>Ir a <strong>CRM → Clientes</strong>.</li>
                  <li>Click en <strong>+ Nuevo cliente</strong>.</li>
                  <li>Completá razón social, contacto, teléfono, email y dirección.</li>
                  <li>El tipo se asigna automáticamente como <em>Potencial</em>.</li>
                  <li>Click <strong>Guardar</strong>. El cliente aparece en el pipeline en etapa <em>Nuevo lead</em>.</li>
                </ol>
                <h4>Avanzar en el pipeline</h4>
                <ol>
                  <li>Abrí el cliente desde el listado.</li>
                  <li>En la sección <strong>Pipeline</strong>, seleccioná la etapa actual: <em>Nuevo lead → Contactado → Cotización enviada → Negociación → Ganado / Perdido</em>.</li>
                  <li>Al ganar una cotización, el cliente pasa automáticamente a <em>Ganado</em> y su tipo cambia a <em>Normal/Activo</em>.</li>
                </ol>
                <h4>Registrar una actividad</h4>
                <ol>
                  <li>Abrí el cliente → tab <strong>Actividades</strong>.</li>
                  <li>Click en <strong>+ Nueva actividad</strong>.</li>
                  <li>Elegí el tipo (llamada, reunión, email, visita) y escribí las notas.</li>
                  <li>Click <strong>Guardar</strong>.</li>
                  <li>Si no registrás actividad en 48 h, recibirás un recordatorio automático por notificación.</li>
                </ol>
                <h4>Ver reportes</h4>
                <ol>
                  <li>Ir a <strong>CRM → Reportes</strong>.</li>
                  <li>Los vendedores ven solo sus propios datos. Los admin de ventas ven todos.</li>
                  <li>Filtrá por período o vendedor.</li>
                </ol>
              </div>
            </template>

            <!-- PRECIOS -->
            <template v-if="activeSection === 'prices'">
              <div class="manual-section">
                <h3>Precios masivos</h3>
                <h4>Actualizar precios de múltiples productos</h4>
                <ol>
                  <li>Ir a <strong>Inventario → Precios masivos</strong>.</li>
                  <li>Opcionalmente filtrá por <strong>Grupo</strong> para afectar solo ciertos productos.</li>
                  <li>Ingresá el porcentaje de ajuste: número positivo para aumento, negativo para baja. Ej: <em>10</em> = +10%, <em>-5</em> = -5%.</li>
                  <li>Revisá la <strong>vista previa</strong> de precios resultantes.</li>
                  <li>Click <strong>Confirmar</strong>. Los precios se actualizan y los vendedores reciben una notificación.</li>
                </ol>
                <h4>Grupos comerciales</h4>
                <ol>
                  <li>Cada cliente pertenece a un <strong>Grupo I, II o III</strong> según su volumen y condición de pago.</li>
                  <li>Cada grupo tiene descuentos por cantidad distintos.</li>
                  <li>Al cotizar, seleccioná el grupo del cliente y los descuentos se aplican automáticamente.</li>
                  <li>Para modificar los descuentos de un grupo: <strong>Inventario → Grupos</strong> (solo admin).</li>
                </ol>
                <h4>Vista de precios para vendedores</h4>
                <ol>
                  <li>Los vendedores pueden simular ajustes de precio para ver el resultado.</li>
                  <li>No pueden confirmar cambios — solo el admin y admin de ventas pueden hacerlo.</li>
                </ol>
                <div class="manual-tip">💡 Los cambios de precio generan una notificación automática a todos los vendedores y admin de ventas.</div>
              </div>
            </template>

            <!-- STOCK -->
            <template v-if="activeSection === 'stock'">
              <div class="manual-section">
                <h3>Gestión de stock</h3>
                <h4>Registrar un ingreso de mercadería</h4>
                <ol>
                  <li>Abrí el <strong>detalle del producto</strong> desde Inventario.</li>
                  <li>Ir al tab <strong>Stock</strong>.</li>
                  <li>Click en <strong>+ Ingreso</strong>.</li>
                  <li>Completá: cantidad, fecha y proveedor.</li>
                  <li>Click <strong>Guardar</strong>. El stock disponible se actualiza automáticamente.</li>
                </ol>
                <h4>Registrar una salida de stock</h4>
                <ol>
                  <li>En el tab <strong>Stock</strong> del producto, click en <strong>+ Salida</strong>.</li>
                  <li>Ingresá cantidad y motivo (venta, muestra, pérdida, etc.).</li>
                  <li>Click <strong>Guardar</strong>.</li>
                </ol>
                <h4>Ajuste manual</h4>
                <ol>
                  <li>En el tab <strong>Stock</strong>, click en <strong>Ajuste</strong>.</li>
                  <li>Ingresá el valor correcto de stock y el motivo del ajuste.</li>
                  <li>Click <strong>Confirmar ajuste</strong>.</li>
                </ol>
                <div class="manual-tip">💡 Los vendedores solo pueden ver el stock, no modificarlo. Todos los movimientos quedan registrados en el historial.</div>
              </div>
            </template>

            <!-- NOTIFICACIONES -->
            <template v-if="activeSection === 'notifs'">
              <div class="manual-section">
                <h3>Notificaciones</h3>
                <h4>Ver notificaciones activas</h4>
                <ol>
                  <li>Click en la <strong>campana 🔔</strong> en la esquina superior derecha.</li>
                  <li>Se abre el panel con todas las alertas activas para tu rol.</li>
                  <li>Click en una notificación para ir directamente a la sección relacionada.</li>
                  <li>Marcá como leída con <strong>✓</strong> o descartá con <strong>✕</strong>.</li>
                </ol>
                <h4>Ver historial de notificaciones</h4>
                <ol>
                  <li>Menú lateral → <strong>Notificaciones</strong>.</li>
                  <li>Se listan todas las notificaciones recibidas, con fecha y tipo.</li>
                  <li>Cada rol ve solo las notificaciones de su área.</li>
                </ol>
                <h4>Activar notificaciones push</h4>
                <ol>
                  <li>Al ingresar a la app, el navegador te pide permiso para enviar notificaciones.</li>
                  <li>Click en <strong>Permitir</strong>.</li>
                  <li>Recibirás alertas aunque la app esté en segundo plano o la pantalla cerrada.</li>
                  <li>Si lo rechazaste, podés activarlo desde <em>Configuración del navegador → Notificaciones</em> para este sitio.</li>
                </ol>
                <h4>Notificaciones automáticas por rol</h4>
                <ul>
                  <li><strong>Admin / Operario / Supervisor:</strong> máquinas detenidas, mantenimientos pendientes, resumen semanal de trabajos (lunes).</li>
                  <li><strong>Vendedor:</strong> nuevo producto, cambio de precios, nuevo color, grupo modificado, nuevo cliente, cotización enviada, recordatorio de seguimiento (cada 2 días sin actividad), resumen semanal de ventas (lunes).</li>
                  <li><strong>Admin ventas:</strong> todo lo anterior + resumen mensual el 1ro de cada mes.</li>
                </ul>
              </div>
            </template>

            <!-- DIFUSIÓN -->
            <template v-if="activeSection === 'difusion'">
              <div class="manual-section">
                <h3>Difusión masiva</h3>
                <p>La herramienta de <strong>Difusión</strong> te permite enviar un mensaje a múltiples clientes a la vez por WhatsApp o email, directamente desde el CRM.</p>

                <h4>Abrir el panel de Difusión</h4>
                <ol>
                  <li>Ir a <strong>CRM → Actividades</strong>.</li>
                  <li>Click en el botón <strong>Difusión</strong> (ícono de megáfono <i class="bi bi-megaphone-fill"></i>) en la barra de herramientas.</li>
                  <li>Se abre el asistente de 3 pasos.</li>
                </ol>

                <h4>Paso 1: Seleccionar destinatarios</h4>
                <ol>
                  <li>Elegí un modo de selección:
                    <ul>
                      <li><strong>Todos:</strong> incluye todos los clientes activos.</li>
                      <li><strong>Por zona:</strong> filtrá por provincia/zona. Podés elegir varias a la vez.</li>
                      <li><strong>Selección manual:</strong> usá el buscador y tildá cliente a cliente.</li>
                    </ul>
                  </li>
                  <li>Abajo del selector verás el resumen: cuántos destinatarios tienen WhatsApp y cuántos tienen email.</li>
                  <li>Click <strong>Siguiente</strong> cuando tengas al menos 1 destinatario.</li>
                </ol>

                <h4>Paso 2: Escribir el mensaje</h4>
                <ol>
                  <li>Elegí el <strong>canal de envío</strong>: WhatsApp, Email, o ambos.</li>
                  <li>Escribí el mensaje en el campo de texto (máx. 1000 caracteres).</li>
                  <li>Si elegiste Email, completá también el <strong>asunto del correo</strong>.</li>
                  <li>Click <strong>Siguiente</strong>.</li>
                </ol>

                <h4>Paso 3: Enviar por WhatsApp</h4>
                <ol>
                  <li>Los contactos se agrupan en <strong>batches de 100</strong> (límite de difusión de WhatsApp).</li>
                  <li>Para cada batch podés:
                    <ul>
                      <li>Click en <strong>Abrir en WhatsApp Web</strong> — abre los chats uno a uno con el mensaje pre-cargado.</li>
                      <li>Click en <strong>Copiar números</strong> para pegar los números en una lista de difusión de WhatsApp.</li>
                      <li>Click en el nombre de cada contacto para abrirlo individualmente.</li>
                    </ul>
                  </li>
                  <li>Los contactos sin teléfono registrado se muestran en un aviso y no se incluyen.</li>
                </ol>

                <h4>Paso 3: Enviar por Email</h4>
                <ol>
                  <li>Click en <strong>Abrir cliente de correo</strong> — abre tu cliente de email (Gmail, Outlook, etc.) con todos los destinatarios como CCO y el mensaje pre-cargado.</li>
                  <li>Revisá y enviá desde tu cliente habitual.</li>
                  <li>Podés usar <strong>Copiar emails</strong> para pegar la lista en cualquier plataforma.</li>
                  <li>Los contactos sin email se listan como aviso.</li>
                </ol>

                <h4>Registrar como actividad</h4>
                <ol>
                  <li>Al finalizar el envío, tildá <strong>Registrar difusión como actividad</strong>.</li>
                  <li>Click en <strong>Registrar</strong>.</li>
                  <li>Queda guardada en el historial de Actividades como tipo "Difusión" con la cantidad de destinatarios y el resumen del mensaje.</li>
                </ol>

                <div class="manual-tip">💡 WhatsApp solo permite difusiones a contactos que te tienen guardado. Para mejores resultados, pediles a tus clientes que guarden tu número antes de enviar.</div>
                <div class="manual-tip">💡 Si tenés más de 100 destinatarios, el sistema divide automáticamente en batches para cumplir el límite de WhatsApp. Repetí el proceso para cada batch.</div>
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
                    <span>Acceso total: productos, precios, usuarios, historial, mantenimiento y CRM</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge admin-ventas">Admin ventas</span>
                    <span>CRM + Inventario completo + gestión de vendedores. Sin acceso a mantenimiento</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge vendedor">Vendedor</span>
                    <span>Ver inventario, crear cotizaciones y clientes, ver sus propios reportes. No modifica precios ni stock</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge operario">Operario</span>
                    <span>Dashboard de mantenimiento, crear y cerrar trabajos. Sin acceso a CRM</span>
                  </div>
                  <div class="role-row">
                    <span class="role-badge supervisor">Supervisor</span>
                    <span>Solo ver historial de mantenimiento y dashboard. Sin editar</span>
                  </div>
                </div>
                <h4>Gestión de usuarios (admin y admin ventas)</h4>
                <ol>
                  <li>Menú lateral → <strong>Usuarios</strong>.</li>
                  <li>Click <strong>Crear usuario</strong>.</li>
                  <li>Completá nombre, DNI (8 dígitos) y contraseña (4 dígitos numéricos).</li>
                  <li>Seleccioná el rol.</li>
                  <li>Click <strong>Guardar usuario</strong>.</li>
                  <li>Para <strong>editar</strong>: botón ✏️ del usuario → modificar → Guardar.</li>
                  <li>Para <strong>ocultar</strong>: botón 👁 — el usuario no puede iniciar sesión pero sus datos se conservan.</li>
                  <li>Para <strong>restaurar</strong>: en la sección "Usuarios ocultos" → botón Restaurar.</li>
                  <li>Para <strong>eliminar definitivamente</strong>: solo desde la zona de usuarios ocultos → Borrar definitivamente.</li>
                </ol>
                <div class="manual-tip">💡 El admin de ventas solo puede crear y gestionar usuarios con rol Vendedor.</div>
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
  { id: 'inventory', label: 'Inventario',  icon: 'bi-box-seam' },
  { id: 'sku',       label: 'SKU',         icon: 'bi-upc-scan' },
  { id: 'quotes',    label: 'Cotizaciones', icon: 'bi-file-earmark-text' },
  { id: 'crm',       label: 'CRM',         icon: 'bi-graph-up-arrow' },
  { id: 'difusion',  label: 'Difusión',    icon: 'bi-megaphone' },
  { id: 'prices',    label: 'Precios',     icon: 'bi-tags' },
  { id: 'stock',     label: 'Stock',       icon: 'bi-archive' },
  { id: 'notifs',    label: 'Notificaciones', icon: 'bi-bell' },
  { id: 'roles',     label: 'Roles',       icon: 'bi-people' },
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
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(30, 41, 59, 0.1);
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.45;
  transition: opacity 0.2s, background 0.18s, color 0.18s, box-shadow 0.18s;
}
.manual-btn:hover { opacity: 1; background: #f8fafc; color: #3b6b2e; box-shadow: 0 4px 16px rgba(30, 41, 59, 0.14); }

@media (max-width: 768px) {
  .manual-shell { display: none; }
}

.manual-btn-label {
  font-size: 0.55rem;
  font-weight: 700;
  color: inherit;
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
  color: #fff !important;
  flex-shrink: 0;
}

.manual-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #fff !important;
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
