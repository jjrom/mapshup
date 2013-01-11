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
 * WMS layer type
 */
(function (M,Map){
    
    Map.layerTypes["SHP"] = {

        /**
         * MANDATORY
         */
        icon:"shp.png",

        /**
         * MANDATORY
         */
        isFile:true,

        /**
         * MANDATORY
         *
         * Shapefile are uploaded to the server and transform in WMS
         *
         * layerDescription = {
         *       type:'SHP',
         *       title:,
         *       file: // filename of shp WITHOUT path
         *       srs: // EPSG:4326 by default
         *  };
         */
        add: function(layerDescription, options) {

            /*
             * Shapefile is made of 3 files : xxx.shp, xxx.shx, xxx.dbf
             *
             * The server assume that :
             *  - the filename given is the shp file
             *  - the shp file is stored under MSP_UPLOAD_DIR within the server
             *  - the shx and dbf files are stored at the same place as the shp file
             */
            if (!layerDescription.file) {
                return null;
            }

            /*
             * Set title
             */
            layerDescription.title = M.Util.getTitle(layerDescription)
            
            /*
             * Set layerDescription.srs to the map projection
             */
            layerDescription.srs = Map.map.projection.projCode

            if (!layerDescription.url) {

                /*
                 * SHP layerType is in fact a WMS layer.
                 * The principle is to send the 3 urls to the getSHPWMS service which returns
                 * a WMS url for this layer
                 */
                M.Util.ajax({
                    url:M.Util.getAbsoluteUrl(M.Config["general"].shpToWMSServiceUrl)+M.Util.abc+"&title="+encodeURIComponent(layerDescription.title)+"&shp="+encodeURIComponent(layerDescription.file),
                    async:true,
                    dataType:"json",
                    success:function(result){
                        if (result.success) {
                            layerDescription.url = result.url;
                            layerDescription.layers = result.layers;
                            layerDescription.bbox = result.bbox;
                            layerDescription.version = result.version;
                            Map.addLayer(layerDescription);
                        }
                        else {
                            M.Util.message(M.Util._("Error : cannot add this shapefile"));
                        }
                    },
                    error:function() {
                        M.Util.message(M.Util._("Error : cannot perform action"));
                    }
                }, !layerDescription.initial ? {
                    title:M.Util._("Loading shapefile"), 
                    cancel:true
                } : null);

                return null;
            }

            /**
             * A WMS cannot be "selectable"
             * Thus this property cannot be overriden
             */
            options["_M"].selectable = false;
            options["_M"].bounds = Map.Util.getProjectedBounds(layerDescription.bbox);
            options["_M"].allowChangeOpacity = true;


            /*
             * Extend options object with Flickr specific properties
             */
            options.buffer = 0;

            /**
             * Layer creation
             * !! If "projectedUrl" is defined, then use it instead
             * of original url
             */
            var newLayer = new OpenLayers.Layer.WMS(layerDescription.title, layerDescription.url, {
                layers:layerDescription.layers,
                format:"image/jpeg",
                transitionEffect: "resize",
                transparent:'true',
                SLD:layerDescription.SLD,
                version:layerDescription.version
            }, options);

            return newLayer;

        },

        /**
         * MANDATORY
         * Compute an unique MID based on layerDescription
         */
        getMID:function(layerDescription) {
            return layerDescription.MID || M.Util.crc32(layerDescription.type + (layerDescription.file || ""));
        }
    }
})(window.M, window.M.Map);
