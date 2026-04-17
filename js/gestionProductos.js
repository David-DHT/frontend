document.addEventListener('DOMContentLoaded', () => {
    obtenerProductos();
    cargarCategoriasEnSelect();
    inicializarValidacionesProducto();

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

    const formEditarProducto = document.getElementById('formEditarProducto');
    if (formEditarProducto) {
        formEditarProducto.addEventListener('submit', actualizarProducto);
    }

    const formAgregarProducto = document.getElementById('formAgregarProducto');
    if (formAgregarProducto) {
        formAgregarProducto.addEventListener('submit', agregarProducto);
    }

    const btnAbrirModalAgregarProducto = document.getElementById('btnAbrirModalAgregarProducto');
    if (btnAbrirModalAgregarProducto) {
        btnAbrirModalAgregarProducto.addEventListener('click', abrirModalAgregarProducto);
    }
});

const API_PRODUCTOS = 'https://backend-liard-alpha-37.vercel.app/api/productos';
const API_CATEGORIAS = 'https://backend-liard-alpha-37.vercel.app/api/categorias';

function obtenerToken() {
    return localStorage.getItem('token');
}

function inicializarValidacionesProducto() {
    const addImagen = document.getElementById('addImagen');
    const editImagen = document.getElementById('editImagen');
    const addPrecio = document.getElementById('addPrecio');
    const editPrecio = document.getElementById('editPrecio');

    if (addImagen) {
        addImagen.addEventListener('change', () => {
            validarArchivoImagen(addImagen, 'mensajeModalAgregarProducto');
        });
    }

    if (editImagen) {
        editImagen.addEventListener('change', () => {
            validarArchivoImagen(editImagen, 'mensajeModalProducto');
        });
    }

    if (addPrecio) {
        addPrecio.addEventListener('input', () => sanitizarPrecioInput(addPrecio));
        addPrecio.addEventListener('change', () => sanitizarPrecioInput(addPrecio));
    }

    if (editPrecio) {
        editPrecio.addEventListener('input', () => sanitizarPrecioInput(editPrecio));
        editPrecio.addEventListener('change', () => sanitizarPrecioInput(editPrecio));
    }
}

function limpiarMensajeModal(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) {
        contenedor.innerHTML = '';
    }
}

