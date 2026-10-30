// =====================================================================
//  PÁGINA DE OPINIONES
//  1) Envía el formulario a un servicio gratuito que lo reenvía al correo del equipo.
//  2) Muestra las opiniones que el equipo decida publicar.
//  (Una página estática no puede guardar datos por sí sola; por eso usamos ese servicio.)
// =====================================================================

// ---- CONFIGURACIÓN: es lo único que hay que cambiar ----
// Clave gratuita de https://web3forms.com : escribes el correo del equipo y te la envían.
const CLAVE_ENVIO = "";
const URL_ENVIO = "https://api.web3forms.com/submit";

// Opiniones que quieren mostrar en la página (después de leerlas y aprobarlas).
// Para agregar una, quita las // de la línea de ejemplo y cambia los textos.
// Si la lista está vacía, la sección "Lo que nos han dicho" no aparece.
const OPINIONES_PUBLICAS = [
  // { nombre: "María P.", perfil: "Habitante", texto: "Me gustaría ver más fotos antiguas de la plaza." },
];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-opinion");
  const estado = document.getElementById("estado-envio");
  const boton = document.getElementById("btn-enviar");
  const mensaje = document.getElementById("mensaje");
  const contador = document.getElementById("contador");

  // Muestra un aviso verde (tipo "ok") o rojo (tipo "error") debajo del botón
  const avisar = (tipo, texto) => {
    estado.className = "estado-envio " + tipo;
    estado.textContent = texto;
  };

  // Contador de caracteres del mensaje
  const contar = () => { contador.textContent = mensaje.value.length + " / " + mensaje.maxLength; };
  mensaje.addEventListener("input", contar);
  contar();

  // Envío del formulario
  form.addEventListener("submit", async evento => {
    evento.preventDefault(); // evita que el navegador recargue la página

    // Trampa para robots: una persona nunca llena este campo oculto
    if (form.elements["web_site"].value) { form.reset(); contar(); return; }

    if (!CLAVE_ENVIO) {
      avisar("error", "El envío todavía no está configurado: falta la clave en js/opiniones.js.");
      return;
    }

    const datos = new FormData(form);   // junta todos los campos del formulario
    datos.delete("web_site");
    datos.append("access_key", CLAVE_ENVIO);

    boton.disabled = true;
    boton.textContent = "Enviando…";
    try {
      const respuesta = await fetch(URL_ENVIO, { method: "POST", body: datos, headers: { Accept: "application/json" } });
      if (!respuesta.ok) throw new Error("Respuesta " + respuesta.status);
      form.reset(); contar();
      avisar("ok", "¡Gracias por tu opinión! Nos ayuda a mejorar la página y a servir mejor a la comunidad.");
    } catch (error) {
      avisar("error", "No pudimos enviar tu opinión. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      boton.disabled = false;
      boton.textContent = "Enviar opinión";
    }
  });

  // Opiniones publicadas por el equipo
  if (OPINIONES_PUBLICAS.length) {
    const seccion = document.getElementById("opiniones-publicas");
    const lista = document.getElementById("lista-opiniones");
    OPINIONES_PUBLICAS.forEach(o => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "opinion-card";
      const texto = document.createElement("p");
      texto.textContent = "“" + o.texto + "”";   // textContent evita que se cuele código malicioso
      const autor = document.createElement("div");
      autor.className = "opinion-autor";
      autor.textContent = o.nombre + (o.perfil ? " · " + o.perfil : "");
      tarjeta.append(texto, autor);
      lista.appendChild(tarjeta);
    });
    seccion.hidden = false;
  }
});
