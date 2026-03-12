<template>
  <div class="login-container">

    <div class="login-box">

      <h2>Sistema de Mantenimiento</h2>

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

// import api from "../services/api"

export default {

  data(){
    return{

      dni:"",
      password:"",
      error:null

    }
  },

  methods:{

    async login(){

      try{

        const response = await api.post("/login",{

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

  }

}
</script>

<style>

.login-container{

  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  background:#f0f2f5;

}

.login-box{

  background:white;
  padding:40px;
  border-radius:10px;
  width:300px;
  box-shadow:0 5px 15px rgba(0,0,0,0.1);

}

input{

  width:100%;
  padding:10px;
  margin:10px 0;

}

button{

  width:100%;
  padding:10px;
  background:#2c7be5;
  color:white;
  border:none;
  cursor:pointer;

}

.error{

  color:red;
  margin-top:10px;

}

</style>