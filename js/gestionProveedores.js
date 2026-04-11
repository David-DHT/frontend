document.addEventListener('DOMContentLoaded', async () => {
    const token = obtenerToken();

    if (!token) {
        alert('Tu sesión no está activa. Inicia sesión nuevamente.');
        window.location.href = 'login.html';
        return;
    }

    await obtenerProveedores();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#tablaResultados tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }

    const formEditarProveedor = document.getElementById('formEditarProveedor');
    if (formEditarProveedor) {
        formEditarProveedor.addEventListener('submit', actualizarProveedor);
    }
});

const API_PROVEEDORES = 'https://backend-liard-alpha-37.vercel.app/api/proveedores';

function obtenerToken() {
    return localStorage.getItem('token');
}

async function obtenerProveedores() {
    const tbody = document.getElementById('tablaResultados');

    try {
        const respuesta = await fetch(API_PROVEEDORES, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem('token');
            alert('Tu sesión expiró. Inicia sesión nuevamente.');
            window.location.href = 'login.html';
            return;
        }

        if (!respuesta.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const proveedores = await respuesta.json();

        tbody.innerHTML = '';

        if (!proveedores.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-4">No hay proveedores registrados.</td>
                </tr>
            `;
            return;
        }

        proveedores.forEach(proveedor => {
            const estatusTexto = Number(proveedor.estatus) === 1 ? 'activo' : 'inactivo';
            const estadoClase = Number(proveedor.estatus) === 1
                ? 'badge-estado badge-activo'
                : 'badge-estado badge-inactivo';

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${proveedor.nombre || ''}</td>
                <td>${proveedor.aPaterno || ''}</td>
                <td>${proveedor.aMaterno || ''}</td>
                <td>${proveedor.telefono || ''}</td>
                <td>${proveedor.correo || ''}</td>
                <td><span class="${estadoClase}">${estatusTexto}</span></td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button onclick="abrirModalEditarProveedor(${proveedor.idProveedor})" class="btn-icon btn-edit" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button onclick="eliminarProveedor(${proveedor.idProveedor})" class="btn-icon btn-delete" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4 text-danger">
                    Error al cargar la información de proveedores.
                </td>
            </tr>
        `;
    }
}

const btnAbrirModalProveedor = document.getElementById('btnAbrirModalProveedor');
const formAgregarProveedor = document.getElementById('formAgregarProveedor');

btnAbrirModalProveedor.addEventListener('click', () => {
    limpiarFormularioProveedor();

    const mensaje = document.getElementById('mensajeModalProveedor');
    mensaje.innerHTML = '';

    const modal = new bootstrap.Modal(document.getElementById('modalAgregarProveedor'));
    modal.show();
});

formAgregarProveedor.addEventListener('submit', agregarProveedor);

function limpiarFormularioProveedor() {
    document.getElementById('nombreProveedor').value = '';
    document.getElementById('aPaternoProveedor').value = '';
    document.getElementById('aMaternoProveedor').value = '';
    document.getElementById('telefonoProveedor').value = '';
    document.getElementById('correoProveedor').value = '';
}

async function agregarProveedor(e) {
    e.preventDefault();

    const mensajeModal = document.getElementById('mensajeModalProveedor');

    const proveedorData = {
        nombre: document.getElementById('nombreProveedor').value.trim(),
        aPaterno: document.getElementById('aPaternoProveedor').value.trim(),
        aMaterno: document.getElementById('aMaternoProveedor').value.trim(),
        telefono: document.getElementById('telefonoProveedor').value.trim(),
        correo: document.getElementById('correoProveedor').value.trim()
    };

    try {
        const respuesta = await fetch(API_PROVEEDORES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(proveedorData)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo agregar el proveedor');
        }

        mensajeModal.innerHTML = `
            <div class="alert alert-success">
                ${resultado.message || 'Proveedor agregado correctamente'}
            </div>
        `;

        if (typeof obtenerProveedores === 'function') {
            await obtenerProveedores();
        }

        setTimeout(() => {
            const modalElement = document.getElementById('modalAgregarProveedor');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            limpiarFormularioProveedor();
        }, 900);

    } catch (error) {
        console.error('Error al agregar proveedor:', error);
        mensajeModal.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

async function abrirModalEditarProveedor(id) {
    try {
        const respuesta = await fetch(`${API_PROVEEDORES}/${id}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem('token');
            alert('Tu sesión expiró. Inicia sesión nuevamente.');
            window.location.href = 'login.html';
            return;
        }

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener la información del proveedor');
        }

        const proveedor = await respuesta.json();

        document.getElementById('editIdProveedor').value = proveedor.idProveedor || '';
        document.getElementById('editNombre').value = proveedor.nombre || '';
        document.getElementById('editAPaterno').value = proveedor.aPaterno || '';
        document.getElementById('editAMaterno').value = proveedor.aMaterno || '';
        document.getElementById('editTelefono').value = proveedor.telefono || '';
        document.getElementById('editCorreo').value = proveedor.correo || '';

        document.getElementById('mensajeModalProveedor').innerHTML = '';

        const modal = new bootstrap.Modal(document.getElementById('modalEditarProveedor'));
        modal.show();

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        alert(`No se pudo cargar el proveedor para editar.\n${error.message}`);
    }
}

async function actualizarProveedor(e) {
    e.preventDefault();

    const id = document.getElementById('editIdProveedor').value;
    const mensajeModal = document.getElementById('mensajeModalProveedor');

    const datosProveedor = {
        nombre: document.getElementById('editNombre').value.trim(),
        aPaterno: document.getElementById('editAPaterno').value.trim(),
        aMaterno: document.getElementById('editAMaterno').value.trim(),
        telefono: document.getElementById('editTelefono').value.trim(),
        correo: document.getElementById('editCorreo').value.trim()
    };

    try {
        const respuesta = await fetch(`${API_PROVEEDORES}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(datosProveedor)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo actualizar el proveedor');
        }

        mensajeModal.innerHTML = `
            <div class="alert alert-success">
                ${resultado.message || 'Proveedor actualizado con éxito'}
            </div>
        `;

        obtenerProveedores();

        setTimeout(() => {
            const modalElement = document.getElementById('modalEditarProveedor');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 1000);

    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        mensajeModal.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

async function eliminarProveedor(id) {
    const confirmar = confirm('¿Deseas eliminar este proveedor?');
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_PROVEEDORES}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo eliminar el proveedor');
        }

        alert(resultado.message || 'Proveedor eliminado correctamente');
        obtenerProveedores();

    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        alert(error.message);
    }
}