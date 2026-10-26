// =====================================================================
//  POKÉDEX DOS GURI
//  1) Lista de Pokémon (PokeAPI), busca e efeitos
//  2) Conta e favoritos (API do professor - OutSystems)
//  3) Pokébola + ficha da Pokédex ao clicar num card
// =====================================================================


// ===================== CORES DOS TIPOS (cards) =====================
const typeColors = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030",
  grass: "#78C850", ice: "#98D8D8", fighting: "#C03028", poison: "#A040A0",
  ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848",
  steel: "#B8B8D0", fairy: "#EE99AC"
};

// ===================== CONFIGURAÇÕES =====================
const pokeApiBase = "https://pokeapi.co/api/v2";
const totalPokemons = 151; // Geração 1
const tamanhoLote = 20;    // quantos detalhes buscar em paralelo por vez

const apiBase = "https://personal-tp6a9zfc.outsystemscloud.com/Pokedex/rest/Pokede";
const chavePessoa = "pokedex-guri-person";

// ===================== ESTADO =====================
let pokemons = [];            // preenchido pela PokeAPI
let carregandoLista = true;   // true enquanto a PokeAPI ainda está respondendo
let pessoa = null;            // { guid, username, name }
let favoritosIds = [];        // ids (number) favoritados pela pessoa logada
let mostrandoFavoritos = false;
let timerDigitacao = null;

// ===================== ELEMENTOS DA PÁGINA =====================
// (statusEl em vez de "status" porque window.status já existe no navegador)
const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("search");
const subtitulo = document.getElementById("subtitulo");

const favToggleBtn = document.getElementById("fav-toggle");
const favCountEl = document.getElementById("fav-count");
const accountLoggedOut = document.getElementById("account-logged-out");
const accountLoggedIn = document.getElementById("account-logged-in");
const signupFields = document.getElementById("signup-fields");
const usernameInput = document.getElementById("username-input");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const greetingText = document.getElementById("greeting-text");
const accountMsg = document.getElementById("account-msg");


// =====================================================================
//  1) LISTA, BUSCA E EFEITOS
// =====================================================================

// PEGAR IMAGEM POKÉMON
function pegarImagem(id) {
  return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" + id + ".png";
}

// TAGS DO TIPO
function criarBadgesTipos(tipos) {
  let html = "";
  for (let i = 0; i < tipos.length; i++) {
    const tipo = tipos[i];
    const cor = typeColors[tipo] || "#888";
    html += `<span class="type-badge" style="background:${cor}">${tipo}</span>`;
  }
  return html;
}

// VERIFICA SE UM POKÉMON ESTÁ FAVORITADO
function estaFavoritado(id) {
  return favoritosIds.indexOf(id) !== -1;
}

