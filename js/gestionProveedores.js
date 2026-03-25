// Esperamos a que el HTML cargue completamente antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Llamamos a la API para traer las categorías al cargar la página
    obtenerProveedores();

    // 2. Lógica del buscador
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            let filter = this.value.toLowerCase();
            let rows = document.querySelectorAll('#tablaResultados tr');

            rows.forEach(row => {
                let text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }
});
// Función para obtener los proveedores desde Node.js
async function obtenerProveedores() {
    const tbody = document.getElementById('tablaResultados');
    
    try {
        // CORRECCIÓN: 'proveedores' en plural como está en tu backend
        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/proveedores');
        
        if (!respuesta.ok) throw new Error('Error en la respuesta del servidor');

        const proveedores = await respuesta.json();
        tbody.innerHTML = ''; 

        if (proveedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">No hay proveedores registrados.</td></tr>';
            return;
        }

        proveedores.forEach(proveedor => {
            const tr = document.createElement('tr');
            // Unimos nombre y apellidos para la columna "Contacto"
            const nombreCompleto = `${proveedor.nombre} ${proveedor.apellidoPaterno || ''}`;

            tr.innerHTML = `
                <td>
                    <div class="fw-bold nombre-cat">${nombreCompleto}</div>
                </td>
                <td>${proveedor.telefono}</td>
                <td>${proveedor.correo}</td> 
                <td class="text-center">
                    <div class="action-buttons">
                        <a href="agregarProveedores.html?id=${proveedor.idProveedor}" class="btn-icon btn-edit" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </a>
                        <button onclick="eliminarProveedor(${proveedor.idProveedor})" class="btn-icon btn-delete" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-danger">Error al cargar la información. Revisa la consola o el servidor.</td></tr>';
    }
}

// Función para eliminar (por ahora solo imprime en consola, luego la conectaremos al DELETE)
function eliminarProveedor(id) {
    if(confirm('¿Deseas eliminar el proveedor?')) {
        console.log('Se enviará petición DELETE para el ID:', id);
        // Aquí conectaremos con el endpoint DELETE de tu backend
    }
}
