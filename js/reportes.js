const API_BASE = "https://backend-liard-alpha-37.vercel.app/api";
const LIMITE_STOCK_BAJO = 10;

let graficaTopProductos = null;
let cacheEstimaciones = null;

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
    const formOpinion = document.getElementById("formOpinion");
    const btnExportarPdf = document.getElementById("btnExportarPdf");

    if (btnRecargar) {
        btnRecargar.addEventListener("click", async () => {
            await Promise.all([
                cargarDashboard(token),
                cargarEstimaciones(token)
            ]);
        });
    }

    if (formOpinion) {
        formOpinion.addEventListener("submit", async (event) => {
            event.preventDefault();
            await registrarOpinion(token);
        });
    }

    if (btnExportarPdf) {
        btnExportarPdf.addEventListener("click", exportarPDF);
    }
}

function obtenerToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function obtenerUsuarioSesion() {
    const usuarioStorage = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");

    if (!usuarioStorage) return null;

    try {
        return JSON.parse(usuarioStorage);
    } catch {
        return null;
    }
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
    const dia = document.getElementById("estimacionDia");
    const semana = document.getElementById("estimacionSemana");
    const mes = document.getElementById("estimacionMes");
    const detalle = document.getElementById("detalleEstimacion");
    const pasos = document.getElementById("pasosEstimacion");

    if (!productoBadge || !rango || !dia || !semana || !mes || !detalle || !pasos) return;

    if (!data || !data.producto || !data.estimaciones || !data.procedimiento || !data.puntos_modelo) {
        productoBadge.textContent = "Sin datos";
        rango.textContent = "---";
        dia.textContent = "--";
        semana.textContent = "--";
        mes.textContent = "--";
        detalle.innerHTML = `<div class="empty-state">No hay información suficiente para calcular la proyección.</div>`;
        pasos.innerHTML = "";
        return;
    }

    productoBadge.textContent = data.producto.nombre_producto;
    rango.textContent = `${formatearFecha(data.rango.fecha_minima_db)} a ${formatearFecha(data.rango.fecha_limite_actual)}`;
    dia.textContent = formatearNumeroDecimal(data.estimaciones.un_dia);
    semana.textContent = formatearNumeroDecimal(data.estimaciones.una_semana);
    mes.textContent = formatearNumeroDecimal(data.estimaciones.un_mes);

    detalle.innerHTML = `
        <div class="estimate-detail-grid">
            <div>
                <span>Producto líder</span>
                <strong>${escapeHtml(data.producto.nombre_producto)}</strong>
            </div>
            <div>
                <span>Total vendido histórico</span>
                <strong>${formatearNumero(data.producto.total_vendido)}</strong>
            </div>
            <div>
                <span>Punto inicial</span>
                <strong>${formatearNumeroDecimal(data.puntos_modelo.y0)} unidades</strong>
                <small>${formatearFecha(data.puntos_modelo.fecha_inicial_modelo)}</small>
            </div>
            <div>
                <span>Punto final</span>
                <strong>${formatearNumeroDecimal(data.puntos_modelo.yt)} unidades</strong>
                <small>${formatearFecha(data.puntos_modelo.fecha_final_modelo)}</small>
            </div>
            <div>
                <span>Días entre puntos del modelo</span>
                <strong>${formatearNumero(data.puntos_modelo.t)}</strong>
            </div>
            <div>
                <span>Días del rango global</span>
                <strong>${formatearNumero(data.rango.dias_periodo_global || 0)}</strong>
            </div>
        </div>
        ${renderObservaciones(data.observaciones || [])}
    `;

    pasos.innerHTML = construirPasosEstimacion(data);
}

