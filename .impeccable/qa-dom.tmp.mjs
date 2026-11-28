import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as esperar } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const pasta = fileURLToPath(new URL('../frontend/dist', import.meta.url));
const prefixoPerfil = path.join(os.tmpdir(), 'vorgame-dom-');
const perfil = await mkdtemp(prefixoPerfil);
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const processo = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--disable-extensions', '--remote-debugging-port=0', '--user-data-dir=' + perfil,
  'about:blank'], { windowsHide: true, stdio: 'ignore' });

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
let falhasSimuladas = 0;
let simularEsperaCuradoria = false;

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(value));
}

function api(req, res, url) {
  if (url.searchParams.get('q') === 'Falha controlada') {
    falhasSimuladas += 1;
    return falhasSimuladas === 1
      ? json(res, 503, { message: 'Falha simulada.' })
      : json(res, 200, { resultados: [] });
  }
  const backend = request('http://localhost:3000' + req.url.slice(4), {
    method: req.method, headers: { ...req.headers, host: 'localhost:3000' },
  }, (retorno) => {
    res.writeHead(retorno.statusCode, retorno.headers);
    retorno.pipe(res);
  });
  backend.on('error', () => json(res, 503, { message: 'API local indisponível.' }));
  req.pipe(backend);
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname.startsWith('/api/')) {
    if (simularEsperaCuradoria && url.pathname === '/api/games') await esperar(1_250);
    return api(req, res, url);
  }
  const arquivo = path.resolve(pasta, '.' + url.pathname);
  if (arquivo !== pasta && !arquivo.startsWith(pasta + path.sep)) {
    return res.writeHead(404).end();
  }
  const existe = await stat(arquivo).catch(() => null);
  const alvo = existe?.isFile() ? arquivo : path.join(pasta, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[path.extname(alvo)] || 'application/octet-stream' });
  res.end(await readFile(alvo));
});
await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver));
const origem = 'http://127.0.0.1:' + servidor.address().port;

async function verificar(prova, descricao, limite = 18000) {
  const fim = Date.now() + limite;
  while (Date.now() < fim) {
    const valor = await prova().catch(() => false);
    if (valor) return valor;
    await esperar(95);
  }
  throw new Error('Tempo limite: ' + descricao);
}

const arquivoPorta = path.join(perfil, 'DevToolsActivePort');
const dadosPorta = await verificar(() => readFile(arquivoPorta, 'utf8'), 'iniciar Edge');
const enderecoCdp = 'http://127.0.0.1:' + dadosPorta.split(/\r?\n/)[0];
const aba = await (await fetch(enderecoCdp + '/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(aba.webSocketDebuggerUrl);
await new Promise((resolver, rejeitar) => {
  socket.addEventListener('open', resolver, { once: true });
  socket.addEventListener('error', rejeitar, { once: true });
});
let sequencia = 0;
const fila = new Map();
const erros = [];
socket.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.method === 'Runtime.exceptionThrown') erros.push(msg.params.exceptionDetails.text);
  const pendente = fila.get(msg.id);
  if (!pendente) return;
  fila.delete(msg.id);
  if (msg.error) pendente.rejeitar(new Error(msg.error.message));
  else pendente.resolver(msg.result);
});

function cdp(method, params = {}) {
  const id = ++sequencia;
  const promessa = new Promise((resolver, rejeitar) => fila.set(id, { resolver, rejeitar }));
  socket.send(JSON.stringify({ id, method, params }));
  return promessa;
}

async function avaliar(expressao) {
  const saida = await cdp('Runtime.evaluate', {
    expression: expressao, returnByValue: true, awaitPromise: true,
  });
  if (saida.exceptionDetails) throw new Error(saida.exceptionDetails.exception?.description);
  return saida.result.value;
}

function esperarDOM(expressao, descricao) {
  return verificar(() => avaliar(expressao), descricao);
}

async function abrir(rota, titulo) {
  await cdp('Page.navigate', { url: origem + rota });
  await esperarDOM(
    'location.pathname === ' + JSON.stringify(new URL(rota, origem).pathname)
      + ' && document.querySelector("main h1")?.textContent.trim() === ' + JSON.stringify(titulo),
    'abrir ' + rota,
  );
}

