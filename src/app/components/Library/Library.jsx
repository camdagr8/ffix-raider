/**
 * -----------------------------------------------------------------------------
 * Component: Library
 * -----------------------------------------------------------------------------
 */

import _ from 'underscore';
import { Editor } from '../Editor';
import { useSyncStateEffect } from '../hooks';
import { Icon } from 'components/common-ui/Icon';
import React, { Fragment, useEffect, useState } from 'react';

import {
    State as App,
    useAsyncEffect,
    useRouteParams,
} from '@atomic-reactor/reactium-core/sdk';

const preload = data =>
    Promise.all(
        _.pluck(data, 'banner').map(
            src =>
                new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(src);
                    image.onerror = () => reject(src);
                    image.src = src;
                }),
        ),
    );

export const Library = () => {
    const params = useRouteParams();

    const [data, update] = useState([]);

    const [active, setActive] = useState();

    const isActive = item => Boolean(active && item.id === active.id);

    const onClick = item => e => {
        e.preventDefault();

        if (isActive(item)) return;

        App.navTo(`/timeline/${item.id}/${App.queryString()}`);
        return;
    };

    const onEditClick = item => e => {
        e.preventDefault();
        e.stopPropagation();
        App.navTo(`/edit/timeline/${item.id}`);
    };

    useAsyncEffect(
        async mounted => {
            if (data.length < 1) {
                App.Loading.setVisible(true);
                return;
            }

            if (!App.get('preloaded.Library')) App.Loading.setVisible(true);

            await preload(data);

            if (!mounted()) return;

            App.set('preloaded.Library', true);
        },
        [data],
    );

    useSyncStateEffect(() => {
        if (App.get('preloaded.Library')) App.Loading.hide();
    }, [App.get('preloaded.Library')]);

    useSyncStateEffect(() => {
        const raids = App.get('raids') || [];
        update(_.sortBy(raids, 'index'));
    }, [App.get('raids')]);

    useEffect(() => {
        const { id } = params;
        const item = _.findWhere(data, { id });
        setActive(item);
    }, [data, params]);

    useEffect(() => {
        document.title = active ? active.title : 'FFXIV Raider';
    }, [active]);

    return (
        <div
            data-row
            data-library
            data-px={active ? 0 : 10}
            data-py={active ? 0 : 10}
            data-px-md={active ? 0 : 10}>
            {data
                .filter(item => Boolean(!active || isActive(item)))
                .map(item => {
                    const _active = isActive(item);
                    const { banner, title, index } = item;
                    const k = `raid-${index}`;
                    const backgroundImage = `url('${banner}')`;
                    return _active ? (
                        <Editor key={k} {...item} />
                    ) : (
                        <a
                            key={k}
                            href='#'
                            data-py={10}
                            data-px={10}
                            data-col-xs={12}
                            data-height-xs='50vw'
                            data-height-md='25vw'
                            data-position='relative'
                            data-col-md={_active ? 12 : 6}
                            onClick={onClick(item)}>
                            <div
                                data-image
                                data-position='relative'
                                style={{ backgroundImage }}>
                                <div
                                    data-flex
                                    data-title
                                    data-width='100%'
                                    data-flex-valign='stretch'>
                                    <div
                                        data-p={20}
                                        data-flex-grow
                                        children={title}
                                    />
                                    {!isActive(item) && (
                                        <button
                                            data-btn='clear'
                                            data-btn-size='sm'
                                            onClick={onEditClick(item)}
                                            title={`Edit ${title} callouts`}>
                                            <Icon name='Feather.Edit2' />
                                        </button>
                                    )}
                                </div>
                                {_active && (
                                    <button
                                        data-p={0}
                                        data-width={50}
                                        data-height={50}
                                        data-btn='clear'
                                        data-btn-icon-shadow
                                        data-position='absolute'
                                        style={{
                                            top: 0,
                                            left: 0,
                                        }}
                                        onClick={() => App.navTo('/')}>
                                        <Icon name='Feather.ArrowLeft' />
                                    </button>
                                )}
                            </div>
                        </a>
                    );
                })}
        </div>
    );
};
