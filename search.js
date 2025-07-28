window.searchService = (async () => {
    const [spells, tagsList] = await Promise.all([
        fetch('spells.json').then(response => response.json()),
        fetch('tags.json').then(response => response.json())
    ]);

    const tagsById = tagsList.reduce((acc, tagData) => {
        acc[tagData.id] = tagData.tags;
        return acc;
    }, {});

    spells.forEach(spell => {
        spell.tags = tagsById[spell.id] || [];
    });
    
    const spellsById = {};
    spells.forEach(spell => {
        spellsById[spell.id] = spell;
    });

    const miniSearch = new window.MiniSearch({
        fields: ['prompt', 'expandedPrompt', 'tags'],
        idField: 'id',
    });

    const documents = spells.map(spell => ({
        id: spell.id,
        prompt: spell.prompt,
        expandedPrompt: spell.metadata.expandedPrompt,
        tags: spell.tags
    }));

    miniSearch.addAll(documents);

    return {
        search: (query) => {
            if (!query) {
                return [...spells];
            }
            const results = miniSearch.search(query, { prefix: true, fuzzy: 0.2 });
            return results.map(result => spellsById[result.id]);
        },
        getAllSpells: () => [...spells]
    };
})(); 