function checarLayout() {
  const h1 = document.querySelector('main h1');
  const forma = document.querySelector('.formulario-busca');
  const ret = (seletor) => {
    const no = document.querySelector(seletor);
    return no ? Math.round(no.getBoundingClientRect().bottom) : null;
  };
  const visivel = (seletor) => getComputedStyle(document.querySelector(seletor)).display !== 'none';
  return {
    largura: innerWidth,
    transbordamento: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    titulo: h1?.textContent,
    titulos: document.querySelectorAll('h1').length,
    desktop: visivel('.cabecalho-desktop'),
    menu: visivel('.cabecalho-movel'),
    busca: forma && ret('.formulario-busca'),
    explorar: ret('.hero-explorar'),
    capa: document.querySelector('.hero-arte img')?.naturalWidth,
    marca: document.querySelector('.marca-vorgame img')?.naturalWidth,
    display: document.fonts.check('700 50px "Barlow Condensed"'),
    corpo: document.fonts.check('400 16px "DM Sans"'),
    artigos: document.querySelectorAll('.grade-jogos > li').length,
    rodape: document.querySelectorAll('footer a[href]').length,
  };
}

async function checar(width, height, mobile) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  simularEsperaCuradoria = !mobile;
  await abrir('/', 'Encontre seu próximo jogo.');
  if (!mobile) {
    const inicial = await avaliar("Array.from(document.querySelectorAll('.grade-jogos img')).map(img => img.getAttribute('src')).sort()");
    assert.deepEqual(inicial, ['/midia/cyberpunk-night-city.webp', '/midia/witcher-3-caminho.webp']);
  }
  await esperarDOM('document.fonts.ready.then(() => document.querySelector(".hero-arte img")?.naturalWidth > 0)', 'arte e fontes');
  await esperarDOM("document.querySelector('.hero-jogo')?.getAttribute('href').startsWith('/jogos/')", 'resolver Cyberpunk 2077');
  await esperarDOM("Array.from(document.querySelectorAll('.grade-jogos a')).every(a => a.getAttribute('href').startsWith('/jogos/'))", 'resolver os quatro jogos');
  simularEsperaCuradoria = false;
  const resultado = await avaliar('(' + checarLayout.toString() + ')()');
  assert.equal(resultado.titulos, 1);
  assert.equal(resultado.transbordamento, 0);
  assert.equal(resultado.menu, mobile);
  assert.equal(resultado.desktop, !mobile);
  assert.ok(resultado.busca <= height && resultado.explorar <= height);
  assert.equal(resultado.artigos, 4);
  assert.deepEqual(await avaliar("Array.from(document.querySelectorAll('.grade-jogos h3')).map(h => h.textContent.trim())"), [
    'Cyberpunk 2077', 'The Binding of Isaac', 'The Witcher 3: Wild Hunt', 'Grand Theft Auto VI',
  ]);
  assert.ok(resultado.display && resultado.corpo && resultado.marca > 0);
  if (!mobile) {
    const destino = await avaliar("document.querySelector('.hero-jogo').getAttribute('href')");
    const alvo = await avaliar("document.elementFromPoint(innerWidth * 0.75, 250)?.closest('.hero-jogo')?.getAttribute('href')");
    assert.equal(alvo, destino);
    assert.equal(await avaliar(`(() => ['.busca-controles button', '.hero-explorar'].every(seletor => {
      const controle = document.querySelector(seletor);
      const ret = controle.getBoundingClientRect();
      const alvo = document.elementFromPoint(ret.x + ret.width/2, ret.y + ret.height/2);
      return controle === alvo || controle.contains(alvo);
    }))()`), true);
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: width * 0.75, y: 250, button: 'left', clickCount: 1 });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: width * 0.75, y: 250, button: 'left', clickCount: 1 });
    await esperarDOM('location.pathname === ' + JSON.stringify(destino) + " && document.querySelector('main h1')?.textContent === 'Cyberpunk 2077'", 'abrir Cyberpunk 2077 ao clicar em Night City');
    console.log('IMAGEM: local desde o primeiro carregamento; clique na paisagem abre ' + destino);
    await abrir('/', 'Encontre seu próximo jogo.');
  }
  console.log('HOME', width, height, JSON.stringify(resultado));
}

async function movimento() {
  await abrir('/', 'Encontre seu próximo jogo.');
  const normal = await avaliar("getComputedStyle(document.querySelector('.hero-arte img')).animationName");
  assert.equal(normal, 'revelar-night-city');
  const ponto = await avaliar(`(() => {
    const primeiro = document.querySelector('.cartao-jogo a');
    primeiro.scrollIntoView({behavior:'instant', block:'center'});
    const r = primeiro.getBoundingClientRect();
    return {x:r.x+r.width/2, y:r.y+r.height/2};
  })()`);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...ponto });
  await esperarDOM("getComputedStyle(document.querySelector('.cartao-jogo h3 svg')).transform !== 'none'", 'transição do cartão no hover');
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion', value:'reduce'}]});
  assert.equal(await avaliar("getComputedStyle(document.querySelector('.hero-arte img')).animationName"), 'none');
  assert.equal(await avaliar("getComputedStyle(document.querySelector('.cartao-jogo h3 svg')).transform"), 'none');
  assert.equal(await avaliar("getComputedStyle(document.documentElement).scrollBehavior"), 'auto');
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion', value:'no-preference'}]});
  console.log('MOVIMENTO: entrada, hover e preferência reduzida confirmados');
}

