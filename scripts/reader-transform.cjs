/** Add reader-only structure; source document bytes and existing IDs stay intact. */
module.exports = function readerTables(html, outputPath) {
  if (!outputPath || !outputPath.endsWith('.html')) return html;
  const ukrainian = /<html\b[^>]*\blang="uk"/.test(html);
  const label = ukrainian
    ? 'Таблиця: за потреби прокрутіть горизонтально клавішами зі стрілками'
    : 'Table: scroll horizontally with the arrow keys when needed';
  return html.replace(
    /(<article\b[^>]*\bclass="[^"]*\breader-document\b[^"]*"[^>]*>)([\s\S]*?)(<\/article>)/,
    (_, opening, content, closing) => opening + content.replace(
      /<table\b[^>]*>[\s\S]*?<\/table>/g,
      table => `<div class="reader-table-scroll" role="region" tabindex="0" aria-label="${label}">${table}</div>`
    ) + closing
  );
};
