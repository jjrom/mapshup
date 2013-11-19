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
 * Quick Selector 
 * 
 * @param {MapshupObject} M
 */
(function(M) {

    M.Plugins.QuickSelector = function() {

        /*
         * Only one QuickSelector object instance is created
         */
        if (M.Plugins.QuickSelector._o) {
            return M.Plugins.QuickSelector._o;
        }

       /*
        * Array of items.
        *
        *  Item structure 
        *  {
        *          name: // Toolip text or structure
        *                      {
        *                          on: // Tooltip to display when item is on
        *                          off: // Tooltip to display when item is off
        *                      }
        *          icon: // Icon to set within the thumbnail container
        *          bbox: // bbox expressed as {
        *                                       bounds:// array [xmin,ymin,xmax,ymax]
        *                                       srs: // EPSG:4326 or EPSG:3857
        *                                     }
        *                   If specified then map is zoomed on click (optional)
        *          layerMID: // attached layer
        *          active: // if true activate the item
        *          callback: // Callback function to call on click (optional)
        *      }
        */
        this.items = [];
        
        /**
         * Init plugin
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var item, options, id = M.Util.getId(), i, l, self = this;

            /*
             * Init options
             */
            options = options || {};
            options.rootUrl =  options.rootUrl || "";
            self.items = options.items || [];
            
            /* 
             * If true only one item can be activated at a time (default false)
             */          
            self.unique = options.unique || false;

            /* If items is empty do not load the plugin */
            if (self.items.length === 0) {
                return null;
            }

            /*
             * Display items
             * 
             * +--------+--------+--------+
             * |        |        |        |
             * | item1  | item2  | item3  |
             * |        |        |        |
             * +--------+--------+--------+
             * 
             * Item structure :
             *      {
             *          name: // Toolip text 
             *          icon: // Icon to set within the thumbnail container
             *          bbox: // bbox expressed as {
             *                                       bounds:// array [xmin,ymin,xmax,ymax]
             *                                       srs: // EPSG:4326 or EPSG:3857
             *                                        }
             *          layerMID: // attached layer
             *          active: // if true activate the item
             *          callback: // Callback function to call on click (optional)
             *      }
             * 
             */
            M.Util.$$('#' + id, M.$mcontainer).html('<ul></ul>').addClass("quickselector");

            for (i = 0, l = self.items.length; i < l; i++) {
                
                item = self.items[i];
                
                /*
                 * Add a unique id to item if not set
                 */
                item.id = item.id || M.Util.getId();
            
                /*
                 * Activate or not
                 */
                
                (function(item, $d) {

                    $d.append('<li id="' + item.id + '" jtitle="' + item.name + '" class="thumbs"><img src="' + options.rootUrl + '/' + item.icon + '"/></li>');
                    M.tooltip.add($('#' + item.id), 's');
                    
                    if (!item.active && M.Map.Util.getLayerByMID(item.layerMID)) {
                        M.Map.Util.setVisibility(M.Map.Util.getLayerByMID(item.layerMID), false);
                    }
                    
                    /*
                     * Callback and/or zoom to extent on click
                     */
                    $('#' + item.id).click(function(e) {

                        e.preventDefault();
                        e.stopPropagation();

                        /*
                         * If unique deactivate every icons
                         */
                        if (self.unique) {
                            self.clear();
                        }
                    
                        /*
                         * Activate/Deactivate 
                         */
                        self.activate(item, !$('img', $(this)).hasClass('active'));
                        
                        /*
                         * Zoom to extent
                         */
                        if (item.bbox) {
                            var b = M.Map.Util.getProjectedBounds(item.bbox); 
                            if (b) {
                                M.Map.map.zoomToExtent(b);
                            }
                        }

                        /*
                         * Callback
                         */
                        if ($.isFunction(item.callback)) {
                            item.callback(item);
                        }

                        return false;
                    });

                })(item, $('ul', $('#' + id)));

            }
        
            /*
             * Event on a change in layer visibility
             */
            M.Map.events.register("visibilitychanged", self, function(layer, scope) {
              
                /*
                 * Activate/unactivate item depending on visibility
                 */
                for (var i = 0, l = scope.items.length; i < l; i++) {
                    if (layer["_M"].MID === scope.items[i].layerMID) {
                        scope.activate(scope.items[i], layer.getVisibility());
                    }
                }
            });

            return this;

        };

        /*
         * Activate or deactivate item
         * 
         * @param {Object} item : object  
         * @param {boolean} b : true to activate, false to deactivate
         */
        this.activate = function(item, b) {
            
            var $d = $('#' + item.id);
            
            /*
             * Switch active/inactive status
             */
            b ? $('img', $d).addClass('active') : $('img', $d).removeClass('active');
        
        };
    
        /*
         * Unactivate all items
         */
        this.clear = function() {
            
            for (var i = 0, l = this.items.length; i < l; i++) {
                $('img', $('#' + this.items[i].id)).removeClass('active');
            }
            
        };

        /*
         * Set unique instance
         */
        M.Plugins.QuickSelector._o = this;

        return this;

    };
})(window.M);