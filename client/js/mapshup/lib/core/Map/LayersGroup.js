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
 * A LayersGroup is a layers container
 * It must be created like this :
 *  var newGroup = new msp.jMap.LayersGroup(map, "name")
 *  (with name a unique name for this group)
 */
(function (msp) {
  
    msp.Map.LayersGroup = function(map, name, icon) {

        /**
         * Identify this object as a LayerGroup
         */
        this.CLASS_NAME = "msp.Map.LayersGroup";
        
        /**
         * Reference to msp.Map object
         */
        this.map = map;
        
        /**
         * Group name (must be unique)
         */
        this.name = name;

        /**
         * Unique group id
         */
        this.id = msp.Util.getId();
        
        /**
         * Group icon
         */
        this.icon = icon || msp.Util.getImgUrl('group.png');

        /**
         * Returns true if all layers within this group are loaded
         * Returns false in the other case
         */
        this.isLoaded = function() {
            var length = this.layers.length;
            for (var i=length;i--;) {
                if (!this.layers[i]["_msp"].isLoaded) {
                    return false;
                }
            }
            return true;
        };

        /**
         * Layers belonging to the group
         */
        this.layers = [];

        /**
         * Group menu items
         * (See LayersManager plugin)
         *
         * Exemple of valid menu item :
         * {
         *      id:"search", // Replace with your code
         *      icon:msp.getImgUrl("search.png"), // Replace with your code
         *      title:"Search", // Replace with your code
         *      javascript:function() {
         *          msp.plugins["Catalog"].searchAll();
         *          return false;
         *      }
         *  }
         */
        this.layersManagerMenuItems = [];

        /**
         * Group visibility
         */
        this.visibility = true;
         
        /**
         * Add a layer to the group
         */
        this.add = function(layer) {

            /**
             * Roll over group layers
             */
            var length = this.layers.length;
            for (var i=length;i--;) {

                /**
                 * Layers is already in the group => do nothing
                 */
                if (this.layers[i]["_msp"].mspID === layer["_msp"].mspID) {
                    return false;
                }
            }
            /**
             * Add the input layer to the layers
             */
            this.layers.push(layer);

            return true;
        };

        /**
         * Remove layer from the group
         */
        this.remove = function(layer) {

            /**
             * Roll over group layers
             */
            var length = this.layers.length;
            for (var i=0;i<length;i++) {

                /**
                 * Layer was found => remove it from layers
                 */
                if (this.layers[i]["_msp"].mspID === layer["_msp"].mspID) {
                    this.layers.splice(i,1);
                    break;
                }
            }
            
            return true;

        };

        /**
         * Zoom to the group extent
         */
        this.zoomOn = function() {

            /**
             * Compute the global bounds = the bounds of all layers bounds
             */
            var layerBounds = null;
            var bounds = null;
            var length = this.layers.length;
            for (var i=length;i--;) {

                /**
                 * layers[i] has bounds => add it to the global bounds
                 * Note : raster layers (e.g. WMS, Image) should have a layer["_msp"].bounds
                 */
                if ((layerBounds = this.layers[i].getDataExtent()) || (layerBounds = this.layers[i]["_msp"].bounds)) {
                    bounds ? bounds.extend(layerBounds) : bounds = layerBounds.clone();
                }
            }

            /**
             * Zoom to the group bounds
             */
            if (bounds) {
                this.map.zoomTo(bounds);
            }
        };

        /**
         * Set group visibility => hide or show all layers group
         */
        this.setVisibility = function(visible) {
            var length = this.layers.length;
            for (var i=length;i--;) {
                this.map.setVisibility(this.layers[i], visible);
            }
            this.visibility = visible;
        };

        /**
         * Get group visibility
         * => true if at least one layer is visible
         * => false in other case
         */
        this.getVisibility = function() {
            return this.visibility;
        };

        /**
         * Return menu items
         * (See LayersManager plugin)
         */
        this.getLayersManagerMenuItems = function() {
            return this.layersManagerMenuItems;
        }
    }
})(window.msp)
