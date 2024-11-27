/**
 * -----------------------------------------------------------------------------
 * Component: Terms
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { State as App } from '@atomic-reactor/reactium-core/sdk';

export const Terms = () => {
    App.Loading.hide();

    return (
        <div data-p={80}>
            <h1 data-text-align='center' data-mb={20}>
                Terms of Service
            </h1>
            <p data-text-align='center'>
                Use the app however you want. Just don't be a jerk about it.
            </p>
        </div>
    );
};
