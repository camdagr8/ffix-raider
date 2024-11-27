import _ from 'underscore';
import op from 'object-path';
import { model } from './model';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import colors from '../../assets/style/_scss/colors-default.json';
import {
    Enums,
    Hook,
    Prefs,
    Routing,
    State,
} from '@atomic-reactor/reactium-core/sdk';

/**
 * -----------------------------------------------------------------------------
 * Reactium Plugin Site
 * -----------------------------------------------------------------------------
 */
const initialSearchString = window.location.search;

const _routingStateHandler = async () => {
    if (!Routing.currentRoute) {
        document.title = 'FFXIV Raider';
        return;
    }

    if (op.get(Routing.currentRoute, 'match.route.meta.app') !== 'site') {
        return;
    }

    if (op.get(Routing.currentRoute, 'match.route.meta.title')) {
        document.title = Routing.currentRoute.match.route.meta.title;
    } else {
        document.title = 'FFXIV Raider';
    }

    State.dispatch('route-change', {
        detail: Routing.currentRoute.match,
    });

    window.scroll(0, 0);
};

const routingStateHandler = _.debounce(_routingStateHandler, 500, true);

const observer = () => {
    Routing.routeListeners.register('site-routing-observer', {
        handler: routingStateHandler,
        order: Enums.priority.highest,
    });
};

(async () => {
    if (!Prefs.get('site')) Prefs.set('site', {});

    State.set('init', false);
    State.set('raids', model);

    try {
        State.Discord = new DiscordSDK('1310197556269289514');
        if (State.Discord) {
            await State.Discoard.ready();
        }
    } catch (err) {
        console.log(err);
    }

    State.extend('setMode', m => {
        const modes = ['light', 'dark'];

        m = String(m).toLowerCase();
        m = !modes.includes(m) ? 'light' : m;

        State.set('site.mode', m);

        document.documentElement.setAttribute('data-mode', m);
        return State;
    });

    const initMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    State.setMode(initMode);

    // Route observer
    Hook.register('routes-init', observer, Enums.priority.highest);

    // SDK Init
    Hook.register('sdk-init', async () => {
        State.Site = State.Site || {};
    });

    // Extend State
    Hook.register(
        'init',
        async () => {
            State.set('init', false);

            State.Loading = window.LoadingRef.current;

            State.extend('modeToggle', () => {
                const m = State.get('site.mode') === 'dark' ? 'light' : 'dark';
                State.setMode(m);
                return State;
            });

            State.extend('navTo', (url, ...params) => {
                url = String(url)
                    .split('?')
                    .shift();

                url += initialSearchString;

                Routing.history.push(url, ...params);
                return State;
            });

            State.extend('scrollLock', () => {
                const body = document.body;
                const html = document.documentElement;

                window.scroll(window.scrollX, window.scrollY);

                body.style.overflow = 'hidden';
                html.style.overflow = 'hidden';
                return State;
            });

            State.extend('scrollUnlock', () => {
                const body = document.body;
                const html = document.documentElement;

                body.style.overflow = 'auto';
                html.style.overflow = 'auto';
                return State;
            });

            State.extend('color', k => op.get(colors, `color-${k}`));

            State.extend('routePath', () =>
                op.get(Routing, 'currentRoute.match.route.path'),
            );

            State.extend('routeParams', () =>
                op.get(Routing, 'currentRoute.params'),
            );

            State.extend('routeQuery', () =>
                op.get(Routing, 'currentRoute.search'),
            );

            State.extend('queryString', () => window.location.search);

            State.extend('zoneFilter', component => {
                let routes = op.get(component, 'routes');
                if (!routes) return true;
                routes = Array.isArray(routes) ? routes : [routes];
                return component.routes.includes(State.routePath());
            });

            window
                .matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', e => {
                    State.setMode(e.matches === true ? 'dark' : 'light');
                });
        },

        Enums.priority.low,
    );
})();
