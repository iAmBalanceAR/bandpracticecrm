const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function downloadSvgs() {
    // Create directory if it doesn't exist
    const dir = path.dirname(__filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // URL containing the SVG files
    const baseUrl = 'https://tecrider.com/images/items/';

    try {
        // Get the page content
        const response = await fetch(baseUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Find all links that end with .svg
        const svgLinks = $('a')
            .map((_, el) => $(el).attr('href'))
            .get()
            .filter(href => href && href.endsWith('.svg'));

        console.log(`Found ${svgLinks.length} SVG files to download...`);

        // Download each SVG file
        for (const link of svgLinks) {
            const filename = path.basename(link);
            const fullUrl = new URL(link, baseUrl).toString();

            console.log(`Downloading ${filename}...`);

            // Get the SVG content
            const svgResponse = await fetch(fullUrl);
            const svgContent = await svgResponse.buffer();

            // Save the file
            fs.writeFileSync(path.join(dir, filename), svgContent);
        }

        console.log('Download complete!');
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

downloadSvgs(); 