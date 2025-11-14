#!/usr/bin/env python3
"""
Deployment verification script for GracefulTable Jeopardy

This script verifies that the basic application components are working correctly.
Run this after deploying to ensure everything is set up properly.
"""

import os
import sys
import requests
import json
from urllib.parse import urljoin

def verify_deployment(base_url):
    """Verify deployment by checking key endpoints"""
    print(f"Verifying deployment at: {base_url}")
    
    # Check endpoints
    endpoints = [
        "/",                 # Homepage
        "/creator",          # Creator page
        "/api/games",        # Games API
    ]
    
    all_successful = True
    
    for endpoint in endpoints:
        url = urljoin(base_url, endpoint)
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {endpoint} - OK ({response.status_code})")
            else:
                print(f"❌ {endpoint} - Failed ({response.status_code})")
                all_successful = False
        except requests.RequestException as e:
            print(f"❌ {endpoint} - Error: {str(e)}")
            all_successful = False
    
    # Try creating a game
    try:
        create_url = urljoin(base_url, "/api/games")
        create_response = requests.post(
            create_url, 
            json={"title": "Test Game from Verification Script"},
            timeout=5
        )
        
        if create_response.status_code == 200:
            game_data = create_response.json()
            game_id = game_data.get('id')
            
            if game_id:
                print(f"✅ Game creation - OK (Game ID: {game_id})")
                
                # Verify game retrieval
                game_url = urljoin(base_url, f"/api/games/{game_id}")
                game_response = requests.get(game_url, timeout=5)
                
                if game_response.status_code == 200:
                    print(f"✅ Game retrieval - OK")
                else:
                    print(f"❌ Game retrieval - Failed ({game_response.status_code})")
                    all_successful = False
            else:
                print("❌ Game creation - Missing game ID in response")
                all_successful = False
        else:
            print(f"❌ Game creation - Failed ({create_response.status_code})")
            all_successful = False
    except requests.RequestException as e:
        print(f"❌ Game creation - Error: {str(e)}")
        all_successful = False
    
    # Summary
    print("\nVerification summary:")
    if all_successful:
        print("✅ All checks passed! The deployment appears to be working correctly.")
    else:
        print("❌ Some checks failed. Please review the errors above.")
    
    return all_successful

if __name__ == "__main__":
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = os.environ.get("APP_URL", "http://localhost:5000")
    
    success = verify_deployment(base_url)
    if not success:
        sys.exit(1)
