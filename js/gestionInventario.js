document.addEventListener("DOMContentLoaded", async () => {
    const token = obtenerToken();

    if (!token) {
        alert("Tu sesión no está activa. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        return;
    }

    await Promise.all([
        obtenerInventario(),
        cargarProductos(),
        cargarProveedores(),
    ]);

    inicializarValidacionesInventario();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", aplicarFiltros);
    }

    const btnAbrirModalCompra = document.getElementById("btnAbrirModalCompra");
    if (btnAbrirModalCompra) {
        btnAbrirModalCompra.addEventListener("click", abrirModalCompra);
    }

    const btnAgregarDetalle = document.getElementById("btnAgregarDetalle");
    if (btnAgregarDetalle) {
        btnAgregarDetalle.addEventListener("click", agregarDetalleCompra);
    }

    const formCompra = document.getElementById("formCompra");
    if (formCompra) {
        formCompra.addEventListener("submit", registrarCompra);
    }

    const formEliminarInventario = document.getElementById("formEliminarInventario");
    if (formEliminarInventario) {
        formEliminarInventario.addEventListener("submit", registrarSalidaInventario);
    }
});

const API_INVENTARIO = "https://backend-liard-alpha-37.vercel.app/api/inventario";
const API_CATEGORIAS = "https://backend-liard-alpha-37.vercel.app/api/categorias";
const API_PRODUCTOS = "https://backend-liard-alpha-37.vercel.app/api/productos";
const API_PROVEEDORES = "https://backend-liard-alpha-37.vercel.app/api/proveedores";

let inventarioGlobal = [];
let categoriasGlobal = [];
let productosGlobal = [];
let proveedoresGlobal = [];
let detallesCompra = [];

function obtenerToken() {
    return localStorage.getItem("token");
}

