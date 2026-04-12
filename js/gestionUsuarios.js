// URL base de tu API (ajusta el puerto si es necesario)
const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/usuarios';

// Referencias al DOM
const tablaResultados = document.getElementById('tablaResultados');
const searchInput = document.getElementById('searchInput');

// 1. Función para obtener y mostrar las categorías
const obtenerUsuarios = async () => {
    try {
        const response = await fetch(API_URL);
        const usuarios = await response.json();
        
        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error('Error:', error);
        tablaResultados.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error al cargar datos</td></tr>`;
    }
};

// 2. Función para renderizar las filas en la tabla
const mostrarUsuarios = (usuarios) => {
    tablaResultados.innerHTML = ''; // Limpiar tabla

    if (usuarios.length === 0) {
        tablaResultados.innerHTML = `<tr><td colspan="5" class="text-center">No se encontraron categorías</td></tr>`;
        return;
    }

    usuarios.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.nombre} ${user.aPaterno} ${user.aMaterno}</td>
            <td>${user.correo}</td>
            <td>${user.telefono}</td>
            <td>${user.perfil}</td>
            <td class="text-center">
                <div class="action-buttons">
                    <a href="" class="btn-icon btn-edit" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </a>
                    <button class="btn-icon btn-delete" onclick="eliminarCategoria(${user.idUsuario})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tablaResultados.appendChild(tr);
    });
};

// 3. Función para eliminar categoría (Borrado lógico)
window.eliminarUsuario = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Usuario eliminado con éxito');
                obtenerCategorias(); // Recargar la lista
            } else {
                alert('Error al eliminar al usuario');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
};

// 4. Lógica del Buscador (Filtro en tiempo real)
searchInput.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filas = tablaResultados.getElementsByTagName('tr');

    Array.from(filas).forEach(fila => {
        const nombre = fila.cells[0]?.textContent.toLowerCase() || '';
        const descripcion = fila.cells[1]?.textContent.toLowerCase() || '';
        
        if (nombre.includes(texto) || descripcion.includes(texto)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
});

// Inicializar la carga de datos al abrir la página
document.addEventListener('DOMContentLoaded', obtenerUsuarios);