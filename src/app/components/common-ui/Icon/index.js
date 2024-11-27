import op from 'object-path';
import cn from 'classnames';
import Linear from './Linear';
import Feather from './Feather';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Hook } from '@atomic-reactor/reactium-core/sdk';
import colors from '../../../../assets/style/_scss/colors-default.json';

const defaults = {
    namespace: 'ar-icon',
    size: 24,
};

const colorNames = Object.keys(colors).map(str =>
    String(str).replace('color-', ''),
);

const Icon = initialProps => {
    let props = { ...defaults, ...initialProps };

    const { name, size, color, className, namespace } = props;

    const cx = cn({
        [className]: !!className,
        [namespace]: !!namespace,
    });

    props.width = size;
    props.height = size;
    props.className = cx;

    const Icons = useMemo(() => {
        const items = Icon.icons;
        Hook.runSync('reactium-ui-icons', items);
        return items;
    }, []);

    const Ico = op.get(Icons, name);

    if (!Ico) return null;

    return <Ico {...props} data-fill={color} />;
};

Icon.icons = {
    Feather,
    Linear,
};

Icon.propTypes = {
    className: PropTypes.string,
    color: PropTypes.oneOf(colorNames),
    namespace: PropTypes.string,
    size: PropTypes.number,
};

export { Icon, Icon as default, Feather, Linear };