function obtenerFechaSistema() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, "0");
    const day = String(hoy.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatearMoneda(valor) {
    return `$${Number(valor || 0).toFixed(2)}`;
}

function escapeHTML(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function obtenerNombreProducto(item) {
    return item.nombre_producto || item.producto_nombre || item.nombre || "Sin nombre";
}

function obtenerNombreCategoria(item) {
    return item.nombre_categoria || item.categoria_nombre || item.categoria || "Sin categoría";
}

function obtenerStock(item) {
    const stock = item.stock_actual ?? item.stock ?? item.cantidad ?? 0;
    return Number(stock);
}

function obtenerIdProducto(item) {
    return item.id_producto ?? item.producto ?? item.producto_id ?? item.id ?? "";
}

function obtenerIdCategoria(item) {
    return item.id_categoria ?? item.categoria ?? item.idCategoria ?? item.categoria_id ?? "";
}

function limpiarMensajeInventario(id) {
    const contenedor = document.getElementById(id);
    if (contenedor) contenedor.innerHTML = "";
}

function mostrarMensajeInventario(id, tipo, mensaje) {
    const contenedor = document.getElementById(id);
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="alert alert-${tipo}">
            ${mensaje}
        </div>
    `;
}

function inicializarValidacionesInventario() {
    const compraCantidad = document.getElementById("compraCantidad");
    const compraPrecio = document.getElementById("compraPrecio");
    const eliminarCantidad = document.getElementById("eliminarCantidad");

    if (compraCantidad) {
        compraCantidad.addEventListener("input", () => {
            if (compraCantidad.value === "") return;
            const valor = Number(compraCantidad.value);
            if (isNaN(valor) || valor < 1) {
                compraCantidad.value = "1";
            }
        });
    }

    if (compraPrecio) {
        compraPrecio.addEventListener("input", () => {
            if (compraPrecio.value === "") return;
            const valor = Number(compraPrecio.value);
            if (isNaN(valor) || valor < 0) {
                compraPrecio.value = "0";
            }
        });
    }

    if (eliminarCantidad) {
        eliminarCantidad.addEventListener("input", () => {
            if (eliminarCantidad.value === "") return;
            const valor = Number(eliminarCantidad.value);
            if (isNaN(valor) || valor < 1) {
                eliminarCantidad.value = "1";
            }
        });
    }
}

async function obtenerInventario() {
    const tbody = document.getElementById("tablaResultados");
    if (!tbody) return;

    try {
        const respuesta = await fetch(API_INVENTARIO, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${obtenerToken()}`
            }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("token");
            alert("Tu sesión expiró. Inicia sesión nuevamente.");
            window.location.href = "login.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        const inventario = await respuesta.json();
        inventarioGlobal = Array.isArray(inventario) ? inventario : [];
        renderizarInventario(inventarioGlobal);

    } catch (error) {
        console.error("Error al obtener inventario:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4 text-danger">
                    Error al cargar el inventario.
                </td>
            </tr>
        `;
    }
}

function renderizarInventario(data) {
    const tbody = document.getElementById("tablaResultados");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center p-3">
                    No hay registros de inventario.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach((item, index) => {
        const nombreProducto = obtenerNombreProducto(item);
        const nombreCategoria = obtenerNombreCategoria(item);
        const stockActual = obtenerStock(item);

        let badgeStock = "badge bg-success";
        if (stockActual <= 10 && stockActual > 0) badgeStock = "badge bg-warning text-dark";
        if (stockActual <= 0) badgeStock = "badge bg-danger";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="product-name">${escapeHTML(nombreProducto)}</div>
            </td>
            <td>${escapeHTML(nombreCategoria)}</td>
            <td>
                <span class="${badgeStock}">${stockActual}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function aplicarFiltros() {
    const texto = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

    const filtrado = inventarioGlobal.filter((item) => {
        const nombreProducto = obtenerNombreProducto(item).toLowerCase();
        const nombreCategoria = obtenerNombreCategoria(item).toLowerCase();

        return (
            nombreProducto.includes(texto) ||
            nombreCategoria.includes(texto) ||
            String(obtenerStock(item)).includes(texto)
        );
    });

    renderizarInventario(filtrado);
}

async function cargarProductos() {
    const selectProducto = document.getElementById("compraProducto");

    try {
        const respuesta = await fetch(API_PRODUCTOS, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${obtenerToken()}`
            }
        });

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos");
        }

        const resultado = await respuesta.json();
        productosGlobal = resultado.data || [];

        if (selectProducto) {
            selectProducto.innerHTML = `<option value="">Selecciona un producto</option>`;
            productosGlobal.forEach((producto) => {
                selectProducto.innerHTML += `
                    <option value="${producto.id_producto}">
                        ${escapeHTML(producto.nombre)}
                    </option>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

async function cargarProveedores() {
    const selectProveedor = document.getElementById("compraProveedor");

    try {
        const respuesta = await fetch(API_PROVEEDORES, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${obtenerToken()}`
            }
        });

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los proveedores");
        }

        const proveedores = await respuesta.json();
        proveedoresGlobal = Array.isArray(proveedores) ? proveedores : [];

        if (selectProveedor) {
            selectProveedor.innerHTML = `<option value="">Selecciona un proveedor</option>`;
            proveedoresGlobal.forEach((proveedor) => {
                const nombreCompleto = `${proveedor.nombre} ${proveedor.aPaterno} ${proveedor.aMaterno}`.trim();

                selectProveedor.innerHTML += `
                    <option value="${proveedor.idProveedor}">
                        ${escapeHTML(nombreCompleto)}
                    </option>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
}

function abrirModalCompra() {
    detallesCompra = [];
    renderizarDetalleCompra();

    const formCompra = document.getElementById("formCompra");
    if (formCompra) {
        formCompra.reset();
    }

    const fechaInput = document.getElementById("compraFecha");
    if (fechaInput) {
        fechaInput.value = obtenerFechaSistema();
    }

    limpiarMensajeInventario("mensajeModalCompra");

    const total = document.getElementById("totalCompra");
    if (total) {
        total.textContent = formatearMoneda(0);
    }

    const modal = new bootstrap.Modal(document.getElementById("modalCompra"));
    modal.show();
}

function agregarDetalleCompra() {
    const selectProducto = document.getElementById("compraProducto");
    const cantidadInput = document.getElementById("compraCantidad");
    const precioInput = document.getElementById("compraPrecio");

    if (!selectProducto || !cantidadInput || !precioInput) return;

    const idProducto = selectProducto.value;
    const cantidad = Number(cantidadInput.value);
    const precio = Number(precioInput.value);

    if (!idProducto) {
        alert("Selecciona un producto.");
        return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("La cantidad debe ser mayor que cero.");
        return;
    }

    if (isNaN(precio) || precio < 0) {
        alert("El precio de compra no puede ser negativo.");
        return;
    }

    const producto = productosGlobal.find(
        (p) => String(p.id_producto) === String(idProducto)
    );

    if (!producto) {
        alert("No se encontró el producto seleccionado.");
        return;
    }

    const existente = detallesCompra.find(
        (item) => String(item.id_producto) === String(idProducto)
    );

    if (existente) {
        existente.cantidad += cantidad;
        existente.precio = precio;
    } else {
        detallesCompra.push({
            id_producto: Number(idProducto),
            nombre: producto.nombre,
            cantidad,
            precio,
        });
    }

    renderizarDetalleCompra();

    selectProducto.value = "";
    cantidadInput.value = "";
    precioInput.value = "";
}

function renderizarDetalleCompra() {
    const tbody = document.getElementById("tablaDetalleCompra");
    const total = document.getElementById("totalCompra");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!detallesCompra.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center p-3">No hay productos agregados.</td>
            </tr>
        `;
        if (total) total.textContent = formatearMoneda(0);
        return;
    }

    let suma = 0;

    detallesCompra.forEach((item, index) => {
        const subtotal = item.cantidad * item.precio;
        suma += subtotal;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${escapeHTML(item.nombre)}</td>
            <td>${item.cantidad}</td>
            <td>${formatearMoneda(item.precio)}</td>
            <td>${formatearMoneda(subtotal)}</td>
            <td class="text-center">
                <button
                    type="button"
                    class="btn-icon btn-delete"
                    onclick="eliminarDetalleCompra(${index})"
                    title="Quitar"
                >
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (total) total.textContent = formatearMoneda(suma);
}

function eliminarDetalleCompra(index) {
    detallesCompra.splice(index, 1);
    renderizarDetalleCompra();
}

async function registrarCompra(e) {
    e.preventDefault();

    const proveedor = document.getElementById("compraProveedor")?.value;
    const mensaje = document.getElementById("mensajeModalCompra");
    const fechaSistema = obtenerFechaSistema();

    if (!proveedor) {
        mensaje.innerHTML = `<div class="alert alert-danger">Selecciona un proveedor.</div>`;
        return;
    }

    if (!detallesCompra.length) {
        mensaje.innerHTML = `<div class="alert alert-danger">Agrega al menos un producto a la compra.</div>`;
        return;
    }

    const payload = {
        id_proveedor: Number(proveedor),
        fecha: fechaSistema,
        detalles: detallesCompra.map((item) => ({
            id_producto: Number(item.id_producto),
            cantidad: Number(item.cantidad),
            precio: Number(item.precio),
        })),
    };

    try {
        const respuesta = await fetch(`${API_INVENTARIO}/compras`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(payload),
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("token");
            alert("Tu sesión expiró. Inicia sesión nuevamente.");
            window.location.href = "login.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(resultado.message || "No se pudo registrar la compra");
        }

        if (!resultado.id_compra) {
            throw new Error("El backend no devolvió un id de compra válido.");
        }

        mensaje.innerHTML = `
            <div class="alert alert-success">
                Compra registrada correctamente. Folio: ${resultado.id_compra}
            </div>
        `;

        await obtenerInventario();

        setTimeout(() => {
            const modalElement = document.getElementById("modalCompra");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 1000);

    } catch (error) {
        console.error("Error al registrar compra:", error);
        mensaje.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    }
}

function abrirModalEliminarInventario(index) {
    const item = inventarioGlobal[index];

    if (!item) {
        alert("No se encontró el producto en el inventario.");
        return;
    }

    const idProducto = obtenerIdProducto(item);

    if (!idProducto) {
        alert("No se encontró un id válido para este producto.");
        return;
    }

    document.getElementById("eliminarIdProducto").value = idProducto;
    document.getElementById("eliminarNombreProducto").value = obtenerNombreProducto(item);
    document.getElementById("eliminarStockActual").value = obtenerStock(item);
    document.getElementById("eliminarCantidad").value = "";
    document.getElementById("eliminarMotivo").value = "";
    limpiarMensajeInventario("mensajeModalEliminarInventario");

    const modal = new bootstrap.Modal(document.getElementById("modalEliminarInventario"));
    modal.show();
}

async function registrarSalidaInventario(e) {
    e.preventDefault();

    const idProducto = document.getElementById("eliminarIdProducto").value;
    const stockActual = Number(document.getElementById("eliminarStockActual").value);
    const cantidad = Number(document.getElementById("eliminarCantidad").value);
    const motivo = document.getElementById("eliminarMotivo").value.trim();

    if (!idProducto) {
        mostrarMensajeInventario("mensajeModalEliminarInventario", "danger", "No se encontró el producto.");
        return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarMensajeInventario("mensajeModalEliminarInventario", "danger", "La cantidad a descontar debe ser mayor que cero.");
        return;
    }

    if (cantidad > stockActual) {
        mostrarMensajeInventario("mensajeModalEliminarInventario", "danger", "La cantidad no puede ser mayor al stock actual.");
        return;
    }

    if (!motivo) {
        mostrarMensajeInventario("mensajeModalEliminarInventario", "danger", "Debes escribir el motivo.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_INVENTARIO}/salidas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify({
                id_producto: Number(idProducto),
                cantidad: Number(cantidad),
                motivo: motivo
            }),
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("token");
            alert("Tu sesión expiró. Inicia sesión nuevamente.");
            window.location.href = "login.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error(resultado.message || "No se pudo actualizar el stock.");
        }

        mostrarMensajeInventario(
            "mensajeModalEliminarInventario",
            "success",
            resultado.message || "Stock actualizado correctamente."
        );

        await obtenerInventario();

        setTimeout(() => {
            const modalElement = document.getElementById("modalEliminarInventario");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }, 900);

    } catch (error) {
        console.error("Error al actualizar stock:", error);
        mostrarMensajeInventario("mensajeModalEliminarInventario", "danger", error.message);
    }
}

window.eliminarDetalleCompra = eliminarDetalleCompra;
window.abrirModalEliminarInventario = abrirModalEliminarInventario;