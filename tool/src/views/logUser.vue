<template>
  <div class="login-container">

    <div class="login-box">

      <h2 class="title">TOOLS<i class="bi bi-wrench-adjustable-circle-fill"></i></h2>

      <input
        v-model="dni"
        type="text"
        placeholder="DNI"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Contraseña"
      />

      <button @click="login">
        Ingresar
      </button>

      <p v-if="error" class="error">
        {{ error }}
      </p>

    </div>

  </div>
</template>

<script>
import axios from "axios"
import backgroundImage from '@/assets/fondo.jpg'

export default {

  data(){
    return{
      dni:"",
      password:"",
      error:null,
      backgroundImage: backgroundImage
    }
  },

  methods:{
    async login(){
      try{
        const response = await axios.post("/login",{
          dni:this.dni,
          password:this.password
        })

        const token = response.data.token
        localStorage.setItem("token",token)
        this.$router.push("/dashboard")

      }
      catch(err){
        this.error = "Usuario o contraseña incorrectos"

      }

    }

  },

  mounted() {
    this.backgroundImage = backgroundImage

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

<style>
.nav {
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
    padding: 1rem;
}
.login-container{

  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  background-image: url('/assets/login-background.jpg');
  background-position: center;
}

.login-box{
  background:white;
  padding:40px;
  border-radius:10px;
  width:300px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}
.login-box:hover {
  transition: 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}
.title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 2.2rem;
  letter-spacing: 0.1rem;
}
.title i {
  font-size: 2rem;
  margin-left: 0.5rem;

}
input{
  width:100%;
  padding:10px;
  margin:10px 0;
  border-radius: 2rem;
  border: 1px solid #ccc;
}
input:hover {
  outline: none;
  background:#f0f0f0;
  transition: 0.2s;
  box-shadow:0 1px 5px rgba(189, 189, 189, 0.31);
}

button{
  border-radius: 2rem;
  padding:10px;
  background:#a6a6a6;
  color:white;
  border:none;
  cursor:pointer;
  display: block;
  margin: 0 auto;
}

.error{

  color:red;
  margin-top:10px;

}

</style>