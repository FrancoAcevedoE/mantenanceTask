<template>

    <div class="box">
        <h2>Nuevo trabajo</h2>
        <select v-model="sector">
            <option v-for="s in sectors" :key="s._id">
                {{ s.name }}
            </option>
        </select>

        <select v-model="machine">
            <option v-for="m in machines" :key="m._id">
                {{ m.name }}
            </option>
        </select>

        <textarea v-model="description" placeholder="Trabajo realizado" />
        <select v-model="type">
            <option value="preventivo">Preventivo</option>
            <option value="arreglo">Arreglo</option>
            <option value="mejora">Mejora</option>
        </select>

        <input type="number" v-model="hoursWorked" placeholder="Horas trabajadas" />
        <label>
            la maquina sigue funcionando?
            <input type="checkbox" v-model="machineWorking">
        </label>

        <select v-model="status">
            <option value="terminado">Terminado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parada">Maquina parada</option>

        </select>
        <textarea v-if="status == 'pendiente'" v-model="pendingReason" placeholder="Motivo" />
        <button @click="save">Guardar</button>
        <button @click="cancel">Cancelar</button>
    </div>
</template>