document.addEventListener('DOMContentLoaded', () => {
    obtenerUsuarios();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            let filter = this.value.toLowerCase();
            let rows = document.querySelectorAll('#tablaResultados tr');

            rows.forEach(row => {
                let text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }

    const formEditarUsuario = document.getElementById('formEditarUsuario');
    if (formEditarUsuario) {
        formEditarUsuario.addEventListener('submit', actualizarUsuario);
    }
});

// Cambia esta URL por la de tu backend en Vercel
const API_URL = 'https://backend-unicafe.vercel.app/api/usuarios';

async function obtenerUsuarios() {
    const tbody = document.getElementById('tablaResultados');

    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const usuarios = await respuesta.json();
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">No hay usuarios registrados.</td></tr>';
            return;
        }

        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');

            const nombreCompleto = `${usuario.nombre || ''} ${usuario.aPaterno || ''} ${usuario.aMaterno || ''}`.trim();

            tr.innerHTML = `
                <td>
                    <div class="nombre-usuario">${nombreCompleto}</div>
                </td>
                <td>${usuario.correo || ''}</td>
                <td>${usuario.telefono || ''}</td>
                <td>${usuario.perfil || 'Sin perfil'}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button onclick="abrirModalEditar(${usuario.idUsuario})" class="btn-icon btn-edit" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button onclick="eliminarUsuario(${usuario.idUsuario})" class="btn-icon btn-delete" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-danger">Error al cargar la información. Revisa que tu backend esté corriendo o publicado correctamente.</td></tr>';
    }
}

async function abrirModalEditar(id) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`);

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener la información del usuario');
        }

        const usuario = await respuesta.json();

        document.getElementById('editIdUsuario').value = usuario.idUsuario || '';
        document.getElementById('editNombre').value = usuario.nombre || '';
        document.getElementById('editAPaterno').value = usuario.aPaterno || '';
        document.getElementById('editAMaterno').value = usuario.aMaterno || '';
        document.getElementById('editCorreo').value = usuario.correo || '';
        document.getElementById('editTelefono').value = usuario.telefono || '';
        document.getElementById('editPassword').value = usuario.password || '';
        document.getElementById('editIdPerfil').value = usuario.idPerfil || '';

        document.getElementById('mensajeModal').innerHTML = '';

        const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
        modal.show();

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        alert('No se pudo cargar el usuario para editar.');
    }
}

async function actualizarUsuario(e) {
    e.preventDefault();

    const id = document.getElementById('editIdUsuario').value;
    const mensajeModal = document.getElementById('mensajeModal');

    const datosUsuario = {
        nombre: document.getElementById('editNombre').value.trim(),
        aPaterno: document.getElementById('editAPaterno').value.trim(),
        aMaterno: document.getElementById('editAMaterno').value.trim(),
        correo: document.getElementById('editCorreo').value.trim(),
        telefono: document.getElementById('editTelefono').value.trim(),
        password: document.getElementById('editPassword').value.trim(),
        idPerfil: parseInt(document.getElementById('editIdPerfil').value)
    };

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosUsuario)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo actualizar el usuario');
        }

        mensajeModal.innerHTML = `
            <div class="alert alert-success">
                ${resultado.message || 'Usuario actualizado con éxito'}
            </div>
        `;

        obtenerUsuarios();

        setTimeout(() => {
            const modalElement = document.getElementById('modalEditarUsuario');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 1000);

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        mensajeModal.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

async function eliminarUsuario(id) {
    const confirmar = confirm('¿Deseas eliminar este usuario?');

    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo eliminar el usuario');
        }

        alert(resultado.message || 'Usuario eliminado correctamente');
        obtenerUsuarios();

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert(error.message);
    }
}