# Pokédex dos Guri 2.0

Pokédex da Geração 1 (151 Pokémon) com busca, ficha animada com estatísticas, cadastro/login e favoritos por usuário.
Projeto bimestral de faculdade (ADS – Uniguaçu).

## Tecnologias

HTML, CSS e JavaScript puro (fetch), PokeAPI e API REST do professor (OutSystems). Sem backend próprio e sem build.

## Como executar

- **Online:** <https://gabrielbarbosafeijo-cpu.github.io/Pokedex-dos-cria-2.0/> (GitHub Pages).
- **Local:** abra a pasta no VS Code e use a extensão **Live Server** em `index.html`.
  Não abra o arquivo direto (`file://`): a origem vira `null` e o navegador bloqueia as requisições por CORS.

## Integrantes

- Gabriel Barbosa Feijó ([@gabrielbarbosafeijo-cpu](https://github.com/gabrielbarbosafeijo-cpu))
- _(adicionar os demais integrantes do grupo)_

## Estrutura

```
HTML/poke.html   página principal (abrir esta)
CSS/poke.css     estilos
JS/poke.js       lógica: lista, busca, ficha com animação, conta e favoritos
index.html       redireciona para HTML/poke.html (necessário para o GitHub Pages)
docs/            swagger da API do professor
```

## APIs usadas

- **PokeAPI** (`pokeapi.co`): dados dos Pokémon (Geração 1, 151).
- **API "Pokede" do professor** (OutSystems, `.../Pokedex/rest/Pokede`): só contas e favoritos.

### Dados de usuário (conta)

| Campo | Observação |
|-------|-----------|
| `Name` | nome |
| `Surename` | sobrenome (a grafia com um "n" só é a da API) |
| `Username` | usado no login |
| `Birthday` | `YYYY-MM-DD` |

Endpoints usados: `GET /GuidByUsername`, `POST /Person`, `GET /PersonByGuid`,
`GET /FavoritosByGuidPerson`, `POST /FavoritarPokemon`, `DELETE /DesfavoritarPokemon`.

No navegador só ficam guardados `guid`, `username` e `name` (localStorage, chave `pokedex-guri-person`).
Os dados pessoais em si ficam no servidor do professor; este repositório contém apenas o código.

## Fonte Pixelify Sans

O CSS usa `../fonts/PixelifySans-Regular.ttf`. Baixe a fonte em
<https://fonts.google.com/specimen/Pixelify+Sans> e coloque em `fonts/PixelifySans-Regular.ttf`.
Sem o arquivo o site funciona normalmente com a fonte padrão (Segoe UI/Arial).

## Cadastro

Botão **Criar conta** na barra de conta (ou tentar entrar com um usuário que não existe) abre o formulário:
usuário, nome, sobrenome e data de nascimento. Antes de criar, o site confere se o usuário já existe
(`GET /GuidByUsername`) e só então faz `POST /Person`.

## CORS e tratamento de erros

- Todo `fetch` está em `try/catch` e mostra mensagem ao usuário (erro da PokeAPI, da API de contas ou de favoritos).
- A PokeAPI libera CORS (`Access-Control-Allow-Origin: *`). A API do professor precisa liberar a origem do site
  (GitHub Pages ou Live Server). Se não liberar, o login/cadastro mostra "Verifique conexão/CORS" e não há ajuste no front que resolva.
- `POST /Person` usa JSON, então o navegador faz um preflight `OPTIONS` antes (explicado em comentário no `JS/poke.js`).
- Não há senhas, chaves ou tokens no repositório; `.gitignore` já ignora `.env`.
