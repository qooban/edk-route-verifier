#!/usr/bin/env node --experimental-modules --experimental-json-modules

import { readFileSync } from 'fs';
import yargs from 'yargs';

import RouteParameters from '../data/input/RouteParameters.js';
import RouteVerificationInput from '../data/input/RouteVerificationInput.js';
import RouteVerificationOptions from '../data/input/RouteVerificationOptions.js';
import verifyRoute from '../core/verifyRoute.js';
import { startServer } from '../server/server.js';

const argv = yargs
    .scriptName('edk-route-verifier')
    .usage('Usage: $0 <command> -c <config-file> [options]')
    .command('server [options] [-p port]', 'Starts server providing verification API', y => y
        .option('port', {
            alias: 'p',
            describe: 'API server port',
            type: 'number',
        }))
    .command('file [options] <kml> <params>', 'Verify provided KML file', y => y
        .positional('kml', {
            describe: 'KML file path',
            type: 'string',
            coerce: kmlFile => readFileSync(kmlFile, 'utf8'),
        })
        .positional('params', {
            describe: 'Route parameters file path',
            type: 'string',
            coerce: params => JSON.parse(readFileSync(params, 'utf8')),
        }))
    // .command('browser', 'Run browser version of the verifer')
    .demandCommand(1, 1, 'You need exactly one command before moving on',
        'You need exactly one command before moving on')
    .option('c', {
        alias: 'config',
        describe: 'Configuration JSON file path (should contain googleMapsApiKey)',
        type: 'string',
        coerce: arg => JSON.parse(readFileSync(arg, 'utf8')),
    })
    .option('l', {
        alias: 'language',
        default: 'en',
        describe: 'Logs language',
        choices: ['en', 'pl'],
    })
    .option('d', {
        alias: 'debug',
        default: false,
        describe: 'Include debugging data',
        type: 'boolean',
    })
    .demandOption('c', 'Please provide configuration file path.')
    .example('$0 server -c config.json -p 9102', 'starts API server on port 9102')
    .example('$0 file -c config.json my_route.kml my_route_params.json',
        'verifies my_route.kml file using route parameters from my_route_params.json')
    .example('$0 file -c config.json -l pl -d my_route.kml my_route_params.json',
        'verifies my_route.kml file using route parameters from my_route_params.json '
        + 'and provides debug information in Polish language')
    // .example('$0 browser', 'starts server and browser version')
    .alias('v', 'version')
    .help('h')
    .alias('h', 'help')
    .wrap(Math.min(120, yargs.terminalWidth()))
    .argv;

const commands = argv._;
const { config, language, debug } = argv;

if (commands.includes('server')) {
    const { port } = argv;
    startServer(config, port, language, debug);
} else if (commands.includes('file')) {
    const { kml, params } = argv;

    const routeParams = new RouteParameters(params.ascent, params.length, params.type);
    const routeInput = new RouteVerificationInput(kml, routeParams);
    const options = new RouteVerificationOptions(config, language, debug);

    verifyRoute(routeInput, options)
        .then(data => console.log(data));
}