import logger from 'loglevel';
import fetch from 'node-fetch';

import UIAdapter from './UIAdapter';
import RouteVerificationOutput from '../data/RouteVerificationOutput';

// Google Maps API loading and key validation
window.GOOGLE_MAPS_API_LOADED = true;
window.gm_authFailure = () => {
    window.GOOGLE_MAPS_API_LOADED = false;
};

function runVerifier() {
    if (!window.GOOGLE_MAPS_API_LOADED || !window.google || !window.google.maps) {
        window.GOOGLE_MAPS_API_LOADED = false;
        logger.error('Google Maps API is not loaded. Verification cannot be done.');
    }

    const mapCanvasElement = $('div#map-canvas');
    const routeUrl = mapCanvasElement.attr('data-what');

    const adapter = new UIAdapter();
    adapter.resetAll();
    adapter.addLoaderToButton();

    // FIXME: We should directly call verifyRoute, but there's problem with
    // turf.helpers (not properly exposed for importing) and browserify fails on it
    fetch(routeUrl)
        .then(res => res.text())
        .then(kml => {
            return fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kml
                })
            });
        })
        .then(res => res.json().then(json => (res.ok ? json : Promise.reject(json))))
        .then(json => {
            const routeVerificationOutput = new RouteVerificationOutput(json);
            adapter.init(routeVerificationOutput);
            adapter.removeLoaderFromButton();
            return adapter.get();
        })
        .catch(error => {
            adapter.removeLoaderFromButton();
            return adapter.handleError(error);
        });
}

$('button#verifyRoute').bind('click', runVerifier);
