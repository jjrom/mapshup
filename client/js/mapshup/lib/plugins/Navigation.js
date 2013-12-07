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
 * PLUGIN: Navigation
 *
 * Add navigation tools
 * 
 * @param {MapshupObject} M
 */
(function(M) {

    M.Plugins.Navigation = function() {

        /*
         * Only one Navigation object instance is created
         */
        if (M.Plugins.Navigation._o) {
            return M.Plugins.Navigation._o;
        }

        /**
         * Initialize plugin
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var self = this;

            self.options = options || {};

            /*
             * Set options
             * Default toolbar is North East Vertical
             */
            $.extend(self.options, {
                home: M.Util.getPropertyValue(self.options, "home", {
                    lon: 0,
                    lat: 40,
                    zoom: 2
                }),
                zoomin: M.Util.getPropertyValue(self.options, "zoomin", true),
                zoomout: M.Util.getPropertyValue(self.options, "zoomout", true),
                position: M.Util.getPropertyValue(self.options, "position", 'nw'),
                orientation: M.Util.getPropertyValue(self.options, "orientation", 'v')
            });

            /*
             * Set the toolbar container
             */
            tb = new M.Toolbar({
                position: self.options.position,
                orientation: self.options.orientation
            });

            /*
             * Zoom in button
             */
            if (self.options.zoomin) {
                tb.add({
                    title: "+",
                    tt: "Zoom",
                    onoff: false,
                    onactivate: function(scope, item) {
                        item.activate(false);
                        M.Map.map.setCenter(M.Map.map.getCenter(), M.Map.map.getZoom() + 1);
                    }
                });
            }

            /*
             * Zoom out button
             */
            if (self.options.zoomout) {
                tb.add({
                    title: "-",
                    tt: "Zoom out",
                    onoff: false,
                    onactivate: function(scope, item) {
                        item.activate(false);
                        M.Map.map.setCenter(M.Map.map.getCenter(), Math.max(M.Map.map.getZoom() - 1, M.Map.lowestZoomLevel));
                    }
                });
            }

            /*
             * Home button
             */
            if (self.options.home) {
                tb.add({
                    title: "&#8226;",
                    tt: "Global view",
                    onoff: false,
                    onactivate: function(scope, item) {
                        item.activate(false);
                        M.Map.map.restrictedExtent ? M.Map.map.zoomToExtent(M.Map.map.restrictedExtent) : M.Map.setCenter(M.Map.Util.d2p(new OpenLayers.LonLat(self.options.home.lon, self.options.home.lat)), self.options.home.zoom, true);
                    }
                });
            }

            return this;

        };

        /*
         * Set unique instance
         */
        M.Plugins.Navigation._o = this;

        return this;
    };

})(window.M);