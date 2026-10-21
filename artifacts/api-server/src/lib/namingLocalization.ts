/** Standalone administrator page: localize presentation without modifying names or input values. */
export function localizeNamingToolPage(html: string): string {
  const script = String.raw`(() => {
    const messages = {
      'Nomear Imagens de Digimons': ['Name Digimon Images', 'Nombrar imágenes de Digimons'],
      '🦕 Nomear Imagens Digimon': ['🦕 Name Digimon Images', '🦕 Nombrar imágenes Digimon'],
      'Todos': ['All', 'Todos'], 'Sem nome': ['Unnamed', 'Sin nombre'],
      'Nomeados': ['Named', 'Nombrados'], '⚠️ Duplicados': ['⚠️ Duplicates', '⚠️ Duplicados'],
      '🔁 Idênticas': ['🔁 Identical', '🔁 Idénticas'],
      'Buscar por arquivo ou nome...': ['Search by file or name...', 'Buscar por archivo o nombre...'],
      'Nome do Digimon...': ['Digimon name...', 'Nombre del Digimon...'],
      '💾 Salvar Todos': ['💾 Save All', '💾 Guardar todos'],
      '⚠️ Nome duplicado em:': ['⚠️ Duplicate name in:', '⚠️ Nombre duplicado en:'],
      '⚠️ Nome duplicado — também em:': ['⚠️ Duplicate name — also in:', '⚠️ Nombre duplicado — también en:'],
      '🔁 Imagem idêntica a:': ['🔁 Image identical to:', '🔁 Imagen idéntica a:'],
      '— pode pular esta!': ['— you can skip this one!', '— ¡puedes omitir esta!'],
      'Nome removido': ['Name removed', 'Nombre eliminado'],
      'Erro ao salvar': ['Unable to save', 'Error al guardar'],
      'Idioma': ['Language', 'Idioma']
    };
    let language = 'pt';
    try { const stored = localStorage.getItem('@omega_language'); if (stored === 'en' || stored === 'es') language = stored; } catch {}
    const translate = (source) => {
      if (language === 'pt') return source;
      const n = language === 'en' ? 0 : 1;
      const trimmed = source.trim();
      let result = messages[trimmed] && messages[trimmed][n];
      if (!result) {
        const count = trimmed.match(/^(Todos|Sem nome|Nomeados|⚠️ Duplicados|🔁 Idênticas)(\s*\(\d+\))$/u);
        if (count) result = messages[count[1]][n] + count[2];
        const progress = trimmed.match(/^(\d+\/\d+) nomeados$/);
        if (progress) result = progress[1] + (n === 0 ? ' named' : ' nombrados');
        const saved = trimmed.match(/^✓ (.+) salvo!$/);
        if (saved) result = '✓ ' + saved[1] + (n === 0 ? ' saved!' : ' guardado');
        const many = trimmed.match(/^✓ (\d+) entradas salvas!$/);
        if (many) result = '✓ ' + many[1] + (n === 0 ? ' entries saved!' : ' entradas guardadas');
        const duplicates = trimmed.match(/^⚠️ Salvando com (\d+) nome\(s\) duplicado\(s\)!$/u);
        if (duplicates) result = n === 0 ? '⚠️ Saving with ' + duplicates[1] + ' duplicate name(s)!' : '⚠️ Guardando con ' + duplicates[1] + ' nombre(s) duplicado(s)';
        const existing = trimmed.match(/^⚠️ "(.+)" já está em: (.+)$/u);
        if (existing) result = '⚠️ "' + existing[1] + '" ' + (n === 0 ? 'already exists in: ' : 'ya existe en: ') + existing[2];
      }
      return result ? source.slice(0, source.length - source.trimStart().length) + result + source.slice(source.trimEnd().length) : source;
    };
    const select = document.createElement('select');
    select.id = 'omega-page-language';
    select.style.cssText = 'background:#1a1a2e;color:#fff;border:1px solid #7c3aed;padding:6px;border-radius:6px;';
    for (const [code, name] of [['pt', 'Português (Brasil)'], ['en', 'English'], ['es', 'Español']]) {
      const option = document.createElement('option'); option.value = code; option.textContent = name; select.append(option);
    }
    select.value = language;
    document.querySelector('header').append(select);
    const originals = new WeakMap();
    const placeholders = new WeakMap();
    const title = document.title;
    const render = () => {
      document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;
      document.title = translate(title);
      select.setAttribute('aria-label', translate('Idioma'));
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement || node.parentElement.closest('script,style,select,input,textarea,.filename')) continue;
        let record = originals.get(node);
        if (!record || node.nodeValue !== record.rendered) record = { source: node.nodeValue, rendered: node.nodeValue };
        const value = translate(record.source);
        record.rendered = value; originals.set(node, record);
        if (node.nodeValue !== value) node.nodeValue = value;
      }
      document.querySelectorAll('input[placeholder]').forEach(input => {
        let record = placeholders.get(input);
        if (!record || input.placeholder !== record.rendered) record = { source: input.placeholder, rendered: input.placeholder };
        record.rendered = translate(record.source); placeholders.set(input, record);
        if (input.placeholder !== record.rendered) input.placeholder = record.rendered;
      });
    };
    select.addEventListener('change', () => { language = select.value; try { localStorage.setItem('@omega_language', language); } catch {} render(); });
    render();
    new MutationObserver(render).observe(document.body, { subtree: true, childList: true, characterData: true });
  })();`;
  return html.replace('</body>', `<script>${script}</script></body>`);
}
