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
 * Image layer type
 */
(function (M,Map){
    
    Map.layerTypes["Image"] = {
    
        /**
         * MANDATORY
         */
        icon:"image.png",

        /**
         * MANDATORY
         */
        isFile:true,

        /**
         * Mandatory properties for
         * valid layerDescription
         */
        mandatories:[
        "bbox"
        ],

        /**
         * MANDATORY
         *
         * layerDescription = {
         *      type:"Image",
         *      title:,
         *      displayType:
         *      srs:
         *      bbox:{
         *          bounds:
         *          srs:
         *      }
         *  };
         *  
         *  @param {Object} layerDescription
         *  @param {Object} options
         *  
         */
        add: function(layerDescription, options) {

            /*
             * No url => return null
             */
            if (!layerDescription.url) {
                return null;
            }
            
            /*
             * Set title
             */
            layerDescription.title = M.Util.getTitle(layerDescription);
            
            /*
             * Check mandatory properties
             */
            if (!(new Map.LayerDescription(layerDescription, Map)).isValid()) {

                /*
                 * Important : non valid layers loaded during
                 * startup are discarded without asking user
                 */
                if (!layerDescription.initial) {
                    this.update(layerDescription, Map.addLayer);
                }
                return null;
            }

            var newImg = new Image();
            newImg.src = layerDescription.url;
            var size = [newImg.height, newImg.width];

            /*
             * Extend options object with Image specific properties
             */
            $.extend(options,
            {
                isBaseLayer:false,
                maxResolution:Map.map.baseLayer.resolutions[0],
                numZoomLevels:18,
                resolutions:Map.map.baseLayer.resolutions,
                transparent:true
            }
            );

            /*
             * Modify options["_M"]
             */
            options["_M"].selectable = false;
            options["_M"].allowChangeOpacity = true;
            options["_M"].bounds = Map.Util.getProjectedBounds(layerDescription.bbox);
            options["_M"].icon = layerDescription.url;

            /**
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Image(layerDescription.title , layerDescription.url,
                options["_M"].bounds,
                new OpenLayers.Size(size[0],size[1]),
                options
                );

            return newLayer;

        },

        /**
         * Ask user for bbox if not specified
         * 
         * @param {Object} layerDescription
         * @param {Function} callback
         */
        update:function(layerDescription, callback) {

            M.Util.askFor({
                title:M.Util._("Image") + ' : ' + layerDescription.title,
                content:M.Util._("Enter Image BBOX"),
                dataType:'bbox',
                callback:function(v){
                    layerDescription["bbox"] = {
                        bounds:v,
                        srs:"EPSG:4326"
                    };
                
                    callback(layerDescription);
                }
            });  

            return true;

        }
    };

})(window.M, window.M.Map);