function construirPasosEstimacion(data) {
    const y0 = Number(data.puntos_modelo.y0 || 0);
    const yt = Number(data.puntos_modelo.yt || 0);
    const t = Number(data.puntos_modelo.t || 0);
    const C = Number(data.procedimiento.valor_C || 0);
    const k = Number(data.procedimiento.valor_k || 0);

    const division = y0 > 0 ? yt / y0 : 0;
    const lnDivision = division > 0 ? Math.log(division) : 0;

    const pasos = [
        {
            titulo: "1) Ecuación base",
            descripcion: "Se parte del modelo de ley de crecimiento para las ventas del producto:",
            formula: "dy/dt = ky"
        },
        {
            titulo: "2) Separación de variables",
            descripcion: "Se separan las variables para dejar y con dy de un lado y t con dt del otro:",
            formula: "dy / y = k dt"
        },
        {
            titulo: "3) Integrar",
            descripcion: "Se integran ambos lados de la ecuación:",
            formula: "ln(y) = kt + C"
        },
        {
            titulo: "4) Despejar",
            descripcion: "Se aplica exponencial para obtener la solución general:",
            formula: "y = Ce^(kt)"
        },
        {
            titulo: "5) Encontrar C",
            descripcion: `Con el punto inicial del modelo: y(0) = ${formatearNumeroDecimal(y0)}`,
            formula: `C = ${formatearNumeroDecimal(C)}`
        },
        {
            titulo: "6) Encontrar k",
            descripcion: `Con el segundo dato: y(${formatearNumero(t)}) = ${formatearNumeroDecimal(yt)}`,
            formula: [
                `${formatearNumeroDecimal(yt)} = ${formatearNumeroDecimal(C)}e^(${formatearNumeroDecimal(k)} · ${formatearNumero(t)})`,
                `${formatearNumeroDecimal(yt / C)} = e^(${formatearNumeroDecimal(k)} · ${formatearNumero(t)})`,
                `ln(${formatearNumeroDecimal(division)}) = ${formatearNumero(t)}k`,
                `${formatearNumeroDecimal(lnDivision)} = ${formatearNumero(t)}k`,
                `k = ${formatearNumeroDecimal(k)}`
            ]
        },
        {
            titulo: "7) Modelo final",
            descripcion: "Se sustituye C y k en la solución general:",
            formula: data.procedimiento.modelo_final
        },
        {
            titulo: "8) Sustitución para la respuesta",
            descripcion: "Se evalúa el modelo para 1 día, 7 días y 30 días:",
            formula: [
                `y(1) = ${formatearNumeroDecimal(data.estimaciones.un_dia)}`,
                `y(7) = ${formatearNumeroDecimal(data.estimaciones.una_semana)}`,
                `y(30) = ${formatearNumeroDecimal(data.estimaciones.un_mes)}`
            ]
        }
    ];

    return pasos.map((paso) => `
        <article class="step-card">
            <h4>${paso.titulo}</h4>
            <p>${paso.descripcion}</p>
            ${
                Array.isArray(paso.formula)
                    ? paso.formula.map((linea) => `<code>${escapeHtml(linea)}</code>`).join("")
                    : `<code>${escapeHtml(paso.formula)}</code>`
            }
        </article>
    `).join("");
}

