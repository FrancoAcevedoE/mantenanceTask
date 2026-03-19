```html
<template>

<div class="page-container">
<div class="container">

<h1>Dashboard de mantenimiento</h1>

<div class="cards">

<div class="card">

<h3>Total mantenimientos</h3>

<p>{{ stats.totalMaintenances }}</p>

</div>

<div class="card">

<h3>Máquinas registradas</h3>

<p>{{ stats.machinesRegistered }}</p>

</div>

<div class="card">

<h3>Mantenimientos pendientes</h3>

<p>{{ stats.pending }}</p>

</div>

<div class="card">

<h3>Máquinas detenidas</h3>

<p>{{ stats.stopped }}</p>

</div>

</div>

</div>

</div>

</template>

<script>

// import apiClient from "../services/apiClient"

export default{

data(){

return{

stats:{}

}

},

async mounted(){

// const res = await apiClient.get("/maintenance/dashboard")

this.stats = res.data

}

}

</script>

<style>

.page-container{
background-image: url('@/assets/fondogeneral.png');
background-size: cover;
background-position: center;
background-repeat: no-repeat;
background-attachment: fixed;
min-height: 100vh;
}

.container{
width:80%;
margin:auto;
}

.cards{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:20px;
}

.card{
background:#f4f4f4;
padding:20px;
text-align:center;
border-radius:8px;
}

.card p{
font-size:28px;
font-weight:bold;
}
</style>
```
