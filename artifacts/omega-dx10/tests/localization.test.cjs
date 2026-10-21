const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const app = path.resolve(__dirname, '..');
const modules = new Map();
const React = require(require.resolve('react', { paths: [app] }));
const { renderToStaticMarkup } = require(require.resolve('react-dom/server', { paths: [app] }));
const alerts = [];
const nativeStub = {
  Text: React.forwardRef(({children, accessibilityLabel}, ref) => React.createElement('span', {ref, 'aria-label':accessibilityLabel}, children)),
  TextInput: React.forwardRef(({placeholder,value}, ref) => React.createElement('input', {ref,placeholder,value,onChange:()=>{}})),
  Alert: {alert: (...args)=>alerts.push(args),prompt: (...args)=>alerts.push(args)},
};
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const localRequire = spec => {
    if (spec === 'react-native') return nativeStub;
    if (spec.startsWith('@/')) { const target=path.join(app,spec.slice(2)); return load(fs.existsSync(target+'.ts')?target+'.ts':target+'.tsx'); }
    if (spec.startsWith('.')) { const target = path.resolve(path.dirname(file), spec); return load(fs.existsSync(target) ? target : target + '.ts'); }
    return require(require.resolve(spec, { paths: [app] }));
  };
  vm.runInNewContext(code, { exports: module.exports, module, require: localRequire, console, Set, Map }, { filename: file });
  return module.exports;
}
const { translations } = load(path.join(app, 'constants/i18n.ts'));
const { supplementalTranslations } = load(path.join(app, 'constants/supplementalTranslations.ts'));
const { localizeText: localize, setDisplayLanguage, getDisplayLanguage, subscribeDisplayLanguage } = load(path.join(app, 'utils/displayLocalization.ts'));

