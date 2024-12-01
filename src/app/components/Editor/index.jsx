import _ from 'underscore';
import op from 'object-path';
import { model } from '../model';
import { v4 as uuid } from 'uuid';
import { Icon } from '../common-ui/Icon';
import { DragDropList } from '../DragDropList';
import { Modal, ModalContext } from '../common-ui/Modal';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';

import Reactium, {
    useEventEffect,
    useRefs,
    useStatus,
    useSyncState,
    Enums,
    State as App,
} from '@atomic-reactor/reactium-core/sdk';

const p = 16;

/**
 * -----------------------------------------------------------------------------
 * Component: Editor
 * -----------------------------------------------------------------------------
 */
export const Editor = initialProps => {
    const refs = useRefs();

    const setRef = name => elm => refs.set(name, elm);

    const [status, setStatus, isStatus] = useStatus('ready');

    const state = useSyncState({
        ...initialProps,
        confirmed: false,
    });

    const isConfirmed = () => state.get('confirmed') === true;
    const cancel = () => state.set('confirmed', false);
    const confirm = () => state.set('confirmed', true);

    const events = useMemo(() => {
        const events = state.get('events');
        if (events.length < 1) {
            events.push({ id: uuid(), source: 'boss', offset: '00:00' });
        }

        return events;
    }, [state.get('events'), status]);

    const insert = index => {
        const events = state.get('events');
        events.splice(index, 0, {
            id: uuid(),
            source: 'boss',
            offset: '00:00',
        });
        state.set('events', events);
        return state;
    };

    const remove = index => {
        if (!isConfirmed()) {
            const onConfirm = () => {
                confirm();
                remove(index);
            };

            showModal(
                <ConfirmDialog
                    onConfirm={onConfirm}
                    title='Confirm Delete'
                    data-width='100vw'
                    style={{ maxWidth: 520 }}>
                    <div data-text-align='center'>
                        This cannot be undone.
                        <div data-text-align='center' data-mt={20}>
                            Are you sure?
                        </div>
                    </div>
                </ConfirmDialog>,
            );
            return;
        }

        const events = state.get('events');
        events.splice(index, 1);

        if (events.length < 1) insert(0);

        state.set('events', events);
        return state;
    };

    const restore = () => {
        if (!isConfirmed()) {
            const onConfirm = () => {
                confirm();
                restore();
            };

            showModal(
                <ConfirmDialog
                    onConfirm={onConfirm}
                    title='Confirm Restore'
                    data-width='100vw'
                    style={{ maxWidth: 520 }}>
                    <div data-text-align='center'>
                        This will overwrite the timeline with the default data.
                        <div data-text-align='center' data-mt={20}>
                            Are you sure?
                        </div>
                    </div>
                </ConfirmDialog>,
            );

            return;
        }

        const idx = _.findIndex(model, { id: state.get('id') });
        if (idx < 0) return;
        const value = model[idx]['events'] || [{ id: uuid() }];
        state.set('events', value);
        return save();
    };

    const save = async value => {
        if (isStatus('pending')) return;
        setStatus('pending', true);

        value = value || state.get('events');

        const user = Reactium.User.current(true);
        const meta = user.get('meta');

        const raids = App.get('raids');
        const idx = _.findIndex(raids, { id: state.get('id') });

        if (idx < 0) return;
        raids[idx]['events'] = value;

        App.set('raids', raids);
        meta.raids = raids;

        const list = refs.get('list');
        list.set('value', value);

        try {
            user.set('meta', meta);
            await user.save();
            await new Promise(resolve =>
                setTimeout(() => resolve(), 500),
            ).then(() => setStatus('complete', true));

            await new Promise(resolve =>
                setTimeout(() => resolve(), 500),
            ).then(() => setStatus('ready', true));
        } catch (err) {
            setStatus('ready', true);
        }

        return state;
    };

    const onDragDrop = e => {
        state.set('events', e.target.value);
    };

    const onChange = e => {
        if (e.path && e.path === 'events') save(e.value);
    };

    const onInput = index => e => {
        const k = `events.${index}.${e.target.name}`;
        return state.set(k, e.target.value);
    };

    const onInsertClick = index => () => insert(index);

    const onDeleteClick = index => () => remove(index);

    const onPlayClick = () =>
        App.set('autoplay', true, false).navTo(`/timeline/${state.get('id')}`);

    const onSaveHotkey = e => {
        e.preventDefault();
        return save();
    };

    const onAudioGenClick = item => () => genAudio(item);

    const genAudio = async item => {
        const string = _.compact([
            op.get(item, 'name'),
            op.get(item, 'notes'),
        ]).join('. ');

        const results = await Reactium.Cloud.run('tts', { string });
        console.log(results);
    };

    const showModal = (...params) => {
        const modal = refs.get('modal');
        modal.reset().show(...params);
    };

    const ListItem = useCallback(
        ({ index, ...props }) => (
            <div data-width='100%' data-draggable>
                <InsertRow
                    index={index}
                    deleteable
                    onAddClick={onInsertClick}
                    onDeleteClick={onDeleteClick}
                />
                <div data-row data-p={p} data-form-group>
                    <div data-col-xs={12}>
                        <input
                            name='name'
                            data-pl={70}
                            aria-label='event name'
                            onChange={onInput(index)}
                            value={op.get(props, 'name')}
                        />
                        <span data-form-placeholder>event:</span>
                    </div>
                </div>
                <div
                    data-row
                    data-notes
                    data-pb={12}
                    data-px={p}
                    data-form-group>
                    <div data-col-xs={12}>
                        <textarea
                            rows={5}
                            name='notes'
                            data-pl={70}
                            aria-label='notes'
                            onChange={onInput(index)}
                            value={op.get(props, 'notes')}
                        />
                        <span data-form-placeholder>notes:</span>
                    </div>
                </div>
                <div
                    data-flex
                    data-notes
                    data-pb={p}
                    data-px={p}
                    data-width='100%'
                    data-flex-valign='stretch'>
                    <div data-width={140} data-form-group>
                        <input
                            name='offset'
                            data-pl={70}
                            aria-label='time'
                            onChange={onInput(index)}
                            value={op.get(props, 'offset')}
                        />
                        <span data-form-placeholder>time:</span>
                    </div>
                    <div
                        data-flex
                        data-flex-grow
                        data-flex-align-md='right'
                        data-flex-valign='stretch'
                        data-pl={p}>
                        <button
                            data-btn='grey'
                            data-width={40}
                            data-height='100%'
                            onClick={onAudioGenClick(props)}>
                            <Icon name='Feather.Mic' size={20} />
                        </button>
                    </div>
                </div>

                <InsertRow
                    inc={1}
                    index={index}
                    onAddClick={onInsertClick}
                    onDeleteClick={onDeleteClick}
                />
            </div>
        ),
        [],
    );

    useEventEffect(state, { change: onChange }, []);

    // Hotkey registration
    useEffect(() => {
        Reactium.Hotkeys.register('timeline-save', {
            key: 'mod+s',
            scope: document,
            callback: onSaveHotkey,
            order: Enums.priority.lowest,
        });

        return () => {
            Reactium.Hotkeys.unregister('timeline-save');
        };
    }, []);

    const render = () => {
        const { banner, title } = state.get();

        const backgroundImage = `url('${banner}')`;

        return (
            <>
                <Modal ref={setRef('modal')} dismissable onHide={cancel} />
                <div data-timeline-toolbar>
                    <button
                        data-btn='clear'
                        data-width={60}
                        onClick={() => App.navTo('/')}
                        children={<Icon name='Feather.X' size={28} />}
                    />
                    <span data-font-size={20}>Timeline Editor</span>

                    <div data-flex-grow data-px={20} />

                    <button
                        data-btn='clear'
                        data-flex-shrink={0}
                        onClick={onPlayClick}
                        disabled={isStatus('pending')}
                        title={`Play ${state.get('title')}`}
                        children={<Icon name='Feather.Play' />}
                    />

                    <button
                        data-ml={11}
                        data-btn='orange'
                        data-flex-shrink={0}
                        onClick={restore}
                        disabled={isStatus('pending')}
                        title={`Restore ${state.get('title')}`}
                        children={<Icon size={16} name='Feather.RotateCcw' />}
                    />

                    <button
                        data-ml={11}
                        data-btn='primary'
                        data-btn-size-md='md'
                        data-flex-shrink={0}
                        data-width-xs={60}
                        data-width-sm={130}
                        onClick={() => save()}
                        disabled={isStatus('pending')}
                        title={`Save ${state.get('title')}`}
                        children={<SaveLabel status={status} />}
                    />
                </div>
                <div data-timeline-hero>
                    <div
                        data-image
                        data-position='relative'
                        style={{ backgroundImage }}>
                        <div
                            data-flex
                            data-title
                            data-width='100%'
                            data-flex-valign='stretch'>
                            <div data-p={20} data-flex-grow children={title} />
                        </div>
                    </div>
                </div>
                <div data-timeline-editor>
                    <DragDropList
                        value={events || []}
                        ref={setRef('list')}
                        onDragEnd={onDragDrop}
                        ListItemComponent={ListItem}
                        id={`timeline-editor-${state.get('id')}`}
                    />
                </div>
            </>
        );
    };

    return render();
};

