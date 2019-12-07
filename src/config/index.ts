import { Store } from 'confidence';
import ormconfig from './ormconfig';

const doc = {
    ormconfig,
    isProduction: {
        $filter: { $env: 'NODE_ENV' },
        production: true,
        $default: false,
    },
};

const store = new Store(doc);

export const getConfig = (key: string) => store.get(key);
