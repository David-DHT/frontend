const API_BASE = "https://backend-liard-alpha-37.vercel.app/api";
const LIMITE_STOCK_BAJO = 10;

let graficaTopProductos = null;
let cacheEstimaciones = null;
let tiempoEstimacionActivo = "dia";

document.addEventListener("DOMContentLoaded", async () => {
    const token = obtenerToken();

    if (!token) {
        alert("Tu sesión no es válida. Inicia sesión nuevamente.");
        window.location.href = "../index.html";
        return;
    }

    configurarEventos(token);

    try {
        await Promise.all([
            cargarDashboard(token),
            cargarOpiniones(token),
            cargarEstimaciones(token)
        ]);
    } catch (error) {
        console.error("Error al inicializar reportes:", error);
    }
});

function configurarEventos(token) {
    const btnRecargar = document.getElementById("btnRecargarReportes");
    const botonesTiempo = document.querySelectorAll(".estimate-switch-btn");

    if (btnRecargar) {
        btnRecargar.addEventListener("click", async () => {
            await Promise.all([
                cargarDashboard(token),
                cargarOpiniones(token),
                cargarEstimaciones(token)
            ]);
        });
    }

    botonesTiempo.forEach((boton) => {
        boton.addEventListener("click", () => {
            const tiempo = boton.dataset.tiempo;
            if (!tiempo) return;

            tiempoEstimacionActivo = tiempo;
            actualizarBotonesTiempo();
            renderEstimaciones(cacheEstimaciones);
        });
    });
}

function actualizarBotonesTiempo() {
    const botonesTiempo = document.querySelectorAll(".estimate-switch-btn");

    botonesTiempo.forEach((boton) => {
        const esActivo = boton.dataset.tiempo === tiempoEstimacionActivo;
        boton.classList.toggle("active", esActivo);
    });
}

function obtenerToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || "No se pudo completar la solicitud");
    }

    return data;
}