const InsertRow = ({
    inc = 0,
    index = 0,
    deleteable,
    onAddClick,
    onDeleteClick,
}) => (
    <div data-insert-row>
        <button
            data-btn-pill
            data-btn='gray-dark'
            data-btn-size='xs'
            title='add event'
            onClick={onAddClick(index + inc)}>
            <Icon name='Feather.Plus' size={14} />
        </button>
        {deleteable && (
            <button
                data-btn='red'
                data-btn-size='xs'
                onClick={onDeleteClick(index)}>
                <Icon name='Feather.X' size={14} />
            </button>
        )}
    </div>
);

const SaveLabel = ({ status }) => {
    switch (status) {
        case 'pending':
            return (
                <>
                    <Icon name='Feather.Activity' size={18} />
                    <span data-hide-xs-only data-ml={12}>
                        Saving...
                    </span>
                </>
            );

        case 'complete':
            return (
                <>
                    <Icon name='Feather.Check' size={18} />
                    <span data-hide-xs-only data-ml={12}>
                        Saved
                    </span>
                </>
            );

        default:
            return (
                <>
                    <Icon name='Feather.UploadCloud' size={18} />
                    <span data-hide-xs-only data-ml={12}>
                        Save
                    </span>
                </>
            );
    }
};

const ConfirmDialog = ({
    cancelLabel = 'No',
    confirmLabel = 'Yes',
    children,
    footer,
    onConfirm,
    onCancel,
    title,
    ...props
}) => {
    const modal = useContext(ModalContext);

    const onCancelClick = () => {
        if (typeof onCancel === 'function') {
            onCancel();
        }

        modal.hide();
    };

    const onConfirmClick = () => {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }

        modal.hide();
    };

    return (
        <div data-dialog {...props}>
            {title && <div data-dialog-header>{title}</div>}
            <div data-dialog-body>{children}</div>
            <div data-dialog-actions>
                {cancelLabel && (
                    <button
                        data-mr={10}
                        data-btn='red'
                        data-btn-size='md'
                        data-width={80}
                        onClick={onCancelClick}>
                        {cancelLabel}
                    </button>
                )}

                <button
                    data-ml={10}
                    data-btn='primary'
                    data-btn-size='md'
                    data-width={80}
                    onClick={onConfirmClick}>
                    {confirmLabel}
                </button>
            </div>
            {footer && <div data-dialog-footer>{footer}</div>}
        </div>
    );
};
