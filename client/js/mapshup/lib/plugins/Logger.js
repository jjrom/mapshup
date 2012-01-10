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
 * Plugin Logger
 *
 * Log every move to mapshup database
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.Logger = function() {
        
        /*
         * Only one Logger object instance is created
         */
        if (msp.Plugins.Logger._o) {
            return msp.Plugins.Logger._o;
        }
        
        /*
         * Init plugin
         */
        this.init = function(options) {
        
            /**
             * Best practice : init options
             */
            this.options = options || {};

            /*
             * Default options
             */
            $.extend(this.options, {
                url:msp.Util.repareUrl(msp.Util.getAbsoluteUrl(this.options.url || "/plugins/logger/logger.php?"))+msp.Util.abc,
                realtime:this.options.realtime || false
            });
            
            /*
             * Register moveend event
             */
            msp.Map.events.register("moveend", this, function(map, scope) {
        
                var state = msp.Map.getState(),
                    projected = msp.Map.Util.p2d(map.getExtent().clone());

                if (map.getZoom() <= msp.Map.lowestZoomLevel) {
                    return;
                }

                /*
                 * Avoid Logger to store re-visited "history" extent
                 */
                if (msp.Map.doNotLog) {
                    msp.Map.doNotLog = false;
                }
                
                /*
                 * Avoid an OpenLayers behaviour (bug ?) :
                 * each time baseLayer is changed, 'moveend' is triggered
                 * even if map.getExtent() did not change
                 */
                if (state.center.equals(msp.Map.currentState.center) && state.center.resolution(msp.Map.currentState.resolution)) {
                    return;
                }

                /*
                 * Call the log service with new bbox
                 */
                scope.log({
                    bbox:projected.left+","+projected.bottom+","+projected.right+","+projected.top
                });
            });

            return this;
        };

        /**
         * Send log data to the mapshup database
         */
        this.log = function(obj) {

            var key,
            query = "";
                
            /*
             * Check for mandatory bbox information
             */
            if (!obj || !obj.bbox) {
                return;
            }

            /*
             * Roll over input query parameters
             */
            obj.zoom = msp.Map.map.getZoom();
            
            for (key in obj) {
                query += "&" + key + "=" + obj[key];
            }

            if (this.options.realtime) {
                query += "&realtime=true";
            }

            if (msp.Util.Cookie.get("userid")) {
                query += "&userid="+msp.Util.Cookie.get("userid");
            }

            /**
             * Send log data to mapshup database
             * For database structure, see :
             *      _devel/plugins/logger
             *      _devel/database
             */
            $.ajax({
                url:msp.Util.proxify(this.options.url+query),
                async:true,
                dataType:"text"
            });

            return;

        };
        /*
         * Set unique instance
         */
        msp.Plugins.Logger._o = this;
        
        return this;
        
    };
})(window.msp);