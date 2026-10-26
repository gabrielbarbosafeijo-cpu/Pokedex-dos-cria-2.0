# Pokédex dos Guri 2.0

Projeto de faculdade (ADS – Uniguaçu) feito em HTML, CSS e JavaScript puro.

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
