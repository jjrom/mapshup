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
 * PLUGIN: Print
 *
 * Print current map to a pdf or an image file
 *
 *********************************************/

M.plugins["Print"] = {

    /**
     * Initialize plugin
     *
     * This is MANDATORY
     */
    init: function(options) {

        /**
         * Best practice : init options
         */
        this.options = options || {};
        this.options.url = this.options.url || "/plugins/print/print.php?";
        
        return true;
    },

    print: function() {

        M.mask.add(M.Util._("Printing map..."));

        /**
         * map reference
         */
        var map = M.Map.map;
        var layername, tilerow, tilei;

        /**
         * Go through all layers, and collect a list of objects
         * each object is a tile's URL and the tile's pixel location relative to the viewport
         */
        var size  = map.getSize();
        var tiles = [];
        for (layername in map.layers) {
            // if the layer isn't visible at this range, or is turned off, skip it
            var layer = map.layers[layername];
            if (!layer.getVisibility()) continue;
            if (!layer.calculateInRange()) continue;
            // iterate through their grid's tiles, collecting each tile's extent and pixel location at this moment
            for (tilerow in layer.grid) {
                for (tilei in layer.grid[tilerow]) {
                    var tile     = layer.grid[tilerow][tilei]
                    var url      = layer.getURL(tile.bounds);
                    var position = tile.position;
                    var opacity  = layer.opacity ? parseInt(100*layer.opacity) : 100;
                    tiles[tiles.length] = {
                        url:url,
                        x:position.x,
                        y:position.y,
                        opacity:opacity
                    };
                }
            }
        }

        // hand off the list to our server-side script, which will do the heavy lifting
        var tiles_json = JSON.stringify(tiles);
        var printparams = 'width='+size.w + '&height='+size.h + '&tiles='+encodeURIComponent(tiles_json) ;

        OpenLayers.Request.POST(
        {
            url:M.repareUrl(this.options.url),
            data:OpenLayers.Util.getParameterString({
                width:size.w,
                height:size.h,
                tiles:tiles_json
            }),
            headers:{
                'Content-Type':'application/x-www-form-urlencoded'
            },
            callback: function(request) {
                M.mask.abort();
                console.log(request.responseText);
            }
        }
        );
    }
};
