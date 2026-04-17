document.addEventListener("DOMContentLoaded", async () => {
    const token = obtenerToken();

    if (!token) {
        alert("Tu sesión no está activa. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        return;
    }

    await Promise.all([
        obtenerVentas(),
        cargarMetodosPago()
    ]);

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", aplicarFiltros);
    }

    const filtroEstado = document.getElementById("filtroEstado");
    if (filtroEstado) {
        filtroEstado.addEventListener("change", aplicarFiltros);
    }

    const formEditarVenta = document.getElementById("formEditarVenta");
    if (formEditarVenta) {
        formEditarVenta.addEventListener("submit", guardarCambiosVenta);
    }

    const formCancelarVenta = document.getElementById("formCancelarVenta");
    if (formCancelarVenta) {
        formCancelarVenta.addEventListener("submit", confirmarCancelacionVenta);
    }

    const modalCancelar = document.getElementById("modalCancelarVenta");
    if (modalCancelar) {
        modalCancelar.addEventListener("hidden.bs.modal", () => {
            if (switchPendiente && !cancelacionConfirmada) {
                switchPendiente.checked = true;
            }

            switchPendiente = null;
            cancelacionConfirmada = false;
        });
    }
});

const API_VENTAS = "https://backend-liard-alpha-37.vercel.app/api/ventas";

let ventasGlobal = [];
let ventaActual = null;
let metodosPagoGlobal = [];
let switchPendiente = null;
let cancelacionConfirmada = false;

function obtenerToken() {
    return localStorage.getItem("token");
}

function formatearMoneda(valor) {
    return `$${Number(valor || 0).toFixed(2)}`;
}

function formatearFechaSolo(fecha) {
    if (!fecha) return "";
    return String(fecha).slice(0, 10);
}

