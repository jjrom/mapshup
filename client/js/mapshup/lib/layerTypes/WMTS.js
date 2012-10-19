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
 * WMTS layer type
 */
(function (msp,Map){
    
    Map.layerTypes["WMTS"] = {
        
        /**
         * MANDATORY
         */
        icon:"wms.png",

        /**
         * Mandatory properties for
         * valid layerDescription
         */
        mandatories:[
            "layer",
            "matrixSet"
        ],

        /**
         * MANDATORY
         *
         * layerDescription = {
         *       type:'WMTS',
         *       title:,
         *       url:,
         *       layer:,
         *       matrixSet:,
         *       format: // default is image/png
         *  };
         *
         */
        add: function(layerDescription, options) {

            var i, projCode, l = 26, matrixIds = new Array(l);
            
            /*
             * Repare URL if it is not well formed
             */
            layerDescription.url = msp.Util.repareUrl(layerDescription.url);
            
            /*
             * Get the projCode for tiles matrix
             */
            projCode = msp.Map.map.projection.projCode === "EPSG:4326" ? "EPSG:4326": "EPSG:900913";
            
            /*
             * Set tiles matrix
             */
            for (i = 0; i < l; ++i) {
                matrixIds[i] = projCode + ":" + i;
            }
            
            $.extend(options, {
                name:layerDescription.title,
                url:layerDescription.url,
                layer:layerDescription.layer,
                matrixSet:layerDescription.matrixSet,
                matrixIds:matrixIds,
                format:layerDescription.format || "image/png",
                style: "_null",
                transitionEffect: "resize",
                version:"1.0.0",
                wrapDateLine:true,
                /* WMTS can be set as background (isBaseLayer:true) or as overlay */
                isBaseLayer:msp.Util.getPropertyValue(layerDescription, "isBaseLayer", false)
            });
            
            return new OpenLayers.Layer.WMTS(options);
            
            /*
            $.ajax({
                url:msp.Util.proxify(layerDescription.url),
                async:true,
                dataType:"xml",
                success:function(data, textStatus, XMLHttpRequest) {
                console.log(msp.Util.getCapabilities(XMLHttpRequest, new OpenLayers.Format.WMTSCapabilities()));
                }
            });
            */

        },
        
        /**
         * MANDATORY
         * Compute an unique mspID based on layerDescription
         */
        getMspID:function(layerDescription) {
            return msp.Util.crc32(layerDescription.type + (msp.Util.repareUrl(layerDescription.url) || "") + (layerDescription.layer || "") + (layerDescription.matrixSet || ""));
        }
        
    }
    
})(window.msp, window.msp.Map);