function renderObservaciones(observaciones) {
    if (!observaciones.length) return "";

    return `
        <div class="estimate-observations">
            <h4>Observaciones</h4>
            <ul>
                ${observaciones.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
        </div>
    `;
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
            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                onclick="eliminarOpinion(${Number(opinion.idOpinion)})"
            >
                <i class="bi bi-trash"></i>
            </button>
        </article>
    `).join("");
}

async function registrarOpinion(token) {
    const inputNombre = document.getElementById("opinionNombre");
    const inputSugerencia = document.getElementById("opinionSugerencia");

    const usuario = obtenerUsuarioSesion();
    const nombrePorDefecto = usuario?.nombre || usuario?.usuario || "";

    const nombreUsuario = String(inputNombre?.value || nombrePorDefecto).trim();
    const sugerencia = String(inputSugerencia?.value || "").trim();

    if (!nombreUsuario || !sugerencia) {
        mostrarToast("Completa los datos de la opinión", "warning");
        return;
    }

    try {
        await requestJson(`${API_BASE}/reportes/opiniones`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                nombreUsuario,
                sugerencia
            })
        });

        if (inputNombre) inputNombre.value = nombrePorDefecto || "";
        if (inputSugerencia) inputSugerencia.value = "";

        mostrarToast("Opinión registrada correctamente", "success");
        await cargarOpiniones(token);
    } catch (error) {
        console.error("Error al registrar opinión:", error);
        mostrarToast(error.message || "No fue posible registrar la opinión", "danger");
    }
}

window.eliminarOpinion = async function eliminarOpinion(idOpinion) {
    const token = obtenerToken();

    if (!token) {
        mostrarToast("Tu sesión ya no es válida", "warning");
        return;
    }

    const confirmar = confirm("¿Deseas eliminar esta opinión?");
    if (!confirmar) return;

    try {
        await requestJson(`${API_BASE}/reportes/opiniones/${idOpinion}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });

        mostrarToast("Opinión eliminada correctamente", "success");
        await cargarOpiniones(token);
    } catch (error) {
        console.error("Error al eliminar opinión:", error);
        mostrarToast(error.message || "No fue posible eliminar la opinión", "danger");
    }
};

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const colorPrincipal = [74, 60, 46];
    const colorSecundario = [176, 141, 85];
    const colorSuave = [122, 91, 69];

    const resumen = {
        categorias: document.getElementById("statCategorias")?.textContent || "0",
        productos: document.getElementById("statProductos")?.textContent || "0",
        usuarios: document.getElementById("statUsuarios")?.textContent || "0",
        topProducto: document.getElementById("productoDestacadoNombre")?.textContent || "Sin datos",
        topCantidad: document.getElementById("productoDestacadoValor")?.textContent || "0"
    };

    doc.setFillColor(...colorPrincipal);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("UNICAFE - Reporte Inteligente", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de exportación: ${new Date().toLocaleString("es-MX")}`, 14, 25);

    let y = 40;

    doc.setTextColor(...colorPrincipal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Resumen general", 14, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Categorías registradas: ${resumen.categorias}`, 14, y);
    y += 6;
    doc.text(`Productos registrados: ${resumen.productos}`, 14, y);
    y += 6;
    doc.text(`Usuarios registrados: ${resumen.usuarios}`, 14, y);
    y += 6;
    doc.text(`Producto más vendido: ${resumen.topProducto}`, 14, y);
    y += 6;
    doc.text(`Unidades vendidas: ${resumen.topCantidad}`, 14, y);

    y += 12;

    const filasTop = obtenerFilasTabla("tablaTopProductos", 4);
    if (filasTop.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Ranking detallado", 14, y);
        y += 4;

        doc.autoTable({
            startY: y,
            head: [["#", "Producto", "Unidades vendidas", "Participación"]],
            body: filasTop,
            theme: "grid",
            headStyles: {
                fillColor: colorSecundario,
                textColor: 255
            },
            styles: {
                fontSize: 9
            }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    const filasStock = obtenerFilasTabla("tablaStockBajo", 4);
    if (filasStock.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Productos con stock bajo", 14, y);
        y += 4;

        doc.autoTable({
            startY: y,
            head: [["Producto", "Categoría", "Stock actual", "Nivel"]],
            body: filasStock,
            theme: "grid",
            headStyles: {
                fillColor: colorSuave,
                textColor: 255
            },
            styles: {
                fontSize: 9
            }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    if (cacheEstimaciones?.producto && cacheEstimaciones?.estimaciones) {
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...colorPrincipal);
        doc.text("Estimaciones con ecuación diferencial", 14, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Producto líder: ${cacheEstimaciones.producto.nombre_producto}`, 14, y);
        y += 6;
        doc.text(
            `Rango analizado: ${formatearFecha(cacheEstimaciones.rango.fecha_minima_db)} a ${formatearFecha(cacheEstimaciones.rango.fecha_limite_actual)}`,
            14,
            y
        );
        y += 6;
        doc.text(`Modelo: ${cacheEstimaciones.procedimiento.modelo_final}`, 14, y);
        y += 8;

        doc.autoTable({
            startY: y,
            head: [["Proyección", "Valor estimado"]],
            body: [
                ["1 día", String(cacheEstimaciones.estimaciones.un_dia)],
                ["1 semana", String(cacheEstimaciones.estimaciones.una_semana)],
                ["1 mes", String(cacheEstimaciones.estimaciones.un_mes)]
            ],
            theme: "grid",
            headStyles: {
                fillColor: [138, 107, 52],
                textColor: 255
            },
            styles: {
                fontSize: 10
            }
        });

        y = doc.lastAutoTable.finalY + 8;

        const pasosTexto = [
            "1) Ecuación base: dy/dt = ky",
            "2) Separación: dy/y = k dt",
            "3) Integración: ln(y) = kt + C",
            "4) Solución general: y = Ce^(kt)",
            `5) C = ${cacheEstimaciones.procedimiento.valor_C}`,
            `6) k = ${cacheEstimaciones.procedimiento.valor_k}`,
            `7) Modelo final: ${cacheEstimaciones.procedimiento.modelo_final}`
        ];

        doc.setFont("helvetica", "bold");
        doc.text("Procedimiento aplicado", 14, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        pasosTexto.forEach((linea) => {
            const lineas = doc.splitTextToSize(linea, 180);
            doc.text(lineas, 14, y);
            y += lineas.length * 5;
        });
    }

    doc.save("reporte-unicafe.pdf");
}

function obtenerFilasTabla(idTbody, cantidadColumnas) {
    const tbody = document.getElementById(idTbody);
    if (!tbody) return [];

    const filas = Array.from(tbody.querySelectorAll("tr"));
    return filas
        .map((fila) => {
            const columnas = Array.from(fila.querySelectorAll("td")).map((td) =>
                td.textContent.trim()
            );
            return columnas.length === cantidadColumnas ? columnas : null;
        })
        .filter(Boolean);
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

function formatearNumeroDecimal(valor) {
    return Number(valor || 0).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "---";

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return "---";

    return fechaObj.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function escapeHtml(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}