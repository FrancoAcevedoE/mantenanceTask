<template>
  <!-- ── Pantalla principal (oculta al imprimir) ─────────────────────── -->
  <div class="page-container no-print">
    <div class="container">

      <!-- Topbar -->
      <div class="topbar">
        <div class="topbar-left">
          <h2 class="page-title">Cotizaciones</h2>
        </div>
        <div class="topbar-right">
          <template v-if="activeTab === 'list'">
            <button class="ghost-button" @click="showPrintEditor = true">
              <i class="bi bi-pencil-square"></i> Editar impresión
            </button>
            <button class="primary-button" @click="startNew">
              <i class="bi bi-plus-lg"></i> Nueva cotización
            </button>
          </template>
          <button v-else class="ghost-button" @click="cancelForm">
            <i class="bi bi-arrow-left"></i> Volver al historial
          </button>
        </div>
      </div>

      <ConfirmDialog
        :visible="!!quoteToDelete"
        title="Eliminar cotizacion"
        :message="quoteToDelete ? `¿Eliminar cotización #${String(quoteToDelete.numero).padStart(4,'0')} '${quoteToDelete.titulo}'?` : ''"
        confirm-text="Eliminar"
        type="danger"
        @confirm="doDeleteQuote"
        @cancel="quoteToDelete = null"
      />

      <!-- ── HISTORIAL ────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'list'">
        <div v-if="loadingQuotes" class="empty-state">Cargando cotizaciones…</div>
        <div v-else-if="!quotes.length" class="empty-state">
          <i class="bi bi-file-earmark-text" style="font-size:2rem; opacity:.35"></i>
          <p>No hay cotizaciones todavía.</p>
        </div>
        <div v-else class="table-scroll">
          <table class="inv-table">
            <thead>
              <tr>
                <th>#</th><th>Título</th><th>Cliente</th><th>Fecha</th>
                <th>Válida hasta</th><th>Total</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quotes" :key="q._id">
                <td class="num-cell">#{{ String(q.numero).padStart(4,'0') }}</td>
                <td class="title-cell">{{ q.titulo }}</td>
                <td class="client-cell">{{ q.cliente?.nombre || '—' }}</td>
                <td class="date-cell">{{ fmtDate(q.createdAt) }}</td>
                <td class="date-cell">{{ validezFecha(q.createdAt, q.validezDias) }}</td>
                <td class="price-cell">{{ fmtMoney(totalCotizacion(q)) }}</td>
                <td><span :class="['badge-estado', q.estado]">{{ labelEstado(q.estado) }}</span></td>
                <td class="actions-cell">
                  <button class="icon-btn" title="Imprimir" @click="openPrint(q)"><i class="bi bi-printer"></i></button>
                  <button class="icon-btn" title="Editar" @click="editQuote(q)"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn danger" title="Eliminar" @click="quoteToDelete = q"><i class="bi bi-trash3"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── FORMULARIO ───────────────────────────────────────────────── -->
      <div v-if="activeTab === 'form'" class="quote-form">

        <div class="form-section-title">
          {{ editingId ? `Editando cotización #${String(form.numero || '').padStart(4,'0')}` : 'Nueva cotización' }}
        </div>

        <!-- Datos generales -->
        <div class="form-grid-2">
          <div class="field full">
            <label>Título *</label>
            <input v-model="form.titulo" type="text" placeholder="Ej: Cotización revestimiento oficinas" />
          </div>
          <div class="field">
            <label>Fecha</label>
            <input :value="fmtDate(form.fecha)" type="text" disabled class="disabled-input" />
          </div>
          <div class="field">
            <label>Válida por (días)</label>
            <input v-model.number="form.validezDias" type="number" min="1" max="365" />
          </div>
          <div class="field">
            <label>Estado</label>
            <select v-model="form.estado">
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        <!-- Cliente (opcional) -->
        <div class="collapsible-header" @click="showCliente = !showCliente">
          <i :class="showCliente ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          <span>Datos del cliente <em class="optional-tag">(opcional)</em></span>
        </div>
        <div v-if="showCliente" class="form-grid-2 collapsible-body">
          <div class="field">
            <label>Nombre</label>
            <div style="position:relative">
              <input
                v-model="form.cliente.nombre"
                type="text"
                placeholder="Nombre del contacto"
                autocomplete="off"
                @focus="crmDropOpen = true"
                @input="crmDropOpen = true"
                @blur="() => setTimeout(() => { crmDropOpen = false }, 160)"
              />
              <div v-if="crmDropOpen && crmResults.length" class="crm-cp-drop">
                <div
                  v-for="c in crmResults"
                  :key="c._id"
                  class="crm-cp-opt"
                  @mousedown.prevent="selectCrmClient(c)"
                >
                  <span class="crm-cp-opt-main">{{ c.razonSocial || c.nombreComercial || c.name || c.contactoPrincipal }}</span>
                  <span class="crm-cp-opt-sub">{{ [c.nombreComercial, c.contactoPrincipal, c.email].filter(Boolean).join(' · ') }}</span>
                </div>
              </div>
            </div>
            <div v-if="form.clienteId" class="crm-linked-badge">
              <i class="bi bi-person-check-fill"></i>
              <span>{{ form._crmClientLabel }}</span>
              <button class="sp-clear" title="Desvincular" @click="clearCrmClient"><i class="bi bi-x"></i></button>
            </div>
          </div>
          <div class="field">
            <label>Empresa</label>
            <input v-model="form.cliente.empresa" type="text" placeholder="Razón social" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="form.cliente.email" type="email" placeholder="correo@ejemplo.com" />
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input v-model="form.cliente.telefono" type="tel" placeholder="+54 11 0000-0000" />
          </div>
        </div>

        <!-- Items -->
        <div class="section-label">Productos / Materiales</div>
        <div class="items-scroll">
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-producto">Producto</th>
                <th class="col-tipo">Tipo</th>
                <th class="col-color">Color</th>
                <th class="col-qty">Cant.</th>
                <th class="col-unit">Unidad</th>
                <th class="col-disc">Descuento</th>
                <th class="col-price">Precio unit.</th>
                <th class="col-desc">Descripción</th>
                <th class="col-sub">Subtotal</th>
                <th class="col-del"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(item, idx) in form.items" :key="idx">
              <tr class="item-row">

                <!-- ── Producto: búsqueda SKU / nombre ── -->
                <td class="col-producto">
                  <div
                    v-if="!item._productId"
                    class="psw"
                    :id="`psw-${idx}`"
                  >
                    <div class="psw-input-wrap">
                      <i class="bi bi-search psw-icon"></i>
                      <input
                        v-model="item._search"
                        type="text"
                        placeholder="SKU o nombre…"
                        class="psw-input"
                        autocomplete="off"
                        @focus="openSearch(idx)"
                        @input="onSearchInput(idx)"
                        @blur="closeSearch(idx)"
                        @keydown.down.prevent="navDown"
                        @keydown.up.prevent="navUp"
                        @keydown.enter.prevent="navEnter(idx)"
                        @keydown.escape="activeSearchIdx = -1"
                      />
                    </div>
                  </div>
                  <div v-else class="selected-product">
                    <div class="sp-body">
                      <div class="sp-top">
                        <span class="sp-name">{{ item.nombre }}</span>
                        <button class="sp-clear" @click="clearProduct(idx)" title="Quitar producto">
                          <i class="bi bi-x"></i>
                        </button>
                      </div>
                      <div class="sp-details">
                        <code class="sp-code">{{ item.codigo }}</code>
                        <span v-if="item.tipo" class="sp-tag">{{ item.tipo }}</span>
                        <span v-if="item.terminacion" class="sp-tag sp-tag--italic">{{ item.terminacion }}</span>
                      </div>
                      <div v-if="item._espesores?.length > 1" class="sp-espesor-wrap">
                        <label class="sp-espesor-label">Espesor</label>
                        <select v-model="item.espesor" class="sel-small">
                          <option v-for="e in item._espesores" :key="e" :value="e">{{ e }}mm</option>
                        </select>
                      </div>
                      <span v-else-if="item.espesor" class="sp-tag sp-tag--espesor">{{ item.espesor }}mm</span>
                    </div>
                  </div>
                </td>

                <!-- Tipo -->
                <td class="col-tipo">
                  <template v-if="item._variantes?.length > 1">
                    <select v-model="item._varianteIdx" class="sel-small" @change="onTipoChange(idx)">
                      <option :value="-1">Seleccionar tipo</option>
                      <option v-for="(v, vi) in item._variantes" :key="vi" :value="vi">
                        {{ [v.tipoProducto, v.tipoTerminacion].filter(Boolean).join(' / ') || v.terminacion }}
                      </option>
                    </select>
                  </template>
                  <span v-else-if="item.tipo || item.tipoTerminacion" class="tipo-label">
                    {{ [item.tipo, item.tipoTerminacion].filter(Boolean).join(' / ') }}
                  </span>
                </td>

                <!-- Color -->
                <td class="col-color">
                  <template v-if="item._colorMode === 'todos' || (item._selectedColors?.length > 1)">
                    <select v-model="item.color" class="sel-small" @change="onColorChange(idx)">
                      <option value="">Seleccionar color</option>
                      <optgroup label="Grupo I" v-if="colorOptionsForItem(item).g1.length">
                        <option v-for="c in colorOptionsForItem(item).g1" :key="c.code" :value="c.code">
                          {{ c.code }} — {{ c.name }}
                        </option>
                      </optgroup>
                      <optgroup label="Grupo II" v-if="colorOptionsForItem(item).g2.length">
                        <option v-for="c in colorOptionsForItem(item).g2" :key="c.code" :value="c.code">
                          {{ c.code }} — {{ c.name }}
                        </option>
                      </optgroup>
                      <optgroup label="Grupo III" v-if="colorOptionsForItem(item).g3.length">
                        <option v-for="c in colorOptionsForItem(item).g3" :key="c.code" :value="c.code">
                          {{ c.code }} — {{ c.name }}
                        </option>
                      </optgroup>
                    </select>
                  </template>
                  <input v-else v-model="item.color" type="text" placeholder="Color" class="input-small" />
                </td>

                <!-- Cantidad -->
                <td class="col-qty">
                  <input v-model.number="item.cantidad" type="number" min="1" step="1"
                    class="input-num" @input="recalc(idx)" @focus="$event.target.select()" />
                </td>

                <!-- Unidad -->
                <td class="col-unit">
                  <select v-model="item.unidad" class="sel-small">
                    <option value="unidad">unidad</option>
                    <option value="m2">m²</option>
                    <option value="ml">ml</option>
                    <option value="lámina">lámina</option>
                    <option value="placa">placa</option>
                    <option value="kit">kit</option>
                    <option value="caja">caja</option>
                  </select>
                </td>

                <!-- Descuento -->
                <td class="col-disc">
                  <span v-if="!item._admiteDescuentos" class="badge-exento" title="Este producto está exento de descuentos">Exento</span>
                  <div v-else class="disc-wrap">
                    <select
                      v-model="item._discountLabel"
                      @change="onDiscountChange(idx)"
                      class="sel-disc"
                      :disabled="!item._groupDescuentos?.length && !item._productId"
                      :title="!item._groupDescuentos?.length ? 'Este producto no tiene tabla de descuentos' : ''"
                    >
                      <option
                        v-for="opt in discountOptions(item._groupDescuentos)"
                        :key="opt.label"
                        :value="opt.label"
                      >{{ opt.label }}</option>
                    </select>
                    <div class="disc-manual">
                      <input
                        v-model.number="item._discountPct"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        class="disc-pct-input"
                        @change="onManualDiscount(idx)"
                        @focus="$event.target.select()"
                      />
                      <span class="disc-pct-sym">%</span>
                      <button
                        v-if="item._discountPct > 0"
                        class="disc-clear-btn"
                        title="Quitar descuento"
                        @click="clearDiscount(idx)"
                      ><i class="bi bi-x-lg"></i></button>
                    </div>
                  </div>
                </td>

                <!-- Precio unitario -->
                <td class="col-price">
                  <div class="input-prefix-wrap">
                    <span class="input-prefix">$</span>
                    <input v-model.number="item.precioUnitario" type="number" min="0" step="0.01"
                      class="input-num has-prefix" @input="recalc(idx)" @focus="$event.target.select()" />
                  </div>
                  <span v-if="item._basePrice && item._discountPct > 0" class="base-price-hint">
                    base: {{ fmtMoney(item._basePrice) }}
                  </span>
                </td>

                <!-- Descripción -->
                <td class="col-desc">
                  <textarea
                    v-model="item.descripcion"
                    placeholder="Observaciones…"
                    class="input-small desc-textarea"
                    rows="1"
                    @input="autoResize($event)"
                    @focus="autoResize($event)"
                  ></textarea>
                </td>

                <!-- Subtotal -->
                <td class="col-sub subtotal-cell">{{ fmtMoney(item.subtotal || 0) }}</td>

                <!-- Eliminar -->
                <td class="col-del">
                  <button class="del-row-btn" @click="removeItem(idx)" title="Quitar">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="item._tieneAgregado" class="agregado-sub-row">
                <td colspan="10">
                  <div class="agregado-check-label">
                    <input type="checkbox" v-model="item._incluirAgregado" @change="recalc(idx)" />
                    <span class="agregado-check-name">{{ item._agregadoNombre }}</span>
                    <span class="agregado-check-price">{{ fmtMoney(item._agregadoPrecio) }} / u &nbsp;·&nbsp; sin descuento</span>
                    <template v-if="item._incluirAgregado">
                      <div class="agregado-qty-wrap">
                        <span class="agregado-qty-label">Cant.</span>
                        <input
                          v-model.number="item._agregadoCantidad"
                          type="number" min="1" step="1"
                          class="agregado-qty-input"
                          @input="recalc(idx)"
                          @focus="$event.target.select()"
                        />
                      </div>
                      <span class="agregado-check-total">
                        = {{ fmtMoney((item._agregadoPrecio || 0) * (item._agregadoCantidad || 1)) }}
                      </span>
                    </template>
                  </div>
                </td>
              </tr>
              </template>
            </tbody>
          </table>
        </div>

        <button class="add-row-btn" @click="addItem">
          <i class="bi bi-plus-circle"></i> Agregar ítem
        </button>

        <!-- Total -->
        <div class="total-row">
          <span class="total-label">Total</span>
          <span class="total-value">{{ fmtMoney(totalForm) }}</span>
        </div>

        <!-- Notas -->
        <div class="field">
          <label>Notas / Condiciones</label>
          <textarea v-model="form.descripcionGeneral" rows="3"
            placeholder="Observaciones generales, condiciones de pago, plazo de entrega…"></textarea>
        </div>

        <!-- Footer -->
        <div class="form-footer">
          <button class="primary-button" :disabled="saving" @click="saveQuote()">
            <i class="bi" :class="saving ? 'bi-hourglass-split' : 'bi-floppy2'"></i>
            {{ saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear cotización' }}
          </button>
          <button class="secondary-button" :disabled="saving" @click="saveAndPrint">
            <i class="bi bi-printer"></i> Guardar e imprimir
          </button>
          <button class="ghost-button" @click="cancelForm">Cancelar</button>
        </div>
      </div>

    </div>
  </div>

  <!-- ── Dropdown de búsqueda (Teleport → body, evita clipping) ──────── -->
  <Teleport to="body">
    <div
      v-if="activeSearchIdx >= 0 && searchResults.length"
      class="psw-portal"
      :style="portalStyle"
    >
      <div
        v-for="(p, pi) in searchResults"
        :key="p._id"
        class="psw-option"
        :class="{ 'psw-option--active': pi === navIdx }"
        @mousedown.prevent="selectResult(activeSearchIdx, p)"
      >
        <span class="pso-code">{{ p.code }}</span>
        <span class="pso-name">{{ p.name }}</span>
        <span class="pso-grupo">{{ p.grupo }}</span>
        <span v-if="p.thicknesses?.length" class="pso-esp">{{ p.thicknesses.join(' · ') }}mm</span>
      </div>
    </div>
  </Teleport>

  <!-- ── Editor de plantilla de impresión ─────────────────────────────── -->
  <Teleport to="body">
    <div v-if="showPrintEditor" class="pe-backdrop" @click.self="showPrintEditor = false">
      <div class="pe-modal">
        <div class="pe-hd">
          <i class="bi bi-pencil-square"></i>
          <span>Editar plantilla de impresión</span>
          <button class="pe-close" @click="showPrintEditor = false"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="pe-body">
          <div class="pe-cols">

            <!-- Formulario -->
            <div class="pe-form">
              <div class="pe-sec-label">Logo de empresa</div>
              <div class="pe-logo-row">
                <div class="pe-logo-thumb">
                  <img v-if="pt.logo" :src="pt.logo" alt="Logo" class="pe-logo-img" />
                  <span v-else class="pe-logo-ph"><i class="bi bi-image" style="font-size:1.6rem;opacity:.3"></i></span>
                </div>
                <div class="pe-logo-btns">
                  <label class="secondary-button pe-upload-lbl">
                    <i class="bi bi-upload"></i> Subir imagen
                    <input type="file" accept="image/*" style="display:none" @change="onLogoFile" />
                  </label>
                  <button v-if="pt.logo" class="ghost-button" @click="pt.logo = ''">
                    <i class="bi bi-trash3"></i> Quitar
                  </button>
                </div>
              </div>

              <div class="pe-sec-label">Datos de la empresa</div>
              <div class="pe-fields">
                <div class="pe-field pe-field--full">
                  <label>Razón social</label>
                  <input v-model="pt.razonSocial" type="text" placeholder="Mi Empresa S.A." maxlength="120" />
                </div>
                <div class="pe-field pe-field--full">
                  <label>Dirección</label>
                  <input v-model="pt.direccion" type="text" placeholder="Av. Corrientes 1234, Piso 3" maxlength="150" />
                </div>
                <div class="pe-field pe-field--full">
                  <label>Ciudad / Provincia</label>
                  <input v-model="pt.ciudad" type="text" placeholder="Buenos Aires, CABA" maxlength="100" />
                </div>
                <div class="pe-field">
                  <label>Teléfono</label>
                  <input v-model="pt.telefono" type="text" placeholder="+54 11 0000-0000" maxlength="40" />
                </div>
                <div class="pe-field">
                  <label>Email</label>
                  <input v-model="pt.email" type="email" placeholder="info@empresa.com" maxlength="100" />
                </div>
                <div class="pe-field">
                  <label>Sitio web</label>
                  <input v-model="pt.web" type="text" placeholder="www.empresa.com" maxlength="100" />
                </div>
                <div class="pe-field">
                  <label>CUIT</label>
                  <input v-model="pt.cuit" type="text" placeholder="30-12345678-9" maxlength="13"
                    @input="pt.cuit = pt.cuit.replace(/[^\d-]/g,'').slice(0,13)" />
                </div>
              </div>

              <div class="pe-sec-label">Texto de condiciones</div>
              <div class="pe-field pe-field--full">
                <textarea v-model="pt.condiciones" rows="3"
                  placeholder="Oferta válida por {dias} días a partir de la fecha de emisión. Precios en dólares. No incluyen IVA." />
                <span class="pe-hint">Usá <code>{dias}</code> para insertar los días de validez de cada cotización.</span>
              </div>

              <div class="pe-sec-label">Pie de página</div>
              <div class="pe-field pe-field--full">
                <textarea v-model="pt.piePagina" rows="2"
                  placeholder="Texto adicional al pie (contacto, datos bancarios, etc.)" />
              </div>
            </div>

            <!-- Preview -->
            <div class="pe-preview">
              <div class="pe-preview-label">Vista previa del encabezado</div>
              <div class="pe-preview-doc">
                <div class="pe-prev-header">
                  <div class="pe-prev-left">
                    <img v-if="pt.logo" :src="pt.logo" alt="Logo" class="pe-prev-logo" />
                    <div v-else class="pe-prev-logo-ph"><i class="bi bi-image"></i><br>Logo</div>
                    <div v-if="pt.razonSocial" class="pe-prev-company-name">{{ pt.razonSocial }}</div>
                    <div v-if="pt.direccion" class="pe-prev-detail">{{ pt.direccion }}</div>
                    <div v-if="pt.ciudad" class="pe-prev-detail">{{ pt.ciudad }}</div>
                    <div v-if="pt.telefono" class="pe-prev-detail">{{ pt.telefono }}</div>
                    <div v-if="pt.email" class="pe-prev-detail">{{ pt.email }}</div>
                    <div v-if="pt.web" class="pe-prev-detail">{{ pt.web }}</div>
                    <div v-if="pt.cuit" class="pe-prev-detail">CUIT: {{ pt.cuit }}</div>
                  </div>
                  <div class="pe-prev-right">
                    <div class="pe-prev-title">COTIZACIÓN</div>
                    <div class="pe-prev-meta-row"><span>N°</span><strong>#0001</strong></div>
                    <div class="pe-prev-meta-row"><span>Fecha</span>{{ new Date().toLocaleDateString('es-AR') }}</div>
                  </div>
                </div>
                <div v-if="pt.condiciones || pt.piePagina" class="pe-prev-footer-area">
                  <div v-if="pt.condiciones" class="pe-prev-conditions">
                    {{ pt.condiciones.replace('{dias}', '7') }}
                  </div>
                  <div v-if="pt.piePagina" class="pe-prev-pie">{{ pt.piePagina }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="pe-ft">
          <button class="ghost-button" @click="showPrintEditor = false">Cancelar</button>
          <button class="primary-button" @click="savePt">
            <i class="bi bi-floppy2"></i> Guardar plantilla
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Layout de impresión ─────────────────────────────────────────── -->
  <div v-if="quoteToPrint" class="print-doc">
    <div class="print-header">
      <div class="print-left">
        <img v-if="pt.logo" :src="pt.logo" alt="Logo" class="print-logo" />
        <img v-else src="/karikal.png" alt="Logo" class="print-logo" />
        <div v-if="pt.razonSocial" class="print-company-name">{{ pt.razonSocial }}</div>
        <div v-if="pt.direccion" class="print-company-detail">{{ pt.direccion }}</div>
        <div v-if="pt.ciudad" class="print-company-detail">{{ pt.ciudad }}</div>
        <div v-if="pt.telefono" class="print-company-detail">{{ pt.telefono }}</div>
        <div v-if="pt.email" class="print-company-detail">{{ pt.email }}</div>
        <div v-if="pt.web" class="print-company-detail">{{ pt.web }}</div>
        <div v-if="pt.cuit" class="print-company-detail">CUIT: {{ pt.cuit }}</div>
      </div>
      <div class="print-company">
        <div class="print-doc-title">COTIZACIÓN</div>
        <table class="print-meta-table">
          <tbody>
            <tr><td>N°</td><td><strong>#{{ String(quoteToPrint.numero).padStart(4,'0') }}</strong></td></tr>
            <tr><td>Fecha</td><td>{{ fmtDate(quoteToPrint.createdAt) }}</td></tr>
            <tr><td>Válida hasta</td><td>{{ validezFecha(quoteToPrint.createdAt, quoteToPrint.validezDias) }}</td></tr>
            <tr><td>Vendedor</td><td>{{ quoteToPrint.vendedor }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="print-titulo">{{ quoteToPrint.titulo }}</div>

    <div v-if="hasCliente(quoteToPrint)" class="print-client-box">
      <div class="print-section-label">DESTINATARIO</div>
      <div v-if="quoteToPrint.cliente.nombre" class="print-client-name">{{ quoteToPrint.cliente.nombre }}</div>
      <div v-if="quoteToPrint.cliente.empresa" class="print-client-detail">{{ quoteToPrint.cliente.empresa }}</div>
      <div v-if="quoteToPrint.cliente.email" class="print-client-detail">{{ quoteToPrint.cliente.email }}</div>
      <div v-if="quoteToPrint.cliente.telefono" class="print-client-detail">{{ quoteToPrint.cliente.telefono }}</div>
    </div>

    <table class="print-items">
      <thead>
        <tr>
          <th class="pi-product">Producto / Material</th>
          <th class="pi-color">Color</th>
          <th class="pi-qty">Cant.</th>
          <th class="pi-unit">Unidad</th>
          <th class="pi-disc">Descuento</th>
          <th class="pi-price">Precio unit.</th>
          <th class="pi-desc">Descripción</th>
          <th class="pi-sub">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in quoteToPrint.items" :key="i">
          <td class="pi-product">
            <span class="pi-name">{{ item.nombre }}</span>
            <span v-if="item.codigo" class="pi-code">{{ item.codigo }}</span>
            <span v-if="item.tipo || item.tipoTerminacion || item.terminacion || item.espesor" class="pi-meta">
              {{ [item.tipo, item.tipoTerminacion, item.terminacion, item.espesor ? item.espesor + 'mm' : ''].filter(Boolean).join(' · ') }}
            </span>
          </td>
          <td class="pi-color">{{ item.color || '—' }}</td>
          <td class="pi-qty">{{ item.cantidad }}</td>
          <td class="pi-unit">{{ item.unidad }}</td>
          <td class="pi-disc">{{ item.discountLabel || '—' }}</td>
          <td class="pi-price">{{ fmtMoney(item.precioUnitario) }}</td>
          <td class="pi-desc">{{ item.descripcion || '' }}</td>
          <td class="pi-sub">{{ fmtMoney(item.subtotal) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="print-total-row">
          <td colspan="7" class="print-total-label">TOTAL</td>
          <td class="print-total-value">{{ fmtMoney(totalCotizacion(quoteToPrint)) }}</td>
        </tr>
      </tfoot>
    </table>

    <div v-if="quoteToPrint.descripcionGeneral" class="print-notes">
      <div class="print-section-label">NOTAS Y CONDICIONES</div>
      <p class="print-notes-text">{{ quoteToPrint.descripcionGeneral }}</p>
    </div>

    <div class="print-validity">
      {{ (pt.condiciones || 'Oferta válida por {dias} días a partir de la fecha de emisión. Precios en dólares. No incluyen IVA.').replace('{dias}', String(quoteToPrint.validezDias)) }}
    </div>
    <div class="print-footer">
      <div v-if="pt.piePagina" class="print-footer-extra">{{ pt.piePagina }}</div>
      <div>Cotización generada por {{ quoteToPrint.vendedor }} — {{ fmtDate(quoteToPrint.createdAt) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { useProductsStore } from '@/stores/products'
import { useCrmStore } from '@/stores/crm'
import { useToast } from 'vue-toastification'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { API_BASE_URL } from '@/utils/api'

const productsStore = useProductsStore()
const crmStore = useCrmStore()
const toast = useToast()

// ── Estado global ─────────────────────────────────────────────────────────────
const activeTab = ref('list')
const quotes = ref([])
const loadingQuotes = ref(false)
const saving = ref(false)
const editingId = ref(null)
const showCliente = ref(false)
const quoteToPrint = ref(null)
const form = ref(newFormState())

// ── Plantilla de impresión ────────────────────────────────────────────────────
const PT_KEY = 'printTemplate'
const showPrintEditor = ref(false)

function defaultPt() {
  return { logo: '', razonSocial: '', direccion: '', ciudad: '', telefono: '', email: '', web: '', cuit: '', condiciones: '', piePagina: '' }
}
const pt = ref(defaultPt())

function loadPt() {
  try {
    const raw = localStorage.getItem(PT_KEY)
    if (raw) pt.value = { ...defaultPt(), ...JSON.parse(raw) }
  } catch {}
}
function savePt() {
  localStorage.setItem(PT_KEY, JSON.stringify(pt.value))
  showPrintEditor.value = false
  toast.success('Plantilla de impresión guardada.')
}
function onLogoFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => { pt.value.logo = ev.target.result }
  reader.readAsDataURL(file)
}

// ── Grupos de descuento ───────────────────────────────────────────────────────
const grupos = ref([])  // [{ nombre, descuentos: [...] }]
const colorCatalog = ref([])  // catálogo de colores para productos con colorMode: 'todos'

// ── Estado del buscador ───────────────────────────────────────────────────────
const activeSearchIdx = ref(-1)
const searchResults = ref([])
const navIdx = ref(-1)
const portalStyle = ref({})

// ── Computed ──────────────────────────────────────────────────────────────────
const totalForm = computed(() =>
  form.value.items.reduce((s, i) => s + (i.subtotal || 0), 0)
)

// ── Auth header ───────────────────────────────────────────────────────────────
function authH() {
  const token = localStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  loadPt()
  loadingQuotes.value = true
  try {
    await Promise.all([
      loadQuotes(),
      productsStore.products.length ? Promise.resolve() : productsStore.fetchProducts(),
      loadGrupos(),
      loadColors(),
      crmStore.clients.length ? Promise.resolve() : crmStore.fetchClients(),
    ])
  } finally {
    loadingQuotes.value = false
  }
})

async function loadQuotes() {
  const { data } = await axios.get(`${API_BASE_URL}/quotes`, authH())
  quotes.value = Array.isArray(data) ? data : []
}

async function loadGrupos() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/product-groups`, authH())
    grupos.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error loading product groups', e)
  }
}

async function loadColors() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/colors`, authH())
    colorCatalog.value = Array.isArray(data) ? data : []
  } catch { /* ignore */ }
}

function colorOptionsForItem(item) {
  const allowed = item._colorMode === 'todos' ? null : (item._selectedColors || [])
  const catalog = colorCatalog.value
  const filter = (g) => {
    const byGroup = catalog.filter(c => c.grupoColor === g)
    return allowed ? byGroup.filter(c => allowed.includes(c.code)) : byGroup
  }
  return { g1: filter(1), g2: filter(2), g3: filter(3) }
}

function getActiveVariante(item) {
  if (!item._variantes?.length) return null
  if (item._variantes.length === 1) return item._variantes[0]
  if (item._varianteIdx >= 0 && item._varianteIdx < item._variantes.length) {
    return item._variantes[item._varianteIdx]
  }
  return null
}

function rebuildSkuAndPrice(item, prod) {
  const prefijo = prod.prefijo || ''
  const nom = prod.nomenclaturaMedida || ''
  const vari = getActiveVariante(item)
  const term = vari?.terminacion || item.terminacion || prod.terminacion || ''
  const colorSel = colorCatalog.value.find(c => c.code === item.color)
  const colorPart = colorSel ? colorSel.code : ''

  const espesorPart = prod.espesor ? `-${prod.espesor}` : ''
  item.codigo = `${prefijo}${colorPart}${term}${nom}${espesorPart}`

  const src = vari || prod
  if (colorSel) {
    let base = 0
    if (colorSel.grupoColor === 1) base = src.precioGrupoI ?? src.precioGeneral ?? 0
    else if (colorSel.grupoColor === 2) base = src.precioGrupoII ?? src.precioGeneral ?? 0
    else if (colorSel.grupoColor === 3) base = src.precioGrupoIII ?? src.precioGeneral ?? 0
    else base = src.precioGeneral ?? 0
    item._basePrice = base
    item.precioUnitario = base
  } else if (src.precioGeneral) {
    item._basePrice = src.precioGeneral
    item.precioUnitario = src.precioGeneral
  }

  item._discountPct = 0
  item._discountLabel = 'Sin descuento'
}

function onTipoChange(idx) {
  const item = form.value.items[idx]
  const vari = getActiveVariante(item)
  if (vari) {
    item.tipo = vari.tipoProducto || ''
    item.tipoTerminacion = vari.tipoTerminacion || ''
    item.terminacion = vari.terminacion || ''
  }

  const prod = item._productId ? productsStore.getById(item._productId) : null
  if (!prod) return

  rebuildSkuAndPrice(item, prod)
  recalc(idx)
}

function onColorChange(idx) {
  const item = form.value.items[idx]
  if (!item._colorMode && !item._selectedColors?.length && !item._variantes?.length) return

  const prod = item._productId ? productsStore.getById(item._productId) : null
  if (!prod) return

  rebuildSkuAndPrice(item, prod)
  recalc(idx)
}

// ── CRM client picker ─────────────────────────────────────────────────────────
const crmDropOpen = ref(false)

const crmResults = computed(() => {
  const q = (form.value.cliente?.nombre || '').trim().toLowerCase()
  if (!q || q.length < 2) return []
  return crmStore.clients.filter(c =>
    [c.razonSocial, c.nombreComercial, c.contactoPrincipal, c.email, c.name]
      .some(f => f && f.toLowerCase().includes(q))
  ).slice(0, 8)
})

function selectCrmClient(c) {
  const firstPhone = c.telefonos?.[0]?.numero || c.telefono || ''
  form.value.clienteId = c._id
  form.value._crmClientLabel = c.razonSocial || c.nombreComercial || c.contactoPrincipal || c.name || ''
  form.value.cliente = {
    nombre:   c.contactoPrincipal || c.name || '',
    empresa:  c.razonSocial || c.nombreComercial || c.company || '',
    email:    c.email || '',
    telefono: firstPhone,
  }
  showCliente.value = true
  crmDropOpen.value = false
}

function clearCrmClient() {
  form.value.clienteId = null
  form.value._crmClientLabel = ''
}

function crmLabelFor(id) {
  if (!id) return ''
  const c = crmStore.clients.find(x => String(x._id) === String(id))
  return c ? (c.razonSocial || c.nombreComercial || c.contactoPrincipal || '') : ''
}

// ── Formulario ────────────────────────────────────────────────────────────────
function newFormState() {
  return {
    numero: null,
    titulo: '',
    fecha: new Date().toISOString(),
    validezDias: 7,
    estado: 'borrador',
    clienteId: null,
    _crmClientLabel: '',
    cliente: { nombre: '', empresa: '', email: '', telefono: '' },
    items: [emptyItem()],
    descripcionGeneral: '',
  }
}

function emptyItem() {
  return {
    _productId: '',
    _search: '',
    _colors: [],
    _espesores: [],
    _basePrice: 0,
    _discountPct: 0,
    _discountLabel: 'Sin descuento',
    _groupDescuentos: [],
    _colorMode: 'especifico',
    _selectedColors: [],
    _variantes: [],
    _varianteIdx: -1,
    _admiteDescuentos: true,
    _tieneAgregado: false,
    _agregadoNombre: '',
    _agregadoPrecio: 0,
    _incluirAgregado: false,
    _agregadoCantidad: 1,
    nombre: '',
    codigo: '',
    tipo: '',
    tipoTerminacion: '',
    terminacion: '',
    espesor: '',
    color: '',
    cantidad: 1,
    unidad: 'unidad',
    precioUnitario: 0,
    descripcion: '',
    subtotal: 0,
  }
}

function startNew() {
  editingId.value = null
  form.value = newFormState()
  showCliente.value = false
  activeTab.value = 'form'
}

function editQuote(q) {
  editingId.value = q._id
  form.value = {
    numero: q.numero,
    titulo: q.titulo,
    fecha: q.createdAt,
    validezDias: q.validezDias ?? 7,
    estado: q.estado || 'borrador',
    clienteId: q.clienteId || null,
    _crmClientLabel: crmLabelFor(q.clienteId),
    cliente: { nombre: '', empresa: '', email: '', telefono: '', ...(q.cliente || {}) },
    items: (q.items || []).map(it => {
      const prod = it.productoId ? productsStore.getById(it.productoId) : null
      const grupo = prod ? grupos.value.find(g => g.nombre === prod.grupo) : null
      return {
        _productId: it.productoId || '',
        _search: '',
        _colors: prod?.colors || [],
        _espesores: prod?.thicknesses || [],
        _basePrice: prod ? (prod.precio ?? prod.precioGrupoI ?? prod.pricePerM2 ?? 0) : 0,
        _discountPct: 0,
        _discountLabel: it.discountLabel || 'Sin descuento',
        _groupDescuentos: grupo?.descuentos || [],
        _colorMode: prod?.colorMode || 'especifico',
        _selectedColors: prod?.selectedColors || [],
        _variantes: prod?.variantes || [],
        _varianteIdx: it._varianteIdx ?? (prod?.variantes?.length === 1 ? 0 : -1),
        _admiteDescuentos: prod?.admiteDescuentos ?? true,
        _tieneAgregado: prod?.tieneAgregado ?? false,
        _agregadoNombre: prod?.agregadoNombre || '',
        _agregadoPrecio: prod?.agregadoPrecio ?? 0,
        _incluirAgregado: it._incluirAgregado ?? false,
        _agregadoCantidad: it._agregadoCantidad ?? 1,
        nombre: it.nombre || '',
        codigo: it.codigo || '',
        tipo: it.tipo || '',
        tipoTerminacion: it.tipoTerminacion || '',
        terminacion: it.terminacion || '',
        espesor: it.espesor || '',
        color: it.color || '',
        cantidad: it.cantidad ?? 1,
        unidad: it.unidad || 'unidad',
        precioUnitario: it.precioUnitario ?? 0,
        descripcion: it.descripcion || '',
        subtotal: it.subtotal ?? 0,
      }
    }),
    descripcionGeneral: q.descripcionGeneral || '',
  }
  const cl = q.cliente || {}
  showCliente.value = !!(cl.nombre || cl.empresa || cl.email || cl.telefono)
  activeTab.value = 'form'
}

function cancelForm() {
  activeTab.value = 'list'
  editingId.value = null
  activeSearchIdx.value = -1
}

function addItem() { form.value.items.push(emptyItem()) }

function removeItem(idx) {
  form.value.items.splice(idx, 1)
  if (!form.value.items.length) form.value.items.push(emptyItem())
}

function recalc(idx) {
  const item = form.value.items[idx]
  const base = (item.cantidad || 0) * (item.precioUnitario || 0)
  const agr = item._incluirAgregado ? (item._agregadoCantidad || 1) * (item._agregadoPrecio || 0) : 0
  item.subtotal = Number((base + agr).toFixed(2))
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// ── Búsqueda de producto por SKU / nombre ────────────────────────────────────
function filteredBySearch(search) {
  const q = (search || '').toLowerCase().trim()
  if (!q) return []
  const direct = productsStore.products.filter(p =>
    (p.code || '').toLowerCase().includes(q) ||
    (p.name || '').toLowerCase().includes(q)
  )
  if (direct.length) return direct.slice(0, 10)

  // SKU inteligente: parsear prefijo del input y buscar productos base
  const upper = q.toUpperCase()
  const byPrefix = productsStore.products.filter(p => {
    if (!p.prefijo) return false
    return upper.startsWith(p.prefijo)
  })
  return byPrefix.slice(0, 10)
}

function openSearch(idx) {
  activeSearchIdx.value = idx
  navIdx.value = -1
  updateResults(idx)
  positionPortal(idx)
}

function closeSearch(idx) {
  // setTimeout para que mousedown en opción se procese antes del blur
  setTimeout(() => {
    if (activeSearchIdx.value === idx) {
      activeSearchIdx.value = -1
      navIdx.value = -1
    }
  }, 160)
}

function onSearchInput(idx) {
  activeSearchIdx.value = idx
  navIdx.value = -1
  updateResults(idx)
  positionPortal(idx)
}

function updateResults(idx) {
  searchResults.value = filteredBySearch(form.value.items[idx]._search)
}

function positionPortal(idx) {
  const el = document.getElementById(`psw-${idx}`)
  if (!el) return
  const r = el.getBoundingClientRect()
  portalStyle.value = {
    position: 'fixed',
    top: r.bottom + 4 + 'px',
    left: r.left + 'px',
    width: Math.max(r.width, 340) + 'px',
    zIndex: 9999,
  }
}

function navDown() { navIdx.value = Math.min(navIdx.value + 1, searchResults.value.length - 1) }
function navUp()   { navIdx.value = Math.max(navIdx.value - 1, 0) }
function navEnter(idx) {
  if (navIdx.value >= 0 && searchResults.value[navIdx.value]) {
    selectResult(idx, searchResults.value[navIdx.value])
  }
}

function parseSkuParts(searchText, product) {
  if (!searchText || !product.prefijo) return null
  const upper = searchText.toUpperCase().trim()
  if (!upper.startsWith(product.prefijo)) return null

  let rest = upper.slice(product.prefijo.length)
  const espesorMatch = rest.match(/-(\d+(?:\.\d+)?)$/)
  if (espesorMatch) rest = rest.slice(0, -espesorMatch[0].length)

  const allTermCodes = (product.variantes || []).map(v => v.terminacion).filter(Boolean)
  const uniqueTerms = [...new Set(allTermCodes)]

  let foundColor = ''
  let foundTerm = ''
  let matched = false

  for (const term of uniqueTerms) {
    if (rest.includes(term)) {
      const termIdx = rest.indexOf(term)
      const colorCandidate = rest.slice(0, termIdx)
      if (colorCandidate.length >= 3 && colorCandidate.length <= 6) {
        foundColor = colorCandidate
        foundTerm = term
        matched = true
        break
      }
    }
  }

  if (!matched && rest.length >= 4) {
    foundColor = rest.slice(0, 4)
    const afterColor = rest.slice(4)
    for (const term of uniqueTerms) {
      if (afterColor.startsWith(term)) {
        foundTerm = term
        break
      }
    }
  }

  return (foundColor || foundTerm) ? { color: foundColor, terminacion: foundTerm } : null
}

function selectResult(idx, p) {
  activeSearchIdx.value = -1
  navIdx.value = -1
  const item = form.value.items[idx]
  const searchText = item._search || ''
  item._productId = p._id
  item._search = ''
  item.nombre = p.name
  item.codigo = p.code || ''
  item._colorMode = p.colorMode || 'especifico'
  item._selectedColors = p.selectedColors || []
  item._variantes = p.variantes || []
  item._varianteIdx = -1
  item._espesores = p.thicknesses || []
  item.espesor = p.espesor || (item._espesores.length ? item._espesores[0] : '')
  item.unidad = p.unidadPrecio || 'unidad'

  // Parsear SKU buscado para auto-completar color y terminación
  const skuParts = parseSkuParts(searchText, p)

  // Terminación / tipo
  if (skuParts?.terminacion && item._variantes.length) {
    const vi = item._variantes.findIndex(v => v.terminacion === skuParts.terminacion)
    if (vi >= 0) {
      item._varianteIdx = vi
      item.tipo = item._variantes[vi].tipoProducto || ''
      item.tipoTerminacion = item._variantes[vi].tipoTerminacion || ''
      item.terminacion = item._variantes[vi].terminacion || ''
    }
  } else if (item._variantes.length === 1) {
    item._varianteIdx = 0
    item.tipo = item._variantes[0].tipoProducto || p.tipo || ''
    item.tipoTerminacion = item._variantes[0].tipoTerminacion || p.tipoTerminacion || ''
    item.terminacion = item._variantes[0].terminacion || p.terminacion || ''
  } else if (item._variantes.length > 1) {
    item.tipo = ''
    item.tipoTerminacion = ''
    item.terminacion = ''
  } else {
    item.tipo = p.tipo || ''
    item.tipoTerminacion = p.tipoTerminacion || ''
    item.terminacion = p.terminacion || ''
  }

  // Color
  if (skuParts?.color) {
    const colorObj = colorCatalog.value.find(c => c.code === skuParts.color)
    if (colorObj) {
      item.color = colorObj.code
      item._colors = []
      const vari = getActiveVariante(item)
      const src = vari || p
      let base = 0
      if (colorObj.grupoColor === 1) base = src.precioGrupoI ?? src.precioGeneral ?? 0
      else if (colorObj.grupoColor === 2) base = src.precioGrupoII ?? src.precioGeneral ?? 0
      else if (colorObj.grupoColor === 3) base = src.precioGrupoIII ?? src.precioGeneral ?? 0
      else base = src.precioGeneral ?? 0
      item._basePrice = base
      item.precioUnitario = base
      rebuildSkuAndPrice(item, p)
    } else {
      item.color = ''
      item._basePrice = 0
      item.precioUnitario = 0
    }
  } else {
    const needsColorSelection = p.colorMode === 'todos' || (p.selectedColors?.length > 1)
    const needsTipoSelection = item._variantes.length > 1 && item._varianteIdx < 0
    if (needsColorSelection || needsTipoSelection) {
      item._colors = []
      item.color = ''
      item._basePrice = 0
      item.precioUnitario = 0
    } else {
      item._colors = p.colors || []
      item.color = p.selectedColors?.length === 1 ? p.selectedColors[0] : (item._colors.length ? item._colors[0] : '')
      const base = p.precio ?? p.precioGrupoI ?? p.pricePerM2 ?? 0
      item._basePrice = base
      item.precioUnitario = base
    }
  }

  item._admiteDescuentos = p.admiteDescuentos ?? true
  item._tieneAgregado = p.tieneAgregado ?? false
  item._agregadoNombre = p.agregadoNombre || ''
  item._agregadoPrecio = p.agregadoPrecio ?? 0
  item._incluirAgregado = false
  item._agregadoCantidad = 1
  item._discountPct = 0
  item._discountLabel = 'Sin descuento'

  const grupo = grupos.value.find(g => g.nombre === p.grupo)
  item._groupDescuentos = item._admiteDescuentos ? (grupo?.descuentos || []) : []

  recalc(idx)
}

function clearProduct(idx) {
  const item = form.value.items[idx]
  Object.assign(item, emptyItem())
}

// ── Descuentos ────────────────────────────────────────────────────────────────
function discountOptions(descuentos) {
  const opts = [{ label: 'Sin descuento', pct: 0 }]
  if (!descuentos?.length) return opts
  for (const t of descuentos) {
    const from = t.desdeHojas
    const to = t.hastaHojas
    const range = to != null ? `${from}–${to} uds.` : `+${from - 1} uds.`
    const prefix = t.nota?.trim() || range
    if (t.porcCantidad) {
      opts.push({ label: `${prefix} · ${fmtPct(t.porcCantidad)}%`, pct: t.porcCantidad })
    }
    if (t.porcCantidadContado) {
      opts.push({ label: `${prefix} · ${fmtPct(t.porcCantidadContado)}% (contado)`, pct: t.porcCantidadContado })
    }
    if (t.porcCantidad30dias) {
      opts.push({ label: `${prefix} · ${fmtPct(t.porcCantidad30dias)}% (30 días)`, pct: t.porcCantidad30dias })
    }
  }
  return opts
}

function onDiscountChange(idx) {
  const item = form.value.items[idx]
  const opts = discountOptions(item._groupDescuentos)
  const selected = opts.find(o => o.label === item._discountLabel)
  const pct = selected?.pct ?? 0
  item._discountPct = pct
  if (item._basePrice > 0) item.precioUnitario = Number((item._basePrice * (1 - pct / 100)).toFixed(2))
  recalc(idx)
}

function onManualDiscount(idx) {
  const item = form.value.items[idx]
  const pct = Math.max(0, Math.min(100, Number(item._discountPct) || 0))
  item._discountPct = pct
  item._discountLabel = pct > 0 ? `Manual · ${fmtPct(pct)}%` : 'Sin descuento'
  if (item._basePrice > 0) item.precioUnitario = Number((item._basePrice * (1 - pct / 100)).toFixed(2))
  recalc(idx)
}

function clearDiscount(idx) {
  const item = form.value.items[idx]
  item._discountPct = 0
  item._discountLabel = 'Sin descuento'
  if (item._basePrice > 0) item.precioUnitario = item._basePrice
  recalc(idx)
}

// ── Guardar ───────────────────────────────────────────────────────────────────
function buildPayload() {
  return {
    titulo: form.value.titulo,
    cliente: form.value.cliente,
    clienteId: form.value.clienteId || null,
    validezDias: form.value.validezDias,
    estado: form.value.estado,
    items: form.value.items.map(it => ({
      productoId: it._productId || null,
      nombre: it.nombre,
      codigo: it.codigo,
      tipo: it.tipo || '',
      terminacion: it.terminacion || '',
      espesor: it.espesor || '',
      color: it.color,
      cantidad: Number(it.cantidad) || 0,
      unidad: it.unidad,
      precioUnitario: Number(it.precioUnitario) || 0,
      descripcion: it.descripcion,
      subtotal: it.subtotal,
      discountLabel: it._discountLabel !== 'Sin descuento' ? it._discountLabel : '',
      discountPct: it._discountPct || 0,
      _incluirAgregado: it._incluirAgregado || false,
      _agregadoCantidad: it._agregadoCantidad || 1,
    })),
    descripcionGeneral: form.value.descripcionGeneral,
  }
}

async function saveQuote(andPrint = false) {
  if (!form.value.titulo.trim()) {
    toast.warning('El título es obligatorio.')
    return null
  }
  saving.value = true
  try {
    let saved
    if (editingId.value) {
      const { data } = await axios.put(`${API_BASE_URL}/quotes/${editingId.value}`, buildPayload(), authH())
      saved = data
      toast.success('Cotización actualizada.')
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/quotes`, buildPayload(), authH())
      saved = data
      toast.success(`Cotización #${String(saved.numero).padStart(4,'0')} creada.`)
    }
    await loadQuotes()
    activeTab.value = 'list'
    editingId.value = null
    return saved
  } catch (err) {
    toast.error('Error al guardar la cotización.')
    console.error(err)
    return null
  } finally {
    saving.value = false
  }
}

async function saveAndPrint() {
  const saved = await saveQuote()
  if (saved) {
    quoteToPrint.value = saved
    await nextTick()
    window.print()
  }
}

async function openPrint(q) {
  quoteToPrint.value = q
  await nextTick()
  window.print()
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
const quoteToDelete = ref(null)

async function doDeleteQuote() {
  const q = quoteToDelete.value
  quoteToDelete.value = null
  if (!q) return
  try {
    await axios.delete(`${API_BASE_URL}/quotes/${q._id}`, authH())
    toast.success('Cotización eliminada.')
    await loadQuotes()
  } catch {
    toast.error('Error al eliminar.')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function validezFecha(createdAt, dias = 7) {
  if (!createdAt) return '—'
  const d = new Date(createdAt)
  d.setDate(d.getDate() + (dias || 7))
  return fmtDate(d.toISOString())
}
function fmtMoney(v) {
  if (v == null || isNaN(v)) return '—'
  return '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(v) {
  return Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}
function totalCotizacion(q) {
  return (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0)
}
const ESTADO_LABELS = { borrador: 'Borrador', enviada: 'Enviada', aceptada: 'Aceptada', rechazada: 'Rechazada' }
function labelEstado(e) { return ESTADO_LABELS[e] || e }
function hasCliente(q) {
  return !!(q.cliente?.nombre || q.cliente?.empresa || q.cliente?.email || q.cliente?.telefono)
}
</script>

<style scoped>
/* ── Topbar ── */
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.6rem; }
.topbar-left { display: flex; align-items: center; gap: 0.75rem; }
.topbar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 1.1rem; font-weight: 700; }

/* ── Empty state ── */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 3rem 1rem; color: var(--color-muted); text-align: center; }

/* ── Tabla historial ── */
.table-scroll { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(107,142,58,0.14); }
.inv-table { width: 100%; border-collapse: collapse; min-width: 720px; font-size: 0.85rem; }
.inv-table thead th { background: rgba(240,245,233,0.97); padding: 0.55rem 0.85rem; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--color-muted); white-space: nowrap; text-align: left; }
.inv-table tbody tr { border-top: 1px solid rgba(107,142,58,0.08); transition: background 0.12s; }
.inv-table tbody tr:hover { background: rgba(107,142,58,0.04); }
.inv-table tbody td { padding: 0.5rem 0.85rem; vertical-align: middle; }
.num-cell { font-weight: 700; font-size: 0.8rem; color: var(--color-primary, #6b8e3a); white-space: nowrap; }
.title-cell { font-weight: 600; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.client-cell { color: var(--color-muted); font-size: 0.82rem; }
.date-cell { white-space: nowrap; font-size: 0.82rem; color: var(--color-muted); }
.price-cell { font-weight: 700; white-space: nowrap; }
.actions-cell { white-space: nowrap; display: flex; gap: 0.3rem; align-items: center; }

/* ── Badges estado ── */
.badge-estado { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.18rem 0.55rem; border-radius: 999px; }
.badge-estado.borrador { background: rgba(107,142,58,0.1); color: #557030; }
.badge-estado.enviada  { background: rgba(59,130,246,0.12); color: #1d4ed8; }
.badge-estado.aceptada { background: rgba(16,185,129,0.12); color: #065f46; }
.badge-estado.rechazada { background: rgba(239,68,68,0.12); color: #991b1b; }

/* ── Botones icono ── */
.icon-btn { background: none; border: none; padding: 0.35rem 0.45rem; border-radius: 8px; cursor: pointer; color: var(--color-muted); transition: background 0.15s, color 0.15s; }
.icon-btn:hover { background: rgba(107,142,58,0.1); color: var(--color-primary, #6b8e3a); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.1); color: #dc2626; }

/* ── Formulario ── */
.quote-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-section-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-primary, #6b8e3a); padding-bottom: 0.4rem; border-bottom: 1px solid rgba(107,142,58,0.18); }
.section-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); margin-top: 0.3rem; }

.form-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field.full { grid-column: 1 / -1; }
.field label { font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-muted); }
.disabled-input { background: rgba(0,0,0,0.04); cursor: default; }

.collapsible-header { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--color-text); padding: 0.45rem 0; user-select: none; }
.collapsible-body { padding-top: 0.25rem; }
.optional-tag { font-size: 0.78rem; font-weight: 400; color: var(--color-muted); font-style: italic; }

/* ── Tabla items ── */
.items-scroll { overflow-x: auto; border: 1px solid rgba(107,142,58,0.14); border-radius: 12px; }
.items-table { width: 100%; border-collapse: collapse; min-width: 1060px; font-size: 0.83rem; }
.items-table thead th { background: rgba(240,245,233,0.97); padding: 0.45rem 0.6rem; font-size: 0.71rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-muted); font-weight: 700; text-align: left; white-space: nowrap; }
.item-row td { padding: 0.35rem 0.45rem; border-top: 1px solid rgba(107,142,58,0.08); vertical-align: middle; }

.col-producto { min-width: 220px; }
.col-tipo   { min-width: 110px; }
.col-color  { min-width: 95px; }

.tipo-label { font-size: 0.78rem; font-weight: 500; color: var(--color-text); }
.col-qty    { width: 68px; }
.col-unit   { width: 80px; }
.col-disc   { min-width: 190px; }
.col-price  { min-width: 120px; }
.col-desc   { min-width: 130px; }
.col-sub    { width: 100px; text-align: right; }
.col-del    { width: 34px; text-align: center; }

/* ── Buscador de producto ── */
.psw { display: flex; flex-direction: column; }
.psw-input-wrap { position: relative; }
.psw-icon { position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--color-muted); pointer-events: none; }
.psw-input { width: 100%; padding: 0.3rem 0.4rem 0.3rem 1.6rem; font-size: 0.8rem; border: 1px solid rgba(107,142,58,0.25); border-radius: 7px; background: #fff; box-sizing: border-box; }
.psw-input:focus { outline: none; border-color: var(--color-primary, #6b8e3a); box-shadow: 0 0 0 2px rgba(107,142,58,0.12); }

/* ── Producto seleccionado ── */
.selected-product { padding: 0.15rem 0; }
.sp-body { display: flex; flex-direction: column; gap: 0.2rem; }
.sp-top { display: flex; align-items: flex-start; gap: 0.3rem; }
.sp-name { font-size: 0.82rem; font-weight: 600; line-height: 1.3; flex: 1; }
.sp-details { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
.sp-code { font-size: 0.68rem; color: var(--color-muted); background: rgba(107,142,58,0.1); padding: 0.08rem 0.35rem; border-radius: 4px; white-space: nowrap; font-family: monospace; }
.sp-tag { font-size: 0.68rem; color: var(--color-muted); white-space: nowrap; }
.sp-tag--italic { font-style: italic; }
.sp-tag--espesor { font-weight: 700; color: var(--color-primary, #6b8e3a); background: rgba(107,142,58,0.1); padding: 0.05rem 0.3rem; border-radius: 4px; }
.sp-espesor-wrap { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.1rem; }
.sp-espesor-label { font-size: 0.67rem; color: var(--color-muted); white-space: nowrap; }
.sp-espesor-wrap .sel-small { width: auto; min-width: 72px; padding: 0.2rem 0.3rem; font-size: 0.75rem; }
.sp-clear { background: none; border: none; padding: 0.1rem 0.2rem; cursor: pointer; color: var(--color-muted); border-radius: 4px; line-height: 1; font-size: 0.95rem; flex-shrink: 0; }
.sp-clear:hover { background: rgba(239,68,68,0.1); color: #dc2626; }

/* ── Descuento ── */
.disc-wrap { display: flex; align-items: center; gap: 0.35rem; flex-wrap: nowrap; }
.sel-disc { font-size: 0.78rem; padding: 0.28rem 0.4rem; border: 1px solid rgba(107,142,58,0.2); border-radius: 7px; min-width: 0; flex: 1; }
.sel-disc:disabled { opacity: 0.45; cursor: not-allowed; }
.disc-manual { display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0; }
.disc-pct-input {
  width: 54px; font-size: 0.82rem; padding: 0.3rem 0.35rem;
  border: 1px solid rgba(107,142,58,0.22); border-radius: 7px;
  text-align: right; box-sizing: border-box; background: #fff;
}
.disc-pct-input:focus { outline: none; border-color: var(--color-primary,#6b8e3a); box-shadow: 0 0 0 2px rgba(107,142,58,0.12); }
.disc-pct-sym { font-size: 0.75rem; color: var(--color-muted); flex-shrink: 0; }
.disc-clear-btn { background: none; border: none; cursor: pointer; padding: 0.15rem 0.25rem; color: var(--color-muted); border-radius: 4px; font-size: 0.78rem; line-height: 1; flex-shrink: 0; }
.disc-clear-btn:hover { color: #dc2626; background: rgba(239,68,68,0.1); }
.badge-exento { display: inline-block; font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; background: rgba(107,142,58,0.1); color: var(--color-primary,#6b8e3a); border: 1px solid rgba(107,142,58,0.25); letter-spacing: 0.04em; white-space: nowrap; }
.base-price-hint { display: block; font-size: 0.69rem; color: var(--color-muted); margin-top: 0.2rem; text-decoration: line-through; }

/* ── Agregado opcional ── */
.agregado-sub-row td {
  padding: 0.3rem 0.75rem 0.4rem;
  background: rgba(107,142,58,0.03);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.agregado-check-label {
  display: inline-flex; align-items: center; gap: 0.6rem;
  cursor: pointer; font-size: 0.8rem;
}
.agregado-check-label input[type="checkbox"] {
  cursor: pointer; accent-color: var(--color-primary, #6b8e3a);
  width: 14px; height: 14px;
}
.agregado-check-name { font-weight: 600; color: var(--color-text); }
.agregado-check-price {
  font-size: 0.75rem; color: var(--color-muted);
  background: rgba(0,0,0,0.05); border-radius: 5px;
  padding: 0.1rem 0.45rem;
}
.agregado-check-total {
  font-size: 0.75rem; font-weight: 700; color: var(--color-primary, #6b8e3a);
  background: rgba(107,142,58,0.1); border-radius: 5px;
  padding: 0.1rem 0.45rem;
}
.agregado-qty-wrap {
  display: inline-flex; align-items: center; gap: 0.3rem;
}
.agregado-qty-label { font-size: 0.72rem; color: var(--color-muted); }
.agregado-qty-input {
  width: 48px; text-align: center; font-size: 0.8rem; font-weight: 700;
  padding: 0.15rem 0.3rem; border-radius: 6px;
  border: 1px solid rgba(107,142,58,0.3); background: #fff;
}

/* ── Campos genéricos en tabla ── */
.sel-small, .input-small {
  width: 100%; font-size: 0.82rem; padding: 0.38rem 0.55rem;
  border: 1px solid rgba(107,142,58,0.22); border-radius: 7px;
  background: #fff; box-sizing: border-box;
}
.sel-small:focus, .input-small:focus {
  outline: none; border-color: var(--color-primary, #6b8e3a);
  box-shadow: 0 0 0 2px rgba(107,142,58,0.12);
}
.desc-textarea {
  resize: none; overflow: hidden; min-height: 32px;
  line-height: 1.4; display: block;
}
.input-num {
  width: 100%; font-size: 0.82rem; padding: 0.38rem 0.55rem;
  border: 1px solid rgba(107,142,58,0.22); border-radius: 7px;
  background: #fff; box-sizing: border-box;
}
.input-num:focus {
  outline: none; border-color: var(--color-primary, #6b8e3a);
  box-shadow: 0 0 0 2px rgba(107,142,58,0.12);
}
.subtotal-cell { font-weight: 700; font-size: 0.82rem; white-space: nowrap; }

.input-prefix-wrap { position: relative; }
.input-prefix { position: absolute; left: 0.55rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: var(--color-muted); pointer-events: none; }
.has-prefix { padding-left: 1.4rem !important; }

.del-row-btn { background: none; border: none; padding: 0.2rem 0.3rem; border-radius: 6px; cursor: pointer; color: #dc2626; opacity: 0.5; transition: opacity 0.15s, background 0.15s; margin-top: 0.3rem; }
.del-row-btn:hover { opacity: 1; background: rgba(239,68,68,0.08); }

.add-row-btn { align-self: flex-start; background: none; border: 1px dashed rgba(107,142,58,0.4); color: var(--color-primary, #6b8e3a); border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: background 0.15s, border-color 0.15s; }
.add-row-btn:hover { background: rgba(107,142,58,0.07); border-color: rgba(107,142,58,0.7); }

/* ── Total ── */
.total-row { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; padding: 0.6rem 0.85rem; background: rgba(107,142,58,0.07); border-radius: 10px; }
.total-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.total-value { font-size: 1.1rem; font-weight: 800; color: var(--color-primary, #6b8e3a); }

/* ── Footer form ── */
.form-footer { display: flex; flex-wrap: wrap; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid rgba(107,142,58,0.12); }

/* ── Selector cliente CRM ── */
.crm-linked-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin-top: 0.3rem; padding: 0.25rem 0.6rem;
  background: rgba(107,142,58,0.1); border: 1px solid rgba(107,142,58,0.22);
  border-radius: 6px; font-size: 0.75rem; font-weight: 600;
  color: var(--color-primary, #6b8e3a);
}
.crm-cp-drop {
  position: absolute; left: 0; right: 0; top: 100%; margin-top: 3px;
  background: #fff; border: 1px solid rgba(107,142,58,0.25);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 500; max-height: 240px; overflow-y: auto;
}
.crm-cp-opt {
  display: flex; flex-direction: column; gap: 0.1rem;
  padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid rgba(107,142,58,0.07);
  transition: background 0.1s;
}
.crm-cp-opt:last-child { border-bottom: none; }
.crm-cp-opt:hover { background: rgba(107,142,58,0.07); }
.crm-cp-opt-main { font-weight: 600; font-size: 0.84rem; }
.crm-cp-opt-sub  { font-size: 0.72rem; color: var(--color-muted); }

/* ── Print doc: oculto en pantalla ── */
.print-doc { display: none; }

/* ── Editor de plantilla de impresión ── */
.pe-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 1.5rem 1rem; overflow-y: auto;
}
.pe-modal {
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 900px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.22);
  display: flex; flex-direction: column;
  max-height: calc(100vh - 3rem);
}
.pe-hd {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 1rem 1.25rem; border-bottom: 1px solid rgba(107,142,58,0.14);
  font-weight: 700; font-size: 0.95rem; flex-shrink: 0;
}
.pe-hd span { flex: 1; }
.pe-close {
  background: none; border: none; cursor: pointer; padding: 0.3rem 0.5rem;
  border-radius: 8px; color: var(--color-muted); font-size: 1rem;
}
.pe-close:hover { background: rgba(239,68,68,0.1); color: #dc2626; }
.pe-body { flex: 1; min-height: 0; overflow-y: auto; padding: 1.25rem; }
.pe-cols {
  display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem;
}
@media (max-width: 700px) { .pe-cols { grid-template-columns: 1fr; } }

@media (max-width: 768px) {
  .topbar { gap: 0.4rem; }
  .topbar-right { width: 100%; justify-content: flex-end; }

  .items-table { min-width: 0; font-size: 0.75rem; }
  .items-table thead { display: none; }
  .item-row { display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0.5rem; border-top: 1px solid rgba(107,142,58,0.12); }
  .item-row td { display: block; padding: 0.2rem 0; border: none; }
  .col-producto { width: 100%; min-width: 0; }
  .col-tipo { width: 100%; min-width: 0; }
  .col-color { width: 100%; min-width: 0; }
  .col-qty { width: auto; }
  .col-unit { width: auto; }
  .col-disc { width: 100%; min-width: 0; }
  .col-price { width: auto; min-width: 0; font-weight: 700; }
  .col-desc { width: 100%; min-width: 0; }
  .col-sub { width: auto; text-align: left; font-weight: 700; color: var(--color-primary, #6b8e3a); }
  .col-del { width: auto; position: absolute; top: 0.4rem; right: 0.3rem; }
  .item-row { position: relative; }

  .sel-small, .input-small { font-size: 0.78rem; }
  .input-num { width: 55px; }

  .inv-table { min-width: 0; font-size: 0.78rem; }
  .title-cell { max-width: 120px; }

  .form-grid-2 { grid-template-columns: 1fr; }
}

.pe-form { display: flex; flex-direction: column; gap: 0.75rem; }
.pe-sec-label {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--color-primary, #6b8e3a);
  padding-bottom: 0.25rem; border-bottom: 1px solid rgba(107,142,58,0.15);
  margin-top: 0.25rem;
}
.pe-logo-row { display: flex; align-items: center; gap: 0.85rem; }
.pe-logo-thumb {
  width: 80px; height: 60px; border-radius: 8px;
  border: 1.5px dashed rgba(107,142,58,0.35);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: rgba(107,142,58,0.03);
}
.pe-logo-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; }
.pe-logo-ph { color: var(--color-muted); }
.pe-logo-btns { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.pe-upload-lbl { cursor: pointer; }
.pe-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.pe-field { display: flex; flex-direction: column; gap: 0.25rem; }
.pe-field--full { grid-column: 1 / -1; }
.pe-field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-muted); }
.pe-field input, .pe-field textarea {
  padding: 0.4rem 0.65rem; font-size: 0.85rem;
  border: 1px solid rgba(107,142,58,0.25); border-radius: 8px;
  background: #fff; width: 100%; box-sizing: border-box;
}
.pe-field input:focus, .pe-field textarea:focus {
  outline: none; border-color: var(--color-primary, #6b8e3a);
  box-shadow: 0 0 0 2px rgba(107,142,58,0.12);
}
.pe-field textarea { resize: vertical; font-family: inherit; }
.pe-hint { font-size: 0.72rem; color: var(--color-muted); margin-top: 0.2rem; }
.pe-hint code { background: rgba(107,142,58,0.12); padding: 0.05rem 0.3rem; border-radius: 4px; font-size: 0.7rem; }

/* Preview */
.pe-preview { display: flex; flex-direction: column; gap: 0.6rem; }
.pe-preview-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.pe-preview-doc {
  border: 1.5px solid rgba(107,142,58,0.2); border-radius: 10px;
  padding: 0.85rem; font-size: 0.72rem; color: #222;
  background: #fafbf7;
}
.pe-prev-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; border-bottom: 1.5px solid #5a7a2a; padding-bottom: 0.6rem; margin-bottom: 0.6rem; }
.pe-prev-left { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
.pe-prev-logo { max-height: 44px; width: auto; object-fit: contain; margin-bottom: 0.25rem; }
.pe-prev-logo-ph { width: 52px; height: 38px; border: 1px dashed rgba(107,142,58,0.4); border-radius: 5px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.65rem; color: var(--color-muted); margin-bottom: 0.2rem; }
.pe-prev-company-name { font-weight: 700; font-size: 0.8rem; }
.pe-prev-detail { font-size: 0.67rem; color: #555; }
.pe-prev-right { text-align: right; flex-shrink: 0; }
.pe-prev-title { font-size: 1rem; font-weight: 800; color: #5a7a2a; letter-spacing: 0.06em; margin-bottom: 0.25rem; }
.pe-prev-meta-row { font-size: 0.67rem; color: #555; display: flex; gap: 0.35rem; justify-content: flex-end; }
.pe-prev-footer-area { border-top: 1px solid #d4dfc8; padding-top: 0.5rem; margin-top: 0.5rem; }
.pe-prev-conditions { font-size: 0.67rem; color: #555; font-style: italic; margin-bottom: 0.2rem; }
.pe-prev-pie { font-size: 0.67rem; color: #777; }

.pe-ft {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 0.9rem 1.25rem; border-top: 1px solid rgba(107,142,58,0.12); flex-shrink: 0;
}
</style>

<!-- ── Portal del buscador (global, fuera del scoped) ── -->
<style>
.psw-portal {
  background: #fff;
  border: 1px solid rgba(107,142,58,0.25);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.14);
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}
.psw-option {
  display: grid;
  grid-template-columns: 90px 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid rgba(107,142,58,0.07);
  font-size: 0.82rem;
}
.psw-option:last-child { border-bottom: none; }
.psw-option:hover, .psw-option--active { background: rgba(107,142,58,0.08); }
.pso-code { font-weight: 700; font-size: 0.77rem; color: var(--color-primary, #6b8e3a); white-space: nowrap; font-family: monospace; }
.pso-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pso-grupo { font-size: 0.72rem; color: var(--color-muted); white-space: nowrap; }
.pso-esp { font-size: 0.7rem; font-weight: 700; background: rgba(107,142,58,0.12); color: #557030; padding: 0.1rem 0.35rem; border-radius: 4px; white-space: nowrap; }
</style>

<!-- ── Media print (global para afectar App.vue) ── -->
<style>
/* Elimina encabezado/pie del navegador (título, URL, fecha, n° de página) y el reborde */
@page {
  size: A4;
  margin: 0;
}

@media print {
  @page {
    size: A4;
    margin: 8mm 10mm;
  }

  .no-print,
  .sidebar,
  .mobile-toggle,
  .sidebar-backdrop,
  .notification-bell-container,
  .notification-shell,
  .crm-tabs-bar,
  .topbar { display: none !important; }

  html, body, #app { height: auto !important; max-height: none !important; overflow: visible !important; }

  main.app-content,
  .with-nav { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
  .crm-wrap, .container { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }

  .print-doc {
    display: block !important;
    font-family: 'Inter', Arial, sans-serif;
    color: #000;
    padding: 0;
    font-size: 9.5pt;
    line-height: 1.4;
  }

  .print-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.8rem; border-bottom: 1.5pt solid #000; padding-bottom: 0.6rem; gap: 1rem; }
  .print-left { display: flex; flex-direction: column; gap: 0.1rem; }
  .print-logo { height: 55px; width: auto; object-fit: contain; margin-bottom: 0.2rem; filter: grayscale(1); }
  .print-company-name { font-weight: 700; font-size: 10pt; color: #000; }
  .print-company-detail { font-size: 8pt; color: #333; }
  .print-company { text-align: right; }
  .print-doc-title { font-size: 18pt; font-weight: 800; color: #000; letter-spacing: 0.08em; margin-bottom: 0.3rem; }
  .print-meta-table { font-size: 8.5pt; border-collapse: collapse; }
  .print-meta-table td { padding: 0.05rem 0.35rem; }
  .print-meta-table td:first-child { color: #444; text-align: right; }

  .print-titulo { font-size: 12pt; font-weight: 700; margin: 0.5rem 0 0.4rem; color: #000; }

  .print-client-box { background: none; border: 1px solid #999; border-radius: 4px; padding: 0.4rem 0.7rem; margin-bottom: 0.6rem; }
  .print-section-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #000; margin-bottom: 0.2rem; }
  .print-client-name { font-weight: 700; font-size: 10pt; color: #000; }
  .print-client-detail { font-size: 8.5pt; color: #333; }

  .print-items { width: 100%; border-collapse: collapse; margin-bottom: 0.6rem; font-size: 8.5pt; }
  .print-items thead tr { background: none; color: #000; }
  .print-items thead th { padding: 0.3rem 0.4rem; text-align: left; font-weight: 700; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1.5pt solid #000; border-top: 1.5pt solid #000; }
  .print-items tbody tr:nth-child(even) { background: none; }
  .print-items tbody td { padding: 0.25rem 0.4rem; border-bottom: 0.5pt solid #ccc; vertical-align: top; color: #000; }

  .pi-name { display: block; font-weight: 600; }
  .pi-code { display: block; font-size: 7.5pt; color: #555; }
  .pi-meta { display: block; font-size: 7pt; color: #666; font-style: italic; }
  .pi-product { min-width: 110px; }
  .pi-color  { width: 60px; }
  .pi-qty    { width: 35px; text-align: right; }
  .pi-unit   { width: 45px; }
  .pi-disc   { width: 90px; font-size: 7.5pt; color: #444; }
  .pi-price  { width: 65px; text-align: right; }
  .pi-desc   { color: #444; }
  .pi-sub    { width: 70px; text-align: right; font-weight: 700; }

  .print-total-row { background: none !important; color: #000; }
  .print-total-label { text-align: right; font-weight: 700; font-size: 10pt; padding: 0.35rem 0.4rem; border-top: 1.5pt solid #000; }
  .print-total-value { text-align: right; font-weight: 800; font-size: 11pt; padding: 0.35rem 0.4rem; border-top: 1.5pt solid #000; white-space: nowrap; }

  .print-notes { margin-bottom: 0.5rem; }
  .print-notes-text { font-size: 8.5pt; color: #333; white-space: pre-line; margin: 0.2rem 0 0; }

  .print-validity { font-size: 8pt; color: #444; border-top: 0.5pt solid #999; padding-top: 0.4rem; margin-bottom: 0.3rem; font-style: italic; white-space: pre-line; }
  .print-footer { display: none; }
}
</style>
