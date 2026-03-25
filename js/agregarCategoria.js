document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Obtener el ID de la URL (si existe)
    // Ejemplo de URL: agregarCategoria.html?id=5
    const urlParams = new URLSearchParams(window.location.search);
    const idCategoria = urlParams.get('id');

    const form = document.getElementById('formCategoria');
    const inputId = document.getElementById('id_categoria');
    const inputNombre = document.getElementById('nombre_categoria');
    const inputDescripcion = document.getElementById('descripcion');
    const pageTitle = document.getElementById('pageTitle');
    const mainTitle = document.getElementById('mainTitle');
    const btnCancelar = document.getElementById('btnCancelar');

    // 2. Si hay ID, estamos en modo EDITAR. Buscamos los datos en la API.
    if (idCategoria) {
        pageTitle.textContent = "Editar Categoría - UNICAFE";
        mainTitle.textContent = "Editar Categoría";
        inputId.value = idCategoria;
        
        cargarDatosCategoria(idCategoria);
    }

    // 3. Manejar el evento "Cancelar"
    btnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
            window.location.href = "gestionCategorias.html"; // Redirige a tu lista html
        }
    });

    // 4. Manejar el evento "Submit" (Guardar)
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // NUEVO: Recuperamos el token de la bóveda
        const token = localStorage.getItem('token');

        // NUEVO: Si no hay token, lo mandamos al login porque no tiene permiso
        if (!token) {
            alert('Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
            return;
        }

        // Preparamos los datos a enviar
        const datos = {
            nombre: inputNombre.value,
            descripcion: inputDescripcion.value
        };

        try {
            let url = 'https://backend-liard-alpha-37.vercel.app/api/categorias';
            let metodo = 'POST'; // Por defecto, asumimos que es crear

            // Si hay un ID en el input oculto, cambiamos a modo ACTUALIZAR (PUT)
            if (inputId.value) {
                url = `https://backend-liard-alpha-37.vercel.app/api/categorias/${inputId.value}`;
                metodo = 'PUT';
            }

            // Hacemos la petición a la API con el Token
            const respuesta = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // NUEVO: Enviamos la llave al backend
                },
                body: JSON.stringify(datos)
            });

            if (!respuesta.ok) {
                throw new Error('Error al guardar la categoría');
            }

            // Si todo salió bien
            alert(inputId.value ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
            window.location.href = 'gestionCategorias.html'; // Redirigimos a la tabla

        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error al guardar. Verifica la consola o tu servidor.');
        }
    });

    // Función para obtener los datos si estamos editando (Esta es GET, no necesita token según tu backend)
    async function cargarDatosCategoria(id) {
        try {
            const respuesta = await fetch(`https://backend-liard-alpha-37.vercel.app/api/categorias/${id}`);
            if (!respuesta.ok) throw new Error('No se pudo cargar la categoría');
            
            const categoria = await respuesta.json();
            
            // Llenamos los inputs con la información traída de la API
            inputNombre.value = categoria.nombre;
            inputDescripcion.value = categoria.descripcion;

        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert('No se pudo cargar la información de la categoría.');
            window.location.href = 'gestionCategorias.html'; // Lo regresamos si falla
        }
    }
});

// Función de validación mantenida global para el oninput del HTML
function soloLetras(e) {
    e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "");
}