<template>
  <div class="page-container">
    <div class="admin-form">
      <label for="name">nombre</label>
      <input type="text" id="name" v-model="user.name" />

      <label for="dni">documento</label>
      <input type="number" id="dni" v-model="user.dni" />

      <label for="password">contraseña</label>
      <input type="password" id="password" v-model="user.password" />

      <button @click="createUser">Crear usuario</button>
      <button @click="deleteUser">Eliminar usuario</button>
    </div>
  </div>
</template>

<script>
import backgroundImage from '@/assets/fondogeneral.png'

export default {
  data() {
    return {
      user: {
        name: "",
        dni: "",
        password: ""
      },
      backgroundImage: backgroundImage
    }
  },
  methods: {
    createUser() {
      console.log('nuevo usuario', this.user)
      // call backend or emit event here
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
.admin-form {
  max-width: 400px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #d1d1d1;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
}

.admin-form label {
  margin-top: 0.5rem;
}
.admin-form input {
  padding: 0.5rem;
  margin-top: 0.25rem;
}
button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-form {
    margin: 1rem auto;
    padding: 1rem;
    max-width: none;
  }
}
</style>
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    
}