// SHAKE: reinicia a animação mesmo se já tiver rodado
function shakeEffect(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

// EFEITO DE DIGITAÇÃO
function efeitoDigitacao(elemento, texto, velocidade = 60) {
  clearInterval(timerDigitacao);
  elemento.textContent = "";
  let i = 0;
  timerDigitacao = setInterval(function () {
    elemento.textContent += texto.charAt(i);
    i++;
    if (i >= texto.length) clearInterval(timerDigitacao);
  }, velocidade);
}

// MENSAGEM QUANDO NÃO TEM NADA PARA MOSTRAR
function mensagemVazia() {
  if (!mostrandoFavoritos) return "Nenhum Pokémon encontrado.";
  if (!pessoa) return "Entre com um usuário para ver seus favoritos.";
  if (favoritosIds.length === 0) return "Você ainda não favoritou nenhum Pokémon.";
  return "Nenhum favorito corresponde à busca.";
}

// RENDERIZA OS CARDS
// animar = false quando só estamos atualizando (ex: favoritou) para os cards não "piscarem" de novo
function renderGrid(lista, animar = true) {
  gridEl.innerHTML = "";

  if (lista.length === 0) {
    if (carregandoLista) return; // ainda carregando: não mostra "nada encontrado" cedo demais
    gridEl.innerHTML = '<div class="empty-msg">' + mensagemVazia() + "</div>";
    statusEl.textContent = "0 Pokémon(s) encontrado(s)";
    shakeEffect(statusEl);
    return;
  }

  for (let i = 0; i < lista.length; i++) {
    const p = lista[i];
    const favorito = estaFavoritado(p.id);

    const card = document.createElement("div");
    card.className = animar ? "card fade-in" : "card";
    card.dataset.id = p.id;
    card.dataset.nome = p.name;
    if (animar) card.style.animationDelay = (Math.min(i, 24) * 0.04) + "s";

    card.innerHTML = `
      <button class="fav-btn ${favorito ? "active" : ""}" data-id="${p.id}" title="Favoritar" aria-label="Favoritar ${p.name}">${favorito ? "★" : "☆"}</button>
      <img src="${pegarImagem(p.id)}" alt="${p.name}">
      <div class="num">#${String(p.id).padStart(3, "0")}</div>
      <div class="name">${p.name}</div>
      <div class="types">${criarBadgesTipos(p.types)}</div>
    `;

    // ZOOM na imagem ao passar o mouse
    const img = card.querySelector("img");
    img.style.transition = "transform 0.3s ease";
    img.addEventListener("mouseenter", function () { img.style.transform = "scale(1.15)"; });
    img.addEventListener("mouseleave", function () { img.style.transform = "scale(1)"; });

    // FAVORITAR (stopPropagation: clicar na estrela NÃO abre a pokédex nem faz o pulso)
    const botaoFavorito = card.querySelector(".fav-btn");
    botaoFavorito.addEventListener("click", function (e) {
      e.stopPropagation();
      alternarFavorito(p, botaoFavorito);
    });

    // PULSO DE COR ao clicar no card
    card.addEventListener("click", function () {
      card.style.transition = "box-shadow 0.3s ease";
      card.style.boxShadow = "0 0 20px 5px gold";
      setTimeout(function () { card.style.boxShadow = "none"; }, 400);
    });

    gridEl.appendChild(card);
  }

  statusEl.textContent = lista.length + " Pokémon(s) encontrado(s)";
}

// MONTA A LISTA ATUAL RESPEITANDO A BUSCA E O MODO FAVORITOS
function listaAtual() {
  const texto = searchInput.value.toLowerCase();
  const base = mostrandoFavoritos
    ? pokemons.filter(function (p) { return estaFavoritado(p.id); })
    : pokemons;

  if (!texto) return base;

  return base.filter(function (p) {
    return p.name.toLowerCase().includes(texto);
  });
}

function atualizarGrid(animar = true) {
  renderGrid(listaAtual(), animar);
}

// Atualiza só as estrelas que já estão na tela (sem redesenhar os cards)
function atualizarBotoesFavorito() {
  const botoes = document.querySelectorAll(".fav-btn");
  for (let i = 0; i < botoes.length; i++) {
    const ativo = estaFavoritado(Number(botoes[i].dataset.id));
    botoes[i].classList.toggle("active", ativo);
    botoes[i].textContent = ativo ? "★" : "☆";
  }
}

// BUSCA POKÉMON POR NOME
searchInput.addEventListener("input", function () {
  atualizarGrid();

  // Scroll suave até o grid
  gridEl.scrollIntoView({ behavior: "smooth" });
});


// ===================== POKEAPI (dados dos Pokémon) =====================

// BUSCA OS DETALHES (id, nome, tipos) DE UM POKÉMON PELA URL DA POKEAPI
async function buscarDetalhesPokemon(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar " + url);
  const dados = await res.json();
  return {
    id: dados.id,
    name: dados.name,
    types: dados.types.map(function (t) { return t.type.name; })
  };
}

// CARREGA OS PRIMEIROS "totalPokemons" DA POKEAPI, EM LOTES
async function carregarPokemonsDaPokeApi() {
  statusEl.textContent = "Carregando lista de Pokémon...";

  const res = await fetch(pokeApiBase + "/pokemon?limit=" + totalPokemons);
  if (!res.ok) throw new Error("Falha ao buscar a lista");
  const dados = await res.json();
  const lista = dados.results; // [{ name, url }, ...]

  for (let i = 0; i < lista.length; i += tamanhoLote) {
    const lote = lista.slice(i, i + tamanhoLote);

    const detalhes = await Promise.all(lote.map(function (p) {
      return buscarDetalhesPokemon(p.url).catch(function () { return null; });
    }));

    for (let j = 0; j < detalhes.length; j++) {
      if (detalhes[j]) pokemons.push(detalhes[j]);
    }

    statusEl.textContent = "Carregando... " + pokemons.length + " de " + totalPokemons;
  }

  pokemons.sort(function (a, b) { return a.id - b.id; });
}


// =====================================================================
//  2) CONTA E FAVORITOS (API DO PROFESSOR - OUTSYSTEMS)
// =====================================================================

// ---- sessão salva no navegador (só guarda o guid, nunca os favoritos) ----
function lerPessoaSalva() {
  try { return JSON.parse(localStorage.getItem(chavePessoa)); } catch (e) { return null; }
}
function salvarPessoa(p) {
  try { localStorage.setItem(chavePessoa, JSON.stringify(p)); } catch (e) { /* sem storage: segue sem lembrar */ }
}
function apagarPessoaSalva() {
  try { localStorage.removeItem(chavePessoa); } catch (e) { /* noop */ }
}

// ---- chamadas da API ----
function mostrarMensagemConta(texto) {
  accountMsg.textContent = texto;
  accountMsg.classList.toggle("show", Boolean(texto));
}

async function apiGuidPorUsername(username) {
  const res = await fetch(apiBase + "/GuidByUsername?Username=" + encodeURIComponent(username));
  if (!res.ok) return null;
  const texto = (await res.text()).trim().replace(/^"|"$/g, "");
  return texto || null;
}

async function apiCriarPessoa(dados) {
  const res = await fetch(apiBase + "/Person", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Name: dados.nome,
      Surename: dados.sobrenome,
      Username: dados.username,
      Birthday: dados.nascimento
    })
  });
  if (!res.ok) throw new Error("Falha ao criar conta");
  const texto = (await res.text()).trim();
  return texto.replace(/^"|"$/g, "");
}

