/**
 * -----------------------------------------------------------------------------
 * Component: Timeline
 * -----------------------------------------------------------------------------
 */

import _ from 'underscore';
import moment from 'moment';
import { Icon } from '../common-ui/Icon';
import { useSyncStateEffect } from '../hooks';
import React, { useEffect, useMemo } from 'react';

import {
    useStatus,
    useSyncState,
    State as App,
    useRouteParams,
} from '@atomic-reactor/reactium-core/sdk';

const defaults = {
    className: 'timeline',
};

export const BackButton = props => (
    <button
        {...props}
        data-p={0}
        data-width={60}
        data-height={60}
        data-btn='clear'
        data-btn-size='sm'
        children={<Icon name='Feather.X' size={28} />}
    />
);

export const PlayButton = ({ status, ...props }) => (
    <button
        {...props}
        data-p={0}
        data-width={60}
        data-height={60}
        data-btn='clear'
        data-btn-size='sm'
        children={
            <Icon
                name={status === 'Pause' ? 'Feather.Play' : 'Feather.Pause'}
            />
        }
    />
);

export const TimelineItem = props => {
    let { active = false, index, name, next, notes, offset, prev } = props;
    notes = notes ? _.flatten([notes]) : [];

    return (
        <div
            data-timeline-item
            data-timeline-next={next}
            data-timeline-prev={prev}
            data-timeline-active={active}>
            <div data-timeline-title data-flex data-flex-valign='middle'>
                <small children={offset} data-mr={20} />
                {name}
            </div>
            {notes.length > 0 && (
                <div data-timeline-notes>
                    {notes.map((note, i) => (
                        <div key={['note', index, i].join('-')}>{note}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Timeline = () => {
    const { id } = useRouteParams();

    let props = { ...defaults };

    const [status, setStatus, isStatus] = useStatus('Pause');

    const [timestamp] = useStatus(moment());

    const state = useSyncState({
        id,
        active: 0,
        raid: null,
        timestamp: null,
        ...props,
    });

    const active = useMemo(() => state.get('active') || 0, [
        state.get('active'),
    ]);

    const togglePlay = () => {
        const s = isStatus('Pause') ? 'Play' : 'Pause';
        setStatus(s, true);
    };

    const isActive = i => Boolean(i === active);

    const isNext = i => Boolean(active + 1 === i);

    const isPrev = i => Boolean(i < active);

    const setActive = i => {
        if (!i) {
            const offset = timestamp.format('mm:ss');
            i = _.findIndex(events, { offset });
            if (i === -1) return;
        }

        state.set('active', i);
    };

    const timer = () => {
        clear();

        timestamp
            .hour(0)
            .minute(0)
            .second(0);

        setActive();

        const interval = setInterval(() => {
            timestamp.add(1000, 'milliseconds');
            setActive();
            state.set('updated', Date.now());
        }, 1000);

        state.set('interval', interval);
    };

    const clear = () => {
        const ival = state.get('interval');
        if (ival) clearInterval(ival);

        state.set('timestamp', null, false);
        state.set('interval', null, false);
        state.set('active', 0);
    };

    const mount = () => {
        const id = state.get('id');
        const raid = _.findWhere(App.get('raids'), { id });
        if (raid) {
            state.set('raid', raid);
            document.title = raid.title;
        }

        if (App.get('autoplay') === true && raid && raid.events.length > 0) {
            setStatus('Play', true);
        }

        App.Loading.hide();
    };
    const unmount = () => {
        return () => {
            App.set('autoplay', null);
            clear();
        };
    };

    const events = useMemo(() => {
        const output = state.get('raid.events', []);
        return output || [];
    }, [state.get('raid')]);

    const onBackClick = () => {
        const url = App.get('autoplay')
            ? `/edit/timeline/${state.get('id')}`
            : '/';

        App.navTo(url);
    };

    useEffect(() => {
        switch (status) {
            case 'Play':
                timer();
                break;

            case 'Pause':
                clear();
                break;
        }
    }, [status]);

    useEffect(mount, [state.get('id')]);

    useEffect(unmount, []);

    const render = () => {
        const title = state.get('raid.title');
        return !title ? null : (
            <>
                <div data-pl={0} data-flex='col' data-height='100vh'>
                    <div
                        data-flex
                        data-flex-wrap
                        data-timeline-heading
                        data-text-align='center'
                        data-flex-valign='middle'>
                        <BackButton
                            data-flex-shrink={0}
                            onClick={onBackClick}
                        />
                        <div
                            data-flex-grow
                            data-font-size={20}
                            children={title}
                        />
                        <PlayButton
                            status={status}
                            data-flex-shrink={0}
                            onClick={togglePlay}
                        />
                    </div>

                    {events.length > 0 && (
                        <div
                            data-flex-grow
                            data-pl-xs={28}
                            data-overflow='auto'>
                            <div
                                data-timeline
                                data-pl-xs={40}
                                data-pt={isStatus('Play') ? 78 : 40}>
                                {events.map((item, i) => (
                                    <TimelineItem
                                        {...item}
                                        index={i}
                                        key={`tli-${i}`}
                                        next={isNext(i)}
                                        prev={isPrev(i)}
                                        active={isActive(i)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {isStatus('Play') && (
                    <div
                        data-btn='primary'
                        data-btn-size='md'
                        data-width='100%'
                        data-flex-shrink={0}
                        data-position='fixed'
                        children={timestamp.format('mm:ss')}
                        style={{
                            top: 60,
                            left: '50%',
                            opacity: 1,
                            zIndex: 100000,
                            borderRadius: 0,
                            transform: 'translateX(-50%)',
                        }}
                    />
                )}
            </>
        );
    };

    return render();
};
