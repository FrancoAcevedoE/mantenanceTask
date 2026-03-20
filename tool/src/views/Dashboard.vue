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
display: flex;
justify-content: center;
align-items: center;
padding: 1rem;
}

.container{
width: 100%;
max-width: 980px;
margin: 0 auto;
background: rgba(255, 255, 255, 0.94);
padding: 2rem;
border-radius: 12px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}

h1 {
text-align: center;
margin: 0 0 1.5rem;
color: #333;
font-size: 2rem;
letter-spacing: 0.04rem;
}

.cards{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
gap:16px;
}

.card{
background:#fff;
padding:20px 16px;
text-align:center;
border-radius:10px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
transition: 0.3s;
}

.card:hover {
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.45);
transform: translateY(-2px);
}

.card h3 {
margin: 0 0 0.75rem;
color: #4b4b4b;
}

.card p{
font-size:28px;
font-weight:bold;
margin: 0;
color: #333;
}

@media (max-width: 768px) {
.container {
padding: 1rem;
}

h1 {
font-size: 1.6rem;
}
}
</style>
```