function mostrarMensajeModal(idContenedor, tipo, mensaje) {
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="alert alert-${tipo}">
                ${mensaje}
            </div>
        `;
    }
}

function sanitizarPrecioInput(input) {
    if (!input) return;

    let valor = input.value;
    if (valor === '') return;

    valor = Number(valor);

    if (isNaN(valor) || valor < 0) {
        input.value = '0';
    }
}

function validarPrecioNoNegativo(idInput, idMensaje) {
    const input = document.getElementById(idInput);
    if (!input) return true;

    const valor = Number(input.value);

    if (input.value === '' || isNaN(valor)) {
        mostrarMensajeModal(idMensaje, 'danger', 'Ingresa un precio válido.');
        return false;
    }

    if (valor < 0) {
        input.value = '0';
        mostrarMensajeModal(idMensaje, 'danger', 'El precio no puede ser negativo.');
        return false;
    }

    return true;
}

function validarArchivoImagen(inputFile, idMensaje) {
    if (!inputFile || !inputFile.files || inputFile.files.length === 0) {
        return true;
    }

    const archivo = inputFile.files[0];
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const nombre = archivo.name || '';
    const extension = nombre.includes('.') ? nombre.split('.').pop().toLowerCase() : '';

    const mimeValido = archivo.type && archivo.type.startsWith('image/');
    const extensionValida = extensionesPermitidas.includes(extension);

    if (!mimeValido || !extensionValida) {
        inputFile.value = '';
        mostrarMensajeModal(idMensaje, 'danger', 'Solo se permiten archivos de imagen válidos.');
        return false;
    }

    return true;
}

async function obtenerProductos() {
    const tbody = document.getElementById('tablaResultados');

    try {
        const respuesta = await fetch(API_PRODUCTOS, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const resultado = await respuesta.json();
        const productos = resultado.data || [];

        tbody.innerHTML = '';

        if (productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-4">No hay productos registrados.</td>
                </tr>
            `;
            return;
        }

        productos.forEach(producto => {
            const tr = document.createElement('tr');

            const imagenHTML = producto.imagen
                ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-img" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=&quot;empty-image&quot;>Sin imagen</div>';">`
                : `<div class="empty-image">Sin imagen</div>`;

            const estado = String(producto.estado || '').toLowerCase();
            const estadoClase = estado === 'activo'
                ? 'badge-estado badge-activo'
                : 'badge-estado badge-inactivo';

            const precioFormateado = Number(producto.precio || 0).toFixed(2);
            const checked = estado === 'activo' ? 'checked' : '';

            tr.innerHTML = `
                <td>${imagenHTML}</td>
                <td>
                    <div class="product-name">${producto.nombre || ''}</div>
                </td>
                <td>
                    <div class="product-description">${producto.descripcion || ''}</div>
                </td>
                <td>${producto.nombre_categoria || 'Sin categoría'}</td>
                <td>
                    <span class="price-text">$${precioFormateado}</span>
                </td>
                <td>
                    <span class="${estadoClase}">${producto.estado || 'Sin estado'}</span>
                </td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button onclick="abrirModalEditarProducto(${producto.id_producto})" class="btn-icon btn-edit" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>

                        <div class="form-check form-switch m-0 d-inline-flex">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                role="switch"
                                ${checked}
                                onchange="cambiarEstadoProducto(${producto.id_producto}, this.checked ? 'activo' : 'inactivo')"
                                title="Cambiar estado"
                            >
                        </div>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al obtener los productos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4 text-danger">
                    Error al cargar la información. Revisa que tu backend esté corriendo o publicado correctamente.
                </td>
            </tr>
        `;
    }
}

async function cargarCategoriasEnSelect() {
    const selectEdit = document.getElementById('editCategoria');
    const selectAdd = document.getElementById('addCategoria');

    try {
        const respuesta = await fetch(API_CATEGORIAS, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar las categorías');
        }

        const resultado = await respuesta.json();
        const categorias = resultado.categorias || resultado.data || resultado || [];

        if (selectEdit) {
            selectEdit.innerHTML = `<option value="">Selecciona una categoría</option>`;
        }

        if (selectAdd) {
            selectAdd.innerHTML = `<option value="">Selecciona una categoría</option>`;
        }

        categorias.forEach(categoria => {
            const optionHTML = `<option value="${categoria.idCategoria}">${categoria.nombre}</option>`;

            if (selectEdit) {
                selectEdit.innerHTML += optionHTML;
            }

            if (selectAdd) {
                selectAdd.innerHTML += optionHTML;
            }
        });

    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function abrirModalAgregarProducto() {
    document.getElementById('formAgregarProducto').reset();
    document.getElementById('mensajeModalAgregarProducto').innerHTML = '';
    document.getElementById('addEstado').value = 'activo';

    const addPrecio = document.getElementById('addPrecio');
    if (addPrecio) {
        addPrecio.min = '0';
        sanitizarPrecioInput(addPrecio);
    }

    const addImagen = document.getElementById('addImagen');
    if (addImagen) {
        addImagen.value = '';
    }

    const modal = new bootstrap.Modal(document.getElementById('modalAgregarProducto'));
    modal.show();
}

async function agregarProducto(e) {
    e.preventDefault();

    const mensajeModal = document.getElementById('mensajeModalAgregarProducto');
    limpiarMensajeModal('mensajeModalAgregarProducto');

    const precioValido = validarPrecioNoNegativo('addPrecio', 'mensajeModalAgregarProducto');
    const imagenValida = validarArchivoImagen(document.getElementById('addImagen'), 'mensajeModalAgregarProducto');

    if (!precioValido || !imagenValida) {
        return;
    }

    const formData = new FormData();
    formData.append('nombre', document.getElementById('addNombre').value.trim());
    formData.append('estado', document.getElementById('addEstado').value);
    formData.append('categoria', document.getElementById('addCategoria').value);
    formData.append('precio', document.getElementById('addPrecio').value);
    formData.append('descripcion', document.getElementById('addDescripcion').value.trim());

    const imagenInput = document.getElementById('addImagen');
    if (imagenInput.files.length > 0) {
        formData.append('imagen', imagenInput.files[0]);
    }

    try {
        const respuesta = await fetch(API_PRODUCTOS, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: formData
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo agregar el producto');
        }

        mensajeModal.innerHTML = `
            <div class="alert alert-success">
                ${resultado.message || 'Producto agregado correctamente'}
            </div>
        `;

        await obtenerProductos();

        setTimeout(() => {
            const modalElement = document.getElementById('modalAgregarProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 900);

    } catch (error) {
        console.error('Error al agregar producto:', error);
        mensajeModal.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

async function abrirModalEditarProducto(id) {
    try {
        const respuesta = await fetch(`${API_PRODUCTOS}/${id}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener la información del producto');
        }

        const resultado = await respuesta.json();
        const producto = resultado.data;

        document.getElementById('editIdProducto').value = producto.id_producto || '';
        document.getElementById('editNombre').value = producto.nombre || '';
        document.getElementById('editPrecio').value = producto.precio || '';
        document.getElementById('editCategoria').value = producto.categoria || '';
        document.getElementById('editDescripcion').value = producto.descripcion || '';
        document.getElementById('editImagenActual').value = producto.imagen || '';
        document.getElementById('editImagen').value = '';
        document.getElementById('mensajeModalProducto').innerHTML = '';

        const editPrecio = document.getElementById('editPrecio');
        if (editPrecio) {
            editPrecio.min = '0';
            sanitizarPrecioInput(editPrecio);
        }

        const modal = new bootstrap.Modal(document.getElementById('modalEditarProducto'));
        modal.show();

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        alert('No se pudo cargar la información del producto para editar.');
    }
}