async function usarPesquisa() {
  await avaliar(`(() => {
    const campo = document.querySelector('[name=q]');
    campo.focus();
  })()`);
  await cdp('Input.insertText', { text: 'Terraria' });
  await avaliar("document.querySelector('.formulario-busca').requestSubmit()");
  const link = await esperarDOM(
    "Array.from(document.querySelectorAll('.pesquisa-resultado')).find(a => a.querySelector('h3').textContent === 'Terraria')?.getAttribute('href')",
    'resultado real de Terraria',
  );
  await avaliar('document.querySelector(".pesquisa-resultado[href=" + ' + JSON.stringify(JSON.stringify(link)) + ' + "]").click()');
  await esperarDOM("document.querySelector('h1')?.textContent === 'Terraria'", 'ficha real');
  assert.equal(await avaliar('location.pathname'), link);
  assert.equal(await avaliar("document.querySelector('.detalhes-voltar').getAttribute('href')"), '/pesquisa?q=Terraria');
  assert.equal(await avaliar("document.querySelectorAll('.detalhes-notas section').length"), 2);
  console.log('API REAL', link, 'Terraria');
}

async function menuMovel() {
  await avaliar(`(() => {
    const botao = document.querySelector('[aria-label="Abrir menu"]');
    botao.focus();
    botao.click();
  })()`);
  await esperarDOM("document.querySelector('[role=dialog]')?.getBoundingClientRect().width > 0", 'menu aberto');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await esperarDOM("!document.querySelector('[role=dialog]') && document.activeElement?.getAttribute('aria-label') === 'Abrir menu'", 'Escape e retorno do foco');
  console.log('MENU móvel: Escape e retorno de foco');
}

async function formularios() {
  for (const [rota, nome, campos] of [['/login', 'Entrar', 2], ['/cadastro', 'Criar conta', 4]]) {
    await abrir(rota, nome);
    const resultado = await avaliar(`(() => {
      const form = document.querySelector('main form');
      const senha = form.querySelector('[name=senha]');
      const botao = form.querySelector('[aria-label="Mostrar senha"]');
      botao.click();
      return {
        campos: form.querySelectorAll('input:required').length,
        rotulados: Array.from(form.querySelectorAll('input')).every(campo => campo.labels.length > 0),
        invalido: !form.checkValidity(),
        largura: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);
    assert.deepEqual(resultado, { campos, rotulados: true, invalido: true, largura: 0 });
    await esperarDOM("document.querySelector('[name=senha]').type === 'text'", 'alternar senha');
  }
  console.log('FORMULÁRIOS: rótulos, obrigatoriedade e alternância da senha');
}

try {
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion', value:'no-preference'}]});
  await checar(1440, 900, false);
  await usarPesquisa();
  await movimento();
  await formularios();
  await checar(390, 844, true);
  await menuMovel();
  await formularios();
  await checar(320, 667, true);
  await abrir('/pesquisa?q=Falha+controlada', 'Pesquisar jogos');
  await esperarDOM("document.querySelector('main [role=alert]')?.textContent.includes('Não foi possível')", 'erro simulado');
  await avaliar("Array.from(document.querySelectorAll('main button')).find(b => b.textContent === 'Tentar novamente').click()");
  await esperarDOM("document.querySelector('main [role=status]')?.textContent.includes('Nenhum jogo encontrado')", 'estado vazio após nova tentativa');
  assert.equal(falhasSimuladas, 2);
  await abrir('/creditos', 'Créditos das imagens');
  assert.equal(await avaliar("document.querySelectorAll('.lista-creditos li').length"), 2);
  await abrir('/status', 'Vorgame');
  await esperarDOM("document.querySelector('main .status--ok')?.textContent.includes('Banco OK')", 'saúde da API');
  assert.deepEqual(erros, []);
  console.log('DOM validado sem capturas: home, busca, ficha, conta, créditos e status.');
} finally {
  socket.close();
  await fetch(enderecoCdp + '/json/close/' + aba.id).catch(() => null);
  servidor.close();
  processo.kill();
  await esperar(500);
  if (path.resolve(perfil).startsWith(path.resolve(prefixoPerfil))) {
    await rm(perfil, { recursive: true, force: true }).catch(() => null);
  }
}
