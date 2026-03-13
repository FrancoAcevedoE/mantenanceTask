<template>
    <div class="page-container">
        <div class="box">
            <h2>Nueva máquina</h2>

            <input type="text" v-model="sector" placeholder="Sector de la fábrica" />

            <input type="text" v-model="machine" placeholder="Máquina" />

            <textarea v-model="machineParts" placeholder="Partes de la máquina"></textarea>

            <input type="number" v-model="horometro" placeholder="Horómetro" />

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
      horometro: 0,
      backgroundImage: backgroundImage
    }
  },
  methods: {
    save() {
      // Placeholder: implement save logic or emit event
      console.log('guardando nueva máquina', this.$data)
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

input[type="text"],
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
</style>

<style>
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
