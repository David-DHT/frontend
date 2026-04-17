document.addEventListener("DOMContentLoaded", () => {
    cargarPoliticas();
});

async function cargarPoliticas() {
    try {

        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/config/configuracion');
        
        if (!respuesta.ok) {
            throw new Error('Error al obtener los datos del servidor');
        }

        const datos = await respuesta.json();

        document.getElementById('contenedor-politicas').textContent = datos.politicas;

    } catch (error) {
        console.error("Hubo un problema con la petición Fetch:", error);
        document.getElementById('contenedor-politicas').textContent = "No se pudieron cargar las políticas en este momento.";
    }
}