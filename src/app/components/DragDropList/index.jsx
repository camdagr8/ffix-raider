/**
 * -----------------------------------------------------------------------------
 * Component: DragDropList
 * -----------------------------------------------------------------------------
 */
import _ from 'underscore';
import op from 'object-path';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Draggable, DragDropContext, Droppable } from 'react-beautiful-dnd';
import {
    useDispatcher,
    useEventEffect,
    useSyncState,
} from '@atomic-reactor/reactium-core/sdk';

export const DragDropList = forwardRef(
    (
        { children, id, ListItemComponent, value: initialValue = [], ...props },
        ref,
    ) => {
        const state = useSyncState({ value: initialValue, props });

        const dispatch = useDispatcher({ props, state });

        state.extend('dispatch', dispatch);
        state.value = useMemo(() => state.get('value'), [state.get('value')]);

        const onChange = e => {
            if (e.path && e.path === 'value') {
                state.set('updated', Date.now());
            }
        };

        const onDragEnd = e => {
            const index = {
                current: op.get(e, 'destination.index', undefined),
                previous: op.get(e, 'source.index'),
            };

            if (
                index.current === undefined ||
                index.current === index.previous
            ) {
                return;
            }

            let arr = Array.from(state.get('value'));

            const item = arr.splice(index.previous, 1)[0];

            arr.splice(index.current, 0, item);
            arr = arr.map((item, i) => {
                item.index = i;
                return item;
            });

            state.set('value', arr);

            _.defer(() => dispatch('drag-end'));
        };

        useImperativeHandle(ref, () => state, []);

        useEventEffect(state, { change: onChange });

        const render = () => {
            const value = state.get('value') || [];
            const ListItem = ListItemComponent || ListItemDefault;

            return (
                <div data-droppable {...state.get('props')}>
                    {children}
                    {value.length && (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId={id}>
                                {provided => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}>
                                        {value.map((item, i) => (
                                            <Draggable
                                                index={i}
                                                key={item.id}
                                                draggableId={item.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        data-dragging={
                                                            snapshot.isDragging
                                                        }>
                                                        <ListItem
                                                            {...item}
                                                            index={i}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </div>
            );
        };

        return render();
    },
);

const ListItemDefault = ({ name }) => (
    <div data-draggable data-p={20}>
        {name}
    </div>
);
