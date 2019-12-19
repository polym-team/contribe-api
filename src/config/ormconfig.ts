export default {
    $filter: { $env: 'NODE_ENV' },
    production: {
        type: 'mysql',
        host: "i don't have db",
        port: 3306,
        username: '',
        password: '',
        database: 'core',
        synchronize: false,
        logging: true,
        // migrations: ['src/migration/**/*.ts'],
        supportBigNumbers: true,
        bigNumberStrings: false,
    },
    $default: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root', // TODO: value by environment
        password: '1234',
        database: 'core',
        synchronize: true,
        logging: true,
        // migrations: ['src/migration/**/*.ts'],
        supportBigNumbers: true,
        bigNumberStrings: false,
    },
};
