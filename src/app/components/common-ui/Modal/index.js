import cn from 'classnames';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { TweenMax, Power2 } from 'gsap/umd/TweenMax';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';

import Reactium, {
    cxFactory,
    useDispatcher,
    useRefs,
    useSyncState,
    Enums,
} from '@atomic-reactor/reactium-core/sdk';

let Modal = ({ ...initialProps }, ref) => {
    const refs = useRefs();

    const props = { ...Modal.defaults, ...initialProps };

    const state = useSyncState({
        ...props,
    });

    state.visible = state.get('visible');

    const cx = cxFactory(state.get('namespace'));

    const dispatch = useDispatcher({ props, state });

    const isDismissable = () => state.get('dismissable') != false;

    const isVisible = () => state.get('visible') === true;

    const onStateChange = () => {
        state.state = state.get();
    };

    const setRef = name => elm => refs.set(name, elm);

    const scrollLock = () => {
        const body = document.body;
        const html = document.documentElement;

        window.scroll(window.scrollX, window.scrollY);

        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
    };

    const scrollUnlock = () => {
        const body = document.body;
        const html = document.documentElement;

        body.style.overflow = state.get('scroll.body', 'auto');
        html.style.overflow = state.get('scroll.html', 'auto');
    };

    const update = content => state.set('children', content);

    const showSetup = () => {
        scrollLock();

        const container = refs.get('container');

        TweenMax.killTweensOf(container);

        container.style.display = 'block';
        container.classList.remove('visible');

        dispatch('before-show');
        return container;
    };

    const show = content => {
        if (content) update(content);

        if (isVisible()) {
            state.set('animation', null);
            return Promise.resolve();
        }

        const container = showSetup();

        const { animationEase: ease, animationSpeed } = state.get();

        const animation = new Promise(resolve => {
            TweenMax.to(container, animationSpeed, {
                ease,
                opacity: 1,
                onComplete: () => complete(resolve),
            });
        });

        state.set({ animation });

        return animation;
    };

    const hideSetup = () => {
        const container = refs.get('container');

        TweenMax.killTweensOf(container);

        container.style.display = 'block';

        dispatch('before-hide');

        return container;
    };

    const hide = () => {
        if (!isVisible()) {
            state.set('animation', null);
            return Promise.resolve();
        }

        const container = hideSetup();

        const { animationEase: ease, animationSpeed } = state.get();

        const animation = new Promise(resolve => {
            TweenMax.to(container, animationSpeed, {
                ease,
                opacity: 0,
                onComplete: () => complete(resolve),
            });
        });

        state.set({ animation });

        return animation;
    };

    const dismiss = () => {
        if (!isDismissable()) return Promise.resolve();
        return hide();
    };

    const complete = resolve => {
        if (isVisible()) {
            state.set({ animation: null, visible: false });

            const container = refs.get('container');
            container.removeAttribute('style');
            container.style.display = 'none';

            if (isDismissable()) dispatch('dismiss');
            dispatch('hide');
            scrollUnlock();
        } else {
            state.set({ animation: null, visible: true });
            dispatch('show');
        }

        dispatch('complete');

        return resolve ? resolve() : state;
    };

    const setVisible = visible => {
        if (props.id === 'loading-modal') {
            if (state.get('init') !== true) return;
        }

        state.visble = visible;

        if (visible === true) {
            const container = showSetup();
            container.style.opacity = 1;
            dispatch('show');
            scrollLock();
        } else {
            const container = hideSetup();
            container.style.opacity = 0;
            container.style.display = 'none';
            if (isDismissable()) dispatch('dismiss');
            dispatch('hide');
            scrollUnlock();
        }

        state.set({ animation: null, visible });

        return state;
    };

    const init = () => state.set('init', true);

    const toggle = e => (isVisible() ? hide(e) : show(e));

    const render = () => {
        const { children, className, visible } = state.get();

        return ReactDOM.createPortal(
            <div
                id={props.id}
                ref={setRef('container')}
                className={cn(cx(), className, { visible })}>
                {isDismissable() ? (
                    <button
                        type='button'
                        onClick={dismiss}
                        className={cx('bg')}
                        ref={setRef('dismiss')}
                    />
                ) : (
                    <div className={cx('bg')} />
                )}
                <div className={cx('wrapper')}>
                    <div
                        children={children}
                        ref={setRef('content')}
                        className={cx('content')}
                    />
                </div>
            </div>,
            document.body,
        );
    };

    state.extend('init', init);
    state.extend('show', show);
    state.extend('hide', hide);
    state.extend('dismiss', dismiss);
    state.extend('toggle', toggle);
    state.extend('setState', state.set);
    state.extend('update', update);
    state.extend('setStyle', () => {});
    state.extend('setVisible', setVisible);
    state.extend('visible', () => state.get('visible'));
    state.extend('reset', () => update(null).dispatch('reset'));

    useImperativeHandle(ref, () => state, []);

    useEffect(() => {
        const val = state.get('visible');
        if (state.visble === val) return;

        state.visible = val;
        state.set('update', Date.now());
    }, [state.get('visible')]);

    useEffect(() => {
        state.addEventListener('change', onStateChange);
        return () => {
            state.removeEventListener('change', onStateChange);
        };
    }, []);

    useEffect(() => {
        if (state.get('dismissable') && Reactium.Hotkeys) {
            Reactium.Hotkeys.register('modal-dismiss', {
                callback: dismiss,
                key: 'esc',
                order: Enums.priority.highest,
                scope: document,
            });

            return () => {
                Reactium.Hotkeys.unregister('modal-dismiss');
            };
        }
    }, [state.get('dismissable')]);

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;

        if (body.style.overflow !== 'hidden') {
            state.set('scroll', {
                body: body.style.overflow || 'auto',
                html: html.style.overflow || 'auto',
            });
        }
    }, []);

    return render();
};

Modal = forwardRef(Modal);

Modal.propTypes = {
    animationEase: PropTypes.object,
    animationSpeed: PropTypes.number,
    dismissable: PropTypes.bool,
    className: PropTypes.string,
    id: PropTypes.string,
    namespace: PropTypes.string,
    onBeforeHide: PropTypes.func,
    onBeforeShow: PropTypes.func,
    onDismiss: PropTypes.func,
    onHide: PropTypes.func,
    onShow: PropTypes.func,
    visible: PropTypes.bool,
};

Modal.defaults = {
    animationEase: Power2.easeInOut,
    animationSpeed: 0.25,
    dismissable: true,
    id: 'app-modal',
    namespace: 'ar-modal',
    visible: false,
};

export { Modal, Modal as default };
