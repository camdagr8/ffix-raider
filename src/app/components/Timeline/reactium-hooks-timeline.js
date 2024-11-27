/**
 * -----------------------------------------------------------------------------
 * Reactium Plugin Timeline
 * -----------------------------------------------------------------------------
 */
(async () => {
    const { Hook, Enums, Component } = await import('@atomic-reactor/reactium-core/sdk');

    Hook.register('plugin-init', async () => {
        const { Timeline } = await import('./Timeline');        
        Component.register('Timeline', Timeline);
    }, Enums.priority.normal, 'plugin-init-Timeline');
})();
