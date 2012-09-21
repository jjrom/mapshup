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
 * Raster manager plugin
 * 
 * !!! THIS PLUGIN MUST BE INITIALIZED BEFORE LayersManager PLUGIN !!!!
 * 
 * Display a popup containing all raster layers. User can show/hide layers,
 * switch visibility, change opacity, reorder z-index, etc.
 * 
 */
(function (msp) {

    msp.Plugins.RastersManager = function() {
        
        /**
         * Only one RastersManager object instance is created
         */
        if (msp.Plugins.RastersManager._o) {
            return msp.Plugins.RastersManager._o;
        }
        
        /**
         * Panel initialisation
         */
        this.init = function(options) {
            
            var self = this;
            
            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set options
             * 
             * inLM : // true to display raster manager access through the "configure" button in
             *           in the raster tab of the LayersManager plugin (default true)
             *
             */
            $.extend(self.options, {
                inLM:msp.Util.getPropertyValue(self.options, "inLM", true)
            });
            
            return self;
        };
        
        /*
        * Open popup configuration
        */
        this.show = function() {

            var $tb, i, l, layer, id, layers = [], self = this;

            /*
            * Roll over layers
            */
            for (i = 0, l = msp.Map.map.layers.length; i < l; i++){
                layer = msp.Map.map.layers[i];
                if (!layer.isBaseLayer && msp.Map.Util.isRaster(layer)) {
                    layers.push(layer);
                }

            }

           /*
           * Get info popup
           */
            if (!self.popup) {

                /*
               * Create info popup.
               * popup reference is removed on popup close
               */
                self.popup = new msp.Popup({
                    modal:false,
                    onClose:function(scope){
                        scope.popup = null;
                    },
                    header:'<p>'+msp.Util._("Configure raster layers")+'</p>',
                    scope:self
                });

                /*
               * Roll over layer descrpiption properties
               */
                self.popup.$b.append('<div class="hint">'+msp.Util._("Hint - drag&drop rows to reorder layer display")+'</div><table class="lmrcfg sortable"><thead><tr><th></th><th>'+msp.Util._("Name")+'</th><th>'+msp.Util._("Opacity")+'</th><th>'+msp.Util._("Visibility")+'</th></tr></thead><tbody></tbody></table>');

                $tb = $('tbody', self.popup.$b).sortable({
                    revert:true,
                    revertDuration:10,
                    stop:function(e,ui){

                        /*
                        * Reorder raster layer z-indexes
                        * 
                        * Get the layer just below the moved layer
                        */
                        var layer = msp.Map.Util.getLayerByMspID(ui.item.attr("mspid")),
                        nLayer = msp.Map.Util.getLayerByMspID(ui.item.next().attr('mspid')),
                        pLayer = msp.Map.Util.getLayerByMspID(ui.item.prev().attr('mspid'));

                        /*
                        * If no layer is below or over the moved layer then do nothing.
                        * Otherwise, set the moved layer index to its new index
                        */
                        if (nLayer) {
                            msp.Map.map.setLayerIndex(layer, msp.Map.map.getLayerIndex(nLayer) + 1);
                        }
                        else if (pLayer) {
                            msp.Map.map.setLayerIndex(layer, msp.Map.map.getLayerIndex(pLayer) - 1);
                        }

                    }

                });
                for (i = 0, l = layers.length; i < l; i++) {
                    layer = layers[i];
                    id = layer['_msp'].mspID;
                    $tb.append('<tr mspid="'+id+'"><td><img src="'+layer['_msp'].icon+'" class="middle"/></td><td class="title">'+msp.Util.shorten(layer.name,20)+'</td><td><div id="'+id+'op" class="element"></div></td><td class="clickable" id="'+id+'vy">'+ msp.Util._(layer.getVisibility() ? "Hide" : "Show") +'</td></tr>');

                    (function(id, layer) {

                        /*
                        * Opacity
                        */
                        $("#"+id+"op").slider({
                            value:layer.opacity * 100 || 100,
                            range:"min",
                            min:0,
                            max:100,
                            slide: function(event, ui) {
                                if (layer) {
                                    layer.setOpacity(ui.value / 100.0);
                                }
                            }
                        });

                        /*
                        * Visibility
                        */
                        $("#"+id+"vy").click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            msp.Map.Util.setVisibility(layer, !layer.getVisibility());
                            return false;
                        });

                    })(id, layer);
                }

            }

            self.popup.show();

        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.RastersManager._o = this;
        
        return this;
        
    };
})(window.msp);