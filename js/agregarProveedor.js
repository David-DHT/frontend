document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Obtener el ID del proveedor desde la URL (para saber si es edición)
    const urlParams = new URLSearchParams(window.location.search);
    const idProveedor = urlParams.get('id');

    // Referencias exactas a tu HTML
    const form = document.getElementById('formProveedor'); 
    const inputId = document.getElementById('id_proveedor'); 
    const inputNombre = document.getElementById('nombre_Proveedor'); 
    const inputApellidoP = document.getElementById('ApellidoP_Proveedor');
    const inputApellidoM = document.getElementById('ApellidoM_Proveedor');
    const inputTelefono = document.getElementById('telefono_Proveedor');
    const inputCorreo = document.getElementById('correo_Proveedor');
    
    const pageTitle = document.getElementById('pageTitle');
    const mainTitle = document.getElementById('mainTitle');

    // 2. Si hay un ID presente, configuramos el modo EDITAR
    if (idProveedor) {
        pageTitle.textContent = "Editar Proveedor - UNICAFE";
        mainTitle.textContent = "Editar Proveedor";
        inputId.value = idProveedor;
        
        cargarDatosProveedor(idProveedor);
    }

    // 3. Manejo del envío del formulario (Guardar o Actualizar)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // NUEVO: Recuperamos el token de la bóveda
        const token = localStorage.getItem('token');

        // NUEVO: Si no hay token, lo mandamos al login porque no tiene permiso
        if (!token) {
            alert('Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión de nuevo.');
            window.location.href = 'login.html';
            return;
        }

        // Creamos el objeto con la estructura que espera tu backend
        const datos = {
            nombre: inputNombre.value,
            apellidoPaterno: inputApellidoP.value,
            apellidoMaterno: inputApellidoM.value,
            telefono: inputTelefono.value,
            correo: inputCorreo.value
        };

        try {
            let url = 'https://backend-liard-alpha-37.vercel.app/api/proveedor';
            let metodo = 'POST';

            // Si el campo oculto tiene un ID, cambiamos a modo actualización (PUT)
            if (inputId.value) {
                url = `${url}/${inputId.value}`;
                metodo = 'PUT';
            }

            const respuesta = await fetch(url, {
                method: metodo,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // NUEVO: Enviamos la llave al backend
                },
                body: JSON.stringify(datos)
            });

            if (!respuesta.ok) throw new Error('Error al procesar la solicitud');

            alert(inputId.value ? 'Proveedor actualizado con éxito' : 'Proveedor guardado con éxito');
            window.location.href = 'gestionProveedores.html';

        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un fallo al guardar los datos. Revisa la conexión o tus permisos.');
        }
    });

    // 4. Función para traer los datos del proveedor si se va a editar
    async function cargarDatosProveedor(id) {
        try {
            const respuesta = await fetch(`https://backend-liard-alpha-37.vercel.app/api/proveedor/${id}`);
            if (!respuesta.ok) throw new Error('Proveedor no encontrado');
            
            const p = await respuesta.json();
            
            // Llenamos los campos (Asegúrate que los nombres 'p.nombre', etc., coincidan con tu API)
            inputNombre.value = p.nombre || '';
            inputApellidoP.value = p.apellidoPaterno || '';
            inputApellidoM.value = p.apellidoMaterno || '';
            inputTelefono.value = p.telefono || '';
            inputCorreo.value = p.correo || '';

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudieron cargar los datos del proveedor.');
            window.location.href = 'gestionProveedores.html';
        }
    }
});

// --- Funciones de Validación Globales ---
function soloLetras(e) {
    // Permite letras, espacios y acentos
    e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "");
}

function soloNumeros(e) {
    // Permite solo dígitos del 0 al 9
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
}