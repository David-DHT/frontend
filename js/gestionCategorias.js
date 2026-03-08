// Esperamos a que el HTML cargue completamente antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Llamamos a la API para traer las categorías al cargar la página
    obtenerCategorias();

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
async function obtenerCategorias() {
    const tbody = document.getElementById('tablaResultados');
    
    try {
        const respuesta = await fetch('http://localhost:3000/api/categorias');
        
        if (!respuesta.ok) throw new Error('Error en la respuesta del servidor');

        const categorias = await respuesta.json();
        tbody.innerHTML = ''; // Limpiamos el texto de "Cargando..."

        if (categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">No hay datos.</td></tr>';
            return;
        }

        // Pintamos las filas dinámicamente
        categorias.forEach(categoria => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>
                    <div class="fw-bold nombre-cat">${categoria.nombre}</div>
                </td>
                <td>${categoria.descripcion}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <a href="agregarCategoria.html?id=${categoria.idCategoria}" class="btn-icon btn-edit" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </a>
                        <button onclick="eliminarCategoria(${categoria.idCategoria})" class="btn-icon btn-delete" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al obtener las categorías:', error);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-danger">Error al cargar la información. Revisa que tu servidor Node esté corriendo.</td></tr>';
    }
}

// Función para eliminar (por ahora solo imprime en consola, luego la conectaremos al DELETE)
function eliminarCategoria(id) {
    if(confirm('¿Deseas eliminar esta categoría?')) {
        console.log('Se enviará petición DELETE para el ID:', id);
        // Aquí conectaremos con el endpoint DELETE de tu backend
    }
}