async function cargarDashboard(token) {
    const estadoGrafica = document.getElementById("estadoGrafica");
    const resumenTop = document.getElementById("resumenTopProductos");

    try {
        if (estadoGrafica) {
            estadoGrafica.textContent = "Actualizando estadísticas de ventas...";
        }

        const data = await requestJson(
            `${API_BASE}/reportes/dashboard?limite_stock_bajo=${LIMITE_STOCK_BAJO}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dashboard = data?.data || {};

        renderResumen(dashboard.resumen || {});
        renderProductoDestacado(dashboard.producto_mas_vendido);
        renderTablaTopProductos(dashboard.top_productos || []);
        renderGraficaTopProductos(dashboard.top_productos || []);
        renderStockBajo(dashboard.stock_bajo || []);

        if (resumenTop) {
            const top = dashboard.producto_mas_vendido;
            resumenTop.innerHTML = top
                ? `<strong>${escapeHtml(top.nombre_producto)}</strong> lidera las ventas con <strong>${formatearNumero(top.unidades_vendidas)}</strong> unidades dentro del top actual.`
                : "Aún no hay suficientes datos para destacar un producto.";
        }

        if (estadoGrafica) {
            estadoGrafica.textContent = "Información actualizada correctamente.";
        }
    } catch (error) {
        console.error("Error al cargar dashboard:", error);

        if (estadoGrafica) {
            estadoGrafica.textContent = "No fue posible cargar la información del panel.";
        }

        mostrarToast(error.message || "Error al cargar reportes", "danger");
    }
}

function renderResumen(resumen) {
    const totalCategorias = document.getElementById("statCategorias");
    const totalProductos = document.getElementById("statProductos");
    const totalUsuarios = document.getElementById("statUsuarios");

    if (totalCategorias) totalCategorias.textContent = formatearNumero(resumen.total_categorias || 0);
    if (totalProductos) totalProductos.textContent = formatearNumero(resumen.total_productos || 0);
    if (totalUsuarios) totalUsuarios.textContent = formatearNumero(resumen.total_usuarios || 0);
}

function renderProductoDestacado(producto) {
    const titulo = document.getElementById("productoDestacadoNombre");
    const valor = document.getElementById("productoDestacadoValor");
    const detalle = document.getElementById("productoDestacadoDetalle");

    if (!titulo || !valor || !detalle) return;

    if (!producto) {
        titulo.textContent = "Sin datos";
        valor.textContent = "0";
        detalle.textContent = "Todavía no hay ventas activas registradas.";
        return;
    }

    titulo.textContent = producto.nombre_producto;
    valor.textContent = formatearNumero(producto.unidades_vendidas);
    detalle.textContent = `Representa ${Number(producto.porcentaje || 0).toFixed(1)}% del top actual de ventas.`;
}

function renderTablaTopProductos(productos) {
    const tbody = document.getElementById("tablaTopProductos");

    if (!tbody) return;

    if (!productos.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4">No hay ventas registradas para mostrar.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productos.map((producto) => `
        <tr>
            <td>${producto.posicion}</td>
            <td>${escapeHtml(producto.nombre_producto)}</td>
            <td>${formatearNumero(producto.unidades_vendidas)}</td>
            <td>${Number(producto.porcentaje || 0).toFixed(1)}%</td>
        </tr>
    `).join("");
}

function renderGraficaTopProductos(productos) {
    const canvas = document.getElementById("graficaTopProductos");

    if (!canvas) return;

    if (graficaTopProductos) {
        graficaTopProductos.destroy();
        graficaTopProductos = null;
    }

    const labels = productos.map((item) => item.nombre_producto);
    const values = productos.map((item) => Number(item.unidades_vendidas || 0));

    graficaTopProductos = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Unidades vendidas",
                    data: values,
                    backgroundColor: [
                        "#6f4e37",
                        "#8b5e3c",
                        "#a56b46",
                        "#c08a5c",
                        "#d3a16c",
                        "#7f5539",
                        "#9c6644",
                        "#b08968",
                        "#ddb892",
                        "#bc8a5f"
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 700
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${formatearNumero(context.raw)} unidades`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function renderStockBajo(stockBajo) {
    const tbody = document.getElementById("tablaStockBajo");
    const badge = document.getElementById("contadorStockBajo");

    if (!tbody || !badge) return;

    badge.textContent = `${stockBajo.length} en riesgo`;

    if (!stockBajo.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4">No hay productos con stock bajo.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = stockBajo.map((item) => `
        <tr>
            <td>${escapeHtml(item.nombre_producto)}</td>
            <td>${escapeHtml(item.nombre_categoria)}</td>
            <td>${formatearNumero(item.stock_actual)}</td>
            <td>
                <span class="stock-pill ${item.nivel === "Crítico" ? "stock-pill-danger" : "stock-pill-warning"}">
                    ${escapeHtml(item.nivel)}
                </span>
            </td>
        </tr>
    `).join("");
}

async function cargarEstimaciones(token) {
    const estado = document.getElementById("estadoEstimaciones");

    try {
        if (estado) {
            estado.textContent = "Calculando proyección histórica del producto líder...";
        }

        const data = await requestJson(`${API_BASE}/reportes/estimaciones`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });

        cacheEstimaciones = data?.data || null;
        renderEstimaciones(cacheEstimaciones);

        if (estado) {
            estado.textContent = "Estimaciones calculadas correctamente.";
        }
    } catch (error) {
        console.error("Error al cargar estimaciones:", error);

        if (estado) {
            estado.textContent = "No fue posible calcular las estimaciones.";
        }

        renderEstimaciones(null);
        mostrarToast(error.message || "Error al calcular estimaciones", "danger");
    }
}

function renderEstimaciones(data) {
    const productoBadge = document.getElementById("estimacionProducto");
    const rango = document.getElementById("estimacionRango");
    const tiempoActivo = document.getElementById("estimacionTiempoActivo");
    const valorActivo = document.getElementById("estimacionValorActivo");
    const detalle = document.getElementById("detalleEstimacion");

    if (!productoBadge || !rango || !tiempoActivo || !valorActivo || !detalle) return;

    if (!data || !data.producto || !data.estimaciones || !data.procedimiento) {
        productoBadge.textContent = "Sin datos";
        rango.textContent = "---";
        tiempoActivo.textContent = "---";
        valorActivo.textContent = "--";
        detalle.innerHTML = `<div class="empty-state">No hay información suficiente para calcular la proyección.</div>`;
        renderHistorialEstimaciones([]);
        return;
    }

    const configTiempo = obtenerConfiguracionTiempo(data.estimaciones, tiempoEstimacionActivo);
    const unidadesRedondeadas = redondearUnidadesObservacion(configTiempo.valor);

    productoBadge.textContent = data.producto.nombre_producto || "Sin datos";

    const fechaInicio = data.rango?.fecha_minima_rango
        ? formatearFecha(data.rango.fecha_minima_rango)
        : "---";

    const fechaFin = data.rango?.fecha_limite_actual
        ? formatearFecha(data.rango.fecha_limite_actual)
        : "---";

    rango.textContent = `${fechaInicio} a ${fechaFin}`;
    tiempoActivo.textContent = configTiempo.etiqueta;
    valorActivo.textContent = formatearNumero5(configTiempo.valor);

    detalle.innerHTML = `
        <div class="estimate-detail-grid estimate-detail-grid--five">
            <div>
                <span>Producto líder</span>
                <strong>${escapeHtml(data.producto.nombre_producto || "Sin datos")}</strong>
            </div>
            <div>
                <span>Total vendido en el rango</span>
                <strong>${formatearNumero(data.producto.total_vendido || 0)}</strong>
            </div>
            <div>
                <span>Valor de C</span>
                <strong>${formatearNumero5(data.procedimiento.valor_C || 0)}</strong>
            </div>
            <div>
                <span>Valor de k</span>
                <strong>${formatearNumero5(data.procedimiento.valor_k || 0)}</strong>
            </div>
            <div>
                <span>Valor de t</span>
                <strong>${formatearNumero5(data.procedimiento.valor_t || 0)}</strong>
            </div>
        </div>
        <div class="estimate-observations">
            <h4>Observación</h4>
            <p>
                Se espera tener de ventas totales <strong>${formatearNumero(unidadesRedondeadas)}</strong>
                unidades durante <strong>${configTiempo.etiqueta.toLowerCase()}</strong>.
            </p>
        </div>
    `;

    renderHistorialEstimaciones(data.historial_ventas || []);
}

function renderHistorialEstimaciones(historial) {
    const tbody = document.getElementById("tablaHistorialEstimaciones");
    if (!tbody) return;

    if (!historial.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center p-4">No hay historial de ventas en el rango seleccionado.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = historial.map((item) => `
        <tr>
            <td>${formatearFecha(item.fecha)}</td>
            <td>${formatearNumero5(item.cantidad_dia)}</td>
        </tr>
    `).join("");
}

function obtenerConfiguracionTiempo(estimaciones, tiempo) {
    if (tiempo === "semana") {
        return {
            etiqueta: "1 semana (7 días)",
            valor: Number(estimaciones.una_semana || 0)
        };
    }

    if (tiempo === "mes") {
        return {
            etiqueta: "1 mes (30 días)",
            valor: Number(estimaciones.un_mes || 0)
        };
    }

    return {
        etiqueta: "1 día",
        valor: Number(estimaciones.un_dia || 0)
    };
}

function redondearUnidadesObservacion(valor) {
    const numero = Number(valor || 0);
    const parteEntera = Math.floor(numero);
    const decimal = numero - parteEntera;

    if (decimal > 0.5) {
        return parteEntera + 1;
    }

    return parteEntera;
}

async function cargarOpiniones(token) {
    const lista = document.getElementById("listaOpiniones");

    try {
        if (lista) {
            lista.innerHTML = `
                <div class="empty-state">
                    <div class="spinner-border text-secondary" role="status"></div>
                    <p class="mt-3 mb-0">Cargando opiniones...</p>
                </div>
            `;
        }

        const data = await requestJson(`${API_BASE}/reportes/opiniones`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });

        renderOpiniones(data?.data || []);
    } catch (error) {
        console.error("Error al cargar opiniones:", error);
        if (lista) {
            lista.innerHTML = `<div class="empty-state">No fue posible cargar las opiniones.</div>`;
        }
    }
}

function renderOpiniones(opiniones) {
    const lista = document.getElementById("listaOpiniones");

    if (!lista) return;

    if (!opiniones.length) {
        lista.innerHTML = `<div class="empty-state">Todavía no hay opiniones registradas.</div>`;
        return;
    }

    lista.innerHTML = opiniones.map((opinion) => `
        <article class="opinion-item">
            <div class="opinion-content">
                <h4>${escapeHtml(opinion.nombreUsuario)}</h4>
                <p>${escapeHtml(opinion.sugerencia)}</p>
            </div>
        </article>
    `).join("");
}

function mostrarToast(mensaje, tipo = "success") {
    let contenedor = document.getElementById("toastContainer");

    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "toastContainer";
        contenedor.className = "toast-container position-fixed top-0 end-0 p-3";
        document.body.appendChild(contenedor);
    }

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    toastEl.role = "alert";
    toastEl.ariaLive = "assertive";
    toastEl.ariaAtomic = "true";

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(mensaje)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
    `;

    contenedor.appendChild(toastEl);

    const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();

    toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
    });
}

function formatearNumero(valor) {
    return Number(valor || 0).toLocaleString("es-MX");
}

function formatearNumero5(valor) {
    return Number(valor || 0).toLocaleString("es-MX", {
        minimumFractionDigits: 5,
        maximumFractionDigits: 5
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "---";

    if (typeof fecha === "string") {
        const soloFecha = fecha.trim().split("T")[0];
        const partes = soloFecha.split("-");

        if (partes.length === 3) {
            const [anio, mes, dia] = partes;
            return `${dia}/${mes}/${anio}`;
        }
    }

    if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        return `${dia}/${mes}/${anio}`;
    }

    return String(fecha);
}

function escapeHtml(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}