async function apiPessoaPorGuid(guid) {
  const res = await fetch(apiBase + "/PersonByGuid?Guid=" + encodeURIComponent(guid));
  if (!res.ok) return null;
  return res.json();
}

async function apiFavoritosDoServidor(guid) {
  const res = await fetch(apiBase + "/FavoritosByGuidPerson?GuidPerson=" + encodeURIComponent(guid));
  if (!res.ok) return [];
  return res.json();
}

async function apiFavoritar(guid, pokemonId) {
  const res = await fetch(apiBase + "/FavoritarPokemon?GuidPerson=" + encodeURIComponent(guid) + "&PokemonGuid=" + encodeURIComponent(pokemonId), { method: "POST" });
  if (!res.ok) throw new Error("Falha ao favoritar");
}

async function apiDesfavoritar(guid, pokemonId) {
  const res = await fetch(apiBase + "/DesfavoritarPokemon?GuidPerson=" + encodeURIComponent(guid) + "&PokemonGuid=" + encodeURIComponent(pokemonId), { method: "DELETE" });
  if (!res.ok) throw new Error("Falha ao desfavoritar");
}

// ---- telas de conta ----
function mostrarContaLogada(nome) {
  accountLoggedOut.style.display = "none";
  signupFields.classList.remove("show");
  accountLoggedIn.classList.add("show");
  greetingText.textContent = "Olá, " + (nome || pessoa.username);
}

function mostrarContaDeslogada() {
  accountLoggedOut.style.display = "flex";
  signupFields.classList.remove("show");
  accountLoggedIn.classList.remove("show");
  usernameInput.value = "";
}

async function tentarLoginAutomatico() {
  const salvo = lerPessoaSalva();
  if (!salvo || !salvo.guid) return;

  pessoa = salvo;
  mostrarContaLogada(salvo.name);

  try {
    await carregarFavoritosDoServidor();
  } catch (e) {
    mostrarMensagemConta("Não foi possível carregar seus favoritos agora.");
  }
}

