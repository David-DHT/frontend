// Esperamos a que el HTML cargue completamente antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Llamamos a la API para traer las categorías al cargar la página
    

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
// Función para obtener las categorías desde Node.js
async function obtenerProveedores() {
    const tbody = document.getElementById('tablaResultados');
    
    try {
        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/proveedor');
        
        if (!respuesta.ok) throw new Error('Error en la respuesta del servidor');

        const proveedores= await respuesta.json();
        tbody.innerHTML = ''; // Limpiamos el texto de "Cargando..."

        if (proveedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">No hay datos.</td></tr>';
            return;
        }

        // Pintamos las filas de proveedores dinámicamente
    proveedores.forEach(proveedor => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td>
            <div class="fw-bold nombre-cat">${proveedor.nombreContacto}</div>
        </td>
        <td>${proveedor.telefono}</td>
        <td>${proveedor.correoElectronico}</td>
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

    // Seleccionamos el id que pusiste en tu HTML: tablaResultados
    const tbody = document.getElementById('tablaResultados');
    tbody.appendChild(tr);
});

    } catch (error) {
        console.error('Error al obtener los proveedores:', error);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-danger">Error al cargar la información. Revisa que tu servidor Node esté corriendo.</td></tr>';
    }
}

// Función para eliminar (por ahora solo imprime en consola, luego la conectaremos al DELETE)
function eliminarProveedor(id) {
    if(confirm('¿Deseas eliminar el proveedor?')) {
        console.log('Se enviará petición DELETE para el ID:', id);
        // Aquí conectaremos con el endpoint DELETE de tu backend
    }
}