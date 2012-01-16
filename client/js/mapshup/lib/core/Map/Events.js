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
 * Define msp.Map events
 */
(function (msp) {
      
    msp.Map.Events = function(map) {

        /*
         * Only one Events object instance is created
         */
        if (msp.Map.Events._o) {
            return msp.Map.Events._o;
        }
        
        /*
         * Reference to msp.Map
         */
        this.map = map;
        
        /*
         * Set events hashtable
         */
        this.events = {
            
            /*
             * Array containing handlers to be call after
             * a change in layer indexing
             */
            indexchanged:[],
            
            /*
             * Array containing handlers to be call after
             * a change in map.layers list i.e. after :
             *  - add
             *  - remove
             *  - update
             *  - features
             */
            layersend:[],
            
            /*
             * Array containing handlers to be call after
             * a map move
             */
            moveend:[],
            
            /*
             * Array containing handlers to be call after
             * a map resize
             */
            resizeend:[],
            
            /*
             * Array containing handlers to be call after
             * a change in visibility layer
             */
            visibilitychanged:[]
        };
       
        /*
         * Register an event to jMap
         *
         * @input <String> eventname : Event name => 'resizeend', 'layersend', 'moveend'
         * @input <function> scope : scope related to this event
         * @input <function> handler : handler attached to this event
         */
        this.register = function(eventname , scope, handler) {

            var e = eventname;
            
            /*
             * Special case :
             *  - loadend and loadstart are registered within layersend
             */
            if (eventname === "loadstart" || eventname === "loadend") {
                e = "layersend";
            }

            if (this.events[e]) {
                this.events[e].push({
                    scope:scope,
                    handler:handler
                });
            }

        };

        /*
         * Unregister event
         */
        this.unRegister = function(scope) {
            
            var arr,
                i,
                key,
                l;
            for (key in this.events) {
                arr = this.events[key];
                for (i = 0, l = arr.length; i < l; i++) {
                    if (arr.scope === scope) {
                        arr.splice(i,1);
                        break;
                    }
                }
            }
        };
        
        /*
         * Trigger handlers related to an event
         *
         * @input <String> eventname : Event name => 'resizeend', 'layersend', 'moveend'
         * @input <Object> extra : options object or layer object (optional)
         */
        this.trigger = function(eventname, extra) {

            var obj,i,l,self = this;

            /*
             * Trigger layersend to each handlers
             */
            if (eventname === 'layersend') {
                
                if (extra) {
                    
                    /*
                     * Compute the true number of features layer i.e.
                     * including features hidden within clusters 
                     */
                    if (extra.layer.features) {
                        var count = 0,
                            f = extra.layer.features;
                        for (i = 0, l = f.length; i < l; i++) {
                            count += f[i].cluster ? f[i].cluster.length : 1;
                        }
                        extra.layer["_msp"].count = count;
                    }
                    
                    for (i = 0, l = self.events["layersend"].length; i < l; i++) {
                        obj = self.events["layersend"][i];
                        obj.handler(extra.action, extra.layer, obj.scope);
                    }
                    
                    /*
                     * Update layer activity indicator
                     */
                    var layer,
                    show = false,
                    $d = msp.Util.$$('#layerai', msp.$mcontainer);

                    for (i = 0, l = self.map.map.layers.length; i < l; i++) {
                        layer = self.map.map.layers[i];

                        /* If the layer is due to be destroyed */
                        if (layer._tobedestroyed) {
                            continue;
                        }
                        else if (layer.hasOwnProperty('_msp') && !layer._msp.isLoaded) {
                            show = true;
                            break;
                        }
                    }
                    show ? $d.show() : $d.hide();
                    
                }
            }
            else if (eventname === 'loadstart') {

                /*
                 * Paranoid mode
                 */
                if (extra) {

                    /*
                     * Clear layer loaded status
                     */
                    extra["_msp"].isLoaded = false;

                    /*
                     * The layer has been updated (for example Wikipedia layer)
                     * Propagate this update to plugins
                     */
                    self.trigger("layersend", {
                        action:"update",
                        layer:extra
                    });
                }
            }
            else if (eventname === 'loadend') {

                /*
                 * Paranoid mode
                 */
                if (extra) {

                    /*
                     * Clear layer loaded status
                     */
                    extra["_msp"].isLoaded = true;

                    /*
                     * Update plugins
                     */
                    self.trigger("layersend", {
                        action:"update",
                        layer:extra
                    });
                }
            }
            /*
             * Trigger moveend to each handlers
             */
            else if (eventname === 'moveend') {
                for (i = 0, l = self.events["moveend"].length; i < l; i++) {
                    obj = self.events["moveend"][i];
                    obj.handler(self.map.map, obj.scope);
                }
            }
            /*
             * Trigger resizeend to each handlers
             */
            else if (eventname === 'resizeend') {
                for (i = 0, l = self.events["resizeend"].length; i < l; i++) {
                    obj = self.events["resizeend"][i];
                    obj.handler(obj.scope);
                }
            }
            /*
             * Trigger visibilitychanged to each handlers
             */
            else if (eventname === 'visibilitychanged') {
                /*
                 * extra is a layer object
                 */
                if (extra) {
                    for (i = 0, l = self.events["visibilitychanged"].length; i < l; i++) {
                        obj = self.events["visibilitychanged"][i];
                        obj.handler(extra, obj.scope);
                    } 
                }
            }
            /*
             * Trigger indexchanged to each handlers
             */
            else if (eventname === 'indexchanged') {
                /*
                 * extra is a layer object
                 */
                if (extra) {
                    for (i = 0, l = self.events["indexchanged"].length; i < l; i++) {
                        obj = self.events["indexchanged"][i];
                        obj.handler(extra, obj.scope);
                    } 
                }
            }
        }
        
        /*
         * Create unique object instance
         */
        msp.Map.Events._o = this;
        
        return this;

    }
})(window.msp);
