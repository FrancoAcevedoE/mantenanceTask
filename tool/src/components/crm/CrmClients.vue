<template>
  <div class="cc-wrap">

    <!-- Toolbar -->
    <div class="cc-toolbar">
      <div class="cc-search-box">
        <i class="bi bi-search cc-search-ico"></i>
        <input v-model="search" type="text" placeholder="Buscar cliente..." class="cc-search" />
      </div>
      <select v-model="filterEstado" class="cc-select">
        <option value="">Todos</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>
      <select v-model="filterPipeline" class="cc-select">
        <option value="">Todas las etapas</option>
        <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <select v-if="allTags.length" v-model="filterTag" class="cc-select">
        <option value="">Todas las etiquetas</option>
        <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
      </select>
      <div class="cc-toolbar-right">
        <button class="cc-btn-view" :class="{ 'cc-btn-view--on': viewMode === 'cards' }" @click="viewMode = 'cards'" title="Vista tarjetas">
          <i class="bi bi-grid-3x3-gap-fill"></i>
        </button>
        <button class="cc-btn-view" :class="{ 'cc-btn-view--on': viewMode === 'list' }" @click="viewMode = 'list'" title="Vista lista">
          <i class="bi bi-list-ul"></i>
        </button>
        <button class="cc-btn-export" @click="exportToExcel" title="Exportar a Excel">
          <i class="bi bi-download"></i>
        </button>
        <button class="cc-btn-add" @click="openNew">
          <i class="bi bi-person-plus-fill"></i> Nuevo
        </button>
        <button class="cc-btn-import" @click="xlsxInput.click()">
          <i class="bi bi-file-earmark-spreadsheet"></i> Importar
        </button>
        <input ref="xlsxInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onXlsxFile" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="crmStore.loadingClients" class="cc-state">
      <div class="crm-spinner"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="cc-state">
      <i class="bi bi-person-x" style="font-size:2rem;color:var(--color-muted)"></i>
      <p>{{ search || filterEstado || filterPipeline || filterTag ? 'Sin resultados' : 'No hay clientes registrados' }}</p>
      <button v-if="!search && !filterEstado && !filterPipeline && !filterTag" @click="openNew">
        <i class="bi bi-person-plus-fill"></i> Agregar primer cliente
      </button>
    </div>

    <!-- ── Vista tarjetas (cards) ── -->
    <div v-else-if="viewMode === 'cards'" class="cc-grid">
      <div v-for="c in filtered" :key="c._id" class="cc-card-wrap">
        <!-- Burbuja roja/naranja: potencial sin actividad -->
        <div v-if="c.tipoCliente === 'potencial' && staleDays(c) >= 2"
          class="cc-stale-badge"
          :class="staleDays(c) >= 7 ? 'cc-stale-badge--critical' : 'cc-stale-badge--warn'">
          {{ staleDays(c) }}d
          <span class="cc-stale-tooltip">
            <strong>{{ staleDays(c) }} días sin actividad ni cotización</strong><br>
            <template v-if="staleDays(c) >= 7">⛔ Mañana este cliente se transfiere automáticamente al administrador de ventas.</template>
            <template v-else>⚠️ Registrá una actividad o cotización para evitar la transferencia automática a los 8 días.</template>
          </span>
        </div>
        <!-- Burbuja naranja: cliente sin cotización en 60+ días -->
        <div v-if="showQuoteBubble(c)"
          class="cc-stale-badge cc-stale-badge--quote"
          :style="c.tipoCliente === 'potencial' && staleDays(c) >= 2 ? 'top:0;right:38px' : ''">
          <i class="bi bi-file-earmark-x"></i>
          <span class="cc-stale-tooltip cc-stale-tooltip--quote">
            <strong>Sin cotización hace {{ daysSinceQuote(c) === 9999 ? 'mucho tiempo' : daysSinceQuote(c) + ' días' }}</strong><br>
            🟠 Este cliente no recibe una cotización en más de 60 días.
            <em style="display:block;margin-top:4px;opacity:.75">La alerta se ocultará al abrir la tarjeta y reaparecerá el próximo lunes.</em>
          </span>
        </div>
        <div class="cc-card" :class="{ 'cc-card--potencial': c.tipoCliente === 'potencial' }"
          @click.self="snoozeAndOpenDetail(c)">
          <div class="cc-card-top" @click.self="snoozeAndOpenDetail(c)">
            <div class="cc-avatar" :style="{ background: avatarColor(c.razonSocial || c.name || '') }">
              {{ initials(c.razonSocial || c.name || '?') }}
            </div>
            <div class="cc-card-head" @click="snoozeAndOpenDetail(c)" style="cursor:pointer">
              <div class="cc-razon">{{ c.razonSocial || c.name || '—' }}</div>
              <div class="cc-comercial">
                <template v-if="c.codigoCliente"><span class="cc-cod">#{{ c.codigoCliente }}</span></template>
                <template v-if="c.codigoCliente && c.nombreComercial"> · </template>
                <template v-if="c.nombreComercial">{{ c.nombreComercial }}</template>
              </div>
            </div>
            <div class="cc-card-actions">
              <button class="cc-ico-btn cc-ico-btn--edit" @click.stop="openEdit(c)" title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button v-if="canManage" class="cc-ico-btn cc-ico-btn--del" @click.stop="confirmDelete(c)" title="Eliminar">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>

          <div class="cc-card-body" @click="snoozeAndOpenDetail(c)">
            <div v-if="c.contactoPrincipal" class="cc-field">
              <i class="bi bi-person"></i><span>{{ c.contactoPrincipal }}</span>
            </div>
            <div v-if="c.cuitCuil" class="cc-field">
              <i class="bi bi-credit-card-2-front"></i><span>{{ c.cuitCuil }}</span>
            </div>
            <template v-if="c.telefonos?.length">
              <div v-for="(t, i) in c.telefonos.slice(0, 1)" :key="i" class="cc-field">
                <i class="bi bi-telephone"></i>
                <span>{{ t.numero }}</span>
                <span class="cc-sector">{{ t.sector }}</span>
              </div>
            </template>
            <div v-else-if="c.telefono" class="cc-field">
              <i class="bi bi-telephone"></i><span>{{ c.telefono }}</span>
            </div>
            <div v-if="c.email" class="cc-field cc-field--trunc">
              <i class="bi bi-envelope"></i><span>{{ c.email }}</span>
            </div>
            <div v-if="c.lugar || c.direccion" class="cc-field cc-field--trunc">
              <i class="bi bi-geo-alt-fill" style="color:#3b82f6"></i>
              <span>{{ c.lugar || c.direccion }}</span>
            </div>
            <!-- Tags preview -->
            <div v-if="c.tags?.length" class="cc-tags-row">
              <span v-for="tag in c.tags.slice(0, 3)" :key="tag" class="cc-tag">{{ tag }}</span>
            </div>
          </div>

          <div class="cc-card-foot">
            <span class="cc-tipo" :class="`cc-tipo--${c.tipoCliente || 'potencial'}`">
              <i :class="c.tipoCliente === 'normal' ? 'bi bi-person-check-fill' : 'bi bi-star-fill'"></i>
              {{ c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' }}
            </span>
            <span class="cc-badge" :class="`cc-badge--${c.estado || 'activo'}`">
              {{ c.estado || 'activo' }}
            </span>
            <span v-if="c.pipelineEstado" class="cc-stage"
              :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
              {{ stageLabel(c.pipelineEstado) }}
            </span>
            <!-- Quick action buttons -->
            <div class="cc-qa-row">
              <a v-if="primaryEmail(c)" :href="`mailto:${primaryEmail(c)}`" class="cc-qa-btn cc-qa-btn--email" title="Enviar email" @click.stop>
                <i class="bi bi-envelope-fill"></i>
              </a>
              <a v-if="primaryPhone(c)" :href="`tel:${primaryPhone(c)}`" class="cc-qa-btn cc-qa-btn--call" title="Llamar" @click.stop>
                <i class="bi bi-telephone-fill"></i>
              </a>
              <a v-if="waPhone(c)" :href="`https://wa.me/${waClean(c)}`" target="_blank" rel="noopener" class="cc-qa-btn cc-qa-btn--wa" title="WhatsApp" @click.stop>
                <i class="bi bi-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Vista lista (tabla) ── -->
    <div v-else-if="viewMode === 'list'" class="cc-table-wrap">
      <table class="cc-table">
        <thead>
          <tr>
            <th>Cód.</th>
            <th>Razón social</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Etapa</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c._id" class="cc-tr" @click="snoozeAndOpenDetail(c)">
            <td class="cc-td-cod">
              <span v-if="c.codigoCliente" class="cc-cod">#{{ c.codigoCliente }}</span>
            </td>
            <td class="cc-td-name">
              <div class="cc-tbl-avatar" :style="{ background: avatarColor(c.razonSocial || '') }">
                {{ initials(c.razonSocial || '?') }}
              </div>
              <div>
                <div class="cc-tbl-razon">{{ c.razonSocial || c.name || '—' }}</div>
                <div v-if="c.nombreComercial" class="cc-tbl-sub">{{ c.nombreComercial }}</div>
              </div>
            </td>
            <td>{{ c.contactoPrincipal || '—' }}</td>
            <td>{{ (c.telefonos?.[0]?.numero || c.telefono || '—') }}</td>
            <td class="cc-td-email">{{ c.email || '—' }}</td>
            <td>
              <span v-if="c.pipelineEstado" class="cc-stage"
                :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
                {{ stageLabel(c.pipelineEstado) }}
              </span>
            </td>
            <td>
              <span class="cc-tipo" :class="`cc-tipo--${c.tipoCliente || 'potencial'}`">
                {{ c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' }}
              </span>
            </td>
            <td @click.stop>
              <div class="cc-tbl-actions">
                <a v-if="primaryEmail(c)" :href="`mailto:${primaryEmail(c)}`" class="cc-qa-btn cc-qa-btn--email" title="Email"><i class="bi bi-envelope-fill"></i></a>
                <a v-if="primaryPhone(c)" :href="`tel:${primaryPhone(c)}`" class="cc-qa-btn cc-qa-btn--call" title="Llamar"><i class="bi bi-telephone-fill"></i></a>
                <a v-if="waPhone(c)" :href="`https://wa.me/${waClean(c)}`" target="_blank" rel="noopener" class="cc-qa-btn cc-qa-btn--wa" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>
                <button class="cc-ico-btn cc-ico-btn--edit" @click="openEdit(c)" title="Editar"><i class="bi bi-pencil"></i></button>
                <button v-if="canManage" class="cc-ico-btn cc-ico-btn--del" @click="confirmDelete(c)" title="Eliminar"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Panel de detalle del cliente ── -->
    <Teleport to="body">
      <div v-if="detailClient" class="cd-overlay" @click.self="closeDetail">
        <div class="cd-panel" :class="{ 'cd-panel--open': !!detailClient }">
          <!-- Header -->
          <div class="cd-hd">
            <div class="cd-hd-left">
              <div class="cd-avatar" :style="{ background: avatarColor(detailClient.razonSocial || '') }">
                {{ initials(detailClient.razonSocial || '?') }}
              </div>
              <div class="cd-hd-text">
                <div class="cd-hd-name">{{ detailClient.razonSocial || detailClient.name }}</div>
                <div class="cd-hd-sub">
                  <span v-if="detailClient.codigoCliente" class="cc-cod">#{{ detailClient.codigoCliente }}</span>
                  <span v-if="detailClient.codigoCliente && detailClient.nombreComercial"> · </span>
                  {{ detailClient.nombreComercial }}
                </div>
              </div>
            </div>
            <div class="cd-hd-right">
              <button class="cd-btn-edit" @click="openEdit(detailClient); closeDetail()">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="cd-btn-quote" @click="newQuoteFromClient(detailClient)">
                <i class="bi bi-file-earmark-plus"></i> Cotizar
              </button>
              <button class="cd-close" @click="closeDetail"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>

          <!-- Quick action bar -->
          <div class="cd-quick-row">
            <a v-if="primaryEmail(detailClient)" :href="`mailto:${primaryEmail(detailClient)}`" class="cd-qa cd-qa--email">
              <i class="bi bi-envelope-fill"></i> Email
            </a>
            <a v-if="primaryPhone(detailClient)" :href="`tel:${primaryPhone(detailClient)}`" class="cd-qa cd-qa--call">
              <i class="bi bi-telephone-fill"></i> Llamar
            </a>
            <a v-if="waPhone(detailClient)" :href="`https://wa.me/${waClean(detailClient)}`" target="_blank" rel="noopener" class="cd-qa cd-qa--wa">
              <i class="bi bi-whatsapp"></i> WhatsApp
            </a>
          </div>

          <!-- Scrollable body -->
          <div class="cd-body">

            <!-- Badges de estado -->
            <div class="cd-badges">
              <span class="cc-tipo" :class="`cc-tipo--${detailClient.tipoCliente || 'potencial'}`">
                <i :class="detailClient.tipoCliente === 'normal' ? 'bi bi-person-check-fill' : 'bi bi-star-fill'"></i>
                {{ detailClient.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' }}
              </span>
              <span class="cc-badge" :class="`cc-badge--${detailClient.estado || 'activo'}`">{{ detailClient.estado || 'activo' }}</span>
              <span v-if="detailClient.pipelineEstado" class="cc-stage"
                :style="{ background: stageColor(detailClient.pipelineEstado)+'18', color: stageColor(detailClient.pipelineEstado) }">
                {{ stageLabel(detailClient.pipelineEstado) }}
              </span>
            </div>

            <!-- Información de contacto -->
            <div class="cd-section">
              <div class="cd-section-title"><i class="bi bi-person-lines-fill"></i> Información</div>
              <div v-if="detailClient.contactoPrincipal" class="cd-field">
                <i class="bi bi-person"></i><span>{{ detailClient.contactoPrincipal }}</span>
              </div>
              <div v-if="detailClient.cuitCuil" class="cd-field">
                <i class="bi bi-credit-card-2-front"></i><span>{{ detailClient.cuitCuil }}</span>
              </div>
              <template v-if="detailClient.telefonos?.length">
                <div v-for="(t, i) in detailClient.telefonos" :key="i" class="cd-field">
                  <i class="bi bi-telephone"></i>
                  <span>{{ t.numero }}</span>
                  <span class="cc-sector">{{ t.sector }}</span>
                </div>
              </template>
              <div v-else-if="detailClient.telefono" class="cd-field">
                <i class="bi bi-telephone"></i><span>{{ detailClient.telefono }}</span>
              </div>
              <div v-if="detailClient.email" class="cd-field">
                <i class="bi bi-envelope"></i><span>{{ detailClient.email }}</span>
              </div>
              <div v-if="detailClient.lugar || detailClient.direccion" class="cd-field">
                <i class="bi bi-geo-alt-fill" style="color:#3b82f6"></i>
                <span>{{ detailClient.lugar || detailClient.direccion }}</span>
                <a v-if="detailClient.latitud && detailClient.longitud"
                  :href="`https://www.openstreetmap.org/?mlat=${detailClient.latitud}&mlon=${detailClient.longitud}&zoom=16`"
                  target="_blank" rel="noopener" class="cc-map-link" title="Ver en mapa">
                  <i class="bi bi-map-fill"></i>
                </a>
              </div>
              <div v-if="detailClient.observaciones" class="cd-field cd-field--obs">
                <i class="bi bi-chat-left-text"></i><span>{{ detailClient.observaciones }}</span>
              </div>
            </div>

            <!-- Etiquetas -->
            <div v-if="detailClient.tags?.length" class="cd-section">
              <div class="cd-section-title"><i class="bi bi-tags-fill"></i> Etiquetas</div>
              <div class="cd-tags">
                <span v-for="tag in detailClient.tags" :key="tag" class="cd-tag">{{ tag }}</span>
              </div>
            </div>

            <!-- Actividades del cliente -->
            <div class="cd-section">
              <div class="cd-section-title-row">
                <span class="cd-section-title"><i class="bi bi-clock-history"></i> Actividades recientes</span>
                <button class="cd-btn-mini" @click="openNewActivityForClient">
                  <i class="bi bi-plus"></i> Nueva
                </button>
              </div>
              <div v-if="!detailActivities.length" class="cd-empty">
                Sin actividades registradas. <br>Hacé clic en <strong>+ Nueva</strong> para agregar una.
              </div>
              <div v-for="act in detailActivities" :key="act._id" class="cd-act-item">
                <div class="cd-act-ico" :style="{ background: typeConfig(act.tipo)?.color + '20', color: typeConfig(act.tipo)?.color }">
                  <i :class="typeConfig(act.tipo)?.icon"></i>
                </div>
                <div class="cd-act-body">
                  <div class="cd-act-title" :class="{ 'cd-act-done': act.completada }">{{ act.titulo }}</div>
                  <div class="cd-act-meta">
                    {{ fmtDate(act.createdAt) }}
                    <span v-if="act.completada" class="cd-act-check"><i class="bi bi-check-circle-fill"></i></span>
                  </div>
                  <div v-if="act.descripcion" class="cd-act-desc">{{ act.descripcion }}</div>
                </div>
              </div>
            </div>

            <!-- Nota rápida -->
            <div class="cd-section">
              <div class="cd-section-title"><i class="bi bi-pencil-square"></i> Nota rápida</div>
              <textarea
                v-model="quickNoteText"
                class="cd-note-input"
                rows="3"
                placeholder="Escribí una nota sobre este cliente (ej: llamé hoy, quedó en confirmar el viernes)..."
              ></textarea>
              <button
                class="cd-note-btn"
                :disabled="!quickNoteText.trim() || savingNote"
                @click="saveQuickNote"
              >
                <div v-if="savingNote" class="btn-spin"></div>
                <span v-else><i class="bi bi-check-lg"></i> Registrar nota</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Modal add/edit ── -->
    <Teleport to="body">
      <div v-if="showModal" class="crm-backdrop" @click.self="closeModal">
        <div class="crm-modal">
          <div class="crm-modal-hd">
            <h2>{{ editing ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
            <button class="crm-close" @click="closeModal"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="crm-modal-bd">
            <div v-if="editing" class="cm-field cm-field--inline">
              <label>Cód. cliente</label>
              <input v-model="form.codigoCliente" maxlength="20" class="cm-input-code" />
            </div>
            <div class="cm-field">
              <label>Razón social *</label>
              <input v-model="form.razonSocial" placeholder="Ej: Distribuidora ABC S.A."
                maxlength="100" />
            </div>
            <div class="cm-field">
              <label>Nombre comercial</label>
              <input v-model="form.nombreComercial" placeholder="Ej: ABC Distribuidora"
                maxlength="100" />
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Contacto principal</label>
                <input v-model="form.contactoPrincipal" placeholder="Nombre del contacto"
                  maxlength="100" />
              </div>
              <div class="cm-field">
                <label>CUIL / CUIT</label>
                <input v-model="form.cuitCuil" placeholder="20-12345678-9"
                  maxlength="13"
                  @input="form.cuitCuil = form.cuitCuil.replace(/[^\d-]/g, '').slice(0, 13)" />
              </div>
            </div>
            <!-- ── Teléfonos múltiples ── -->
            <div class="cm-field">
              <label>Teléfonos</label>
              <div class="cm-phones">
                <div v-for="(t, i) in form.telefonos" :key="i" class="cm-phone-row">
                  <select v-model="t.sector" class="cm-phone-sector">
                    <option v-for="s in SECTORES" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <input v-model="t.numero" type="tel" placeholder="+54 351 555-0000"
                    class="cm-phone-num" maxlength="20"
                    @input="t.numero = t.numero.replace(/[^\d\s\+\-\(\)]/g, '').slice(0, 20)" />
                  <button type="button" class="cm-phone-del" :disabled="form.telefonos.length === 1"
                    @click="form.telefonos.splice(i, 1)" title="Quitar">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <button type="button" class="cm-phone-add" @click="form.telefonos.push({ numero: '', sector: 'General' })">
                  <i class="bi bi-plus-circle"></i> Agregar teléfono
                </button>
              </div>
            </div>
            <div class="cm-field">
              <label>Email</label>
              <input v-model="form.email" placeholder="contacto@empresa.com" type="email"
                maxlength="100" />
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Estado</label>
                <select v-model="form.estado">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="cm-field">
                <label>Etapa en pipeline</label>
                <select v-model="form.pipelineEstado">
                  <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
            </div>
            <div class="cm-field">
              <label>Observaciones</label>
              <input v-model="form.observaciones" placeholder="Notas sobre el cliente" maxlength="300" />
            </div>

            <!-- ── Etiquetas (tags) ── -->
            <div class="cm-field">
              <label>Etiquetas</label>
              <div class="cm-tags-wrap">
                <div class="cm-tags-chips">
                  <span v-for="(tag, i) in form.tags" :key="i" class="cm-tag-chip">
                    {{ tag }}
                    <button type="button" class="cm-tag-del" @click="form.tags.splice(i, 1)"><i class="bi bi-x"></i></button>
                  </span>
                  <input
                    v-model="tagInput"
                    class="cm-tag-input"
                    placeholder="Agregar etiqueta..."
                    maxlength="30"
                    @keydown.enter.prevent="addTag"
                    @keydown.comma.prevent="addTag"
                    @blur="addTag"
                  />
                </div>
              </div>
              <p class="cm-tipo-hint">Presioná Enter o coma para agregar. Ej: constructor, revendedor, arquitecto</p>
            </div>

            <!-- ── Tipo de cliente ── -->
            <div class="cm-field">
              <label>Tipo de cliente</label>
              <div v-if="canManage" class="cm-tipo-row">
                <button type="button"
                  :class="['cm-tipo-opt', { 'cm-tipo-opt--sel cm-tipo-opt--pot': form.tipoCliente === 'potencial' }]"
                  @click="form.tipoCliente = 'potencial'">
                  <i class="bi bi-star-fill"></i> Potencial
                </button>
                <button type="button"
                  :class="['cm-tipo-opt', { 'cm-tipo-opt--sel cm-tipo-opt--cli': form.tipoCliente === 'normal' }]"
                  @click="form.tipoCliente = 'normal'">
                  <i class="bi bi-person-check-fill"></i> Cliente
                </button>
              </div>
              <div v-else class="cm-tipo-display">
                <span :class="form.tipoCliente === 'potencial' ? 'cm-tipo-opt--pot' : 'cm-tipo-opt--cli'">
                  <i :class="form.tipoCliente === 'potencial' ? 'bi bi-star-fill' : 'bi bi-person-check-fill'"></i>
                  {{ form.tipoCliente === 'potencial' ? 'Potencial' : 'Cliente' }}
                </span>
              </div>
              <p class="cm-tipo-hint">
                Se convierte automáticamente a <strong>Cliente</strong> cuando una cotización asociada pasa a <em>Ganada</em>.
              </p>
            </div>

            <!-- ── Ubicación ── -->
            <div class="cm-section-title">
              <i class="bi bi-geo-alt-fill"></i> Ubicación
            </div>

            <div class="cm-field">
              <label>Dirección</label>
              <input v-model="form.direccion" placeholder="Calle 123, Ciudad, Provincia" maxlength="200" />
            </div>

            <div class="cm-map-actions">
              <button type="button" class="secondary-button cm-map-btn"
                :disabled="geocoding" @click="geocodeAddress">
                <i class="bi bi-search"></i>
                {{ geocoding ? 'Buscando...' : 'Buscar en mapa' }}
              </button>
              <button type="button" class="secondary-button cm-map-btn"
                :disabled="geocoding" @click="useMyLocation">
                <i class="bi bi-crosshair"></i>
                Mi ubicación
              </button>
              <button v-if="form.latitud" type="button" class="secondary-button cm-map-btn cm-map-btn--clear"
                @click="clearLocation">
                <i class="bi bi-x-circle"></i> Quitar
              </button>
            </div>

            <p v-if="geoError" class="cm-geo-error">{{ geoError }}</p>

            <div v-if="form.latitud && form.longitud" class="cm-map-preview">
              <iframe
                :src="`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitud-0.006},${form.latitud-0.006},${form.longitud+0.006},${form.latitud+0.006}&layer=mapnik&marker=${form.latitud},${form.longitud}`"
                class="cm-map-iframe"
                frameborder="0"
                loading="lazy"
                title="Mapa de ubicación"
              ></iframe>
              <div class="cm-map-coords">
                <i class="bi bi-geo-alt-fill" style="color:#3b82f6"></i>
                {{ Number(form.latitud).toFixed(5) }}, {{ Number(form.longitud).toFixed(5) }}
                <a :href="`https://www.openstreetmap.org/?mlat=${form.latitud}&mlon=${form.longitud}&zoom=16`"
                  target="_blank" rel="noopener" class="cm-map-open">
                  <i class="bi bi-box-arrow-up-right"></i> Abrir mapa
                </a>
              </div>
              <div v-if="form.lugar" class="cm-map-lugar">{{ form.lugar }}</div>
            </div>

            <p v-if="formError" class="cm-error">{{ formError }}</p>
          </div>

          <div class="crm-modal-ft">
            <button class="secondary-button" @click="closeModal">Cancelar</button>
            <button :disabled="saving" @click="saveClient">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>{{ dupConfirmed ? 'Crear de todas formas' : (editing ? 'Guardar cambios' : 'Crear cliente') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Excel import preview ── -->
    <Teleport to="body">
      <div v-if="importModal" class="crm-backdrop" @click.self="importModal = false">
        <div class="crm-modal crm-modal--sm">
          <div class="crm-modal-hd">
            <h2><i class="bi bi-file-earmark-spreadsheet"></i> Importar clientes</h2>
            <button class="crm-close" @click="importModal = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crm-modal-bd">
            <div class="ci-summary">
              <div class="ci-badge ci-badge--new">
                <span class="ci-num">{{ importPreview.length }}</span>
                <span class="ci-lbl">a importar</span>
              </div>
              <div class="ci-badge ci-badge--skip">
                <span class="ci-num">{{ importSkipped }}</span>
                <span class="ci-lbl">ya existen</span>
              </div>
            </div>
            <div v-if="importPreview.length" class="ci-list">
              <div v-for="c in importPreview" :key="c.razonSocial" class="ci-row">
                <i class="bi bi-person-check" style="color:var(--color-primary)"></i>
                <span>{{ c.razonSocial }}</span>
                <small v-if="c.lugar" class="ci-lugar">{{ c.lugar }}</small>
              </div>
            </div>
            <p v-if="!importPreview.length" class="ci-empty">
              Todos los clientes del archivo ya existen en el sistema.
            </p>
          </div>
          <div class="crm-modal-ft">
            <button class="secondary-button" @click="importModal = false">Cancelar</button>
            <button :disabled="importing || !importPreview.length" @click="doImport">
              <div v-if="importing" class="btn-spin"></div>
              <span v-else>Importar {{ importPreview.length }} cliente{{ importPreview.length !== 1 ? 's' : '' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Delete confirm ── -->
    <Teleport to="body">
      <div v-if="deleting" class="crm-backdrop" @click.self="deleting = null">
        <div class="crm-modal crm-modal--sm">
          <div class="crm-modal-hd">
            <h2>Eliminar cliente</h2>
            <button class="crm-close" @click="deleting = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crm-modal-bd">
            <p class="del-txt">
              ¿Eliminás a <strong>{{ deleting.razonSocial || deleting.name }}</strong>?
            </p>
          </div>
          <div class="crm-modal-ft">
            <button class="secondary-button" @click="deleting = null">Cancelar</button>
            <button class="danger-button" :disabled="saving" @click="doDelete">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Modal actividad desde panel de detalle ── -->
    <Teleport to="body">
      <div v-if="showActivityModal" class="crm-backdrop" @click.self="showActivityModal = false">
        <div class="crm-modal crm-modal--sm">
          <div class="crm-modal-hd">
            <h2>Nueva actividad</h2>
            <button class="crm-close" @click="showActivityModal = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crm-modal-bd">
            <div class="cm-field">
              <label>Tipo *</label>
              <select v-model="actForm.tipo">
                <option v-for="t in ACT_TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
              </select>
            </div>
            <div class="cm-field">
              <label>Título *</label>
              <input v-model="actForm.titulo" placeholder="Ej: Llamada de seguimiento" maxlength="100" />
            </div>
            <div class="cm-field">
              <label>Descripción</label>
              <textarea v-model="actForm.descripcion" rows="3" placeholder="Detalles de la actividad..."></textarea>
            </div>
            <div class="cm-field">
              <label>Fecha programada</label>
              <input v-model="actForm.fechaProgramada" type="date" />
            </div>
            <p v-if="actFormError" class="cm-error">{{ actFormError }}</p>
          </div>
          <div class="crm-modal-ft">
            <button class="secondary-button" @click="showActivityModal = false">Cancelar</button>
            <button :disabled="savingActivity" @click="saveActivityFromPanel">
              <div v-if="savingActivity" class="btn-spin"></div>
              <span v-else>Registrar</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCrmStore } from '@/stores/crm'
import { usePermissions } from '@/utils/permissions'
import * as XLSX from 'xlsx'
import { useToast } from 'vue-toastification'

const { canManage, userId } = usePermissions()
const toast = useToast()

const emit = defineEmits(['new-quote'])

const props = defineProps({ pendingEdit: { type: Object, default: null } })

onMounted(() => { if (props.pendingEdit) openEdit(props.pendingEdit) })

const crmStore = useCrmStore()

// ── Filtros y vista ──
const search         = ref('')
const filterEstado   = ref('')
const filterPipeline = ref('')
const filterTag      = ref('')
const viewMode       = ref('cards')

// ── Modales ──
const showModal      = ref(false)
const editing        = ref(null)
const saving         = ref(false)
const formError      = ref('')
const dupConfirmed   = ref(false)
const deleting       = ref(null)
const geocoding      = ref(false)
const geoError       = ref('')

// ── Panel de detalle ──
const detailClient   = ref(null)
const quickNoteText  = ref('')
const savingNote     = ref(false)

// ── Modal actividad desde panel ──
const showActivityModal = ref(false)
const savingActivity    = ref(false)
const actFormError      = ref('')
const actForm = ref({ tipo: 'llamada', titulo: '', descripcion: '', fechaProgramada: '' })

// ── Tags en formulario ──
const tagInput = ref('')

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevos Clientes',  color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',  color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotizado',    color: '#f59e0b' },
  { key: 'ganado',             label: 'Ganado',      color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',     color: '#ef4444' },
]

const ACT_TYPES = [
  { key: 'llamada',  label: 'Llamada',  icon: 'bi bi-telephone-fill',   color: '#3b82f6' },
  { key: 'reunion',  label: 'Reunión',  icon: 'bi bi-people-fill',       color: '#8b5cf6' },
  { key: 'correo',   label: 'Correo',   icon: 'bi bi-envelope-fill',     color: '#f59e0b' },
  { key: 'nota',     label: 'Nota',     icon: 'bi bi-sticky-fill',       color: '#22c55e' },
  { key: 'difusion', label: 'Difusión', icon: 'bi bi-megaphone-fill',    color: '#ec4899' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))
function stageLabel(key) { return STAGE_MAP[key]?.label || key }
function stageColor(key) { return STAGE_MAP[key]?.color || '#6b8e3a' }
function typeConfig(tipo) { return ACT_TYPES.find(t => t.key === tipo) || ACT_TYPES[0] }

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#6366f1','#22c55e','#ec4899','#6b8e3a','#ef4444']
function avatarColor(name) {
  let n = 0; for (const c of name) n += c.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name) {
  return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

const SECTORES = ['General', 'Compras', 'Ventas', 'Facturación', 'Administración', 'Logística', 'Gerencia', 'Soporte']

const emptyForm = () => ({
  codigoCliente: '',
  razonSocial: '', nombreComercial: '', contactoPrincipal: '',
  cuitCuil: '', telefonos: [{ numero: '', sector: 'General' }],
  email: '', direccion: '', observaciones: '',
  tags: [],
  estado: 'activo', pipelineEstado: 'nuevo_lead',
  tipoCliente: 'potencial',
  lugar: '', latitud: null, longitud: null,
})

const form = ref(emptyForm())

// ── Tags de todos los clientes visibles (para el filtro) ──
const allTags = computed(() => {
  const set = new Set()
  for (const c of crmStore.visibleClients) {
    for (const tag of (c.tags || [])) set.add(tag)
  }
  return [...set].sort()
})

const filtered = computed(() => {
  let list = crmStore.visibleClients
  if (filterEstado.value)   list = list.filter(c => c.estado === filterEstado.value)
  if (filterPipeline.value) list = list.filter(c => c.pipelineEstado === filterPipeline.value)
  if (filterTag.value)      list = list.filter(c => (c.tags || []).includes(filterTag.value))
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c =>
      rx.test(c.razonSocial) || rx.test(c.nombreComercial) ||
      rx.test(c.contactoPrincipal) || rx.test(c.email) ||
      rx.test(c.telefono) || rx.test(c.name) ||
      (c.telefonos || []).some(t => rx.test(t.numero)) ||
      (c.tags || []).some(t => rx.test(t))
    )
  }
  return list
})

// Actividades del cliente en el panel
const detailActivities = computed(() => {
  if (!detailClient.value) return []
  return crmStore.activities
    .filter(a => String(a.clienteId) === String(detailClient.value._id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
})

// ── Quick action helpers ──
function primaryEmail(c) { return c.email || '' }
function primaryPhone(c) {
  return c.telefonos?.[0]?.numero || c.telefono || ''
}
function waPhone(c) {
  return c.telefonos?.[0]?.numero || c.telefono || ''
}
function waClean(c) {
  const raw = waPhone(c)
  return raw.replace(/[^\d+]/g, '').replace(/^\+/, '')
}

// ── Panel de detalle ──
function openDetail(c) {
  detailClient.value = c
  quickNoteText.value = ''
}

function closeDetail() {
  detailClient.value = null
  quickNoteText.value = ''
}

async function saveQuickNote() {
  if (!quickNoteText.value.trim() || !detailClient.value) return
  savingNote.value = true
  try {
    await crmStore.createActivity({
      tipo: 'nota',
      titulo: 'Nota rápida',
      descripcion: quickNoteText.value.trim(),
      clienteId: detailClient.value._id,
      clienteNombre: detailClient.value.razonSocial || detailClient.value.name || '',
      realizadoPorId: userId.value || undefined,
    })
    quickNoteText.value = ''
    toast.success('Nota registrada')
  } catch {
    toast.error('Error al registrar la nota')
  } finally {
    savingNote.value = false
  }
}

function newQuoteFromClient(c) {
  crmStore.setPendingQuoteClient(c)
  emit('new-quote', c)
  closeDetail()
}

function openNewActivityForClient() {
  if (!detailClient.value) return
  actForm.value = { tipo: 'llamada', titulo: '', descripcion: '', fechaProgramada: '' }
  actFormError.value = ''
  showActivityModal.value = true
}

async function saveActivityFromPanel() {
  actFormError.value = ''
  if (!actForm.value.tipo || !actForm.value.titulo.trim()) {
    actFormError.value = 'Tipo y título son obligatorios'
    return
  }
  savingActivity.value = true
  try {
    await crmStore.createActivity({
      tipo: actForm.value.tipo,
      titulo: actForm.value.titulo.trim(),
      descripcion: actForm.value.descripcion.trim(),
      fechaProgramada: actForm.value.fechaProgramada || null,
      clienteId: detailClient.value._id,
      clienteNombre: detailClient.value.razonSocial || detailClient.value.name || '',
      realizadoPorId: userId.value || undefined,
    })
    showActivityModal.value = false
    toast.success('Actividad registrada')
  } catch {
    actFormError.value = 'Error al registrar la actividad'
  } finally {
    savingActivity.value = false
  }
}

function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Tags en formulario ──
function addTag() {
  const t = tagInput.value.trim().replace(/,$/, '')
  if (t && !form.value.tags.includes(t)) {
    form.value.tags.push(t)
  }
  tagInput.value = ''
}

// ── Modal add/edit ──
function openNew() {
  editing.value = null
  form.value = emptyForm()
  formError.value = ''
  geoError.value = ''
  dupConfirmed.value = false
  tagInput.value = ''
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = {
    codigoCliente:    c.codigoCliente || '',
    razonSocial:      c.razonSocial || c.name || '',
    nombreComercial:  c.nombreComercial || c.company || '',
    contactoPrincipal: c.contactoPrincipal || '',
    cuitCuil:         c.cuitCuil || '',
    telefonos:        c.telefonos?.length
      ? c.telefonos.map(t => ({ numero: t.numero || '', sector: t.sector || 'General' }))
      : (c.telefono ? [{ numero: c.telefono, sector: 'General' }] : [{ numero: '', sector: 'General' }]),
    email:            c.email || '',
    direccion:        c.direccion || '',
    observaciones:    c.observaciones || '',
    tags:             Array.isArray(c.tags) ? [...c.tags] : [],
    estado:           c.estado || 'activo',
    pipelineEstado:   c.pipelineEstado || 'nuevo_lead',
    tipoCliente:      c.tipoCliente || 'potencial',
    lugar:            c.lugar || '',
    latitud:          c.latitud ?? null,
    longitud:         c.longitud ?? null,
  }
  formError.value = ''
  geoError.value = ''
  dupConfirmed.value = false
  tagInput.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false; dupConfirmed.value = false }

async function saveClient() {
  formError.value = ''
  if (!form.value.razonSocial.trim()) {
    formError.value = 'La razón social es obligatoria'
    return
  }
  // Agregar tag pendiente si hay texto sin confirmar
  if (tagInput.value.trim()) addTag()

  // Detección de duplicados (solo al crear)
  if (!editing.value && !dupConfirmed.value) {
    const key = form.value.razonSocial.trim().toLowerCase()
    const dup = crmStore.visibleClients.find(c =>
      (c.razonSocial || c.name || '').trim().toLowerCase() === key
    )
    if (dup) {
      formError.value = `⚠️ Ya existe un cliente con esa razón social: "${dup.razonSocial || dup.name}". Hacé clic en "Crear de todas formas" para continuar.`
      dupConfirmed.value = true
      return
    }
  }
  dupConfirmed.value = false
  saving.value = true
  try {
    if (editing.value) {
      const updated = await crmStore.updateClient(editing.value._id, { ...form.value })
      // Actualizar el panel de detalle si estaba abierto con ese cliente
      if (detailClient.value?._id === editing.value._id) {
        detailClient.value = updated
      }
    } else {
      await crmStore.createClient({ ...form.value })
    }
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

function confirmDelete(c) { deleting.value = c }

async function doDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await crmStore.deleteClient(deleting.value._id)
    if (detailClient.value?._id === deleting.value._id) closeDetail()
    deleting.value = null
  } finally {
    saving.value = false
  }
}

// ── Geocodificación ──
async function geocodeAddress() {
  const addr = form.value.direccion.trim()
  if (!addr) { geoError.value = 'Escribí una dirección primero'; return }
  geocoding.value = true
  geoError.value = ''
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await res.json()
    if (!data.length) { geoError.value = 'No se encontró esa dirección'; return }
    form.value.latitud  = parseFloat(data[0].lat)
    form.value.longitud = parseFloat(data[0].lon)
    form.value.lugar    = data[0].display_name || addr
  } catch {
    geoError.value = 'Error al buscar en el mapa'
  } finally {
    geocoding.value = false
  }
}

function useMyLocation() {
  if (!navigator.geolocation) { geoError.value = 'El navegador no soporta geolocalización'; return }
  geocoding.value = true
  geoError.value = ''
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      form.value.latitud  = pos.coords.latitude
      form.value.longitud = pos.coords.longitude
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data = await res.json()
        form.value.lugar = data.display_name || ''
        if (!form.value.direccion.trim()) form.value.direccion = data.display_name || ''
      } catch { /* reverse geocoding opcional */ }
      geocoding.value = false
    },
    (err) => {
      geoError.value = 'No se pudo obtener la ubicación'
      console.warn('Geolocation error:', err.message)
      geocoding.value = false
    },
    { timeout: 10000, enableHighAccuracy: true }
  )
}

function clearLocation() {
  form.value.latitud  = null
  form.value.longitud = null
  form.value.lugar    = ''
}

// ── Export a Excel ──
function exportToExcel() {
  const rows = filtered.value.map(c => ({
    'Cód. cliente':   c.codigoCliente || '',
    'Razón social':   c.razonSocial || c.name || '',
    'Nombre comercial': c.nombreComercial || '',
    'Contacto':       c.contactoPrincipal || '',
    'CUIT/CUIL':      c.cuitCuil || '',
    'Teléfono':       c.telefonos?.[0]?.numero || c.telefono || '',
    'Email':          c.email || '',
    'Dirección':      c.direccion || '',
    'Localidad':      c.lugar || '',
    'Pipeline':       stageLabel(c.pipelineEstado),
    'Tipo':           c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial',
    'Estado':         c.estado || 'activo',
    'Etiquetas':      (c.tags || []).join(', '),
    'Observaciones':  c.observaciones || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  XLSX.writeFile(wb, `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`)
  toast.success(`${rows.length} clientes exportados`)
}

// ── Excel import ──
const xlsxInput   = ref(null)
const importModal  = ref(false)
const importPreview = ref([])
const importSkipped = ref(0)
const importing    = ref(false)

function normalizePhone(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ')
}

function onXlsxFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''

  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

      const existing = new Set(
        crmStore.visibleClients.map(c => (c.razonSocial || c.name || '').trim().toLowerCase())
      )

      const toImport = []
      let skipped = 0

      for (const row of rows) {
        const razonSocial = String(row['Razón social'] ?? row['Razon social'] ?? row['razonSocial'] ?? '').trim()
        if (!razonSocial) continue

        if (existing.has(razonSocial.toLowerCase())) {
          skipped++
          continue
        }
        existing.add(razonSocial.toLowerCase())

        const telefonos = []
        const tel1 = normalizePhone(row['Teléfono'] ?? row['Telefono'] ?? '')
        const tel2 = normalizePhone(row['Teléfono 2'] ?? row['Telefono 2'] ?? '')
        const movil = normalizePhone(row['Móvil'] ?? row['Movil'] ?? '')
        if (tel1) telefonos.push({ numero: tel1, sector: 'General' })
        if (tel2) telefonos.push({ numero: tel2, sector: 'General' })
        if (movil) telefonos.push({ numero: movil, sector: 'General' })
        if (!telefonos.length) telefonos.push({ numero: '', sector: 'General' })

        const codCliente = String(row['Cód. cliente'] ?? row['Cod. cliente'] ?? '').trim()

        toImport.push({
          codigoCliente:    codCliente,
          razonSocial,
          nombreComercial:  String(row['Grupo Empresario'] ?? '').trim(),
          contactoPrincipal: '',
          cuitCuil:         '',
          telefonos,
          email:            String(row['E-mail'] ?? row['Email'] ?? '').trim(),
          direccion:        String(row['Domicilio'] ?? '').trim(),
          lugar:            String(row['Localidad'] ?? '').trim(),
          observaciones:    '',
          tags:             [],
          estado:           'activo',
          pipelineEstado:   'nuevo_lead',
          tipoCliente:      'normal',
          latitud:          null,
          longitud:         null,
        })
      }

      importPreview.value = toImport
      importSkipped.value = skipped
      importModal.value   = true
    } catch {
      toast.error('No se pudo leer el archivo Excel')
    }
  }
  reader.readAsArrayBuffer(file)
}

async function doImport() {
  importing.value = true
  let ok = 0
  let fail = 0
  for (const client of importPreview.value) {
    try {
      await crmStore.createClient(client)
      ok++
    } catch {
      fail++
    }
  }
  importing.value = false
  importModal.value = false
  importPreview.value = []
  if (ok)   toast.success(`${ok} cliente${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''} correctamente`)
  if (fail) toast.error(`${fail} cliente${fail !== 1 ? 's' : ''} no pudieron importarse`)
}

// ── Stale y burbuja ──
function staleDays(client) {
  if (client.tipoCliente !== 'potencial') return 0
  const candidates = [client.lastActivityAt, client.lastQuoteAt, client.createdAt]
    .filter(Boolean).map(d => new Date(d).getTime())
  if (!candidates.length) return 0
  const mostRecent = Math.max(...candidates)
  return Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24))
}

const SNOOZE_KEY = 'cc_quote_snooze'

function loadSnooze() {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}') } catch { return {} }
}

function nextMonday(ts) {
  const d = new Date(ts)
  const day = d.getDay()
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7
  d.setDate(d.getDate() + daysUntilMonday)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function daysSinceQuote(client) {
  if (client.tipoCliente !== 'normal') return 0
  if (client.lastQuoteAt) {
    return Math.floor((Date.now() - new Date(client.lastQuoteAt).getTime()) / (1000 * 60 * 60 * 24))
  }
  const base = client.createdAt || null
  if (!base) return 9999
  return Math.floor((Date.now() - new Date(base).getTime()) / (1000 * 60 * 60 * 24))
}

function showQuoteBubble(client) {
  if (daysSinceQuote(client) < 60) return false
  const snooze = loadSnooze()
  const snoozeUntil = snooze[client._id]
  if (!snoozeUntil) return true
  return Date.now() >= snoozeUntil
}

function snoozeAndOpenDetail(client) {
  const snooze = loadSnooze()
  snooze[client._id] = nextMonday(Date.now())
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(snooze))
  openDetail(client)
}
</script>

<style scoped>
.cc-wrap { position: relative; min-width: 0; overflow: hidden; }

/* ── Toolbar ── */
.cc-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.cc-toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
}

.cc-search-box { position: relative; flex: 1; min-width: 150px; }

.cc-search-ico {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.cc-search {
  width: 100%;
  padding: 0.55rem 0.9rem 0.55rem 2.1rem;
  border-radius: 10px;
  font-size: 0.82rem;
}

.cc-select {
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  font-size: 0.8rem;
  width: auto;
  min-width: 130px;
}

.cc-btn-add {
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.cc-btn-import {
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  background: transparent;
  border: 1.5px solid var(--color-primary, #6b8e3a);
  color: var(--color-primary, #6b8e3a);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s, color 0.15s;
}
.cc-btn-import:hover { background: var(--color-primary, #6b8e3a); color: #fff; }

.cc-btn-view {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(107,142,58,.07);
  color: var(--color-muted);
  border: 1.5px solid transparent;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  box-shadow: none;
}
.cc-btn-view:hover { background: rgba(107,142,58,.15); color: var(--color-text); transform: none; }
.cc-btn-view--on { background: rgba(107,142,58,.18) !important; color: var(--color-primary) !important; border-color: rgba(107,142,58,.35) !important; }

.cc-btn-export {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(59,130,246,.07);
  color: #3b82f6;
  border: 1.5px solid transparent;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.15s;
}
.cc-btn-export:hover { background: rgba(59,130,246,.15); transform: none; }

/* ── Card wrap + stale badge ── */
.cc-card-wrap {
  position: relative;
  padding-top: 8px;
  height: 100%;
}

.cc-stale-badge {
  position: absolute;
  top: 0;
  right: 4px;
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0 6px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
  cursor: default;
}
.cc-stale-badge--warn     { background: #f59e0b; color: #fff; }
.cc-stale-badge--critical { background: #ef4444; color: #fff; animation: cc-pulse 1.6s ease-in-out infinite; }
.cc-stale-badge--quote    { background: #f97316; color: #fff; font-size: 0.75rem; gap: 3px; }

@keyframes cc-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.18); }
}

.cc-stale-tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: min(230px, calc(100vw - 24px));
  background: #1e293b;
  color: #f1f5f9;
  font-size: 0.72rem;
  font-weight: 400;
  line-height: 1.5;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
  white-space: normal;
  pointer-events: none;
  z-index: 100;
}
.cc-stale-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 8px;
  border: 5px solid transparent;
  border-bottom-color: #1e293b;
}
.cc-stale-badge:hover .cc-stale-tooltip { display: block; }
.cc-stale-tooltip--quote { right: 0; }
.cc-stale-tooltip--quote::before { right: 8px; }

/* ── Grid ── */
.cc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .cc-grid { grid-template-columns: 1fr; gap: 0.6rem; }
}

/* ── Card ── */
.cc-card {
  background: rgba(255,255,255,.96);
  border-radius: 14px;
  border: 1px solid rgba(107,142,58,.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 2px 8px rgba(42,53,32,.07);
  overflow: hidden;
  transition: box-shadow 0.18s, transform 0.18s;
  min-width: 0;
}
.cc-card:hover { box-shadow: 0 5px 18px rgba(42,53,32,.13); transform: translateY(-2px); }

.cc-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.75rem 0.35rem;
}

.cc-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.85rem; font-weight: 700;
  flex-shrink: 0; text-transform: uppercase;
}

.cc-card-head { flex: 1; min-width: 0; }

.cc-razon {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: break-word;
}

.cc-comercial {
  font-size: 0.7rem;
  color: var(--color-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-cod {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--color-primary, #6b8e3a);
  letter-spacing: 0.03em;
}

.cc-card-actions { display: flex; gap: 0.2rem; flex-shrink: 0; }

.cc-ico-btn {
  width: 26px; height: 26px;
  border-radius: 7px;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem;
  box-shadow: none;
}
.cc-ico-btn--edit { background: rgba(107,142,58,.1); color: var(--color-primary); }
.cc-ico-btn--edit:hover { background: rgba(107,142,58,.2); }
.cc-ico-btn--del  { background: rgba(239,68,68,.1); color: #ef4444; }
.cc-ico-btn--del:hover { background: rgba(239,68,68,.2); }

.cc-card-body {
  flex: 1;
  padding: 0.3rem 0.75rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}
.cc-card-body:hover { background: rgba(107,142,58,.03); }

.cc-field {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-text);
  min-width: 0;
}
.cc-field i { color: var(--color-muted); font-size: 0.75rem; flex-shrink: 0; }
.cc-field span {
  flex: 1; min-width: 0; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}

.cc-field--trunc span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.cc-sector {
  flex-shrink: 0;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(107,142,58,.1);
  color: var(--color-primary);
  white-space: nowrap;
}

.cc-map-link {
  color: #3b82f6; font-size: 0.75rem; text-decoration: none;
  flex-shrink: 0; display: flex; align-items: center;
}
.cc-map-link:hover { color: #2563eb; }

/* Tags en card */
.cc-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.15rem;
}
.cc-tag {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(99,102,241,.1);
  color: #6366f1;
  border: 1px solid rgba(99,102,241,.2);
}

.cc-card-foot {
  padding: 0.45rem 0.75rem;
  border-top: 1px solid rgba(107,142,58,.08);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}

/* Quick action buttons en card footer */
.cc-qa-row { display: flex; gap: 0.2rem; margin-left: auto; }

.cc-qa-btn {
  width: 22px; height: 22px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.68rem;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.cc-qa-btn:hover { transform: scale(1.12); }
.cc-qa-btn--email { background: rgba(245,158,11,.12); color: #d97706; }
.cc-qa-btn--email:hover { background: rgba(245,158,11,.25); }
.cc-qa-btn--call  { background: rgba(59,130,246,.12); color: #2563eb; }
.cc-qa-btn--call:hover  { background: rgba(59,130,246,.25); }
.cc-qa-btn--wa    { background: rgba(34,197,94,.12); color: #16a34a; }
.cc-qa-btn--wa:hover    { background: rgba(34,197,94,.25); }

/* Tipo/badge badges */
.cc-tipo {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.cc-tipo--potencial { background: rgba(245,158,11,.12); color: #b45309; }
.cc-tipo--normal    { background: rgba(34,197,94,.12);  color: #16a34a; }

.cc-badge {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
}
.cc-badge--activo   { background: rgba(107,142,58,.1);  color: var(--color-primary); }
.cc-badge--inactivo { background: rgba(239,68,68,.12); color: #dc2626; }

.cc-stage {
  font-size: 0.62rem;
  font-weight: 600;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
}

/* ── Vista tabla ── */
.cc-table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(107,142,58,.1);
  box-shadow: 0 2px 8px rgba(42,53,32,.07);
}

.cc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.cc-table thead th {
  padding: 0.65rem 0.85rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  background: rgba(107,142,58,.04);
  border-bottom: 1px solid rgba(107,142,58,.12);
  white-space: nowrap;
}

.cc-tr {
  cursor: pointer;
  transition: background 0.12s;
}
.cc-tr:hover { background: rgba(107,142,58,.04); }

.cc-table tbody td {
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid rgba(107,142,58,.06);
  color: var(--color-text);
  vertical-align: middle;
}

.cc-td-cod { white-space: nowrap; color: var(--color-muted); }

.cc-td-name {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  min-width: 160px;
}

.cc-tbl-avatar {
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.7rem; font-weight: 700;
  flex-shrink: 0;
}

.cc-tbl-razon { font-weight: 600; font-size: 0.82rem; }
.cc-tbl-sub { font-size: 0.7rem; color: var(--color-muted); }
.cc-td-email { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cc-tbl-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: nowrap;
}

/* ── Panel de detalle (slide from right) ── */
.cd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 3000;
  display: flex;
  justify-content: flex-end;
}

.cd-panel {
  width: min(440px, 100vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,.18);
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
}

.cd-panel--open { transform: translateX(0); }

/* Header del panel */
.cd-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid rgba(107,142,58,.12);
  background: rgba(107,142,58,.03);
  flex-shrink: 0;
}

.cd-hd-left { display: flex; align-items: center; gap: 0.65rem; flex: 1; min-width: 0; }

.cd-avatar {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1rem; font-weight: 700;
  flex-shrink: 0; text-transform: uppercase;
}

.cd-hd-text { flex: 1; min-width: 0; }
.cd-hd-name {
  font-size: 0.95rem; font-weight: 700;
  color: var(--color-text);
  word-break: break-word; line-height: 1.3;
}
.cd-hd-sub { font-size: 0.72rem; color: var(--color-muted); margin-top: 2px; }

.cd-hd-right { display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0; }

.cd-btn-edit {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  font-size: 0.75rem;
  background: rgba(107,142,58,.1);
  color: var(--color-primary);
  border: none; cursor: pointer; box-shadow: none;
  transition: background 0.15s;
}
.cd-btn-edit:hover { background: rgba(107,142,58,.2); transform: none; }

.cd-btn-quote {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  font-size: 0.75rem;
  background: rgba(59,130,246,.1);
  color: #2563eb;
  border: none; cursor: pointer; box-shadow: none;
  transition: background 0.15s;
}
.cd-btn-quote:hover { background: rgba(59,130,246,.2); transform: none; }

.cd-close {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: rgba(107,142,58,.07);
  color: var(--color-text);
  padding: 0; font-size: 0.8rem; box-shadow: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border: none;
  transition: background 0.15s;
}
.cd-close:hover { background: rgba(239,68,68,.12); color: #ef4444; transform: none; }

/* Quick actions bar */
.cd-quick-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(107,142,58,.08);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cd-qa {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s;
}
.cd-qa:hover { transform: translateY(-1px); }
.cd-qa--email { background: rgba(245,158,11,.12); color: #d97706; }
.cd-qa--email:hover { background: rgba(245,158,11,.22); }
.cd-qa--call  { background: rgba(59,130,246,.12); color: #2563eb; }
.cd-qa--call:hover  { background: rgba(59,130,246,.22); }
.cd-qa--wa    { background: rgba(34,197,94,.12); color: #16a34a; }
.cd-qa--wa:hover    { background: rgba(34,197,94,.22); }

/* Scrollable body */
.cd-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.cd-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.75rem;
}

.cd-section {
  margin-bottom: 1.1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(107,142,58,.08);
}
.cd-section:last-child { border-bottom: none; margin-bottom: 0; }

.cd-section-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}

.cd-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.cd-section-title-row .cd-section-title { margin-bottom: 0; }

.cd-btn-mini {
  font-size: 0.72rem;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  background: rgba(107,142,58,.1);
  color: var(--color-primary);
  border: none; cursor: pointer; box-shadow: none;
  display: flex; align-items: center; gap: 0.2rem;
  transition: background 0.15s;
}
.cd-btn-mini:hover { background: rgba(107,142,58,.2); transform: none; }

.cd-field {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text);
  margin-bottom: 0.35rem;
}
.cd-field i { color: var(--color-muted); font-size: 0.78rem; flex-shrink: 0; margin-top: 1px; }
.cd-field span { flex: 1; min-width: 0; word-break: break-word; }
.cd-field--obs span { color: var(--color-muted); font-style: italic; }

/* Tags en panel */
.cd-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.cd-tag {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(99,102,241,.1);
  color: #6366f1;
  border: 1px solid rgba(99,102,241,.2);
}

/* Empty state en panel */
.cd-empty {
  font-size: 0.78rem;
  color: var(--color-muted);
  text-align: center;
  padding: 0.75rem;
  background: rgba(107,142,58,.04);
  border-radius: 8px;
  line-height: 1.5;
}

/* Actividades en panel */
.cd-act-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}

.cd-act-ico {
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.cd-act-body { flex: 1; min-width: 0; }
.cd-act-title { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
.cd-act-done { text-decoration: line-through; opacity: .55; }
.cd-act-meta { font-size: 0.68rem; color: var(--color-muted); display: flex; align-items: center; gap: 0.35rem; margin-top: 1px; }
.cd-act-check { color: #22c55e; }
.cd-act-desc { font-size: 0.75rem; color: var(--color-muted); margin-top: 2px; }

/* Nota rápida */
.cd-note-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  font-size: 0.82rem;
  resize: vertical;
  min-height: 70px;
  display: block;
  margin-bottom: 0.5rem;
}

.cd-note-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.78rem;
  background: var(--color-primary, #6b8e3a);
  color: #fff;
  border: none; cursor: pointer; box-shadow: none;
  transition: background 0.15s;
}
.cd-note-btn:hover:not(:disabled) { background: #5a7830; transform: none; }
.cd-note-btn:disabled { opacity: 0.45; cursor: default; }

/* ── Estado: loading/empty ── */
.cc-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 180px;
  color: var(--color-muted);
}
.cc-state p { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Import preview modal ── */
.ci-summary { display: flex; gap: 1rem; margin-bottom: 1rem; }
.ci-badge {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 0.75rem; border-radius: 10px;
  background: var(--color-surface, #f8fafc);
}
.ci-badge--new { border: 2px solid var(--color-primary, #6b8e3a); }
.ci-badge--skip { border: 2px solid var(--color-muted, #94a3b8); }
.ci-num { font-size: 1.6rem; font-weight: 700; line-height: 1; }
.ci-badge--new .ci-num { color: var(--color-primary, #6b8e3a); }
.ci-badge--skip .ci-num { color: var(--color-muted, #94a3b8); }
.ci-lbl { font-size: 0.7rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
.ci-list { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.ci-row {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.82rem; padding: 0.3rem 0.5rem;
  border-radius: 6px; background: var(--color-surface, #f8fafc);
}
.ci-lugar { color: var(--color-muted); font-size: 0.72rem; margin-left: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
.ci-empty { font-size: 0.82rem; color: var(--color-muted); text-align: center; padding: 1rem 0; }

/* Tags en formulario */
.cm-tags-wrap {
  border: 1px solid rgba(107,142,58,.2);
  border-radius: 10px;
  padding: 0.4rem 0.6rem;
  background: var(--color-bg, #fff);
}
.cm-tags-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; }
.cm-tag-chip {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(99,102,241,.1);
  color: #6366f1;
  font-size: 0.75rem; font-weight: 600;
}
.cm-tag-del {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: rgba(99,102,241,.2);
  color: #6366f1;
  border: none; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; box-shadow: none;
}
.cm-tag-del:hover { background: rgba(239,68,68,.2); color: #ef4444; transform: none; }
.cm-tag-input {
  border: none !important;
  outline: none !important;
  padding: 0.15rem 0.2rem !important;
  font-size: 0.82rem !important;
  min-width: 120px;
  flex: 1;
  background: transparent !important;
  box-shadow: none !important;
}

/* código cliente inline */
.cm-field--inline { display: flex; align-items: center; gap: 0.75rem; }
.cm-field--inline label { white-space: nowrap; margin-bottom: 0; }
.cm-input-code { max-width: 120px; font-family: monospace; font-size: 0.85rem; }

/* ── Modal ── */
.crm-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}

.crm-modal {
  background: #fff; border-radius: 20px;
  width: min(560px, 100%); max-height: 92vh;
  overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.22);
  display: flex; flex-direction: column;
}
.crm-modal--sm { width: min(380px, 100%); }

.crm-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem 0.85rem;
  border-bottom: 1px solid rgba(107,142,58,.12);
  position: sticky; top: 0; background: #fff; z-index: 1;
}
.crm-modal-hd h2 { font-size: 1rem; text-transform: uppercase; }

.crm-close {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(107,142,58,.1); color: var(--color-text);
  padding: 0; font-size: 0.8rem; box-shadow: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border: none;
}

.crm-modal-bd {
  padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.7rem; flex: 1;
}

.cm-section-title {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--color-primary); display: flex; align-items: center; gap: 0.4rem;
  padding-top: 0.25rem; border-top: 1px solid rgba(107,142,58,.12); margin-top: 0.15rem;
}

.cm-field { display: flex; flex-direction: column; gap: 0.28rem; }
.cm-field label {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--color-muted);
}
.cm-field input, .cm-field select, .cm-field textarea {
  padding: 0.55rem 0.85rem; border-radius: 10px; font-size: 0.83rem;
}
.cm-field textarea { min-height: 70px; }

.cm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }

/* Multi-phone */
.cm-phones { display: flex; flex-direction: column; gap: 0.4rem; }
.cm-phone-row { display: grid; grid-template-columns: 130px 1fr 28px; gap: 0.4rem; align-items: center; }
.cm-phone-sector { padding: 0.45rem 0.55rem; border-radius: 8px; font-size: 0.78rem; width: 100%; }
.cm-phone-num { padding: 0.45rem 0.7rem; border-radius: 8px; font-size: 0.82rem; width: 100%; }
.cm-phone-del {
  width: 28px; height: 28px; border-radius: 7px; padding: 0;
  font-size: 0.85rem; background: rgba(239,68,68,.1); color: #ef4444; box-shadow: none;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; border: none;
}
.cm-phone-del:hover:not(:disabled) { background: rgba(239,68,68,.2); transform: none; }
.cm-phone-del:disabled { opacity: 0.3; cursor: default; }
.cm-phone-add {
  align-self: flex-start; padding: 0.35rem 0.75rem; font-size: 0.75rem;
  background: rgba(107,142,58,.08); color: var(--color-primary); border-radius: 8px; box-shadow: none;
  display: flex; align-items: center; gap: 0.35rem;
  border: 1px dashed rgba(107,142,58,.3); text-transform: uppercase;
  letter-spacing: 0.04em; font-weight: 600; cursor: pointer;
}
.cm-phone-add:hover { background: rgba(107,142,58,.15); transform: none; }

/* Map */
.cm-map-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.cm-map-btn { padding: 0.45rem 0.85rem; font-size: 0.78rem; border-radius: 8px; }
.cm-map-btn--clear { background: rgba(239,68,68,.1); color: #dc2626; border-color: rgba(239,68,68,.2); }
.cm-geo-error {
  font-size: 0.78rem; color: #dc2626;
  background: rgba(239,68,68,.08); border-radius: 8px; padding: 0.4rem 0.7rem;
  text-transform: none; letter-spacing: 0;
}
.cm-map-preview { border-radius: 12px; overflow: hidden; border: 1px solid rgba(107,142,58,.15); }
.cm-map-iframe { width: 100%; height: 190px; display: block; border: none; }
.cm-map-coords {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.75rem; font-size: 0.72rem; color: var(--color-muted);
  text-transform: none; background: rgba(107,142,58,.04); flex-wrap: wrap;
}
.cm-map-open {
  color: #3b82f6; text-decoration: none; font-size: 0.72rem;
  display: flex; align-items: center; gap: 0.25rem; margin-left: auto;
}
.cm-map-open:hover { text-decoration: underline; }
.cm-map-lugar {
  padding: 0.35rem 0.75rem; font-size: 0.7rem; color: var(--color-text);
  text-transform: none; background: #fff; border-top: 1px solid rgba(107,142,58,.08);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Tipo toggle en formulario */
.cm-tipo-row { display: flex; gap: 0.5rem; }
.cm-tipo-opt {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.55rem 0.75rem; border-radius: 10px;
  background: rgba(107,142,58,.07); color: var(--color-muted);
  border: 2px solid transparent; font-size: 0.8rem; font-weight: 600; box-shadow: none;
  transition: background 0.18s, color 0.18s, border-color 0.18s; text-transform: uppercase;
  letter-spacing: 0.05em; cursor: pointer;
}
.cm-tipo-opt:hover:not(.cm-tipo-opt--sel) { background: rgba(107,142,58,.13); color: var(--color-text); transform: none; }
.cm-tipo-opt--pot { background: rgba(245,158,11,.12); color: #b45309; border-color: rgba(245,158,11,.35); }
.cm-tipo-opt--cli { background: rgba(34,197,94,.12); color: #16a34a; border-color: rgba(34,197,94,.35); }
.cm-tipo-hint { font-size: 0.68rem; color: var(--color-muted); text-transform: none; letter-spacing: 0; line-height: 1.4; margin-top: 0.3rem; font-style: italic; }

.cm-error { color: #dc2626; font-size: 0.78rem; text-transform: none; background: rgba(239,68,68,.08); border-radius: 8px; padding: 0.4rem 0.7rem; letter-spacing: 0; }

.crm-modal-ft {
  padding: 0.85rem 1.25rem 1rem; border-top: 1px solid rgba(107,142,58,.1);
  display: flex; justify-content: flex-end; gap: 0.65rem;
  position: sticky; bottom: 0; background: #fff;
}

.del-txt { text-transform: none; font-size: 0.88rem; color: var(--color-text); letter-spacing: 0; line-height: 1.5; }

/* Spinners */
.crm-spinner {
  width: 28px; height: 28px;
  border: 3px solid rgba(107,142,58,.2); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.btn-spin {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .cm-row { grid-template-columns: 1fr; }
  .cc-toolbar { flex-direction: column; align-items: stretch; }
  .cc-toolbar-right { margin-left: 0; justify-content: flex-end; }
  .cd-panel { width: 100vw; }
  .cc-field span { white-space: normal; word-break: break-word; overflow: visible; }
  .cc-card-foot  { flex-wrap: wrap; }
}
</style>

<style>
/* ── Dark mode ── */
[data-theme="dark"] .cc-card {
  background: rgba(13,18,35,0.72) !important;
  border-color: rgba(255,255,255,0.07) !important;
}
[data-theme="dark"] .cc-card:hover { background: rgba(13,18,35,0.88) !important; }
[data-theme="dark"] .cc-card-foot { border-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .cc-search,
[data-theme="dark"] .cc-select {
  background: rgba(13,18,35,0.7) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
}
[data-theme="dark"] .cc-tipo--potencial { background: rgba(245,158,11,0.15) !important; color: #fbbf24 !important; }
[data-theme="dark"] .cc-tipo--normal    { background: rgba(34,197,94,0.15) !important;  color: #86efac !important; }
[data-theme="dark"] .cc-badge--activo   { background: rgba(107,142,58,0.15) !important; color: #a3c464 !important; }
[data-theme="dark"] .cc-badge--inactivo { background: rgba(239,68,68,0.15) !important;  color: #fca5a5 !important; }
[data-theme="dark"] .cc-ico-btn--edit { background: rgba(107,142,58,0.15) !important; }
[data-theme="dark"] .cc-ico-btn--del  { background: rgba(239,68,68,0.15) !important; }
[data-theme="dark"] .cc-tag { background: rgba(99,102,241,0.15) !important; color: #a5b4fc !important; border-color: rgba(99,102,241,0.2) !important; }
[data-theme="dark"] .cc-btn-view { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.5) !important; }
[data-theme="dark"] .cc-btn-view--on { background: rgba(107,142,58,0.2) !important; color: #a3c464 !important; }
[data-theme="dark"] .cc-btn-export { background: rgba(59,130,246,0.1) !important; color: #60a5fa !important; }

/* Panel detalle dark */
[data-theme="dark"] .cd-panel {
  background: rgba(10,14,28,0.99) !important;
  box-shadow: -8px 0 32px rgba(0,0,0,0.5) !important;
}
[data-theme="dark"] .cd-hd { background: rgba(13,18,35,0.6) !important; border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .cd-hd-name { color: rgba(255,255,255,0.92) !important; }
[data-theme="dark"] .cd-quick-row { border-color: rgba(255,255,255,0.07) !important; }
[data-theme="dark"] .cd-section { border-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .cd-field { color: rgba(255,255,255,0.82) !important; }
[data-theme="dark"] .cd-act-title { color: rgba(255,255,255,0.85) !important; }
[data-theme="dark"] .cd-tag { background: rgba(99,102,241,0.15) !important; color: #a5b4fc !important; }
[data-theme="dark"] .cd-empty { background: rgba(255,255,255,0.04) !important; }
[data-theme="dark"] .cd-note-input {
  background: rgba(13,18,35,0.7) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
}
[data-theme="dark"] .cd-close { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.8) !important; }

/* Tabla dark */
[data-theme="dark"] .cc-table-wrap { border-color: rgba(255,255,255,0.07) !important; }
[data-theme="dark"] .cc-table thead th { background: rgba(13,18,35,0.5) !important; border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .cc-tr:hover { background: rgba(107,142,58,0.05) !important; }
[data-theme="dark"] .cc-table tbody td { border-color: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.82) !important; }

/* Modal dark */
[data-theme="dark"] .crm-modal {
  background: rgba(10,14,28,0.98) !important;
  border: 1px solid rgba(255,255,255,0.08);
}
[data-theme="dark"] .crm-modal-hd {
  background: rgba(10,14,28,0.98) !important;
  border-color: rgba(255,255,255,0.08) !important;
  color: #ffffff !important;
}
[data-theme="dark"] .crm-modal-hd h2 { color: #ffffff !important; }
[data-theme="dark"] .crm-modal-ft {
  background: rgba(10,14,28,0.98) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .crm-close { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.8) !important; }
[data-theme="dark"] .cm-section-title { border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .cm-phone-add { background: rgba(107,142,58,0.1) !important; border-color: rgba(107,142,58,0.25) !important; }
[data-theme="dark"] .cm-map-lugar { background: rgba(10,14,28,0.98) !important; color: rgba(255,255,255,0.75) !important; border-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .cm-map-coords { background: rgba(13,18,35,0.6) !important; }
[data-theme="dark"] .del-txt { color: rgba(255,255,255,0.85) !important; }
[data-theme="dark"] .cm-tipo-opt { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.55) !important; border-color: transparent !important; }
[data-theme="dark"] .cm-tipo-opt--pot { background: rgba(245,158,11,0.12) !important; color: #fbbf24 !important; border-color: rgba(245,158,11,0.3) !important; }
[data-theme="dark"] .cm-tipo-opt--cli { background: rgba(34,197,94,0.12) !important;  color: #86efac !important; border-color: rgba(34,197,94,0.3) !important; }
[data-theme="dark"] .cm-tags-wrap { background: rgba(13,18,35,0.7) !important; border-color: rgba(255,255,255,0.12) !important; }
[data-theme="dark"] .cm-tag-chip { background: rgba(99,102,241,0.15) !important; color: #a5b4fc !important; }
[data-theme="dark"] .cm-tag-input { color: rgba(255,255,255,0.85) !important; }
</style>
