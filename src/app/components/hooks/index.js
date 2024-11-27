import op from 'object-path';
import { useEffect } from 'react';
import {
    State as App,
    useRouteParams,
    useAttachSyncState,
} from '@atomic-reactor/reactium-core/sdk';

export const useSyncStateEffect = (
    callback,
    deps,
    options = { stateObj: App, event: 'change' },
) => {
    useAttachSyncState(options.stateObj, options.event);
    useEffect(callback, deps);
};

export const useCollection = () => {
    const { id } = useRouteParams();
    const data = op(App.get(`collections.${id}`) || {});
    return [data, Date.now()];
};
