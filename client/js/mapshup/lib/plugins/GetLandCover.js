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
 * PLUGIN: GetLandCover
 *********************************************/
msp.plugins["GetLandCover"] = {
    
    /**
     * Launch a segmentation request to the server
     */
    getMenuItems: function() {
        return {
            id:"getLandCover",
            icon:msp.Util.getImgUrl("landcover.png"),
            title:"Land Cover",
            tt:"Get Land Cover",
            javascript:function() {
                msp.menu.hide();
                msp.plugins["GetLandCover"].getLandCover();
                return false;
            }
        }
    },

    /**
     * Initialize plugin
     *
     * This is MANDATORY
     */
    init: function(options) {

        /*
         * Best practice : init options
         */
        this.options = options || {};

        /*
         * url to the getLandCover service
         */
        this.options.getLandCoverServiceUrl = this.options.getLandCoverServiceUrl || "/plugins/landcover/getLandCover.php?";
         
        return true;
    },

    /*
     * Send a request to the server to comput land cover
     * from visible background tiles
     * Note: this only work for BING tiles at the moment
     */
    getLandCover: function() {

        var url,
            json,
            bounds,
            line,
            self = msp.plugins["GetLandCover"];

        /*
         * Get BING visible tiles
         */
        var bl = msp.Map.map.baseLayer;

        if (bl.CLASS_NAME !== "OpenLayers.Layer.Bing" || bl["_msp"].layerDescription.bingType !== "Aerial") {
            msp.Util.message(msp.Util._("Warning: this feature only work with Bing Aerial background"));
            return false;
        }

        /*
         * Bing layer is organized with a grid containing visible tiles
         * A call to the getLandCover function send the tile urls to the server
         *
         * The urls are sent as a serialized json string :
         *
         * {tiles: [[item1, item2, etc.],[itemn, itemm, etc.],..,[itemy, itemz, etc.]]}
         *             line 1              line 2                 line n
         *
         * where items are objects with the following properties
         * {
         *      url:
         *      srs:
         *      bounds:{
         *          bottom:
         *          top:
         *          left:
         *          right:
         *      }
         *  }
         */
        json = {
            tiles:[]
        };
        for (var i = 0, l = bl.grid.length; i < l; i++) {
            line = [];
            for (var j = 0, m = bl.grid[i].length; j < m;j++) {
                url = bl.grid[i][j].url;
                bounds = bl.grid[i][j].bounds;
                if (url) {
                    line.push({
                        url:url,
                        srs:"EPSG:3857",
                        bounds:{
                            bottom:bounds.bottom,
                            top:bounds.top,
                            left:bounds.left,
                            right:bounds.right
                        }
                    });
                }
            }
            json.tiles.push(line);
        }

        /*
         * Send a POST ajax request to the getLandCover service
         * with the visible tile urls
         */
        msp.Util.ajax({
            url:msp.Util.getAbsoluteUrl(self.options.getLandCoverServiceUrl+msp.abc),
            async:true,
            dataType:"json",
            type:"POST",
            data:{
                json:JSON.stringify(json)
            },
            success: function(data) {
                alert(data.url);
            }
        },{
            title:msp.Util._("Retrieving Bing tiles....:)"),
            cancel:true  
        });

        return true;
    }

};
