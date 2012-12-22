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
 */
(function(M) {

    M.Plugins.QuickSelector = function() {

        /*
         * Only one QuickSelector object instance is created
         */
        if (M.Plugins.QuickSelector._o) {
            return M.Plugins.QuickSelector._o;
        }

        /**
         * Init plugin
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var options, id, i, l;

            /*
             * Init options
             */
            options = options || {};
            $.extend(options, {
                rootUrl: options.rootUrl || "",
                items: options.items || []
            });
            
            /* If items is empty do not load the plugin */
            if (options.items.length === 0) {
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
             *          bounds: // Bounds as an array [xmin,ymin,xmax,ymax] to
             *                     zoom on click (optional)
             *          callback: // Callback function to call on click (optional)
             *      }
             * 
             */
            M.Util.$$('#' + id, M.$mcontainer).html('<ul></ul>').addClass("quickselector");
            
            for (i = 0, l = options.items.length; i < l; i++) {
                (function(item, id, $d) {
                    
                    $d.append('<li id="' + id + '" jtitle="' + item.name + '" class="thumbs"><img src="' + options.rootUrl + '/' + item.icon + '"/></li>');
                    M.tooltip.add($('#' + id), 's');
                    
                    /*
                     * Callback and/or zoom to extent on click
                     */
                    $('#' + id).click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        /*
                         * Zoom to extent
                         */
                        if ($.isArray(item.bounds) && item.bounds.length === 4 ) {
                            M.Map.map.zoomToExtent(new OpenLayers.Bounds(item.bounds[0],item.bounds[1],item.bounds[2],item.bounds[3]));
                        }
                    
                        /*
                         * Callback
                         */
                        if ($.isFunction(item.callback)) {
                            item.callback();
                        }
                    
                        return false;
                    });
                    
                })(options.items[i], M.Util.getId(), $('ul', $('#' + id)));
            }
   
            return this;

        };

        /*
         * Set unique instance
         */
        M.Plugins.QuickSelector._o = this;

        return this;

    };
})(window.M);