# Pokemon Data Fetcher Scripts

This directory contains the script to fetch Pokemon data from the PokeAPI.

## Files

- **fetch_pokemon.py** - Main script to fetch Pokemon data from PokeAPI and organize by generation
- **pokemon_by_generation_sample.json** - Sample output showing the expected format (first 3 generations)

## Usage

### Running the Script

```bash
python3 fetch_pokemon.py
```

### Requirements

- Python 3.6 or higher
- Internet connection to access PokeAPI

No external dependencies are required - the script uses only Python standard library modules (`urllib`, `json`, `sys`, `time`).

### Output

The script creates `pokemon_by_generation.json` with Pokemon organized by generation:

```json
{
  "generation-i": ["bulbasaur", "charmander", "squirtle", ...],
  "generation-ii": ["chikorita", "cyndaquil", "totodile", ...],
  ...
}
```

### Features

- **Automatic retry logic**: Handles temporary network failures
- **Exponential backoff**: Respectful of API rate limits
- **Progress reporting**: Shows which generation is being fetched
- **Summary statistics**: Displays count of Pokemon per generation
- **Error handling**: Graceful handling of network issues

### API Information

The script uses the official [PokeAPI](https://pokeapi.co/docs/v2):
- No authentication required
- Free to use
- Well-documented endpoints
- Active maintenance and updates

### Example Output

```
Pokemon Data Fetcher
==================================================
Fetching generation data from PokeAPI...
Fetching Generation 1...
  Found 151 Pokemon in generation-i
Fetching Generation 2...
  Found 100 Pokemon in generation-ii
...
Results saved to pokemon_by_generation.json

==================================================
SUMMARY
==================================================
generation-i: 151 Pokemon
generation-ii: 100 Pokemon
generation-iii: 135 Pokemon
...
Total: 1025 Pokemon across 9 generations
==================================================
```

## Troubleshooting

### Network Issues

If you encounter network errors:
1. Check your internet connection
2. Verify PokeAPI is accessible: `curl https://pokeapi.co/api/v2/pokemon-species/1`
3. The script will automatically retry failed requests

### Permission Errors

If you can't write the output file:
```bash
chmod +w .
```

## Extending the Script

The script can be easily extended to fetch additional data:
- Pokemon abilities, types, and stats
- Move lists and evolution chains
- Sprites and artwork URLs
- Regional variants and forms

See the [PokeAPI documentation](https://pokeapi.co/docs/v2) for available endpoints.
