#!/usr/bin/env python3
"""
Pokemon Data Fetcher

Fetches Pokemon data from the PokeAPI and organizes it by generation.
Results are saved to a JSON file with Pokemon sorted alphabetically
within each generation.

API: https://pokeapi.co/docs/v2
"""

import json
import sys
import time
from typing import Dict, List
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError


API_BASE_URL = "https://pokeapi.co/api/v2"
OUTPUT_FILE = "pokemon_by_generation.json"


def fetch_json(url: str, max_retries: int = 3) -> dict:
    """
    Fetch JSON data from a URL with retry logic.
    
    Args:
        url: The URL to fetch
        max_retries: Maximum number of retry attempts
        
    Returns:
        Parsed JSON data as a dictionary
        
    Raises:
        Exception: If all retry attempts fail
    """
    for attempt in range(max_retries):
        try:
            req = Request(url, headers={'User-Agent': 'Pokemon-Data-Fetcher/1.0'})
            with urlopen(req, timeout=10) as response:
                data = response.read()
                return json.loads(data)
        except (URLError, HTTPError) as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Request failed, retrying in {wait_time}s... ({attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            else:
                raise Exception(f"Failed to fetch {url} after {max_retries} attempts: {e}")
    
    raise Exception(f"Failed to fetch {url}")


def fetch_all_generations() -> Dict[str, List[str]]:
    """
    Fetch all Pokemon generations and their Pokemon species.
    
    Returns:
        Dictionary mapping generation names to lists of Pokemon names
    """
    print("Fetching generation data from PokeAPI...")
    
    pokemon_by_generation = {}
    
    # Fetch all generations (currently 9 generations)
    for gen_id in range(1, 10):
        try:
            print(f"Fetching Generation {gen_id}...")
            gen_url = f"{API_BASE_URL}/generation/{gen_id}"
            gen_data = fetch_json(gen_url)
            
            gen_name = gen_data['name']  # e.g., "generation-i"
            
            # Extract Pokemon species names
            pokemon_species = []
            for species in gen_data['pokemon_species']:
                pokemon_species.append(species['name'])
            
            # Sort alphabetically
            pokemon_species.sort()
            
            pokemon_by_generation[gen_name] = pokemon_species
            print(f"  Found {len(pokemon_species)} Pokemon in {gen_name}")
            
            # Be nice to the API
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Warning: Could not fetch generation {gen_id}: {e}")
            continue
    
    return pokemon_by_generation


def save_to_json(data: dict, filename: str) -> None:
    """
    Save data to a JSON file with nice formatting.
    
    Args:
        data: Dictionary to save
        filename: Output filename
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nResults saved to {filename}")


def print_summary(data: Dict[str, List[str]]) -> None:
    """
    Print a summary of the fetched data.
    
    Args:
        data: Dictionary of Pokemon by generation
    """
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    
    total_pokemon = 0
    for gen_name, pokemon_list in sorted(data.items()):
        count = len(pokemon_list)
        total_pokemon += count
        print(f"{gen_name}: {count} Pokemon")
    
    print(f"\nTotal: {total_pokemon} Pokemon across {len(data)} generations")
    print("="*50)


def main():
    """Main function to fetch and save Pokemon data."""
    try:
        print("Pokemon Data Fetcher")
        print("="*50)
        
        # Fetch data
        pokemon_data = fetch_all_generations()
        
        if not pokemon_data:
            print("Error: No data was fetched!")
            sys.exit(1)
        
        # Save to file
        save_to_json(pokemon_data, OUTPUT_FILE)
        
        # Print summary
        print_summary(pokemon_data)
        
        print("\nDone! Check the generated JSON file for the complete data.")
        
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
