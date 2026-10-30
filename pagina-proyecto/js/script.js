document.addEventListener("DOMContentLoaded", () => {
  // Visor de fotos: zoom (rueda, pellizco, botones, doble clic/toque) y arrastre con mouse o dedo
  const modal = document.getElementById("modal-fullscreen");
  const foto = document.getElementById("foto-grande");
  if (modal && foto) {
    const MIN = 0.5, MAX = 6;
    let escala = 1, x = 0, y = 0, movido = false, recorrido = 0, ultimoToque = 0;
    let previoMedio = null, distInicial = 1, escalaInicial = 1;
    const punteros = new Map(); // dedos (o mouse) que estan tocando la imagen

    const aplicar = () => {
      // El limite evita arrastrar la foto fuera de la pantalla
      const limX = Math.max(0, (foto.offsetWidth * escala - modal.clientWidth) / 2);
      const limY = Math.max(0, (foto.offsetHeight * escala - modal.clientHeight) / 2);
      x = Math.min(Math.max(x, -limX), limX);
      y = Math.min(Math.max(y, -limY), limY);
      foto.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${escala})`;
    };
    // Cambia el zoom manteniendo fijo el punto (px, py) de la pantalla
    const zoom = (nueva, px, py) => {
      const w = modal.clientWidth, h = modal.clientHeight;
      px = px ?? w / 2; py = py ?? h / 2;
      nueva = Math.min(Math.max(MIN, nueva), MAX);
      const f = nueva / escala;
      x += (px - (w / 2 + x)) * (1 - f);
      y += (py - (h / 2 + y)) * (1 - f);
      escala = nueva;
      aplicar();
    };
    const abrir = img => {
      foto.src = img.currentSrc || img.src;
      foto.alt = img.alt;
      escala = 1; x = 0; y = 0; aplicar();
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    };
    const cerrar = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
      punteros.clear();
    };

    document.querySelectorAll(".imagen-contenedor img").forEach(img => img.addEventListener("click", () => abrir(img)));

    // Botones + / - / restablecer (se crean aqui para no tocar el HTML)
    const barra = document.createElement("div");
    barra.className = "visor-controles";
    barra.innerHTML = '<button type="button" data-z="mas" aria-label="Acercar">+</button>' +
      '<button type="button" data-z="menos" aria-label="Alejar">&minus;</button>' +
      '<button type="button" data-z="reset" aria-label="Restablecer"><i class="fas fa-expand"></i></button>';
    barra.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.z === "mas") zoom(escala * 1.4);
      else if (b.dataset.z === "menos") zoom(escala / 1.4);
      else { escala = 1; x = 0; y = 0; aplicar(); }
    });
    modal.appendChild(barra);

    // Rueda del mouse: zoom hacia donde esta el cursor
    modal.addEventListener("wheel", e => {
      e.preventDefault();
      zoom(escala * (e.deltaY > 0 ? 0.9 : 1.1), e.clientX, e.clientY);
    }, { passive: false });

    // Arrastrar (1 dedo / clic sostenido) y pellizcar (2 dedos)
    const iniciarPellizco = () => {
      const [a, b] = [...punteros.values()];
      distInicial = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      escalaInicial = escala;
      previoMedio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    foto.addEventListener("pointerdown", e => {
      e.preventDefault();
      foto.setPointerCapture(e.pointerId);
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 1) { movido = false; recorrido = 0; }
      if (punteros.size === 2) iniciarPellizco();
    });
    foto.addEventListener("pointermove", e => {
      const previo = punteros.get(e.pointerId);
      if (!previo) return;
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 1) {
        const dx = e.clientX - previo.x, dy = e.clientY - previo.y;
        recorrido += Math.abs(dx) + Math.abs(dy);
        if (recorrido > 6) movido = true;
        x += dx; y += dy;
        aplicar();
      } else if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        const medio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        movido = true;
        x += medio.x - previoMedio.x; y += medio.y - previoMedio.y;
        previoMedio = medio;
        zoom(escalaInicial * Math.hypot(a.x - b.x, a.y - b.y) / distInicial, medio.x, medio.y);
      }
    });
    foto.addEventListener("pointerup", e => {
      if (!punteros.delete(e.pointerId)) return;
      // Doble clic / doble toque: acerca o vuelve al tamano normal
      if (punteros.size === 0 && !movido) {
        const ahora = Date.now();
        if (ahora - ultimoToque < 300) {
          if (escala > 1.2) { x = 0; y = 0; zoom(1); } else zoom(2.5, e.clientX, e.clientY);
          ultimoToque = 0;
        } else ultimoToque = ahora;
      }
    });
    foto.addEventListener("pointercancel", e => punteros.delete(e.pointerId));
    foto.addEventListener("dragstart", e => e.preventDefault());

    // Cerrar: boton X, clic en el fondo oscuro o tecla Esc
    const equis = document.getElementById("cerrar-modal");
    if (equis) equis.addEventListener("click", cerrar);
    modal.addEventListener("click", e => { if (e.target === modal) cerrar(); });
    document.addEventListener("keydown", e => {
      if (modal.style.display !== "block") return;
      if (e.key === "Escape") cerrar();
      if (e.key === "+" || e.key === "=") zoom(escala * 1.2);
      if (e.key === "-") zoom(escala / 1.2);
    });
  }

  // Menu hamburguesa (celular)
  const boton = document.getElementById("menu-toggle");
  const menu = document.getElementById("nav-links");
  if (boton && menu) {
    const abrir = estado => {
      menu.classList.toggle("active", estado);
      boton.setAttribute("aria-expanded", estado);
      const icono = boton.querySelector("i");
      icono.classList.toggle("fa-bars", !estado);
      icono.classList.toggle("fa-times", estado);
    };
    boton.addEventListener("click", e => { e.stopPropagation(); abrir(!menu.classList.contains("active")); });
    // "Lugares" solo abre el submenu, no salta al inicio de la pagina
    document.querySelectorAll(".dropdown > a").forEach(a => a.addEventListener("click", e => { if (a.getAttribute("href") === "#") e.preventDefault(); }));
    menu.querySelectorAll("a").forEach(a => {
      if (a.getAttribute("href") !== "#") a.addEventListener("click", () => abrir(false));
    });
    document.addEventListener("click", e => {
      if (!menu.contains(e.target) && !boton.contains(e.target)) abrir(false);
    });
  }
});
