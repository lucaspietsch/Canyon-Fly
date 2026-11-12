/* Modo de controle do jogo: "toque" (celular/tablet: joystick e botões na tela, render mais leve) ou "teclado" (notebook/PC).
   Quem decide é a tela inicial (index.html), pelo tamanho da tela e pelo ponteiro principal, antes do jogo abrir:
   ela grava window.CANYONFLY_MODO. Sem essa decisão (outra página que monte o jogo), vale a detecção antiga pelo ponteiro. */
export function ehToque(){
  const m = typeof window !== "undefined" ? window.CANYONFLY_MODO : null;
  if(m === "toque" || m === "teclado") return m === "toque";
  return (typeof matchMedia === "function" && matchMedia("(pointer:coarse)").matches) || (typeof window !== "undefined" && "ontouchstart" in window);
}