function escapeHTML(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function obtenerBadgeEstado(estado) {
    const valor = String(estado || "").toLowerCase();

    if (valor === "activa") {
        return `<span class="badge bg-success">Activa</span>`;
    }

    if (valor === "cancelada") {
        return `<span class="badge bg-danger">Cancelada</span>`;
    }

    return `<span class="badge bg-secondary">${escapeHTML(estado || "Sin estado")}</span>`;
}

function mostrarErrorSesion() {
    localStorage.removeItem("token");
    alert("Tu sesión expiró. Inicia sesión nuevamente.");
    window.location.href = "login.html";
}

async function obtenerVentas() {
    const tbody = document.getElementById("tablaResultados");
    if (!tbody) return;

    try {
        const respuesta = await fetch(API_VENTAS, {
            headers: {
                Authorization: `Bearer ${obtenerToken()}`
            }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            mostrarErrorSesion();
            return;
        }

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las ventas.");
        }

        const resultado = await respuesta.json();
        ventasGlobal = resultado.data || [];

        renderizarVentas(ventasGlobal);
    } catch (error) {
        console.error("Error al obtener ventas:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4 text-danger">
                    No se pudieron cargar las ventas.
                </td>
            </tr>
        `;
    }
}

function renderizarVentas(ventas) {
    const tbody = document.getElementById("tablaResultados");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!ventas.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4">
                    No hay ventas registradas.
                </td>
            </tr>
        `;
        return;
    }

    ventas.forEach((venta) => {
        const id = venta.id_venta;
        const fecha = formatearFechaSolo(venta.fecha);
        const trabajador = venta.trabajador || "Sin trabajador";
        const total = venta.total || 0;
        const estatus = String(venta.estatus || "activa").toLowerCase();
        const metodoPago = venta.metodo_pago || "Sin método";

        const checked = estatus === "activa" ? "checked" : "";
        const disabled = estatus === "cancelada" ? "disabled" : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${id}</td>
            <td>${escapeHTML(fecha)}</td>
            <td>${escapeHTML(trabajador)}</td>
            <td>${formatearMoneda(total)}</td>
            <td>${obtenerBadgeEstado(estatus)}</td>
            <td>${escapeHTML(metodoPago)}</td>
            <td class="text-center">
                <div class="action-buttons d-flex justify-content-center align-items-center gap-2">
                    <button
                        class="btn-icon btn-view"
                        title="Ver detalle"
                        onclick="abrirModalDetalleVenta(${id})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>

                    <button
                        class="btn-icon btn-edit"
                        title="Editar venta"
                        onclick="abrirModalEditarVenta(${id})"
                    >
                        <i class="bi bi-pencil-square"></i>
                    </button>

                    <div class="form-check form-switch m-0">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            ${checked}
                            ${disabled}
                            onchange="manejarSwitchEstadoVenta(${id}, this)"
                            title="Cancelar venta"
                        >
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function aplicarFiltros() {
    const texto = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const estadoSeleccionado = (document.getElementById("filtroEstado")?.value || "").toLowerCase();

    const filtradas = ventasGlobal.filter((venta) => {
        const id = String(venta.id_venta || "").toLowerCase();
        const fecha = String(formatearFechaSolo(venta.fecha) || "").toLowerCase();
        const trabajador = String(venta.trabajador || "").toLowerCase();
        const metodo = String(venta.metodo_pago || "").toLowerCase();
        const estatus = String(venta.estatus || "").toLowerCase();

        const coincideTexto =
            id.includes(texto) ||
            fecha.includes(texto) ||
            trabajador.includes(texto) ||
            metodo.includes(texto) ||
            estatus.includes(texto);

        const coincideEstado =
            !estadoSeleccionado || estatus === estadoSeleccionado;

        return coincideTexto && coincideEstado;
    });

    renderizarVentas(filtradas);
}

async function cargarMetodosPago() {
    const selectMetodo = document.getElementById("editMetodoPagoVenta");
    if (!selectMetodo) return;

    try {
        const respuesta = await fetch(`${API_VENTAS}/metodos-pago`, {
            headers: {
                Authorization: `Bearer ${obtenerToken()}`
            }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            mostrarErrorSesion();
            return;
        }

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los métodos de pago.");
        }

        const resultado = await respuesta.json();
        metodosPagoGlobal = resultado.data || [];

        selectMetodo.innerHTML = `<option value="">Selecciona un método</option>`;

        metodosPagoGlobal.forEach((metodo) => {
            selectMetodo.innerHTML += `
                <option value="${metodo.id_metodo}">
                    ${escapeHTML(metodo.nombre)}
                </option>
            `;
        });
    } catch (error) {
        console.error("Error al cargar métodos de pago:", error);
        selectMetodo.innerHTML = `<option value="">No disponibles</option>`;
    }
}

async function obtenerVentaPorId(id) {
    const respuesta = await fetch(`${API_VENTAS}/${id}`, {
        headers: {
            Authorization: `Bearer ${obtenerToken()}`
        }
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
        mostrarErrorSesion();
        return null;
    }

    if (!respuesta.ok) {
        throw new Error("No se pudo obtener la venta seleccionada.");
    }

    const resultado = await respuesta.json();
    return resultado.data;
}

function renderizarTablaDetalle(detalles, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!detalles || !detalles.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-3">
                    Sin detalle disponible.
                </td>
            </tr>
        `;
        return;
    }

    detalles.forEach((detalle) => {
        const producto = detalle.nombre_producto || "Producto";
        const cantidad = Number(detalle.cantidad || 0);
        const precio = Number(detalle.precio_unitario || 0);
        const subtotal = Number(detalle.subtotal || (cantidad * precio));

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${escapeHTML(producto)}</td>
            <td>${cantidad}</td>
            <td>${formatearMoneda(precio)}</td>
            <td>${formatearMoneda(subtotal)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function limpiarMensaje(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) {
        contenedor.innerHTML = "";
    }
}

function mostrarMensaje(idContenedor, texto, tipo = "success") {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="alert alert-${tipo} mb-0">
            ${texto}
        </div>
    `;
}

function abrirBootstrapModal(idModal) {
    const modal = new bootstrap.Modal(document.getElementById(idModal));
    modal.show();
}

function cerrarBootstrapModal(idModal) {
    const modalElement = document.getElementById(idModal);
    const modalInstance = bootstrap.Modal.getInstance(modalElement);

    if (modalInstance) {
        modalInstance.hide();
    }
}

async function abrirModalDetalleVenta(id) {
    try {
        ventaActual = await obtenerVentaPorId(id);
        if (!ventaActual) return;

        document.getElementById("detalleVentaId").value = ventaActual.id_venta || "";
        document.getElementById("detalleFechaVenta").value = formatearFechaSolo(ventaActual.fecha);
        document.getElementById("detalleTrabajadorVenta").value = ventaActual.trabajador || "";
        document.getElementById("detalleTotalVenta").value = formatearMoneda(ventaActual.total || 0);
        document.getElementById("detalleEstadoVenta").value = ventaActual.estatus || "";
        document.getElementById("detalleMetodoPagoVenta").value = ventaActual.metodo_pago || "";

        renderizarTablaDetalle(ventaActual.detalles || [], "tablaDetalleVentaVisual");

        abrirBootstrapModal("modalDetalleVenta");
    } catch (error) {
        console.error("Error al abrir modal de detalle:", error);
        alert(error.message);
    }
}

async function abrirModalEditarVenta(id) {
    try {
        ventaActual = await obtenerVentaPorId(id);
        if (!ventaActual) return;

        document.getElementById("editVentaId").value = ventaActual.id_venta || "";
        document.getElementById("editIdVenta").value = ventaActual.id_venta || "";
        document.getElementById("editFechaVenta").value = formatearFechaSolo(ventaActual.fecha);
        document.getElementById("editTrabajadorVenta").value = ventaActual.trabajador || "";
        document.getElementById("editTotalVenta").value = formatearMoneda(ventaActual.total || 0);
        document.getElementById("editEstadoVenta").value = ventaActual.estatus || "";

        const contenedorMotivo = document.getElementById("contenedorMotivoCancelacionEdit");
        const inputMotivo = document.getElementById("editMotivoCancelacionGuardado");
        const esCancelada = String(ventaActual.estatus || "").toLowerCase() === "cancelada";

        if (contenedorMotivo && inputMotivo) {
            if (esCancelada) {
                contenedorMotivo.style.display = "block";
                inputMotivo.value = ventaActual.motivo_cancelacion || "Sin motivo registrado";
            } else {
                contenedorMotivo.style.display = "none";
                inputMotivo.value = "";
            }
        }

        const selectMetodo = document.getElementById("editMetodoPagoVenta");
        if (selectMetodo) {
            selectMetodo.value = String(ventaActual.id_metodo_pago || "");
            selectMetodo.disabled = esCancelada;
        }

        const btnGuardar = document.getElementById("btnGuardarCambiosVenta");
        if (btnGuardar) {
            btnGuardar.disabled = esCancelada;
        }

        limpiarMensaje("mensajeModalEditarVenta");

        abrirBootstrapModal("modalEditarVenta");
    } catch (error) {
        console.error("Error al abrir modal de edición:", error);
        alert(error.message);
    }
}

async function abrirModalCancelarVenta(id) {
    try {
        ventaActual = await obtenerVentaPorId(id);
        if (!ventaActual) return;

        document.getElementById("cancelVentaId").value = ventaActual.id_venta || "";
        document.getElementById("cancelIdVenta").value = ventaActual.id_venta || "";
        document.getElementById("cancelFechaVenta").value = formatearFechaSolo(ventaActual.fecha);
        document.getElementById("cancelTrabajadorVenta").value = ventaActual.trabajador || "";
        document.getElementById("cancelTotalVenta").value = formatearMoneda(ventaActual.total || 0);
        document.getElementById("cancelEstadoVenta").value = ventaActual.estatus || "";
        document.getElementById("cancelMetodoPagoVenta").value = ventaActual.metodo_pago || "";
        document.getElementById("motivoCancelacion").value = "";

        renderizarTablaDetalle(ventaActual.detalles || [], "tablaDetalleVentaCancelar");

        const esCancelada = String(ventaActual.estatus || "").toLowerCase() === "cancelada";
        const textareaMotivo = document.getElementById("motivoCancelacion");
        const btnConfirmar = document.getElementById("btnConfirmarCancelarVenta");

        if (textareaMotivo) {
            textareaMotivo.disabled = esCancelada;
            textareaMotivo.placeholder = esCancelada
                ? "La venta ya está cancelada"
                : "Escribe el motivo de cancelación";
        }

        if (btnConfirmar) {
            btnConfirmar.disabled = esCancelada;
        }

        limpiarMensaje("mensajeModalCancelarVenta");

        abrirBootstrapModal("modalCancelarVenta");
    } catch (error) {
        console.error("Error al abrir modal de cancelación:", error);
        alert(error.message);
    }
}

async function guardarCambiosVenta(e) {
    e.preventDefault();

    const id = document.getElementById("editVentaId")?.value;
    const idMetodoPago = document.getElementById("editMetodoPagoVenta")?.value;

    if (!idMetodoPago) {
        mostrarMensaje("mensajeModalEditarVenta", "Debes seleccionar un método de pago.", "danger");
        return;
    }

    try {
        const respuesta = await fetch(`${API_VENTAS}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify({
                id_metodo_pago: Number(idMetodoPago)
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || "No se pudo actualizar la venta.");
        }

        mostrarMensaje(
            "mensajeModalEditarVenta",
            resultado.message || "Venta actualizada correctamente.",
            "success"
        );

        await obtenerVentas();

        setTimeout(() => {
            cerrarBootstrapModal("modalEditarVenta");
        }, 900);
    } catch (error) {
        console.error("Error al actualizar venta:", error);
        mostrarMensaje("mensajeModalEditarVenta", error.message, "danger");
    }
}

async function confirmarCancelacionVenta(e) {
    e.preventDefault();

    const id = document.getElementById("cancelVentaId")?.value;
    const motivo = document.getElementById("motivoCancelacion")?.value.trim();

    if (!motivo) {
        mostrarMensaje("mensajeModalCancelarVenta", "Debes escribir el motivo de cancelación.", "danger");
        return;
    }

    try {
        const respuesta = await fetch(`${API_VENTAS}/${id}/cancelar`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify({
                motivo_cancelacion: motivo
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || "No se pudo cancelar la venta.");
        }

        cancelacionConfirmada = true;

        mostrarMensaje(
            "mensajeModalCancelarVenta",
            resultado.message || "Venta cancelada correctamente.",
            "success"
        );

        await obtenerVentas();

        setTimeout(() => {
            cerrarBootstrapModal("modalCancelarVenta");
        }, 900);
    } catch (error) {
        console.error("Error al cancelar venta:", error);
        mostrarMensaje("mensajeModalCancelarVenta", error.message, "danger");
    }
}

async function manejarSwitchEstadoVenta(id, switchElement) {
    const quiereCancelar = !switchElement.checked;

    if (!quiereCancelar) {
        switchElement.checked = true;
        return;
    }

    switchPendiente = switchElement;
    cancelacionConfirmada = false;

    await abrirModalCancelarVenta(id);
}

window.abrirModalDetalleVenta = abrirModalDetalleVenta;
window.abrirModalEditarVenta = abrirModalEditarVenta;
window.abrirModalCancelarVenta = abrirModalCancelarVenta;
window.manejarSwitchEstadoVenta = manejarSwitchEstadoVenta;