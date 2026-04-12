document.addEventListener('DOMContentLoaded', () => {
    obtenerProductos();
    cargarCategoriasEnSelect();

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
});

const API_PRODUCTOS = 'https://backend-liard-alpha-37.vercel.app/api/productos';
const API_CATEGORIAS = 'https://backend-liard-alpha-37.vercel.app/api/categorias';

function obtenerToken() {
    return localStorage.getItem('token');
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

            const estadoClase = String(producto.estado).toLowerCase() === 'activo'
                ? 'badge-estado badge-activo'
                : 'badge-estado badge-inactivo';

            const precioFormateado = Number(producto.precio || 0).toFixed(2);

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
                        <button onclick="eliminarProducto(${producto.id_producto})" class="btn-icon btn-delete" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
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
    const selectCategoria = document.getElementById('editCategoria');

    try {
        const respuesta = await fetch(API_CATEGORIAS, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar las categorías');
        }

        const categorias = await respuesta.json();

        selectCategoria.innerHTML = `<option value="">Selecciona una categoría</option>`;

        categorias.forEach(categoria => {
            selectCategoria.innerHTML += `
                <option value="${categoria.idCategoria}">${categoria.nombre}</option>
            `;
        });

    } catch (error) {
        console.error('Error al cargar categorías:', error);
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
        const producto = resultado.data || resultado;

        document.getElementById('editIdProducto').value = producto.id_producto || '';
        document.getElementById('editNombre').value = producto.nombre || '';
        document.getElementById('editDescripcion').value = producto.descripcion || '';
        document.getElementById('editPrecio').value = producto.precio || '';
        document.getElementById('editCategoria').value = producto.categoria || '';
        document.getElementById('editEstado').value = producto.estado || 'activo';
        document.getElementById('editImagenActual').value = producto.imagen || '';
        document.getElementById('editImagen').value = '';

        document.getElementById('mensajeModalProducto').innerHTML = '';

        const modal = new bootstrap.Modal(document.getElementById('modalEditarProducto'));
        modal.show();

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        alert(`No se pudo cargar el producto para editar.\n${error.message}`);
    }
}

async function actualizarProducto(e) {
    e.preventDefault();

    const id = document.getElementById('editIdProducto').value;
    const mensajeModal = document.getElementById('mensajeModalProducto');

    const formData = new FormData();
    formData.append('nombre', document.getElementById('editNombre').value.trim());
    formData.append('descripcion', document.getElementById('editDescripcion').value.trim());
    formData.append('precio', document.getElementById('editPrecio').value);
    formData.append('categoria', document.getElementById('editCategoria').value);
    formData.append('estado', document.getElementById('editEstado').value);

    // Mantener imagen actual por defecto
    formData.append('imagenActual', document.getElementById('editImagenActual').value);

    const imagenInput = document.getElementById('editImagen');

    // Si el usuario selecciona una nueva imagen, esa reemplaza la actual
    if (imagenInput.files && imagenInput.files[0]) {
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
                ${resultado.message || 'Producto actualizado con éxito'}
            </div>
        `;

        obtenerProductos();

        setTimeout(() => {
            const modalElement = document.getElementById('modalEditarProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 1000);

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        mensajeModal.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

async function eliminarProducto(id) {
    const confirmar = confirm('¿Deseas eliminar este producto?');

    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || 'No se pudo eliminar el producto');
        }

        alert(resultado.message || 'Producto eliminado correctamente');
        obtenerProductos();

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert(error.message);
    }
}