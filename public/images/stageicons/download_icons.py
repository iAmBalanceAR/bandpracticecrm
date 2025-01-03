import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def download_svgs():
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    
    # URL containing the SVG files
    base_url = 'https://tecrider.com/images/items/'
    
    # Get the page content
    response = requests.get(base_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all links that end with .svg
    svg_links = [link.get('href') for link in soup.find_all('a') if link.get('href', '').endswith('.svg')]
    
    print(f"Found {len(svg_links)} SVG files to download...")
    
    # Download each SVG file
    for link in svg_links:
        filename = os.path.basename(link)
        full_url = urljoin(base_url, link)
        
        print(f"Downloading {filename}...")
        
        # Get the SVG content
        svg_response = requests.get(full_url)
        
        # Save the file
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), filename), 'wb') as f:
            f.write(svg_response.content)
            
    print("Download complete!")

if __name__ == "__main__":
    try:
        download_svgs()
    except Exception as e:
        print(f"An error occurred: {str(e)}") 