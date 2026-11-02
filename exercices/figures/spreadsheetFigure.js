// Petite feuille HTML autonome, également utilisable dans les exports.
export const escapeSheetText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createSpreadsheetFigure({ orientation, values, results, rows: gridRows, letters: gridLetters, selected = 'B2', renderText = escapeSheetText }) {
  if (!gridRows && (!['horizontal', 'vertical'].includes(orientation) || values.length !== 3 || results.length !== 3)) throw new TypeError('Feuille : orientation et trois valeurs/résultats requis.');
  const horizontal = orientation === 'horizontal';
  const rows = gridRows ?? (horizontal ? [['x', ...values], ['A', ...results]] : [['x','A'], ...values.map((x, i) => [x, results[i]])]);
  const letters = gridLetters ?? (horizontal ? ['A','B','C','D'] : ['A','B']);
  return `<style>
  .spreadsheet-figure{width:100%;max-width:560px;margin:16px auto;color:#17212b;font:clamp(14px,2.5vw,22px)/1.4 system-ui;text-align:center}
  .spreadsheet-figure table{border-collapse:collapse;table-layout:fixed;width:100%;background:#fff}
  .spreadsheet-figure th,.spreadsheet-figure td{border:1px solid #8d9ba8;padding:8px 2px;overflow-wrap:anywhere}
  .spreadsheet-figure th{background:#e3e9ed;font-weight:600}
  .spreadsheet-figure th:first-child{width:32px}
  .spreadsheet-figure .sheet-selected{outline:3px solid #18864b;outline-offset:-3px;background:#e5f4e9;font-weight:700}
  .spreadsheet-figure caption{font-size:.8em;color:#17212b;background:#e3e9ed;padding:4px;margin-bottom:6px}
  </style><div class="spreadsheet-figure"><table aria-label="Feuille de calcul"><caption>${renderText('Cellule sélectionnée : '+selected)}</caption><thead><tr><th aria-label="Coin de la feuille"></th>${letters.map(l=>`<th scope="col">${renderText(l)}</th>`).join('')}</tr></thead><tbody>${rows.map((row,i)=>`<tr><th scope="row">${renderText(i+1)}</th>${row.map((v,j)=>`<td${letters[j]+(i+1)===selected?` class="sheet-selected" aria-label="${selected}, cellule sélectionnée"`:''}${gridRows?` data-cell="${letters[j]+(i+1)}"`:''}>${renderText(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
