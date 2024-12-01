import Hotkeys from './Hotkeys';
import Reactium, { Hook } from '@atomic-reactor/reactium-core/sdk';

(async () => {
    Reactium.Hotkeys = new Hotkeys('hotkeys');

    const onHotKeyDown = e => Reactium.Hotkeys.onKeyboardEvent(e);

    Hook.register('init', async () => {
        window.addEventListener('keydown', onHotKeyDown);
    });
})();