async function entrar() {
  const username = usernameInput.value.trim();
  if (!username) return;

  mostrarMensagemConta("");
  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando...";

  try {
    const guid = await apiGuidPorUsername(username);

    if (guid) {
      const info = await apiPessoaPorGuid(guid);
      pessoa = { guid: guid, username: username, name: info ? info.Name : username };
      salvarPessoa(pessoa);
      mostrarContaLogada(pessoa.name);
      await carregarFavoritosDoServidor();
    } else {
      signupFields.classList.add("show");
      mostrarMensagemConta("Usuário não encontrado. Preencha os dados para criar a conta.");
    }
  } catch (e) {
    mostrarMensagemConta("Não foi possível conectar à API de contas. Verifique conexão/CORS.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar";
  }
}

async function criarConta() {
  const username = usernameInput.value.trim();
  const nome = document.getElementById("signup-name").value.trim();
  const sobrenome = document.getElementById("signup-surname").value.trim();
  const nascimento = document.getElementById("signup-birthday").value;

  if (!username || !nome || !nascimento) {
    mostrarMensagemConta("Preencha usuário, nome e data de nascimento.");
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = "Criando...";

  try {
    const guid = await apiCriarPessoa({ nome: nome, sobrenome: sobrenome, username: username, nascimento: nascimento });
    pessoa = { guid: guid, username: username, name: nome };
    salvarPessoa(pessoa);
    mostrarContaLogada(nome);
    mostrarMensagemConta("");
    favoritosIds = [];
    atualizarContadorFavoritos();
    atualizarBotoesFavorito();
  } catch (e) {
    mostrarMensagemConta("Não foi possível criar a conta. Tente novamente.");
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = "Criar conta";
  }
}

function sair() {
  pessoa = null;
  favoritosIds = [];
  atualizarContadorFavoritos();
  apagarPessoaSalva();
  mostrarContaDeslogada();
  mostrarMensagemConta("");
  mostrandoFavoritos = false;
  favToggleBtn.classList.remove("active");
  if (!carregandoLista) atualizarGrid(false);
}

loginBtn.addEventListener("click", entrar);
signupBtn.addEventListener("click", criarConta);
logoutBtn.addEventListener("click", sair);
usernameInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") entrar();
});

// ---- favoritos ----
async function carregarFavoritosDoServidor() {
  if (!pessoa) return;
  const idsTexto = await apiFavoritosDoServidor(pessoa.guid); // array de strings — usamos o id da PokeAPI como "PokemonGuid"
  const lista = Array.isArray(idsTexto) ? idsTexto : [];
  favoritosIds = lista.map(Number).filter(function (n) { return !isNaN(n); });
  atualizarContadorFavoritos();
  if (!carregandoLista) atualizarGrid(false);
}

function atualizarContadorFavoritos() {
  favCountEl.textContent = favoritosIds.length;
}

async function alternarFavorito(p, botao) {
  if (!pessoa) {
    mostrarMensagemConta("Entre com um usuário para favoritar Pokémon.");
    usernameInput.focus();
    return;
  }

  const jaFavoritado = estaFavoritado(p.id);
  botao.disabled = true;

  try {
    if (jaFavoritado) {
      await apiDesfavoritar(pessoa.guid, String(p.id));
      favoritosIds = favoritosIds.filter(function (id) { return id !== p.id; });
    } else {
      await apiFavoritar(pessoa.guid, String(p.id));
      favoritosIds.push(p.id);
    }
    atualizarContadorFavoritos();

    // Na aba de favoritos o card precisa sumir; nas outras só troca a estrela
    if (mostrandoFavoritos) atualizarGrid(false);
    else atualizarBotoesFavorito();
  } catch (e) {
    mostrarMensagemConta("Não foi possível atualizar o favorito agora.");
  } finally {
    botao.disabled = false;
  }
}

favToggleBtn.addEventListener("click", function () {
  mostrandoFavoritos = !mostrandoFavoritos;
  favToggleBtn.classList.toggle("active", mostrandoFavoritos);
  atualizarGrid();
});


