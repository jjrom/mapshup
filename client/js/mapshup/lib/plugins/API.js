/*
 * mapshup - Webmapping made easy
 * http://mapshup.info
 *
 * Copyright Jérôme Gasperi, 2011.12.08
 *
 * jerome[dot]gasperi[at]gmail[dot]com
 *
 * This software is a computer program whose purpose is a webmapping application
 * to display and manipulate geographical data.
 *
 * This software is governed by the CeCILL-B license under French law and
 * abiding by the rules of distribution of free software.  You can  use,
 * modify and/ or redistribute the software under the terms of the CeCILL-B
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 *
 * As a counterpart to the access to the source code and  rights to copy,
 * modify and redistribute granted by the license, users are provided only
 * with a limited warranty  and the software's author,  the holder of the
 * economic rights,  and the successive licensors  have only  limited
 * liability.
 *
 * In this respect, the user's attention is drawn to the risks associated
 * with loading,  using,  modifying and/or developing or reproducing the
 * software by the user in light of its specific status of free software,
 * that may mean  that it is complicated to manipulate,  and  that  also
 * therefore means  that it is reserved for developers  and  experienced
 * professionals having in-depth computer knowledge. Users are therefore
 * encouraged to load and test the software's suitability as regards their
 * requirements in conditions enabling the security of their systems and/or
 * data to be ensured and,  more generally, to use and operate it in the
 * same conditions as regards security.
 *
 * The fact that you are presently reading this means that you have had
 * knowledge of the CeCILL-B license and that you accept its terms.
 */

/**
 * API plugin allows to access mapshup functions (addLayer, etc.)
 * from another domain - e.g. when mapshup is run within an iFrame
 * 
 * @param {MapshupObject} M
 */
(function(M) {

    M.Plugins.API = function() {

        /*
         * Only one API object instance is created
         */
        if (M.Plugins.API._o) {
            return M.Plugins.API._o;
        }

        this.authorized = [];

        /**
         * Init plugin
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var self = this;

            /*
             * Init options
             */
            options = options || {};
            if (options.authorized) {
                this.authorized = $.isArray(options.authorized) ? options.authorized : [options.authorized];
            }

            var listener = function(event) {
                var allowed = false;
                for (var i = 0, l = self.authorized.length; i < l; i++) {
                    if (self.authorized[i] === '*' || self.authorized[i] === event.origin) {
                        allowed = true;
                        break;
                    }
                }

                /*
                 * Process messages from authorized urls only 
                 * 
                 * Message should be a valid json string wich after decoding should be
                 * on the form :
                 * 
                 *      {"command":"addLayer","options":{...}}
                 *      
                 */
                if (allowed) {
                    try {
                        var data = JSON.parse(decodeURIComponent(event.data));
                        self.dispatch(data['command'], data['options']);
                    }
                    catch (e) {
                        return false;
                    }
                    return true;
                }

                return false;
            };

            /*
             * Attach eventlistener on postMessage
             */
            if (window.addEventListener) {
                addEventListener("message", listener, false);
            }
            else {
                attachEvent("onmessage", listener);
            }

            return this;

        };

        /**
         * Process and dispatch data
         * 
         * @param {String} command
         * @param {Object} options
         */
        this.dispatch = function(command, options) {

            options = options || {};
            
            switch (command) {
                case 'addLayer':
                    M.Map.addLayer(options, {noDeletionCheck: true});
                    break;
                case 'removeLayer' :
                    M.Map.removeLayer(M.Map.Util.getLayerByMID(options.MID));
                    break;
                case 'zoomOnLayer' :
                    M.Map.Util.zoomOn(M.Map.Util.getLayerByMID(options.MID), true);
                    break;
                case 'zoomOnFeature' :
                    M.Map.Util.Feature.zoomOn(M.Map.Util.getFeature(M.Map.Util.getLayerByMID(options.MID), options.fid));
                    break;
                default :
                    break;
            }
        };

        /*
         * Set unique instance
         */
        M.Plugins.API._o = this;

        return this;

    };
})(window.M);