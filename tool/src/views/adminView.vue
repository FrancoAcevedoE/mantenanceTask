<template>
  <div class="page-container">
    <div class="admin-form">
      <h2 class="title">Panel de Admin</h2>

      <label for="name">nombre</label>
      <input type="text" id="name" v-model="user.name" />

      <label for="dni">documento</label>
      <input type="number" id="dni" v-model="user.dni" />

      <label for="password">contraseña</label>
      <input type="password" id="password" v-model="user.password" />

      <div class="actions">
        <button @click="createUser">Crear usuario</button>
        <button @click="deleteUser">Eliminar usuario</button>
      </div>
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
.page-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.admin-form {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}

.admin-form:hover {
  transition: 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}

.title {
  text-align: center;
  margin: 0 0 1rem;
  color: #333;
  font-size: 2rem;
  letter-spacing: 0.04rem;
}

.admin-form label {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  color: #4b4b4b;
  font-size: 0.95rem;
  text-align: center;
}

.admin-form input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 2rem;
  border: 1px solid #ccc;
  text-align: center;
}

.admin-form input:hover,
.admin-form input:focus {
  outline: none;
  background: #f0f0f0;
  transition: 0.2s;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.actions {
  width: 100%;
  display: grid;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

button {
  border-radius: 2rem;
  padding: 10px;
  background: #a6a6a6;
  color: #fff;
  border: none;
  cursor: pointer;
}

button:hover {
  background: #8f8f8f;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-form {
    padding: 1rem;
    max-width: 90%;
  }

  .title {
    font-size: 1.6rem;
  }
}
</style>
