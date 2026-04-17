const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/usuarios';

const tablaResultados = document.getElementById('tablaResultados');
const searchInput = document.getElementById('searchInput');
const formEditarUsuario = document.getElementById('formEditarUsuario');

let modalEditarUsuario = null;

document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById('modalEditarUsuario');
    if (modalElement) {
        modalEditarUsuario = new bootstrap.Modal(modalElement);
    }

    configurarValidaciones();
    obtenerUsuarios();

    if (searchInput) {
        searchInput.addEventListener('input', filtrarUsuarios);
    }

    if (formEditarUsuario) {
        formEditarUsuario.addEventListener('submit', actualizarUsuario);
    }
});

function obtenerToken() {
    return localStorage.getItem('token');
}

function obtenerHeaders(conJson = true) {
    const headers = {};
    const token = obtenerToken();

    if (conJson) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

function mostrarMensajeModal(tipo, mensaje) {
    const contenedor = document.getElementById('mensajeModalUsuario');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="alert alert-${tipo} mb-0" role="alert">
            ${mensaje}
        </div>
    `;
}

function limpiarMensajeModal() {
    const contenedor = document.getElementById('mensajeModalUsuario');
    if (contenedor) {
        contenedor.innerHTML = '';
    }
}

function normalizarEstado(estado) {
    const valor = String(estado || '').toLowerCase().trim();
    return valor === 'inactivo' ? 'inactivo' : 'activo';
}

function obtenerIdPerfilDesdeTexto(perfil) {
    const valor = String(perfil || '').toLowerCase().trim();

    if (valor.includes('docente')) return 2;
    if (valor.includes('alumno')) return 1;

    return '';
}

function soloLetras(valor) {
    return valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
}

function soloNumeros(valor) {
    return valor.replace(/\D/g, '');
}

function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function configurarValidaciones() {
    const nombre = document.getElementById('editNombre');
    const aPaterno = document.getElementById('editAPaterno');
    const aMaterno = document.getElementById('editAMaterno');
    const telefono = document.getElementById('editTelefono');

    if (nombre) {
        nombre.addEventListener('input', e => {
            e.target.value = soloLetras(e.target.value);
        });
    }

    if (aPaterno) {
        aPaterno.addEventListener('input', e => {
            e.target.value = soloLetras(e.target.value);
        });
    }

    if (aMaterno) {
        aMaterno.addEventListener('input', e => {
            e.target.value = soloLetras(e.target.value);
        });
    }

    if (telefono) {
        telefono.addEventListener('input', e => {
            e.target.value = soloNumeros(e.target.value).slice(0, 10);
        });
    }
}

async function obtenerUsuarios() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: obtenerHeaders(false)
        });

        if (!response.ok) {
            throw new Error('No se pudieron obtener los usuarios');
        }

        const usuarios = await response.json();
        mostrarUsuarios(Array.isArray(usuarios) ? usuarios : []);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        tablaResultados.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger p-4">
                    Error al cargar los usuarios.
                </td>
            </tr>
        `;
    }
}

