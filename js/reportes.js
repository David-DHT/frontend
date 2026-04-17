const API_BASE = "https://backend-liard-alpha-37.vercel.app/api";
const LIMITE_STOCK_BAJO = 10;

let graficaTopProductos = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = obtenerToken();

    if (!token) {
        alert("Tu sesión no está activa. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        return;
    }

    const btnRecargar = document.getElementById("btnRecargarReportes");
    if (btnRecargar) {
        btnRecargar.addEventListener("click", cargarDashboardReportes);
    }

    // REPORTEEEEEEEE
    const btnGenerarPDF = document.getElementById("btnGenerarPDF");
    if (btnGenerarPDF) {
        btnGenerarPDF.addEventListener("click", generarReportePDF);
    }
    await cargarDashboardReportes();
});

function obtenerToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function obtenerHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obtenerToken()}`
    };
}

async function requestJSON(url, options = {}) {
    const configuracion = {
        method: options.method || "GET",
        headers: {
            ...obtenerHeaders(),
            ...(options.headers || {})
        }
    };

    if (typeof options.body !== "undefined") {
        configuracion.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, configuracion);

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        throw new Error("Sesión expirada");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.message || `Error al consultar ${url}`);
    }

    return data;
}

async function fetchJSON(url) {
    return requestJSON(url, { method: "GET" });
}

function extraerArreglo(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.categorias)) return data.categorias;
    if (Array.isArray(data?.usuarios)) return data.usuarios;
    if (Array.isArray(data?.productos)) return data.productos;
    return [];
}

function formatearPorcentaje(valor) {
    return `${Number(valor || 0).toFixed(1)}%`;
}

function escapeHTML(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function obtenerNombreCategoria(item) {
    return item.nombre_categoria || item.categoria_nombre || item.categoria || "Sin categoría";
}

function obtenerNombreProductoInventario(item) {
    return item.nombre_producto || item.producto || item.nombre || "Producto";
}

function obtenerStock(item) {
    return Number(item.stock_actual ?? item.stock ?? item.cantidad ?? 0);
}

function obtenerColorDinamico(index, total) {
    const baseHue = 28;
    const step = total > 1 ? 28 / (total - 1) : 0;
    const lightness = 30 + (index * 3);
    return `hsl(${baseHue + (index * step)}, 58%, ${Math.min(lightness, 72)}%)`;
}

async function cargarDashboardReportes() {
    try {
        mostrarEstadoGrafica("Cargando información de ventas...");
        await Promise.all([
            cargarContadoresGenerales(),
            cargarTopProductosMasVendidos(),
            cargarProductosStockBajo(),
            cargarOpiniones()
        ]);
    } catch (error) {
        console.error("Error al cargar dashboard de reportes:", error);
        mostrarEstadoGrafica("No se pudo cargar la información del panel.");
    }
}

async function cargarContadoresGenerales() {
    try {
        const [categoriasData, productosData, usuariosData] = await Promise.all([
            fetchJSON(`${API_BASE}/categorias`),
            fetchJSON(`${API_BASE}/productos`),
            fetchJSON(`${API_BASE}/usuarios`)
        ]);

        const categorias = extraerArreglo(categoriasData);
        const productos = extraerArreglo(productosData);
        const usuarios = extraerArreglo(usuariosData);

        document.getElementById("totalCategorias").textContent = categorias.length;
        document.getElementById("totalProductos").textContent = productos.length;
        document.getElementById("totalUsuarios").textContent = usuarios.length;
    } catch (error) {
        console.error("Error al cargar contadores generales:", error);
        document.getElementById("totalCategorias").textContent = "--";
        document.getElementById("totalProductos").textContent = "--";
        document.getElementById("totalUsuarios").textContent = "--";
    }
}

async function cargarTopProductosMasVendidos() {
    const tbody = document.getElementById("tablaTopProductos");
    const resumen = document.getElementById("resumenTopProductos");
    const tituloTop = document.getElementById("productoMasVendido");
    const textoTop = document.getElementById("textoProductoMasVendido");

    try {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4">Analizando ventas registradas...</td>
            </tr>
        `;

        const responseData = await fetchJSON(`${API_BASE}/ventas/top-productos`);
        const rankingBD = extraerArreglo(responseData);

        if (!rankingBD || !rankingBD.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4">No se encontraron productos vendidos.</td>
                </tr>
            `;
            resumen.textContent = "No fue posible calcular el top de productos.";
            tituloTop.textContent = "---";
            textoTop.textContent = "Sin datos disponibles";
            destruirGrafica();
            mostrarEstadoGrafica("No se encontraron productos vendidos.");
            return;
        }

        const ranking = rankingBD.map(item => ({
            nombre: item.nombre || "Producto sin nombre",
            cantidad: Number(item.cantidad || 0)
        }));

        const totalTopVentas = ranking.reduce((sum, item) => sum + item.cantidad, 0);
        const rankingConPorcentaje = ranking.map((item) => ({
            ...item,
            porcentaje: totalTopVentas > 0 ? (item.cantidad / totalTopVentas) * 100 : 0
        }));

        const productoTop = rankingConPorcentaje[0];

        tituloTop.textContent = productoTop.nombre;
        textoTop.textContent = `${productoTop.cantidad} unidades vendidas (${formatearPorcentaje(productoTop.porcentaje)})`;

        tbody.innerHTML = rankingConPorcentaje.map((item, index) => `
            <tr>
                <td><span class="top-pill">#${index + 1}</span></td>
                <td>${escapeHTML(item.nombre)}</td>
                <td>${item.cantidad}</td>
                <td>${formatearPorcentaje(item.porcentaje)}</td>
            </tr>
        `).join("");

        resumen.innerHTML = `
            El producto con mayor salida es <strong>${escapeHTML(productoTop.nombre)}</strong>,
            con <strong>${productoTop.cantidad} unidades vendidas</strong>, lo que representa
            <strong>${formatearPorcentaje(productoTop.porcentaje)}</strong> del total concentrado
            en el top 10 de productos más vendidos.
        `;

        renderizarGraficaTopProductos(rankingConPorcentaje);
        mostrarEstadoGrafica("Gráfica actualizada con base en ventas activas registradas.");
    } catch (error) {
        console.error("Error al cargar top de productos más vendidos:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4 text-danger">No se pudo cargar el ranking de ventas.</td>
            </tr>
        `;

        resumen.textContent = "No fue posible generar el resumen del top de productos.";
        tituloTop.textContent = "---";
        textoTop.textContent = "Error al procesar información";
        destruirGrafica();
        mostrarEstadoGrafica("Ocurrió un error al generar la gráfica.");
    }
}

