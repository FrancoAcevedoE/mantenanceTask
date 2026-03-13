<template>
    <div class="page-container">
        <div class="box">
            <h2>Nuevo trabajo</h2>

            <select v-model="sector">
                <option disabled value="">Seleccionar sector</option>
                <option v-for="s in sectors" :key="s._id" :value="s.name">
                    {{ s.name }}
                </option>
            </select>

            <select v-model="machine">
                <option disabled value="">Seleccionar máquina</option>
                <option v-for="m in machines" :key="m._id" :value="m.name">
                    {{ m.name }}
                </option>
            </select>

            <select v-model="machineParts">
                <option disabled value="">Seleccionar piezas</option>
                <option v-for="p in machinePartsList" :key="p._id" :value="p.name">
                    {{ p.name }}
                </option>
            </select>

            <select v-model="type">
                <option value="preventivo">Preventivo</option>
                <option value="arreglo">Arreglo</option>
                <option value="mejora">Mejora</option>
                <option value="Revision">Revision y disponibilidad</option>
            </select>

            <textarea v-model="description" placeholder="Trabajo realizado"></textarea>
            <textarea v-model="partsUsed" placeholder="Repuestos utilizados"></textarea>

            <input type="number" v-model="hoursWorked" placeholder="Horas trabajadas" />
            <input type="number" v-model="hoursDowntime" placeholder="Horas de maquina parada" />

            <label class="checkbox-label">
                la maquina sigue funcionando?
                <input type="checkbox" v-model="machineWorking" />
            </label>

            <div class="status-group">
                <label>
                    <input type="radio" value="terminado" v-model="status" /> Si
                </label>
                <label>
                    <input type="radio" value="pendiente" v-model="status" /> No
                </label>
            </div>

            <div class="button-group">
                <button @click="save">Guardar</button>
                <button @click="cancel">Cancelar</button>
            </div>
        </div>
    </div>
</template>

<script>
import backgroundImage from '@/assets/fondogeneral.jpg'

export default {
  data() {
    return {
      sector: "",
      machine: "",
      machineParts: "",
      type: "preventivo",
      description: "",
      partsUsed: "",
      hoursWorked: 0,
      hoursDowntime: 0,
      machineWorking: false,
      status: "pendiente",

      sectors: [],
      machines: [],
      machinePartsList: [],
      backgroundImage: backgroundImage
    }
  },
  methods: {
    save() {
      // Placeholder: implement save logic or emit event
      console.log('guardando', this.$data)
    },
    cancel() {
      // Reset form or navigate away
      this.$router.back()
    }
  },
  mounted() {
    document.body.style.backgroundImage = `url(${this.backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  },
  beforeUnmount() {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  }
}
</script>

<style scoped>
/* simple minimalist palette for form */
.box {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: #fff;
    border: 1px solid #d1d1d1;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
    color: #000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

h2 {
    margin-top: 0;
    font-weight: 600;
    color: #111;
}

select,
input[type="number"],
textarea {
    display: block;
    width: 100%;
    margin: 0.5rem 0;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fafafa;
    color: #000;
    font-size: 1rem;
}

textarea {
    resize: vertical;
}

label {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.5rem 0;
    font-size: 0.95rem;
}

.checkbox-label {
    justify-content: flex-start;
    max-width: 300px;
    margin: 0.5rem auto;
}

label input[type="checkbox"] {
    margin-left: 0.5rem;
}

.status-group {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 0.5rem 0;
}

.status-group label {
    display: flex;
    align-items: center;
    margin: 0;
}

.status-group label input[type="radio"] {
    margin-right: 0.5rem;
}

button {
    margin-top: 1rem;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    background: #000;
    color: #fff;
    cursor: pointer;
    font-weight: 500;
}

.button-group {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
}

button+button {
    margin-left: 0.5rem;
    margin-top: 1rem;
    background: #444;
}

/* Responsive */
@media (max-width: 768px) {
  .box {
    margin: 1rem auto;
    padding: 1rem;
    max-width: none;
  }

  .status-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  button {
    width: 100%;
  }
}
</style>
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    
}