async function actualizarProducto(e) {
    e.preventDefault();

    const id = document.getElementById('editIdProducto').value;
    const mensajeModal = document.getElementById('mensajeModalProducto');
    limpiarMensajeModal('mensajeModalProducto');

    const precioValido = validarPrecioNoNegativo('editPrecio', 'mensajeModalProducto');
    const imagenValida = validarArchivoImagen(document.getElementById('editImagen'), 'mensajeModalProducto');

    if (!precioValido || !imagenValida) {
        return;
    }

    const formData = new FormData();
    formData.append('nombre', document.getElementById('editNombre').value.trim());
    formData.append('categoria', document.getElementById('editCategoria').value);
    formData.append('precio', document.getElementById('editPrecio').value);
    formData.append('descripcion', document.getElementById('editDescripcion').value.trim());
    formData.append('imagenActual', document.getElementById('editImagenActual').value);

    const imagenInput = document.getElementById('editImagen');
    if (imagenInput.files.length > 0) {
        formData.append('imagen', imagenInput.files[0]);
    }

    try {
        const respuesta = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: formData
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo actualizar el producto');
        }

        mensajeModal.innerHTML = `
            <div class="alert alert-success">
                ${resultado.message || 'Producto actualizado correctamente'}
            </div>
        `;

        await obtenerProductos();

        setTimeout(() => {
            const modalElement = document.getElementById('modalEditarProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 900);

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        mensajeModal.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

async function cambiarEstadoProducto(id, nuevoEstado) {
    try {
        const respuestaProducto = await fetch(`${API_PRODUCTOS}/${id}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (!respuestaProducto.ok) {
            throw new Error('No se pudo obtener el producto');
        }

        const resultadoProducto = await respuestaProducto.json();
        const producto = resultadoProducto.data;

        const formData = new FormData();
        formData.append('nombre', producto.nombre || '');
        formData.append('estado', nuevoEstado);
        formData.append('categoria', producto.categoria || '');
        formData.append('precio', producto.precio || 0);
        formData.append('descripcion', producto.descripcion || '');
        formData.append('imagenActual', producto.imagen || '');

        const respuesta = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: formData
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo cambiar el estado del producto');
        }

        await obtenerProductos();

    } catch (error) {
        console.error('Error al cambiar estado del producto:', error);
        alert(error.message);
        await obtenerProductos();
    }
}