/**
 * Déplace l'élément à la fin de <body> : il passe au-dessus de tout, et c'est lui seul qui
 * s'imprime (voir la règle @media print de app.css).
 */
export function printable(node: HTMLElement) {
  node.classList.add('print-root');
  document.body.appendChild(node);
  document.body.classList.add('has-print-root');
  return {
    destroy() {
      node.remove();
      document.body.classList.remove('has-print-root');
    },
  };
}