function mostrarUsuarios(usuarios) {
    tablaResultados.innerHTML = '';

    if (!usuarios || usuarios.length === 0) {
        tablaResultados.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4">
                    No se encontraron usuarios.
                </td>
            </tr>
        `;
        return;
    }

    usuarios.forEach(user => {
        const tr = document.createElement('tr');

        const nombreCompleto = `${user.nombre || ''} ${user.aPaterno || ''} ${user.aMaterno || ''}`.trim();
        const estado = normalizarEstado(user.estado);
        const checked = estado === 'activo' ? 'checked' : '';

        tr.innerHTML = `
            <td>${nombreCompleto}</td>
            <td>${user.correo || ''}</td>
            <td>${user.telefono || ''}</td>
            <td>${user.perfil || 'Sin perfil'}</td>
            <td>
                <span class="${estado === 'activo' ? 'badge-estado badge-activo' : 'badge-estado badge-inactivo'}">
                    ${estado}
                </span>
            </td>
            <td class="text-center">
                <div class="action-buttons-text d-flex justify-content-center align-items-center gap-2">
                    <button
                        type="button"
                        class="btn-icon btn-edit"
                        title="Editar usuario"
                        onclick="abrirModalEditarUsuario(${user.idUsuario})"
                    >
                        <i class="bi bi-pencil-square"></i>
                    </button>

                    <div class="form-check form-switch m-0">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            ${checked}
                            onchange="cambiarEstadoUsuario(${user.idUsuario}, this.checked)"
                            title="Activar o desactivar usuario"
                        >
                    </div>
                </div>
            </td>
        `;

        tablaResultados.appendChild(tr);
    });
}

async function abrirModalEditarUsuario(idUsuario) {
    limpiarMensajeModal();

    try {
        const response = await fetch(`${API_URL}/${idUsuario}`, {
            method: 'GET',
            headers: obtenerHeaders(false)
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la información del usuario');
        }

        const usuario = await response.json();

        document.getElementById('editIdUsuario').value = usuario.idUsuario || '';
        document.getElementById('editNombre').value = usuario.nombre || '';
        document.getElementById('editAPaterno').value = usuario.aPaterno || '';
        document.getElementById('editAMaterno').value = usuario.aMaterno || '';
        document.getElementById('editCorreo').value = usuario.correo || '';
        document.getElementById('editTelefono').value = usuario.telefono || '';
        document.getElementById('editPerfil').value = usuario.idPerfil || obtenerIdPerfilDesdeTexto(usuario.perfil);

        modalEditarUsuario.show();
    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        alert('No se pudo cargar la información del usuario.');
    }
}

async function actualizarUsuario(e) {
    e.preventDefault();
    limpiarMensajeModal();

    const idUsuario = document.getElementById('editIdUsuario').value;
    const nombre = document.getElementById('editNombre').value.trim();
    const aPaterno = document.getElementById('editAPaterno').value.trim();
    const aMaterno = document.getElementById('editAMaterno').value.trim();
    const correo = document.getElementById('editCorreo').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const idPerfil = document.getElementById('editPerfil').value;

    if (!nombre || !aPaterno || !aMaterno || !correo || !telefono || !idPerfil) {
        mostrarMensajeModal('danger', 'Completa los campos obligatorios.');
        return;
    }

    if (!correoValido(correo)) {
        mostrarMensajeModal('danger', 'Ingresa un correo válido. Ejemplo: usuario@gmail.com');
        return;
    }

    if (!/^\d{10}$/.test(telefono)) {
        mostrarMensajeModal('danger', 'El teléfono debe contener exactamente 10 números.');
        return;
    }

    const payload = {
        nombre,
        aPaterno,
        aMaterno,
        correo,
        telefono,
        idPerfil: Number(idPerfil)
    };

    try {
        const response = await fetch(`${API_URL}/${idUsuario}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(payload)
        });

        const resultado = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(resultado.message || 'No se pudo actualizar el usuario');
        }

        mostrarMensajeModal('success', resultado.message || 'Usuario actualizado con éxito.');

        setTimeout(() => {
            modalEditarUsuario.hide();
            obtenerUsuarios();
        }, 800);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        mostrarMensajeModal('danger', error.message || 'Error al actualizar el usuario.');
    }
}

window.cambiarEstadoUsuario = async (idUsuario, activo) => {
    const nuevoEstado = activo ? 'activo' : 'inactivo';

    try {
        const responseUsuario = await fetch(`${API_URL}/${idUsuario}`, {
            method: 'GET',
            headers: obtenerHeaders(false)
        });

        if (!responseUsuario.ok) {
            throw new Error('No se pudo obtener el usuario para cambiar su estado');
        }

        const usuario = await responseUsuario.json();

        const payload = {
            nombre: usuario.nombre,
            aPaterno: usuario.aPaterno,
            aMaterno: usuario.aMaterno,
            correo: usuario.correo,
            telefono: usuario.telefono,
            idPerfil: Number(usuario.idPerfil),
            estado: nuevoEstado
        };

        const response = await fetch(`${API_URL}/${idUsuario}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(payload)
        });

        const resultado = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(resultado.message || 'No se pudo cambiar el estado del usuario');
        }

        obtenerUsuarios();
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        alert(error.message || 'Error al cambiar el estado del usuario.');
        obtenerUsuarios();
    }
};

function filtrarUsuarios(e) {
    const texto = e.target.value.toLowerCase().trim();
    const filas = tablaResultados.querySelectorAll('tr');

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(texto) ? '' : 'none';
    });
}