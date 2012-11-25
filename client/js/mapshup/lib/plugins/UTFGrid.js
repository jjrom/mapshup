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
/*
 * UTFGrid plugin.
 */
(function(M) {
    
    M.Plugins.UTFGrid = function() {
        
        /*
         * Only one UTFGrid object instance is created
         */
        if (M.Plugins.UTFGrid._o) {
            return M.Plugins.UTFGrid._o;
        }
        
        /*
         * Active status
         */
        this.active = false;
        
        /*
         * Store last hilited grid object
         */
        this._current = {};
        
        /*
         * List of UTFGrid layers
         */
        this.layers = [];
        
        /*
         * True to display geometry if available
         */
        this.useGeo = true;
        
        /*
         * Init plugin
         */
        this.init = function(options) {
            
            var self = this;
            
            /**
             * Init options
             */
            self.options = options || {};

            /*
             * Create UTFGrid alert container
             */
            self.$d = M.Util.$$('#'+M.Util.getId()).addClass("utfginfo").click(function(){
                self.activate(!self.active);
            });
            
            /*
             * Define action on mousemove
             */
            M.$map.mousemove(function (e){
                
                /*
                 * Never display UTFGrid info if a vector feature is already hilited
                 */
                if (M.Map.$featureHilite.attr("hilited") === "hilited") {
                    
                    /* Important - reset last hilited object if any */
                    self._current = {};
                    
                    return false;
                }
                
                var i, l, items, layer, z, mz,
                show = false,
                lonLat = M.Map.map.getLonLatFromPixel(M.Map.mousePosition);
                
                if (!lonLat) { 
                    return false;
                }    
                
                /*
                 * Roll over UTFGrid layers
                 */
                if (self.layers.length > 0) {
                    items = {};
                    for (i = 0, l = self.layers.length; i<l; i++) {
                        
                        layer = self.layers[i];
                        
                        /*
                         * Do not send request outside of zoom levels and location bounds
                         */
                        z = layer["_M"].z;
                        mz = M.Map.map.getZoom();
                        
                        if ((mz >= z[0] && mz <= z[1]) && layer["_M"].bounds.containsLonLat(lonLat)) {
                            
                            /*
                             * Show info if UTFGrid is active
                             */
                            if (self.active) {
                                items[OpenLayers.Util.indexOf(M.Map.map.layers, layer)] = {
                                    attributes:layer.getFeatureInfo(lonLat),
                                    modifiers:layer["_M"].layerDescription["info"]
                                }
                            }
                            
                            show = true;
                            
                        }
                        
                    }
                    
                    /*
                     * Show or hide UTFGrid alert container depending on UTFGrid data are present or not
                     */
                    show ? self.$d.show() : self.$d.hide();
                    
                    self.getInfo(items);
                    
                }
                
                /*
                 * Activate or deactivate UTFGrid alert during startup
                 */
                self.activate(self.active);
                
                return true;
                
            });
            
            /*
             * Create overlay layer to display polygon on hover
             */
            self.layer = new OpenLayers.Layer.Vector("__LAYER_UTFGRID__", {
                projection:M.Map.sm,
                displayInLayerSwitcher:false,
                styleMap:new OpenLayers.StyleMap({
                    'default':{
                        strokeColor:'white',
                        strokeWidth: 1,
                        fillColor:'yellow',
                        fillOpacity: 0.2
                    }
                })
            });

            /**
             * Add Drawing layer to Map object
             */
            M.Map.addLayer({
                type:"Generic",
                title:self.layer.name,
                unremovable:true,
                MLayer:true,
                layer:self.layer
            });
            
            /*
             * Track layersend events to add/remove UTFGrid layers
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {
                
                var i,l;
                
                /*
                 * Only process UTFGrid layers
                 */
                if (!layer || !layer["_M"] || !layer["_M"].layerDescription) {
                    return false;
                }
                
                if (layer["_M"].layerDescription["type"] !== "UTFGrid") {
                    return false;
                }
                
                if (action === "add") {
                    scope.layers.push(layer);
                }
                else if (action === "remove") {
                    for (i = 0, l = scope.layers.length ; i < l; i++) {
                        if (scope.layers[i].id === layer.id) {
                            scope.layers.splice(i,1);
                            break;
                        }
                    }
                }
                
                return true;
                
            });
            
            return self;
            
        };
        
        /*
         * Activate or deactivate UTFGrid detection
         */
        this.activate = function(b) {
            this.active = b;
            this.$d.html(M.Util._((b ? "Hide" : "Show") +" thematic metadata"));
            if (!b) {
                this.layer.destroyFeatures();
            }
        };
        
        /*
         * Activate or deactivate UTFGrid detection
         */
        this.activateGeo = function(b) {
            this.useGeo = b;
            if (!b) {
                this.layer.destroyFeatures();
            }
        };
        
        /*
         * Display items info
         * 
         * @param {Array} items : array of item
         *          {
         *              attributes: // object of attributes
         *                  { data://, id://}
         *              modifiers: // object modifier
         *                  {
         *                      title: // title to be displayed
         *                      keys:{
         *                          '...':{
         *                              transform:function()
         *                          }
         *                      }
         *                  }
         *              
         *          }
         */
        this.getInfo = function(items) {
            
            var k, keys, item, o, c = "", features = [], self = this;
            
            items = items || {};
            
            /*
             * Roll over items
             */
            for (item in items) {
                
                o = items[item];
                o.attributes  = o.attributes || {};
                o.modifiers  = o.modifiers || {};
                keys = o.attributes.data || null;
                
                if (keys) {

                    /*
                     * Optimize !
                     * If new keys is the same as the one already
                     * displayed do not reprocess things
                     */
                    if (JSON.stringify(keys) === JSON.stringify(self._current)) {
                        M.Map.$featureHilite.show();
                        return false;
                    }
                    
                    if (o.modifiers.title) {
                        c = M.Util.parseTemplate(o.modifiers.title, keys, o.modifiers.keys);
                    }
                    else {

                        /*
                        * Roll over data key
                        */
                        for (k in keys) {
                            c += '<p>'+k+' : ' + keys[k] + '</p>';
                        }

                    }

                    /*
                     * Add geometry
                     */
                    if (self.useGeo && keys["wkt"]) {
                        features.push(new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(keys["wkt"])));
                    }
                    
                    self._current = keys;
                }
   
            }
            
            if (c !== "") {
               
                /*
                * Display tooltip
                */
                M.Map.$featureHilite.html(c).show();
                
                /*
                * Display geometry
                */
                if (features.length > 0) {
                    self.layer.destroyFeatures();
                    self.layer.addFeatures(features);
                }
                
                return true;
            }
            
            /*
             * Hide container
             */
            self.layer.destroyFeatures();
            self._current = {};
            M.Map.$featureHilite.hide();
            
            return false;
            
        };
        
        /*
         * Set unique instance
         */
        M.Plugins.UTFGrid._o = this;
        
        return this;
    };
})(window.M);