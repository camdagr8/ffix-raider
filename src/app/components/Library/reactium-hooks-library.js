(async () => {
    const { Hook, Enums, Component } = await import(
        '@atomic-reactor/reactium-core/sdk'
    );

    Hook.register(
        'plugin-init',
        async () => {
            const { Library } = await import('./Library');
            Component.register('Library', Library);
        },
        Enums.priority.normal,
        'plugin-init-library',
    );
})();