test('all original keys exist in all three languages', () => {
  for (const lang of ['en', 'es']) assert.deepEqual(Object.keys(translations[lang]).sort(), Object.keys(translations.pt).sort());
});
test('DigiFarm, PvP, evolution, server errors and descriptions are translated', () => {
  const cases = [
    ['Sem comida', 'No food', 'Sin comida'],
    ['ASCENSÃO', 'ASCENSION', 'ASCENSIÓN'],
    ['Recompensa semanal', 'Weekly reward', 'Recompensa semanal'],
    ['Usuário ou senha inválidos', 'Invalid username or password', 'Usuario o contraseña incorrectos'],
    ['Não foi possível colocar neste slot.', 'Unable to place in this slot.', 'No se pudo colocar en este espacio.'],
    ['Digimon do universo digital.', 'A Digimon from the digital universe.', 'Un Digimon del universo digital.'],
  ];
  for (const [pt,en,es] of cases) { assert.equal(localize(pt,'pt'),pt); assert.equal(localize(pt,'en'),en); assert.equal(localize(pt,'es'),es); }
});
test('variable templates retain values, item names and numbers', () => {
  assert.equal(localize('Alimentar (12)','en'),'Feed (12)');
  assert.equal(localize('Alimentar (12)','es'),'Alimentar (12)');
  assert.equal(localize('Gastei 4 gemas.','pt'),'Gastei 4 gemas.');
  assert.equal(localize('Gastou 900 gemas.','en'),'Spent 900 gems.');
  assert.equal(localize('💎 +150 Gemas (1ª conclusão)!','es'),'💎 ¡+150 gemas (primera victoria)!');
  assert.equal(localize('Agumon usou Ataque Digital!','en'),'Agumon used Digital Attack!');
  assert.equal(localize('Agumon usou Ataque Digital!','es'),'¡Agumon usó Ataque digital!');
  assert.equal(localize('Você tem 1 comida disponível','en'),'You have 1 food item(s) available');
});
test('indentation, multi-line notices and emoji prefixes survive', () => {
  assert.equal(localize('  Sem comida  ','en'),'  No food  ');
  assert.equal(localize('Sem comida\nRecompensa semanal','en'),'No food\nWeekly reward');
  assert.equal(localize('🏠 Decoração','es'),'🏠 Decoración');
});
test('locale changes invalidate cached translations and notify subscribers', () => {
  let changes=0; const off=subscribeDisplayLanguage(()=>changes++);
  setDisplayLanguage('en'); assert.equal(localize('Sem comida'),'No food');
  setDisplayLanguage('es'); assert.equal(localize('Sem comida'),'Sin comida');
  setDisplayLanguage('es'); assert.equal(changes,2);
  off(); setDisplayLanguage('pt'); assert.equal(getDisplayLanguage(),'pt'); assert.equal(changes,2);
});
test('unknown text, user names, protocol IDs and save keys remain unchanged', () => {
  for(const text of ['dede336','name:Omegamon X','piece_brasao_coragem','custom_313','Agumon','Olá @dede336, vamos jogar às 20h?']) {
    assert.equal(localize(text,'en'),text); assert.equal(localize(text,'es'),text);
  }
});
test('legacy English system text has a Brazilian Portuguese version', () => {
  assert.equal(localize('Something went wrong','pt'),'Ocorreu um erro');
  assert.equal(localize('Go to home screen!','pt'),'Ir para a tela inicial!');
});
test('supplemental entries have both targets and do not introduce variables', () => {
  for (const [source,pair] of Object.entries(supplementalTranslations)) {
    assert.equal(pair.length,2,source);
    for(const target of pair) {
      assert.ok(target.trim(),source);
      const vars = [...source.matchAll(/\{(\w+)\}/g)].map(x=>x[1]);
      for (const variable of target.matchAll(/\{(\w+)\}/g)) assert.ok(vars.includes(variable[1]),source+' → '+target);
    }
  }
});
test('literal t() calls reference real dictionary keys', () => {
  function walk(dir) { for(const entry of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,entry.name); if(entry.isDirectory())walk(p); else if(/\.(ts|tsx)$/.test(p)){
    for(const match of fs.readFileSync(p,'utf8').matchAll(/\bt\(\s*(['"])([^'"]+)\1\s*\)/g)) assert.ok(match[2] in translations.pt,p+': '+match[2]);
  } } }
  walk(path.join(app,'app')); walk(path.join(app,'components'));
});
test('unknown item keys use their display name instead of exposing an internal key', () => {
  const {translate}=load(path.join(app,'constants/i18n.ts'));
  assert.equal(translate('es','item.new_custom_id','Estrela de Ascensão Dourada ⭐'),'Estrela de Ascensão Dourada ⭐');
  assert.equal(localize(translate('es','item.new_custom_id','Estrela de Ascensão Dourada ⭐'),'es'),'Estrella de Ascensión Dorada ⭐');
});
test('template variables containing player text are not translated as game labels', () => {
  assert.equal(localize('Ver perfil de Casa','en'),'View Casa\'s profile');
  assert.equal(localize('Usuário \'Casa\' não encontrado','es'),"Usuario 'Casa' no encontrado");
});

test('rendered labels, adjacent JSX values, placeholders and accessibility follow the locale', () => {
  const {Text, TextInput} = load(path.join(app,'components/localization/LocalizedNative.tsx'));
  setDisplayLanguage('en');
  assert.equal(renderToStaticMarkup(React.createElement(Text, {accessibilityLabel:'Recompensa semanal'}, 'Alimentar (',12,')')), '<span aria-label="Weekly reward">Feed (12)</span>');
  const input=renderToStaticMarkup(React.createElement(TextInput,{placeholder:'Digite sua senha',value:'MinhaSenha123'}));
  assert.ok(input.includes('placeholder="Enter your password"')); assert.ok(input.includes('value="MinhaSenha123"'));
  setDisplayLanguage('es');
  assert.equal(renderToStaticMarkup(React.createElement(Text, null, 'Sem comida')), '<span>Sin comida</span>');
  assert.equal(renderToStaticMarkup(React.createElement(Text, {localize:false}, 'Sem comida')), '<span>Sem comida</span>');
  setDisplayLanguage('pt');
});
test('native alerts translate display text and preserve callbacks and input defaults', () => {
  const {Alert}=load(path.join(app,'components/localization/LocalizedNative.tsx'));
  const callback=()=>{}; setDisplayLanguage('es');
  Alert.alert('Atenção','Gemas insuficientes',[{text:'Cancelar',onPress:callback}]);
  const [title,message,buttons]=alerts.pop(); assert.equal(title,'Atención'); assert.equal(message,'Gemas insuficientes'); assert.equal(buttons[0].text,'Cancelar'); assert.equal(buttons[0].onPress,callback);
  Alert.prompt('Alterar senha','Digite sua senha',callback,'secure-text','MinhaSenha123');
  const prompt=alerts.pop(); assert.equal(prompt[0],'Cambiar contraseña');assert.equal(prompt[2],callback);assert.equal(prompt[4],'MinhaSenha123');
  setDisplayLanguage('pt');
});
test('all built-in Portuguese descriptions and mail messages have English and Spanish display entries', () => {
  let checked = 0;
  for(const file of ['constants/gameData.ts','constants/fases.ts','context/GameContext.tsx','../api-server/src/seed.ts']) {
    const full=path.join(app,file),source=fs.readFileSync(full,'utf8');
    const sf=ts.createSourceFile(full,source,ts.ScriptTarget.Latest,true);
    function visit(node) {
      if(ts.isPropertyAssignment(node) && ['description','title','body','message'].includes(node.name.getText(sf)) && (ts.isStringLiteral(node.initializer)||ts.isNoSubstitutionTemplateLiteral(node.initializer))) {
        const value=node.initializer.text.replace(/\s+/g,' ').trim();
        if(/[áãõçê]|\b(do|de|com|pelo|sua|um|uma|que|seu|dos|das)\b/.test(value)) {
          assert.notEqual(localize(value,'en'),value,full+': '+value);
          assert.notEqual(localize(value,'es'),value,full+': '+value);
          checked++;
        }
      }
      ts.forEachChild(node,visit);
    }
    visit(sf);
  }
  assert.ok(checked>=2000, `Expected full catalogue coverage, got ${checked}`);
});
test('numbers and dates use the selected display locale', () => {
  const {getDisplayLocale}=load(path.join(app,'utils/displayLocalization.ts'));
  for(const [language,locale] of [['pt','pt-BR'],['en','en-US'],['es','es-ES']]) {
    setDisplayLanguage(language);assert.equal(getDisplayLocale(),locale);
  }
  setDisplayLanguage('pt');
});
test('significant message variables are preserved in both target languages', () => {
  const grammaticalSuffixes = {
    'Você tem {0} comida{1} disponível{2}': ['1','2'],
    '{0} estrela{1} de ascensão': ['1'],
    'SUBIU {0} NÍVEL{1}!': ['1'],
  };
  for(const [source,pair] of Object.entries(supplementalTranslations)) {
    const required=[...source.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).filter(key=>!grammaticalSuffixes[source]?.includes(key));
    for(const target of pair)for(const key of required)assert.ok(target.includes('{'+key+'}'),source+' → '+target);
  }
});
