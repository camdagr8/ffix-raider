/**
 * -----------------------------------------------------------------------------
 * Reactium Plugin Splash
 * -----------------------------------------------------------------------------
 */
(async () => {
    const { Hook, Enums, Component } = await import('@atomic-reactor/reactium-core/sdk');

    Hook.register('plugin-init', async () => {
        const { Splash } = await import('./Splash');        
        Component.register('Splash', Splash);
    }, Enums.priority.normal, 'plugin-init-Splash');
})();
