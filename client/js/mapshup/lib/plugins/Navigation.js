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
/*********************************************
 * PLUGIN: Navigation
 *
 * Add navigation tools
 * 
 *********************************************/
(function(msp) {
    
    msp.Plugins.Navigation = function() {
        
        /*
         * Only one Navigation object instance is created
         */
        if (msp.Plugins.Navigation._o) {
            return msp.Plugins.Navigation._o;
        }
        
        /**
         * Store the latest saved context
         */
        this.latestSavedContext = "";
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var tb;
            
            this.options = options || {};

            /*
             * Set options
             * Default toolbar is North West Horizontal
             */
            $.extend(this.options, {
                home:this.options.home || false,
                zoomin:this.options.zoomin || true,
                zoomout:this.options.zoomout || true,
                position:this.options.position || 'nw',
                orientation:this.options.orientation || 'h'
            });

            /*
             * Set the toolbar container
             */
            tb = new msp.Toolbar(this.options.position, this.options.orientation);
            
            /*
             * Zoom in button
             */
            if (this.options.zoomin) {
                new msp.Button({
                    tb:tb,
                    title:"+",
                    tt:"Zoom",
                    activable:false,
                    callback:function() {
                        msp.Map.map.setCenter(msp.Map.map.getCenter(), msp.Map.map.getZoom() + 1);
                    }
                });
            }

            /*
             * Zoom out button
             */
            if (this.options.zoomout) {
                new msp.Button({
                    tb:tb,
                    title:"-",
                    tt:"Zoom out",
                    activable:false,
                    callback:function() {
                        msp.Map.map.setCenter(msp.Map.map.getCenter(), Math.max(msp.Map.map.getZoom() - 1, msp.Map.lowestZoomLevel));
                    }
                });
            }

            /*
             * Home button
             */
            if (this.options.home) {
                new msp.Button({
                    tb:tb,
                    icon:"fullscreen.png",
                    tt:"Go back to the start view",
                    activable:false,
                    callback:function() {
                        msp.Map.map.restrictedExtent ? msp.Map.map.zoomToExtent(msp.Map.map.restrictedExtent) : msp.Map.map.setCenter(new OpenLayers.LonLat(0,20), 3);
                    }
                });
            }

            return this;

        };

        /*
         * Set unique instance
         */
        msp.Plugins.Navigation._o = this;
        
        return this;
    }
    
})(window.msp);
