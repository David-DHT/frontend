document.addEventListener("DOMContentLoaded", () => {
    cargarMisionYVision();
});

async function cargarMisionYVision() {
    try {
        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/config/configuracion');
        
        if (!respuesta.ok) {
            throw new Error('Error al obtener los datos del servidor');
        }
         const datos = await respuesta.json();

        document.getElementById('texto-mision').textContent = datos.mision;
        document.getElementById('texto-vision').textContent = datos.vision;

    } catch (error) {
        console.error("Hubo un problema con la petición Fetch:", error);
        
        document.getElementById('texto-mision').textContent = "No se pudo cargar la misión en este momento.";
        document.getElementById('texto-vision').textContent = "No se pudo cargar la visión en este momento.";
    }
}