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
 * PLUGIN: BackgroundsManager
 *
 * Define a "Background layer" switcher
 * Located at the top-right of the map
 *********************************************/
(function(msp) {
    
    msp.Plugins.BackgroundsManager = function() {
        
        /*
         * Only one BackgroundsManager object instance is created
         */
        if (msp.Plugins.BackgroundsManager._o) {
            return msp.Plugins.BackgroundsManager._o;
        }
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            /*
             * Reference to this plugin
             */
            var scope = this;
            
            /*
             * Be sure to only initialize
             */
            if (this.isLoaded) {
                return scope;
            }

            /**
             * Init options
             */
            this.options = options || {};

            /*
             * Set options
             * Default toolbar is South East vertical Toolbar
             */
            $.extend(this.options, {
                position:this.options.position || 'se',
                orientation:this.options.orientation || 'v'
            });
            
            this.tb = new msp.Toolbar(this.options.position, this.options.orientation);
            
            /**
             * Register changebaselayer
             */
            msp.Map.map.events.register('changebaselayer', msp.Map.map, function(e){
                var btn = scope.tb.get(msp.Util.encode(e.layer.id));
                if (btn) {
                    btn.activate(true);
                }
            });

            /*
             * Register events
             */
            msp.Map.events.register("layersend", scope, scope.onLayersEnd);

            this.isLoaded = true;

            return scope;
        };

        /**
         * This function is called after msp.jMap.map.layers changed
         * (i.e. successfull addLayer or removeLayer)
         */
        this.onLayersEnd = function(action, layer, scope) {

            if (!layer) {
                return false;
                
            }
            
            var id = msp.Util.encode(layer.id),
                btn;
                
            /**
             * Case 1 : layers list changed because a layer was added
             */
            if (action === "add") {
                if (layer.isBaseLayer && layer.displayInLayerSwitcher) {
                    new msp.Button({
                        id:id,
                        tb:scope.tb,
                        title:msp.Util._(layer.name).substring(0,1),
                        tt:layer.name,
                        activable:true,
                        switchable:false,
                        callback:function() {
                            msp.Map.map.setBaseLayer(layer);
                        }
                    });
                    
                    /*
                     * If layer is the new base layer, trigger the toolbar
                     * to activate the right layer
                     */
                    if (layer.getVisibility()) {
                        scope.tb.get(id).activate(true);
                    }
                }
            }

            /**
             * Case 2 : layers list changed because a layer was removed
             */
            else if (action === "remove") {
                btn = scope.tb.get(id);
                if (btn) {
                    btn.remove();
                }
            }
            
            return true;
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.BackgroundsManager._o = this;
        
        return this;
    }
    
})(window.msp);
