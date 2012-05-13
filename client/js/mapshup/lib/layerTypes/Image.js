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
(function (msp,Map){
    
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
         *      displayType:,
         *      srs:
         *      bbox:
         *  };
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
            layerDescription.title = msp.Util.getTitle(layerDescription);
            
            /*
             * Check mandatory properties
             */
            if (!(new Map.LayerDescription(layerDescription, Map)).isValid()) {

                /*
                 * Important : non valid layers loaded during
                 * startup are discarded without asking user
                 */
                if (!layerDescription.initialLayer) {
                    this.update(layerDescription, Map.addLayer);
                }
                return null;
            }

            var newImg = new Image();
            newImg.src = layerDescription.url;
            var size = [newImg.height, newImg.width],
                BBOX = layerDescription.bbox.split(","),
                bounds;

            /*
             * If srs is set to EPSG:4326 then reproject
             */
            if (layerDescription.srs && layerDescription.srs === Map.epsg4326.projCode) {

                /*
                 * This is awfull...
                 * Spherical mercator doesnt like polar values...
                 */ 
                var avoidBoundError = 0;

                if (BBOX[1] === "-90" || BBOX[3] === "90") {
                    avoidBoundError = 0.1;
                }

                bounds = Map.Util.d2p(new OpenLayers.Bounds(parseFloat(BBOX[0]), parseFloat(BBOX[1]) + avoidBoundError, parseFloat(BBOX[2]), parseFloat(BBOX[3]) - avoidBoundError));

            }
            /*
             * Do not project the bounds
             */
            else {
                bounds = new OpenLayers.Bounds(parseFloat(BBOX[0]), parseFloat(BBOX[1]), parseFloat(BBOX[2]), parseFloat(BBOX[3]));
            }

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
             * Modify options["_msp"]
             */
            options["_msp"].selectable = false;
            options["_msp"].allowChangeOpacity = true;
            options["_msp"].bounds = bounds;
            options["_msp"].icon = layerDescription.url;

            /**
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Image(layerDescription.title , layerDescription.url,
                bounds,
                new OpenLayers.Size(size[0],size[1]),
                options
                );

            return newLayer;

        },

        /*
         * Ask user for bbox if not specified
         */
        update:function(layerDescription, callback) {

            msp.Util.askFor(msp.Util._("Image") + ' : ' + layerDescription.title, msp.Util._("Enter Image BBOX"), 'bbox', null, function(v){
                layerDescription["bbox"] = v;
                layerDescription.srs = "EPSG:4326";
                callback(layerDescription);
            });  

            return true;

        }
    }
})(window.msp, window.msp.Map);
