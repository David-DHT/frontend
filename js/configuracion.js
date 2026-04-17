document.addEventListener("DOMContentLoaded", () => {
    cargarDatosConfiguracion();
});

async function cargarDatosConfiguracion() {
    try {
        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/config/configuracion');
        
        if (!respuesta.ok) {
            throw new Error('No se pudo conectar con el servidor');
        }

        const datos = await respuesta.json();

        // Rellenamos los inputs de texto
        document.getElementById('nombreSitio').value = datos.nombreSitio || "";
        document.getElementById('eslogan').value = datos.eslogan || "";
        document.getElementById('mision').value = datos.mision || "";
        document.getElementById('vision').value = datos.vision || "";
        document.getElementById('politicas').value = datos.politicas || "";

        // Si tienes una imagen/logo guardado, lo mostramos en la vista previa
        if (datos.logo) {
            const imagePreview = document.getElementById("image-preview-box");
            const defaultContent = document.getElementById("default-icon-text");
            const imagenAnterior = document.getElementById("imagen_anterior");

            if (defaultContent) defaultContent.style.display = "none";
            
            // Suponiendo que tu backend devuelve la ruta de la imagen
            imagePreview.src = datos.logo; 
            imagePreview.style.display = "block";
            
            // Guardamos el nombre de la imagen actual en el input oculto
            if (imagenAnterior) imagenAnterior.value = datos.logo;
        }

    } catch (error) {
        console.error("Error al cargar configuración:", error);
        mostrarAlerta("Error al cargar los datos actuales", "error");
    }
}

// Función auxiliar para mostrar mensajes en tu div de alertas
function mostrarAlerta(mensaje, tipo) {
    const alertBox = document.getElementById('alert-message');
    alertBox.textContent = mensaje;
    alertBox.style.display = 'block';
    alertBox.className = tipo === 'success' ? 'alert alert-success' : 'alert alert-error';
    
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Obtenemos el formulario y metemos todo en un FormData (ideal para archivos)
    const form = e.target;
    const formData = new FormData(form);

    const btnSubmit = form.querySelector('.btn-save');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Guardando...';
    btnSubmit.disabled = true;
    try {
        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/config/actualizar', {
            method: 'PUT', // o 'POST' si tu ruta es POST
            body: formData // No necesitas Headers de Content-Type, FormData lo hace solo
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            mostrarAlerta('¡Configuración guardada exitosamente!', 'success');
            
            // Actualizamos el input oculto por si cambian la imagen otra vez sin recargar
            if (resultado.data && resultado.data.logo) {
                document.getElementById('imagen_anterior').value = resultado.data.logo;
            }
        } else {
            throw new Error(resultado.message || 'Error al guardar');
        }

    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarAlerta(error.message, 'error');
    }
});