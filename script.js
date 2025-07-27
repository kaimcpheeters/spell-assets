document.addEventListener('DOMContentLoaded', function() {
    // Determine device type once on load and use it as the source of truth
    const isMobile = window.innerWidth <= 768;

    fetch('spells.json')
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('gallery');
            const searchBar = document.querySelector('.search-bar');
            const backdrop = document.getElementById('backdrop');

            // Desktop shelf elements
            const desktopShelf = document.getElementById('desktop-shelf');
            const shelfContent = document.getElementById('shelf-content');
            const closeShelfBtn = document.getElementById('close-shelf');

            // Mobile overlay elements
            const mobileOverlay = document.getElementById('mobile-overlay');
            const mobileOverlayContent = document.getElementById('mobile-overlay-content');
            const closeOverlayBtn = document.getElementById('close-overlay');
            
            let spells = data;

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
                const detailHtml = createSpellDetailHtml(spell);

                if (isMobile) {
                    mobileOverlayContent.innerHTML = detailHtml;
                    mobileOverlay.classList.add('open');
                    document.body.classList.add('no-scroll');
                } else {
                    shelfContent.innerHTML = detailHtml;
                    desktopShelf.classList.add('open');
                }

                backdrop.classList.add('visible');
                
                // Pause GIFs in the main gallery
                document.querySelectorAll('.gallery .card img').forEach(img => {
                    img.src = `spritesheets/${img.dataset.spellId}.png`;
                    img.classList.add('paused');
                });
            }

            function closeDetails() {
                if (isMobile) {
                    mobileOverlay.classList.remove('open');
                    document.body.classList.remove('no-scroll');
                } else {
                    desktopShelf.classList.remove('open');
                }

                backdrop.classList.remove('visible');

                // Resume GIFs in the main gallery
                document.querySelectorAll('.gallery .card img.paused').forEach(img => {
                    img.src = `gifs/${img.dataset.spellId}.gif`;
                    img.classList.remove('paused');
                });
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
                        gallery.appendChild(card);
                    }
                });
            }

            function filterSpells() {
                const query = searchBar.value.toLowerCase();
                const filteredSpells = spells.filter(spell => 
                    spell.prompt.toLowerCase().includes(query)
                );
                renderGallery(filteredSpells);
            }

            // Attach event listeners
            searchBar.addEventListener('input', filterSpells);
            closeShelfBtn.addEventListener('click', closeDetails);
            closeOverlayBtn.addEventListener('click', closeDetails);
            backdrop.addEventListener('click', closeDetails);

            // Initial render
            renderGallery(spells);
        })
        .catch(error => console.error('Error loading spells:', error));
}); 