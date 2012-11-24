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
 * located in the mapshup header
 *********************************************/
(function(M) {
    
    M.Plugins.BackgroundsManager = function() {
        
        /*
         * Only one BackgroundsManager object instance is created
         */
        if (M.Plugins.BackgroundsManager._o) {
            return M.Plugins.BackgroundsManager._o;
        }
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            /*
             * Reference to this plugin
             */
            var self = this;
            
            /**
             * Init options
             */
            self.options = options || {};
            
            /*
             * Create Toolbar
             */
            self.tb = new M.Toolbar({
                parent:self.options.parent || $('.leftBar', M.$header), 
                classes:'bgm'
            });
            
            /**
             * Register changebaselayer
             */
            M.Map.map.events.register('changebaselayer', M.Map.map, function(e){
                self.tb.activate(M.Util.encode(e.layer.id), true);
            });

            /*
             * Register layersend event
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

                /*
                 * Paranoid mode
                 */
                if (!layer) {
                    return false;
                }
            
                var id = M.Util.encode(layer.id);
                
                /**
                 * Case 1 : layers list changed because a layer was added
                 */
                if (action === "add") {
                    if (layer.isBaseLayer && layer.displayInLayerSwitcher) {
                        scope.tb.add({
                            id:id,
                            title:M.Util._(layer.name).substring(0,1),
                            tt:layer.name,
                            activable:true,
                            switchable:false,
                            callback:function() {
                                M.Map.map.setBaseLayer(layer);
                            }
                        });
                    
                        /*
                         * If layer is the new base layer, trigger the toolbar
                         * to activate the right layer
                         */
                        if (layer.getVisibility()) {
                            self.tb.activate(id,true);
                        }
                    }
                }

                /**
                 * Case 2 : layers list changed because a layer was removed
                 */
                else if (action === "remove") {
                    scope.tb.remove(id);
                }
            
                return true;
            });

            return self;
        };

        /*
         * Set unique instance
         */
        M.Plugins.BackgroundsManager._o = this;
        
        return this;
    }
    
})(window.M);