// =====================================================================
//  3) POKÉBOLA + FICHA DA POKÉDEX
//  Clicou no card → pokébola cai, treme, abre e aparece a ficha.
//  Fica dentro de uma função própria para os nomes não colidirem com o resto.
// =====================================================================
(function () {
  const listaCards = document.getElementById("grid");
  const overlay = document.getElementById("pk-overlay");
  const ball = document.getElementById("pk-ball");
  const dex = document.getElementById("pk-dex");

  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const arte = function (id) { return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" + id + ".png"; };

  const CORES = {
    normal: "#a8a77a", fire: "#ee8130", water: "#6390f0", electric: "#f7d02c", grass: "#7ac74c", ice: "#96d9d6", fighting: "#c22e28",
    poison: "#a33ea1", ground: "#e2bf65", flying: "#a98ff3", psychic: "#f85888", bug: "#a6b91a", rock: "#b6a136", ghost: "#735797", dragon: "#6f35fc",
    dark: "#705746", steel: "#b7b7ce", fairy: "#d685ad"
  };
  const NOMES_STATS = { hp: "PS", attack: "Ataque", defense: "Defesa", "special-attack": "Ataque Especial", "special-defense": "Defesa Especial", speed: "Velocidade" };
  const ingles = function (lista) { return (lista || []).find(function (x) { return x.language.name === "en"; }); };
  const limpa = function (t) { return t.replace(/\s+/g, " "); };

  // Cada abertura/fechamento ganha um número. Se o usuário fechar (Esc) no meio da animação,
  // a animação antiga percebe que não é mais a vigente e para — assim nada trava nem reaparece.
  let sessao = 0;

  // Clique em qualquer card (funciona com cards criados/filtrados depois).
  // Ignora a estrela de favorito e mensagens que não são card.
  listaCards.addEventListener("click", function (e) {
    if (e.target.closest(".fav-btn")) return;
    const card = e.target.closest("#grid > .card");
    if (card) abrirPokedex(card.dataset.id || card.dataset.nome);
  });

  async function abrirPokedex(nomeOuId) {
    const minha = ++sessao;

    dex.classList.remove("mostrar");
    dex.innerHTML = "";
    overlay.classList.add("ativo");
    document.body.style.overflow = "hidden";               // trava a rolagem da página
    ball.className = "pk-ball pk-cair";                    // 1) pokébola cai
    const dados = carregarCarta(nomeOuId).catch(function () { return null; }); // busca em paralelo

    await sleep(900);
    if (minha !== sessao) return;
    ball.className = "pk-ball pk-tremer";                  // 2) treme
    await sleep(800);
    if (minha !== sessao) return;
    ball.className = "pk-ball pk-abrir";                   // 3) abre com brilho
    await sleep(600);
    if (minha !== sessao) return;

    const carta = await dados;
    if (minha !== sessao) return;
    if (!carta) {                                          // não achou / falhou a internet
      encerrar();
      alert("Não foi possível carregar o Pokémon: " + nomeOuId);
      return;
    }
    preencherDex(carta);                                   // 4) monta a ficha
    ball.classList.add("pk-sumir");
    dex.classList.add("mostrar");                          // 5) ficha aparece
  }

  // ---- busca na PokeAPI ----
  async function pegarJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha em " + url);
    return res.json();
  }

  async function carregarCarta(nomeOuId) {
    const p = await pegarJson(pokeApiBase + "/pokemon/" + nomeOuId);
    const resto = await Promise.all(
      [pegarJson(p.species.url)].concat(p.types.map(function (t) { return pegarJson(t.type.url); }))
    );
    return { p: p, sp: resto[0], tipos: resto.slice(1) };
  }

  // fraquezas = tipos de ataque cujo multiplicador total é maior que 1
  function calcularFraquezas(tipos) {
    return Object.keys(CORES).filter(function (atq) {
      let mult = 1;
      tipos.forEach(function (t) {
        const r = t.damage_relations;
        if (r.double_damage_from.some(function (x) { return x.name === atq; })) mult *= 2;
        if (r.half_damage_from.some(function (x) { return x.name === atq; })) mult *= 0.5;
        if (r.no_damage_from.some(function (x) { return x.name === atq; })) mult *= 0;
      });
      return mult > 1;
    });
  }

  const badge = function (t) {
    const escuro = ["ghost", "dark", "fighting", "poison", "dragon", "psychic"].indexOf(t) !== -1;
    return `<span class="pk-badge ${escuro ? "escuro" : ""}" style="--c:${CORES[t]}">${t}</span>`;
  };

  function preencherDex(carta) {
    const p = carta.p, sp = carta.sp, tipos = carta.tipos;

    // descrições: as duas últimas versões diferentes em inglês
    const vistos = new Set();
    const versoes = [];
    sp.flavor_text_entries.filter(function (f) { return f.language.name === "en"; }).reverse().forEach(function (f) {
      const txt = limpa(f.flavor_text);
      if (!vistos.has(txt) && versoes.length < 2) { vistos.add(txt); versoes.push({ txt: txt, nome: f.version.name }); }
    });
    const coresVersao = ["#1f8fd6", "#e1344d"];

    const g = sp.gender_rate;
    const sexo = g === -1 ? "Sem gênero" : (g < 8 ? "♂ " : "") + (g > 0 ? "♀" : "");
    const generoIngles = ingles(sp.genera);
    const categoria = (generoIngles ? generoIngles.genus : "").replace(/ Pokémon$/, "");
    const hab = p.abilities.map(function (a) { return a.ability.name.replace(/-/g, " "); }).join(", ");

    const barras = p.stats.map(function (s) {
      const n = Math.max(1, Math.floor(s.base_stat / 15));
      let segmentos = "";
      for (let i = 0; i < 15; i++) segmentos += `<i class="${i < n ? "on" : ""}"></i>`;
      return `<div class="pk-col" title="${s.base_stat}"><div class="pk-seg">${segmentos}</div><span>${NOMES_STATS[s.stat.name] || s.stat.name}</span></div>`;
    }).join("");

    const botoesVersao = versoes.map(function (v, i) {
      return `<button class="pk-vbtn ${i ? "" : "ativo"}" style="--v:${coresVersao[i]}" data-i="${i}" title="${v.nome}"></button>`;
    }).join("");

    dex.innerHTML = `
      <h2 class="pk-titulo">${p.name} <small>Nº ${String(p.id).padStart(3, "0")}</small></h2>
      <div class="pk-ficha">
        <div>
          <div class="pk-imagem"><img src="${arte(p.id)}" alt="${p.name}"></div>
          <div class="pk-stats"><h3 class="pk-stats-t">Estatísticas</h3><div class="pk-colunas">${barras}</div></div>
        </div>
        <div>
          <p class="pk-desc" id="pk-desc">${versoes[0] ? versoes[0].txt : ""}</p>
          <div class="pk-versoes">Versões: ${botoesVersao}</div>
          <dl class="pk-infos">
            <div><dt>Altura</dt><dd class="pk-un">${p.height / 10} m</dd></div>
            <div><dt>Categoria</dt><dd>${categoria}</dd></div>
            <div><dt>Peso</dt><dd class="pk-un">${p.weight / 10} kg</dd></div>
            <div><dt>Habilidades</dt><dd>${hab}</dd></div>
            <div><dt>Sexo</dt><dd>${sexo}</dd></div>
          </dl>
          <h3 class="pk-secao">Tipo</h3>
          <div class="pk-badges">${p.types.map(function (t) { return badge(t.type.name); }).join("")}</div>
          <h3 class="pk-secao">Fraquezas</h3>
          <div class="pk-badges">${calcularFraquezas(tipos).map(badge).join("")}</div>
        </div>
      </div>
      <button id="pk-fechar">Fechar</button>`;

    dex.querySelectorAll(".pk-vbtn").forEach(function (btn) {
      btn.onclick = function () {
        dex.querySelectorAll(".pk-vbtn").forEach(function (b) { b.classList.remove("ativo"); });
        btn.classList.add("ativo");
        document.getElementById("pk-desc").textContent = versoes[btn.dataset.i].txt;
      };
    });
    document.getElementById("pk-fechar").onclick = fechar;
  }

  // volta tudo ao estado inicial
  function encerrar() {
    overlay.classList.remove("ativo");
    dex.classList.remove("mostrar");
    ball.className = "pk-ball";
    document.body.style.overflow = "";
  }

  function fechar() {
    const minha = ++sessao;                                // cancela qualquer animação em andamento
    if (!dex.classList.contains("mostrar")) { encerrar(); return; } // ficha ainda nem apareceu: fecha na hora
    dex.classList.remove("mostrar");
    setTimeout(function () { if (minha === sessao) encerrar(); }, 500);
  }

  overlay.addEventListener("click", function (e) { if (e.target === overlay) fechar(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("ativo")) fechar();
  });
})();


// =====================================================================
//  INICIALIZAÇÃO
// =====================================================================
async function iniciar() {
  efeitoDigitacao(subtitulo, "Projetinho dos Guri");

  try {
    // busca os pokémons na PokeAPI e tenta logar automaticamente ao mesmo tempo
    await Promise.all([
      carregarPokemonsDaPokeApi(),
      tentarLoginAutomatico()
    ]);
  } catch (e) {
    carregandoLista = false;
    if (pokemons.length === 0) {
      statusEl.textContent = "Não foi possível carregar os Pokémon da PokeAPI. Verifique sua conexão.";
      return;
    }
  }

  carregandoLista = false;
  atualizarGrid();
}

iniciar();
