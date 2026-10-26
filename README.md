# Pokédex dos Guri 2.0

Projeto de faculdade (ADS – Uniguaçu) feito em HTML, CSS e JavaScript puro.

## Estrutura

```
HTML/poke.html   página principal (abrir esta)
CSS/poke.css     estilos
JS/poke.js       lógica: lista, busca, ficha com animação, conta e favoritos
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
