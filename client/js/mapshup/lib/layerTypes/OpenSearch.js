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
 * OpenSearch layer type
 */
(function (msp,Map){
    
    Map.layerTypes["OpenSearch"] = {

        /**
         * Layer clusterization is set by default
         */
        clusterized:true,

        /**
         * Set default styleMap
         */
        hasStyleMap:true,

        /**
         * MANDATORY
         */
        icon:"opensearch.png",

        /**
         * MANDATORY
         */
        isFile:true,

        /**
         * MANDATORY
         */
        selectable:true,

        /**
         * MANDATORY
         * {
         *      type:"OpenSearch",
         *      title:,
         *      url:"http://..../opensearch.xml"
         *      q:
         * }
         *
         */
        add: function(layerDescription, options) {

            /*
             * No OpenSearch url description => return null
             */
            if (!layerDescription.url) {
                return null;
            }

            /*
             * Set title to q term if not defined
             */
            layerDescription.title = msp.Util.getPropertyValue(layerDescription, "title", msp.Util.getPropertyValue(layerDescription, "q", "OpenSearch #" + msp.Util.sequence++));

            /*
             * Add the opensearch.xml description to the layer strategie
             */
            options.strategies = options.strategies || [];

            options.strategies.push(new OpenLayers.Strategy.OpenSearch({
                descriptionurl:msp.Util.getAbsoluteUrl(layerDescription.url),
                q:layerDescription.q,
                autoActivate: true
            }));

            /*
             * When strategy is loaded => launch search
             */
            options.strategies[options.strategies.length - 1].events.register("descriptionloadend",options.strategies[options.strategies.length - 1],function(){
                this.setSearchTerms(msp.Util.htmlEntitiesEncode(this.options.q));
            });

            /*
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);

            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {
                Map.onFeaturesAdded(this);
            });

            return newLayer;

        },

        /**
         * MANDATORY
         * Compute an unique mspID based on layerDescription
         */
        getMspID:function(layerDescription) {
            return msp.Util.crc32(layerDescription.type + (layerDescription.url || "") + (layerDescription.q || ""));
        }
    }

})(window.msp, window.msp.Map);
