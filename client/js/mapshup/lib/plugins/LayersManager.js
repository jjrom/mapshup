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
 * PLUGIN: LayersManager
 *
 * The LayersManager plugin offers an easy way to
 * manipulate map layers
 * 
 *********************************************/
(function(msp) {
    
    msp.Plugins.LayersManager = function() {
        
        /*
         * Only one Context object instance is created
         */
        if (msp.Plugins.LayersManager._o) {
            return msp.Plugins.LayersManager._o;
        }
        
        
        /*
         * Initialize plugin
         */
        this.init = function(options) {
            
            var id,
                scope = this;
            
            /*
             * Init options
             */
            this.options = options || {};

            /*
             * Set options
             * Default toolbar is North East Horizontal
             */
            $.extend(this.options, {
                opacitySteps:this.options.opacitySteps || 5, // Number of opacity steps for raster layers - Opacity range is from 0 (transparent) to 1 (opaque)
                position:this.options.position || 'ne',
                orientation:this.options.orientation || 'v',
                backgrounds:msp.Util.getPropertyValue(this.options, "backgrounds", true)
            });
            
            /*
             * Register open layers list action within Toolbar and store
             * the reference of the created <li> element
             */
            this.btn = new msp.Button({
                tb:new msp.Toolbar(this.options.position, this.options.orientation),
                icon:"layers.png",
                tt:"Layers manager",
                container:(new msp.Panel('e')).add(), //  Layers list is displayed within an East msp.Panel
                activable:true,
                scope:this
            });
            
            /*
             * Set the panel container content with the following html structure
             * 
             * <div id="..." class="pglm">
             *      <div class="header"></div>
             *      <div class="backgrounds block"></div>
             *      <div class="body block expdbl">
             *          <ul>
             *              ...
             *          </ul>
             *      </div>
             * </div>
             */
            this.btn.container.$d.addClass("pglm").html('<div class="body block expdbl"><h1>'+msp.Util._("Overlays")+'</h1><ul></ul></div>');
            
            /*
             * Get the body.ul reference
             */
            this.$oul = $('.body ul', this.btn.container.$d);
           
            /*
             * Background toolbar reference
             */
            if (this.options.backgrounds) {
                
                /*
                 * Create backgrounds toolbar
                 */
                this.bgtb = new msp.Toolbar('fr', 'h', this.btn.container.$d.prepend('<div class="backgrounds block"><h1>'+msp.Util._("Backgrounds")+'</h1></div>').children().first());
                
                /**
                 * Register changebaselayer
                 */
                msp.Map.map.events.register('changebaselayer', msp.Map.map, function(e){
                    var btn = scope.bgtb.get('lm'+msp.Util.encode(e.layer.id));
                    if (btn) {
                        btn.activate(true);
                    }
                });
                
                /*
                 * Register events on layersend
                 */
                msp.Map.events.register("layersend", scope, function(action,layer,scope) {
                    if (action === "add" && layer) {
                        if (layer.isBaseLayer && layer.displayInLayerSwitcher) {
                            id = 'lm'+msp.Util.encode(layer.id);
                            new msp.Button({
                                tb:scope.bgtb,
                                id:id,
                                tt:layer.name,
                                switchable:false,
                                title:msp.Util._(layer.name).substring(0,1),
                                activable:true,
                                callback:function() {
                                    msp.Map.map.setBaseLayer(layer);
                                }
                            });
                            
                            /*
                             * If layer is the new base layer, trigger the toolbar
                             * to activate the right layer
                             */
                            if (layer.getVisibility()) {
                                scope.bgtb.get(id).activate(true);
                            }
                        }
                    }
                });

            }
            
            /*
             * Add header
             */
            this.btn.container.$d.prepend('<div class="header">'+msp.Util._("Layers manager")+'</div>');
            
            /*
             * Event registration when layer end to load
             * 
             * Event is called after msp.Map.map.layers changed
             * (i.e. successfull addLayer or removeLayer)
             *
             * Possible actions are :
             *   - add
             *   - remove
             *   - update
             *   - features
             */
             msp.Map.events.register("layersend", this, function(action, layer, scope) {

                /**
                 * Case 1 : layers list changed because a layer was added or updated
                 */
                if (action === "add" || action ==="update" || action === "features") {
                    scope.update(layer);
                }

                /*
                 * Case 2 : layers list changed because a layer was removed
                 */
                else if (action === "remove") {
                    scope.remove(layer);
                }

                return true;
        
            });
            
            /*
             * Event on a change in layer visibility
             */
            msp.Map.events.register("visibilitychanged", this, function (layer, scope) {
                scope.update(layer);
            });
            
            msp.Map.events.register("indexchanged", this, this.updateIndex);
            

            return this;
        };
        
        /**
         * This function is called after a layer index have been updated
         * 
         * Move the layer in the <ul> list regarding it's index in the layer list
         * The greater the layer index, the lowest the layer is added within the list
         */
        this.updateIndex = function(layer, scope) {
            
            var id = msp.Util.encode("lm"+layer["_msp"].mspID),
                lidx = msp.Map.map.getLayerIndex(layer);
                
            /*
             * Paranoid mode
             */
            if (!layer) {
                return false;
            }
            
            /*
             * If layer new index is the same as previous,
             * there is no needs to move it in the list
             */
            if (parseInt($('#'+id).attr('lidx')) === lidx) {
                return false;
            }
            
            return scope.add();

        };
        
        /*
         * Refresh actions for input layer
         */
        this.update = function(layer) {
            
            if (!layer) {
                return;
            }
            
            var actions,
                c,
                i,
                j,
                k,
                unique,
                img,
                fraction = 1 / this.options.opacitySteps,
                content = '<div class="title" title="'+msp.Util._(layer.name)+'"><img class="icn" src="'+(layer["_msp"].isLoaded ? layer["_msp"].icon : msp.Util.getImgUrl("loading.gif"))+'"/> ' + msp.Util.shorten(msp.Util._(layer.name),30) +'</div><div class="actions"></div>',
                id = msp.Util.encode("lm"+layer["_msp"].mspID),
                $id = $('#'+id)
                scope = this;
                
            if (layer.displayInLayerSwitcher && !layer.isBaseLayer && !layer._tobedestroyed) {
                    
                    /*
                     * Clear layer entry in the list 
                     */
                    if ($id.length > 0) {
                        $id.empty();
                        $id.append(content);
                    }
                    else {
                        /*
                         * Add the layer at the last element in the <ul> list 
                         */
                        this.$oul.append('<li id="' + id + '">'+content+'</li>');
                        $id = $('#'+id);
                    }
                    
                    /*
                     * Get actions class
                     */
                    c = $('.actions', $id);
                    actions = this.getActions(layer, $id);
                    
                    /*
                     * Add or remove hidden class
                     */ 
                    layer.getVisibility() === true ? $id.removeClass('hidden') : $id.addClass('hidden');

                    /*
                     * Roll over layer actions
                     */
                    for (j = 0, k = actions.length; j < k; j++) {
                        a = actions[j];
                        
                        /*
                         * Special case for opacity change
                         */
                        if (a.id.indexOf('opacity') !== -1) {
                         
                            for (i = 1; i <= this.options.opacitySteps; i++) {
                                unique = msp.Util.getId();
                                if ((layer.opacity <= fraction * i) && (layer.opacity > fraction * (i - 1))) {
                                    img = msp.Util.getImgUrl("opacitya.png");
                                }
                                else {
                                    img = msp.Util.getImgUrl("opacity.png")
                                }
                                c.append('<a href="#" class="fade" jtitle="'+msp.Util._("Opacity")+' - '+Math.round(fraction*i*100)+ '%" id="'+unique+'"><img class="middle" src="'+img+'"></a>');
                                (function(d,i,fraction,scope,layer) {
                                    d.click(function(){
                                        msp.Map.Util.getLayerByMspID(layer["_msp"].mspID).setOpacity(fraction*i);
                                        scope.update(layer)
                                        return false;
                                    });
                                    msp.tooltip.add(d, 'n');
                                })($('#'+unique),i,fraction,scope,layer);
                            }

                        }
                        else {
                            c.append('<a href="#" id="'+a.id+'" jtitle="'+msp.Util._(a.ti)+'"><img class="middle" src="'+msp.Util.getImgUrl(a.ic)+'"/></a>');
                            d = $('#'+a.id);
                            msp.tooltip.add(d, 'n');
                            (function(d,a){
                                d.click(function() {
                                    a.cb();
                                    return false;
                                })
                            })(d,a);
                        }
                    }

            }
            
        };
        
        /**
         * Return an array of layer menu items
         */
        this.getActions = function(layer,li) {
  
            var bounds,
                j,
                key,
                l,
                menuactions,
                plugin,
                actions = [],
                self = this,
                id = msp.Util.encode("lm"+layer["_msp"].mspID+"_");

            /**
             * Switch visibility
             */
            if (layer.getVisibility()) {
                actions.push({
                    id:id+"visibility",
                    ic:"hide.png",
                    ti:"Hide",
                    cb:function() {
                        
                        /*
                         * Hide layer
                         */
                        msp.Map.Util.setVisibility(layer, false);
                        
                    }
                });
            }
            else {
                actions.push({
                    id:id+"visibility",
                    ic:"show.png",
                    ti:"Show",
                    cb:function() {
                        
                        /*
                         * Show layer
                         */
                        msp.Map.Util.setVisibility(layer, true);
                        
                    }
                });
            }

            /*
             * Zoom on layer
             * Vector layers should have a layer.getDataExtent() function that returns
             * the layer bounds
             * Raster layer (e.g. WMS, Image) should have a layer["_msp"].getDataExtent()
             */
            if ((bounds = layer.getDataExtent()) || (bounds = layer["_msp"].bounds)) {
                
                /**
                 * Do not set a zoomOn capability on layer
                 * with _msp.noZoomOn set to true
                 */
                if (!layer["_msp"].noZoomOn) {
                    actions.push({
                        id:id+"zoomon",
                        ic:"plus.png",
                        ti:"Zoom",
                        cb:function() {
                            msp.Map.zoomTo(bounds);
                        }
                    });
                }
            }

            /**
             * Track layer
             */
            if (layer["_msp"].refreshable) {
                if (layer["_msp"].refresh) {
                    actions.push({
                        id:id+"refresh",
                        ic:"loading.gif",
                        ti:"Stop tracking",
                        cb:function() {
                            layer["_msp"].refresh = false;
                            self.update(layer);
                        }
                    });
                }
                else {
                    actions.push({
                        id:id+"refresh",
                        ic:"spin.png",
                        ti:"Start tracking",
                        cb:function() {
                            layer["_msp"].refresh = true;
                            self.update(layer);
                        }
                    });
                }
            }

            /*
             * Time layer
             */
            if (layer["_msp"].layerDescription.time) {
                actions.push({
                    id:id+"time",
                    ic:"time.png",
                    ti:"Time",
                    cb:function() {
                        msp.Util.askFor(msp.Util._("Set date"), msp.Util._("Enter ISO 8601 date..."), "date", layer["_msp"].layerDescription.time.value, function(time) {
                            if (layer) {
                                var layerType = msp.Map.layerTypes[layer["_msp"].layerDescription["type"]];
                                if (layerType && typeof layerType.setTime === "function") {
                                    layerType.setTime(layer, time)
                                }
                            }
                        });
                    }
                });
            }

            /**
             * Change opacity
             */
            if (layer["_msp"].allowChangeOpacity) {

                /**
                 * OpenLayers issue ? opacity is not set at first
                 */
                if (!layer.opacity) {
                    layer.setOpacity(1);
                }

                actions.push({
                    id:id+"opacity",
                    ti:"Opacity"
                });
            }
            
            /**
             * Add item from other plugins
             */
            for(key in msp.plugins) {
                plugin = msp.plugins[key];
                if (plugin) {
                    if (typeof plugin.getLmngActions === "function") {
                        menuactions = plugin.getLmngActions(layer, li);
                        if (menuactions) {
                            if (menuactions instanceof Array) {
                                for (j = 0, l = menuactions.length; j < l;j++) {
                                    actions.push(menuactions[j]);
                                }
                            }
                            else {
                                actions.push(menuactions);
                            }
                        }
                    }
                }
            }

            /**
             * Remove layer
             */
            if (!layer["_msp"].unremovable) {
                actions.push({
                    id:id+"trash",
                    ic:"trash.png",
                    ti:"Delete",
                    cb:function() {
                        msp.Map.removeLayer(layer, true);
                    }
                });
            }

            return actions;
        };
        
        /*
         * Remove layer from the LayersManager
         */
        this.remove = function(layer) {
            $('#'+msp.Util.encode("lm"+layer["_msp"].mspID)).remove();
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.LayersManager._o = this;
        
        return this;
        
    };
    
})(window.msp);