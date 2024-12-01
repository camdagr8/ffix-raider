import isHotkey from 'is-hotkey';
import {
    useIsContainer as isContainer,
    Registry,
} from '@atomic-reactor/reactium-core/sdk';

export default class Hotkeys extends Registry {
    constructor(opts) {
        super(opts);
        this.isContainer = isContainer;
    }

    get onKeyboardEvent() {
        return event => {
            let next = true;
            this.list.forEach(item => {
                if (next === false) return;

                const { key, callback, scope } = item;
                if (!scope || !key || typeof callback !== 'function') return;

                const isKey = isHotkey(key, event);
                if (!isKey) return;

                try {
                    if (!this.isContainer(event.target, scope)) return;
                    next = callback(event, key) || true;
                } catch (err) {
                    console.log(err);
                }
            });
        };
    }
}
