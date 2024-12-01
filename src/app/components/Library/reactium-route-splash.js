import { Library as component } from './Library';

export default [
    {
        id: 'route-library-1',
        exact: true,
        component,
        path: ['/edit/timeline/:id'],
    },
    {
        id: 'route-library-2',
        exact: true,
        component,
        path: ['/'],
    },
];