function renderizarGraficaTopProductos(data) {
    const canvas = document.getElementById("graficaTopProductos");
    if (!canvas) return;

    destruirGrafica();

    const labels = data.map((item) => item.nombre);
    const porcentajes = data.map((item) => Number(item.porcentaje.toFixed(2)));
    const colores = data.map((_, index) => obtenerColorDinamico(index, data.length));

    graficaTopProductos = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                label: "Participación de ventas (%)",
                data: porcentajes,
                backgroundColor: colores,
                borderColor: "#ffffff",
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "58%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 14,
                        padding: 16,
                        font: {
                            size: 12,
                            weight: "600"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const item = data[context.dataIndex];
                            return `${item.nombre}: ${formatearPorcentaje(item.porcentaje)} (${item.cantidad} unidades)`;
                        }
                    }
                }
            }
        }
    });
}

function destruirGrafica() {
    if (graficaTopProductos) {
        graficaTopProductos.destroy();
        graficaTopProductos = null;
    }
}

function mostrarEstadoGrafica(texto) {
    const estado = document.getElementById("estadoGrafica");
    if (estado) {
        estado.textContent = texto;
    }
}

async function cargarProductosStockBajo() {
    const tbody = document.getElementById("tablaStockBajo");
    const contador = document.getElementById("contadorStockBajo");

    try {
        const inventarioData = await fetchJSON(`${API_BASE}/inventario`);
        const inventario = extraerArreglo(inventarioData);

        const stockBajo = inventario
            .map((item) => ({
                nombre: obtenerNombreProductoInventario(item),
                categoria: obtenerNombreCategoria(item),
                stock: obtenerStock(item)
            }))
            .filter((item) => item.stock <= LIMITE_STOCK_BAJO)
            .sort((a, b) => a.stock - b.stock);

        contador.textContent = `${stockBajo.length} en riesgo`;

        if (!stockBajo.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4">
                        No hay productos con stock bajo por el momento.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = stockBajo.map((item) => {
            const nivelClase = item.stock <= 3 ? "critico" : "bajo";
            const nivelTexto = item.stock <= 3 ? "Crítico" : "Bajo";

            return `
                <tr>
                    <td>${escapeHTML(item.nombre)}</td>
                    <td>${escapeHTML(item.categoria)}</td>
                    <td><span class="stock-value">${item.stock}</span></td>
                    <td>
                        <span class="stock-level ${nivelClase}">
                            ${nivelTexto}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error("Error al cargar productos con stock bajo:", error);

        contador.textContent = "Error";
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4 text-danger">
                    No se pudo cargar el inventario crítico.
                </td>
            </tr>
        `;
    }
}

async function cargarOpiniones() {
    const contenedor = document.getElementById("listaOpiniones");
    const contador = document.getElementById("contadorOpiniones");

    if (!contenedor || !contador) return;

    try {
        const data = await fetchJSON(`${API_BASE}/reportes/opiniones`);
        const opiniones = extraerArreglo(data);

        contador.textContent = `${opiniones.length} registradas`;

        if (!opiniones.length) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    No hay opiniones registradas por el momento.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = opiniones.map((opinion) => `
            <article class="opinion-item">
                <div class="opinion-top">
                    <div class="opinion-user">
                        <div class="opinion-avatar">
                            <i class="bi bi-chat-left-text-fill"></i>
                        </div>
                        <div>
                            <h3>${escapeHTML(opinion.nombreUsuario || "Usuario")}</h3>
                            <span>Opinión #${opinion.idOpinion}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="btn-delete-opinion"
                        onclick="eliminarOpinion(${opinion.idOpinion})"
                        title="Eliminar opinión"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>

                <p class="opinion-text">
                    ${escapeHTML(opinion.sugerencia || "Sin contenido")}
                </p>
            </article>
        `).join("");
    } catch (error) {
        console.error("Error al cargar opiniones:", error);
        contador.textContent = "Error";
        contenedor.innerHTML = `
            <div class="empty-state text-danger">
                No se pudieron cargar las opiniones.
            </div>
        `;
    }
}

async function eliminarOpinion(idOpinion) {
    const confirmado = confirm("¿Deseas eliminar esta opinión?");

    if (!confirmado) return;

    try {
        await requestJSON(`${API_BASE}/reportes/opiniones/${idOpinion}`, {
            method: "DELETE"
        });

        await cargarOpiniones();
    } catch (error) {
        console.error("Error al eliminar opinión:", error);
        alert(error.message || "No se pudo eliminar la opinión.");
    }
}

// ==========================================
// MÓDULO DE GENERACIÓN DE PDF
// ==========================================

function generarReportePDF() {
    // 1. Inicializar jsPDF (Lo que te recomendó tu compañero)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 2. Título y Fecha
    const fechaActual = new Date().toLocaleDateString("es-MX");
    doc.setFontSize(20);
    doc.setTextColor(92, 58, 33); // Color café oscuro (opcional)
    doc.text("Reporte Inteligente - UNICAFE", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100); // Gris
    doc.text(`Fecha de generación: ${fechaActual}`, 14, 30);

    // 3. Extraer contadores generales del DOM
    const totalCat = document.getElementById("totalCategorias").innerText;
    const totalProd = document.getElementById("totalProductos").innerText;
    const totalUsu = document.getElementById("totalUsuarios").innerText;
    const prodEstrella = document.getElementById("productoMasVendido").innerText;

    // 4. Imprimir resumen
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text("Resumen General:", 14, 45);
    
    doc.setFontSize(12);
    doc.text(`• Categorías activas: ${totalCat}`, 14, 53);
    doc.text(`• Productos en catálogo: ${totalProd}`, 14, 60);
    doc.text(`• Usuarios registrados: ${totalUsu}`, 14, 67);
    doc.text(`• Producto estrella: ${prodEstrella}`, 14, 74);

    // 5. Tabla: Top 10 Productos
    doc.setFontSize(14);
    doc.text("Ranking Detallado de Ventas (Top 10)", 14, 90);

    doc.autoTable({
        startY: 95,
        head: [['#', 'Producto', 'Unidades Vendidas', 'Participación']],
        body: extraerDatosTabla("tablaTopProductos"),
        theme: 'striped',
        headStyles: { fillColor: [123, 85, 49] }, // Color café UNICAFE
    });

    // 6. Tabla: Stock Bajo
    // Calculamos dónde terminó la tabla anterior para que no se encimen
    let posicionYFinal = doc.lastAutoTable.finalY + 15; 

    doc.setFontSize(14);
    doc.text("Monitoreo de Inventario (Stock Bajo)", 14, posicionYFinal);

    doc.autoTable({
        startY: posicionYFinal + 5,
        head: [['Producto', 'Categoría', 'Stock Actual', 'Nivel']],
        body: extraerDatosTabla("tablaStockBajo"),
        theme: 'striped',
        headStyles: { fillColor: [180, 50, 50] }, // Color rojo/alerta
    });

    // 7. Descargar el archivo
    doc.save(`Reporte_UNICAFE_${fechaActual.replace(/\//g, "-")}.pdf`);
}

// Función auxiliar: Lee una tabla de tu HTML y la convierte en arreglo para jsPDF
function extraerDatosTabla(idTbody) {
    const tbody = document.getElementById(idTbody);
    const filas = tbody.querySelectorAll("tr");
    const datos = [];

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td, th");
        // Filtramos la fila de "Cargando..." o "No hay datos" (tienen colspan)
        if (celdas.length > 1 && !celdas[0].hasAttribute("colspan")) {
            const filaDatos = Array.from(celdas).map(celda => celda.innerText.trim());
            datos.push(filaDatos);
        }
    });

    // Si la tabla está vacía, devolvemos un mensaje
    if (datos.length === 0) {
        return [["Sin datos", "-", "-", "-"]];
    }

    return datos;
}

window.eliminarOpinion = eliminarOpinion;