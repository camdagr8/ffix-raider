/**
 * -----------------------------------------------------------------------------
 * Component: Privacy
 * -----------------------------------------------------------------------------
 */

import React from 'react';
import { State as App } from '@atomic-reactor/reactium-core/sdk';

export const Privacy = () => {
    App.Loading.hide();

    return (
        <div data-p={80}>
            <h1 data-text-align='center' data-mb={20}>
                Privacy Policy
            </h1>
            <p data-text-align='center'>
                It's simple: We don't share your info or anything about you. Any
                data you input or submit will used only by you, for you.
            </p>
        </div>
    );
};
