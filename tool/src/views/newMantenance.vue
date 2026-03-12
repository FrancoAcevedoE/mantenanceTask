<template>
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

        <textarea v-model="description" placeholder="Trabajo realizado" />
<textarea v-model="description" placeholder="Repuestos utilizados" />
        <input type="number" v-model="hoursWorked" placeholder="Horas trabajadas" />
        <input type="number" v-model="hoursWorked" placeholder="Horas de maquina parada" />
        <label>
            la maquina sigue funcionando?
            <input type="checkbox" v-model="machineWorking">
        </label>

        <label> Trabajo terminado?
                <input type="checkbox" v-model="status" true-value="terminado" false-value="pendiente">SI
                <input type="checkbox" v-model="status" true-value="pendiente" false-value="terminado">NO

         <input type="text" v-model="status" true-value="pendiente" false-value="terminado">
            </label>

        <button @click="save">Guardar</button>
        <button @click="cancel">Cancelar</button>
    </div>
</template>

<style scoped>
/* simple minimalist palette for form */
.box {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: #fff;
    border: 1px solid #d1d1d1;
    border-radius: 8px;
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

label {
    display: flex;
    align-items: center;
    margin: 0.5rem 0;
    font-size: 0.95rem;
}

label input[type="checkbox"] {
    margin-left: 0.5rem;
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

button+button {
    margin-left: 0.5rem;
    background: #444;
}
</style>