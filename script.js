document.addEventListener('DOMContentLoaded', async function() {
    let colorSortActive = false;
    let selectedColor = null;

    try {
        const [searchApi, colors] = await Promise.all([
            window.searchService,
            fetch('colors.json').then(response => response.json())
        ]);

        const gallery = document.getElementById('gallery');
        const searchBar = document.querySelector('.search-bar');
        const backdrop = document.getElementById('backdrop');
        const colorPicker = document.getElementById('color-picker');
        const colorPickerBtn = document.getElementById('color-picker-btn');
        const clearColorBtn = document.getElementById('clear-color-btn');

        // Unified details panel elements
        const detailsPanel = document.getElementById('spell-details');
        const detailsContent = document.getElementById('details-content');
        const closeDetailsBtn = document.getElementById('close-details');
        
        function formatExpandedPrompt(prompt) {
            return prompt.replace(/"/g, '');
        }

        function createSpellDetailHtml(spell) {
            return `
                <div class="shelf-header">
                    <h2 class="prompt-name">${spell.prompt}</h2>
                    <p class="prompt-detail">${formatExpandedPrompt(spell.metadata.expandedPrompt)}</p>
                </div>
                <div class="asset-grid">
                    <div class="asset-container">
                        <img src="gifs/${spell.id}.gif" alt="${spell.prompt}">
                        <a href="gifs/${spell.id}.gif" download class="download-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </a>
                    </div>
                    <div class="asset-container">
                        <img src="spritesheets/${spell.id}.png" alt="${spell.prompt} Spritesheet">
                        <a href="spritesheets/${spell.id}.png" download class="download-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </a>
                    </div>
                </div>
            `;
        }

        function showDetails(spell) {
            detailsContent.innerHTML = createSpellDetailHtml(spell);
            detailsPanel.classList.add('open');
            backdrop.classList.add('visible');
            document.body.classList.add('no-scroll');
            
            // Pause GIFs in the main gallery
            document.querySelectorAll('.gallery .card img').forEach(img => {
                img.src = `spritesheets/${img.dataset.spellId}.png`;
                img.classList.add('paused');
            });
        }

        function closeDetails() {
            detailsPanel.classList.remove('open');
            backdrop.classList.remove('visible');
            document.body.classList.remove('no-scroll');

            // Resume GIFs in the main gallery
            document.querySelectorAll('.gallery .card img.paused').forEach(img => {
                img.src = `gifs/${img.dataset.spellId}.gif`;
                img.classList.remove('paused');
            });
        }

        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : null;
        }

        function colorDistance(rgb1, rgb2) {
            const [r1, g1, b1] = rgb1;
            const [r2, g2, b2] = rgb2;
            return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
        }

        function renderGallery(items) {
            gallery.innerHTML = '';
            items.forEach(spell => {
                if (!spell.hidden) {
                    const card = document.createElement('div');
                    card.classList.add('card');
                    card.addEventListener('click', () => showDetails(spell));

                    const gif = document.createElement('img');
                    gif.src = `gifs/${spell.id}.gif`;
                    gif.alt = spell.prompt;
                    gif.dataset.spellId = spell.id;

                    const overlay = document.createElement('div');
                    overlay.classList.add('overlay');
                    overlay.textContent = spell.prompt;

                    card.appendChild(gif);
                    card.appendChild(overlay);

                    if (colorSortActive) {
                        const colorDots = document.createElement('div');
                        colorDots.classList.add('color-dots');
                        const spellColors = colors[spell.id];
                        if (spellColors) {
                            const dot1 = document.createElement('div');
                            dot1.classList.add('color-dot');
                            dot1.style.backgroundColor = `rgb(${spellColors.primary_rgb.join(',')})`;
                            colorDots.appendChild(dot1);
    
                            const dot2 = document.createElement('div');
                            dot2.classList.add('color-dot');
                            dot2.style.backgroundColor = `rgb(${spellColors.secondary_rgb.join(',')})`;
                            colorDots.appendChild(dot2);
                        }
                        card.appendChild(colorDots);
                    }
                    gallery.appendChild(card);
                }
            });
        }

        function filterSpells() {
            const query = searchBar.value.toLowerCase();
            let filteredSpells = searchApi.search(query);

            if (colorSortActive && selectedColor) {
                const selectedRgb = hexToRgb(selectedColor);
                if (selectedRgb) {
                    filteredSpells.sort((a, b) => {
                        const aColors = colors[a.id];
                        const bColors = colors[b.id];

                        if (!aColors) return 1;
                        if (!bColors) return -1;

                        const aDist = Math.min(
                            colorDistance(selectedRgb, aColors.primary_rgb),
                            colorDistance(selectedRgb, aColors.secondary_rgb)
                        );
                        const bDist = Math.min(
                            colorDistance(selectedRgb, bColors.primary_rgb),
                            colorDistance(selectedRgb, bColors.secondary_rgb)
                        );
                        return aDist - bDist;
                    });
                }
            }

            renderGallery(filteredSpells);
        }

        function activateColorSort(color) {
            colorSortActive = true;
            selectedColor = color;
            colorPickerBtn.style.backgroundColor = color;
            colorPickerBtn.querySelector('img').style.filter = 'none';
            clearColorBtn.style.display = 'block';
            filterSpells();
        }

        function deactivateColorSort() {
            colorSortActive = false;
            selectedColor = null;
            colorPickerBtn.style.backgroundColor = 'transparent';
            colorPickerBtn.querySelector('img').style.filter = 'invert(1)';
            clearColorBtn.style.display = 'none';
            filterSpells();
        }

        // Attach event listeners
        searchBar.addEventListener('input', filterSpells);
        closeDetailsBtn.addEventListener('click', closeDetails);
        backdrop.addEventListener('click', closeDetails);
        colorPickerBtn.addEventListener('click', () => colorPicker.click());
        colorPicker.addEventListener('input', (e) => activateColorSort(e.target.value));
        clearColorBtn.addEventListener('click', deactivateColorSort);

        // Initial render
        renderGallery(searchApi.getAllSpells());

    } catch (error) {
        console.error('Error loading data:', error);
    }
}); 