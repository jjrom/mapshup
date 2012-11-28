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
 * Display a popup containing all raster layers. User can show/hide layers,
 * switch visibility, change opacity, reorder z-index, etc.
 * 
 */
(function(M) {

    M.Plugins.RastersManager = function() {

        /**
         * Only one RastersManager object instance is created
         */
        if (M.Plugins.RastersManager._o) {
            return M.Plugins.RastersManager._o;
        }

        /**
         * Panel initialisation
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var self = this;

            /*
             * Init options
             */
            self.options = options || {};
            $.extend(self.options, {
                position: M.Util.getPropertyValue(self.options, "position", 'ne'),
                orientation: M.Util.getPropertyValue(self.options, "orientation", 'v')
            });

            /*
             * RastersManager is activated through a Toolbar item
             */
            self.$d = M.Util.$$('#' + M.Util.getId(), M.$mcontainer);
            self.launcher = (new M.Toolbar({
                position: self.options.position,
                orientation: self.options.orientation
            })).add({
                icon: "raster.png",
                tt: "Show raster layers",
                scope: self,
                callback: function(scope, item) {
                    !scope.popup ? scope.show() : scope.hide();
                }
            });

            /*
             * Track layersend events
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

                if (!layer.isBaseLayer && M.Map.Util.isRaster(layer)) {
                    if (action === "add") {
                        scope.show();
                    }
                    else if (action === "remove"){
                            scope.refresh();
                    }
                }

            });

            return self;
        };

        /*
         * Open popup configuration
         */
        this.show = function() {

            /*
             * Get info popup
             */
            if (!this.popup) {

                /*
                 * Create info popup.
                 * popup reference is removed on popup close
                 */
                this.popup = new M.Popup({
                    modal: false,
                    scope: this,
                    classes:'rm',
                    centered:false,
                    noHeader:true,
                    autoSize:true,
                    generic:false,
                    onClose: function(scope) {
                        scope.popup = null;
                        scope.launcher.activate(false);
                    },
                    header: '<p>' + M.Util._("Configure raster layers") + '</p>'
                });

            }

            /*
             * Refresh popup content
             */
            this.refresh();

            /*
             * Show popup
             */
            this.popup.show();

        };
        
        /**
         * Hide popup
         */
        this.hide = function() {
            if (this.popup) {
                this.popup.hide();
            }
            this.popup = null;
            this.launcher.activate(false);
        };
    
        /*
         * Refresh popup content
         */
        this.refresh = function() {
            
            /*
             * Parnoid mode
             */
            if (!this.popup) {
                return false;
            }
        
            var $tb, i, l, layer, id, layers = [], self = this;

            /*
             * Roll over layers
             */
            for (i = 0, l = M.Map.map.layers.length; i < l; i++) {
                layer = M.Map.map.layers[i];
                if (!layer.isBaseLayer && M.Map.Util.isRaster(layer) && !layer._tobedestroyed) {
                    layers.push(layer);
                }

            }

            /*
             * Clear popup
             */
            self.popup.$b.empty();

            /*
             * Roll over layer descrpiption properties
             */
            self.popup.$b.append('<div class="center big padded">' + M.Util._("Drag&drop rows to reorder layer display") + '</div><table class="lmrcfg sortable"><thead><tr><th></th><th></th><th></th><th></th></tr></thead><tbody></tbody></table>');

            $tb = $('tbody', self.popup.$b).sortable({
                revert: true,
                revertDuration: 10,
                stop: function(e, ui) {

                    /*
                     * Reorder raster layer z-indexes
                     * 
                     * Get the layer just below the moved layer
                     */
                    var layer = M.Map.Util.getLayerByMID(ui.item.attr("MID")),
                            nLayer = M.Map.Util.getLayerByMID(ui.item.next().attr('MID')),
                            pLayer = M.Map.Util.getLayerByMID(ui.item.prev().attr('MID'));

                    /*
                     * If no layer is below or over the moved layer then do nothing.
                     * Otherwise, set the moved layer index to its new index
                     */
                    if (nLayer) {
                        M.Map.map.setLayerIndex(layer, M.Map.map.getLayerIndex(nLayer) + 1);
                    }
                    else if (pLayer) {
                        M.Map.map.setLayerIndex(layer, M.Map.map.getLayerIndex(pLayer) - 1);
                    }

                }

            });
            for (i = 0, l = layers.length; i < l; i++) {
                layer = layers[i];
                id = layer['_M'].MID;
                $tb.append('<tr MID="' + id + '"><td><img id="' + id + 'ce" src="' + layer['_M'].icon + '" class="clickable middle square" title="'+layer.name+'"/></td><td><div id="' + id + 'op" style="width:100px;"></div></td><td class="clickable" id="' + id + 'vy"><img class="middle" src="'+M.Util.getImgUrl("hide.png")+'"/></td><td class="clickable remove" id="' + id + 'rm"><img class="middle" src="'+M.Util.getImgUrl("trash.png")+'"/></td></tr>');

                (function(id, layer) {

                    /*
                     * Center
                     */
                    $("#" + id + "ce").click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        M.Map.zoomTo(layer.getDataExtent() || layer["_M"].bounds);
                        return false;
                    });

                    /*
                     * Opacity
                     */
                    $("#" + id + "op").slider({
                        value: layer.opacity * 100 || 100,
                        range: "min",
                        min: 0,
                        max: 100,
                        slide: function(event, ui) {
                            if (layer) {
                                layer.setOpacity(ui.value / 100.0);
                            }
                        }
                    });

                    /*
                     * Visibility
                     */
                    $("#" + id + "vy").click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        M.Map.Util.setVisibility(layer, !layer.getVisibility());
                        return false;
                    });

                    /*
                     * Remove
                     */
                    $("#" + id + "rm").click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        M.Map.removeLayer(layer, true);
                        return false;
                    });

                })(id, layer);
            }

            return true;

        };

        /*
         * Set unique instance
         */
        M.Plugins.RastersManager._o = this;

        return this;

    };
})(window.M);