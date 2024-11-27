/**
 * -----------------------------------------------------------------------------
 * Component: Splash
 * -----------------------------------------------------------------------------
 */

import _ from 'underscore';
import { useSyncStateEffect } from '../hooks';
import React, { useEffect, useMemo } from 'react';
import { State as App } from '@atomic-reactor/reactium-core/sdk';

const preloadImage = src =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(src);
        image.onerror = () => reject(src);
        image.src = src;
    });

export const Splash = () => {
    const data = useMemo(() => {
        const raids = App.get('raids');
        return _.sortBy(raids, 'index');
    }, [App.get('raids')]);

    const preload = () =>
        Promise.all(_.pluck(data, 'banner').map(preloadImage));

    const onClick = item => e => {
        e.preventDefault();
        App.navTo(`/timeline/${item.id}/${App.queryString()}`);

        return;
    };

    useSyncStateEffect(() => {
        if (App.get('init') === true) App.Loading.hide();
    }, [App.get('init')]);

    useEffect(() => {
        // preload().then(() => App.set('init', true));
        App.set('init', true);
    }, []);

    return (
        <div
            data-row
            data-px={10}
            data-py={10}
            data-px-md={10}
            className='splash'>
            {data.map(item => {
                const { banner, title, index } = item;

                const k = `raid-${index}`;
                const backgroundImage = `url('${banner}')`;
                return (
                    <a
                        key={k}
                        href='#'
                        data-py={10}
                        data-px={10}
                        data-col-md={6}
                        data-col-xs={12}
                        data-height-xs='50vw'
                        data-height-md='25vw'
                        onClick={onClick(item)}>
                        <div data-image style={{ backgroundImage }}>
                            <div data-title data-p={20} children={title} />
                        </div>
                    </a>
                );
            })}
        </div>
    );
};
