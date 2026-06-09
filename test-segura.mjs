import { chromium } from 'playwright';
import { readFileSync } from 'fs';

// Lê credenciais do .env.local
const env = readFileSync('/Users/luizcruz/System_seguraai/.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)`, 'm'))?.[1]?.trim();

const BASE = 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const results = [];

function log(status, msg) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  results.push(`${icon} ${msg}`);
  console.log(`${icon} ${msg}`);
}

try {
  // ── Teste 1: raiz redireciona para /login ──────────────────
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const url1 = page.url();
  url1.includes('/login')
    ? log('PASS', `Raiz redireciona para login (${url1})`)
    : log('FAIL', `Raiz não redirecionou para login — está em: ${url1}`);

  // ── Teste 2: tela de login renderiza corretamente ──────────
  const loginTitle = await page.locator('h1').textContent().catch(() => '');
  loginTitle.includes('Segura Pay')
    ? log('PASS', 'Tela de login renderizou com título correto')
    : log('FAIL', `Título inesperado na tela de login: "${loginTitle}"`);

  const tabLogin = await page.locator('button', { hasText: 'login' }).isVisible().catch(() => false);
  tabLogin
    ? log('PASS', 'Aba "login" visível')
    : log('FAIL', 'Aba "login" não encontrada');

  // Screenshot da tela de login
  await page.screenshot({ path: '/tmp/01-login.png', fullPage: true });
  log('INFO', 'Screenshot: /tmp/01-login.png');

  // ── Teste 3: /perfil sem login redireciona para /login ─────
  await page.goto(`${BASE}/perfil`, { waitUntil: 'networkidle' });
  const url3 = page.url();
  url3.includes('/login')
    ? log('PASS', `/perfil sem sessão → redirecionou para login (${url3})`)
    : log('FAIL', `/perfil sem sessão → destino inesperado: ${url3}`);

  // ── Teste 4: login com credencial de teste ─────────────────
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  // Usa o e-mail do usuário do projeto
  const testEmail = 'lucianosantos0202@gmail.com';
  log('INFO', `Tentando login com ${testEmail} (sem senha real — apenas verificando fluxo)`);

  // Preenche e-mail e senha inválida para confirmar mensagem de erro
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', 'senha-errada-teste');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  const erroMsg = await page.locator('text=incorretos').isVisible().catch(() => false);
  erroMsg
    ? log('PASS', 'Senha errada exibe mensagem "E-mail ou senha incorretos"')
    : log('FAIL', 'Mensagem de erro de senha não apareceu');

  await page.screenshot({ path: '/tmp/02-login-erro.png', fullPage: true });
  log('INFO', 'Screenshot: /tmp/02-login-erro.png');

  // ── Teste 5: verificar se /nova-transacao protegida ────────
  // Limpa cookies para garantir sessão zerada
  await page.context().clearCookies();
  await page.goto(`${BASE}/nova-transacao`, { waitUntil: 'networkidle' });
  const url5 = page.url();
  url5.includes('/login')
    ? log('PASS', `/nova-transacao sem sessão → redirecionou para login`)
    : log('FAIL', `/nova-transacao sem sessão → destino inesperado: ${url5}`);

  // ── Teste 6: tab cadastro renderiza campos corretos ────────
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("cadastro")');
  await page.waitForTimeout(300);

  const nomeField = await page.locator('input[name="name"]').isVisible().catch(() => false);
  const senhaField = await page.locator('input[name="password"]').isVisible().catch(() => false);
  nomeField && senhaField
    ? log('PASS', 'Tab cadastro tem campos nome + senha')
    : log('FAIL', `Tab cadastro — nome: ${nomeField}, senha: ${senhaField}`);

  await page.screenshot({ path: '/tmp/03-cadastro.png', fullPage: true });
  log('INFO', 'Screenshot: /tmp/03-cadastro.png');

  // ── Teste 7: indicador de força de senha ──────────────────
  await page.fill('input[name="password"]', 'Abc1');
  await page.waitForTimeout(300);
  const strengthBar = await page.locator('.h-1.bg-\\[\\#E4E8F0\\]').isVisible().catch(() => false);
  const rules = await page.locator('text=mínimo 8 caracteres').isVisible().catch(() => false);
  rules
    ? log('PASS', 'Indicador de força de senha aparece')
    : log('FAIL', 'Indicador de força de senha não encontrado');

  await page.fill('input[name="password"]', 'MinhaSenh@123');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/04-senha-forte.png', fullPage: true });
  log('INFO', 'Screenshot: /tmp/04-senha-forte.png');

} catch (err) {
  log('FAIL', `Erro inesperado: ${err.message}`);
} finally {
  await browser.close();
}

console.log('\n─── Resultado ───');
results.forEach(r => console.log(r));
const fails = results.filter(r => r.startsWith('❌')).length;
const passes = results.filter(r => r.startsWith('✅')).length;
console.log(`\n${passes} passes · ${fails} falhas`);
