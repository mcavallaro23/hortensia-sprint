
// app.js 1.2.8 FINAL - modo oscuro + diseño móvil + bugs corregidos
window.navigate = function(screen) {
  const screenDiv = document.getElementById('screen');
  if (!screenDiv) return;
  screenDiv.innerHTML = `<p style="padding: 20px;">Navegación activa a: <strong>${screen}</strong><br>(El contenido dinámico será cargado en esta sección).</p>`;
};
