import ReactDOM from 'react-dom';
import { LoadingShell } from './Shell';
import React, { forwardRef } from 'react';
import { Modal } from '../common-ui/Modal';

/**
 * -----------------------------------------------------------------------------
 * Component: Loading
 * -----------------------------------------------------------------------------
 */

export const Loading = forwardRef((props, ref) =>
    ReactDOM.createPortal(
        <Modal visible ref={ref} dismissable={false} id='loading-modal'>
            <LoadingShell />
        </Modal>,
        document.documentElement,
    ),
);
