window.searchService = (async () => {
    const spells = await fetch('spells.json').then(response => response.json());
    
    const spellsById = {};
    spells.forEach(spell => {
        spellsById[spell.id] = spell;
    });

    const miniSearch = new window.MiniSearch({
        fields: ['prompt', 'expandedPrompt'],
        idField: 'id',
    });

    const documents = spells.map(spell => ({
        id: spell.id,
        prompt: spell.prompt,
        expandedPrompt: spell.metadata.expandedPrompt
    }));

    miniSearch.addAll(documents);

    return {
        search: (query) => {
            if (!query) {
                return spells;
            }
            const results = miniSearch.search(query, { prefix: true, fuzzy: 0.2 });
            return results.map(result => spellsById[result.id]);
        },
        getAllSpells: () => spells
    };
})(); 