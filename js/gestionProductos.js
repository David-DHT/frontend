document.addEventListener('DOMContentLoaded', () => {
    obtenerProductos();

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
});

// Cambia esta URL por la de tu backend publicado en Vercel
const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/productos';

async function obtenerProductos() {
    const tbody = document.getElementById('tablaResultados');

    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const resultado = await respuesta.json();
        const productos = resultado.data || [];

        tbody.innerHTML = '';

        if (productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center p-4">No hay productos registrados.</td>
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
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error al obtener los productos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4 text-danger">
                    Error al cargar la información. Revisa que tu backend esté corriendo o publicado correctamente.
                </td>
            </tr>
        `;
    }
}