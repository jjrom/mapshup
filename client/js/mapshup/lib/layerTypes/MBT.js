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
 * MBT layer type
 * Add support to mbtiles (see http://mbtiles.org/)
 * located on server
 */
(function (M,Map){
    
    Map.layerTypes["MBT"] = {
        
        /*
         * This is a raster layer
         */
        isRaster: true,
        
        /**
         * MANDATORY
         *
         * layerDescription = {
         *       type:'MBT',
         *       title:,
         *       t:,
         *       numZoomLevels: // optional
         *  };
         */
        add: function(layerDescription, options) {

            if (!layerDescription.t) {
                return null;
            }
            
            /*
             * Set title
             */
            layerDescription.title = M.Util.getTitle(layerDescription);
            
            /*
             * Extend options object with MBT specific properties
             */
            $.extend(options,
            {
                /* MBT can be set as background (isBaseLayer:true) or as overlay */
                isBaseLayer:M.Util.getPropertyValue(layerDescription, "isBaseLayer", true),
                sphericalMercator:true,
                wrapDateLine:true,
                numZoomLevels:M.Util.getPropertyValue(layerDescription, "numZoomLevels", M.Map.map.getNumZoomLevels()),
                transitionEffect:'resize'
            }
            );
                
            /*
             * selectable cannot be overriden
             */
            options["_M"].selectable = false;

            return new OpenLayers.Layer.XYZ(layerDescription.title, M.Util.getAbsoluteUrl(M.Config["general"].mbtilesServiceUrl+layerDescription.t),options);

        },

        /**
         * MANDATORY
         * Compute an unique MID based on layerDescription
         */
        getMID:function(layerDescription) {
            return layerDescription.MID || M.Util.crc32(layerDescription.type + (layerDescription.t || ""));
        }
    }
})(window.M, window.M.Map);
