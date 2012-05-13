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
/*
 * Export plugin.
 * Add an "export" action in the LayersManager action list
 * to export vector layers within a well known format (CSV, KML, etc.)
 */
(function(msp) {
    
    msp.Plugins.Export = function() {
        
        /*
         * Only one Export object instance is created
         */
        if (msp.Plugins.Export._o) {
            return msp.Plugins.Export._o;
        }
        
        /*
         * Init plugin
         */
        this.init = function(options) {
            
            /**
             * Init options
             */
            this.options = options || {};

            /*
             * Default export service url
             */
            this.options.exportServiceUrl = this.options.exportServiceUrl || "/utilities/export.php?";

            return this;
            
        };
        
        /**
         * This method is called by LayersManager plugin
         */
        this.getLayerActions = function(layer) {
            
            var scope = this;
        
            /*
             * Only vector layers with features can be exported
             */
            if (layer && layer.features) {
                return {
                    id:msp.Util.getId(),
                    icon:"export.png",
                    title:"Export",
                    tt:"Export layer",
                    callback:function() {
                        msp.Util.askFor(msp.Util._("Export")+ ' : '+layer.name, msp.Util._("Choose export format"), "list", [
                        {
                            title:"CSV", 
                            value:"csv"
                        },
                        {
                            title:"KML", 
                            value:"kml"
                        }], function(v){
                            scope.download(scope.getFeatures(layer), layer.name, v);
                        });
                        return false;
                    }
                }
            }
            else {
                return null;
            }

        };
        
        /*
         * Export layer in the given format
         */
        this.download = function(a, name, format) {

            /*
             * Create an hidden link to store the export url
             */
            var hidden = msp.Util.$$('#'+msp.Util.getId()).html('<a href="#" style="diplay:none;"></a>'),
                scope = this,
                userid = msp.Util.Cookie.get("userid") || -1;

            /*
             * Add action on click
             */
            hidden.click(function() {

                var d = $(this);

                /*
                 * Set href location
                 */
                location.href = d.attr("href");

                /*
                 * Remove hidden div
                 */
                d.remove();

                return true;

            });

            /*
             * Ajax query to prepare the export file
             */
            msp.Util.ajax({
                url:msp.Util.getAbsoluteUrl(scope.options.exportServiceUrl+msp.Util.abc),
                async:true,
                dataType:"json",
                type:"POST",
                target:hidden,
                data:{
                    userid:userid,
                    format:format,
                    name:name,
                    json:JSON.stringify({
                        items:a
                    })
                },
                success: function(data) {

                    /*
                     * If file was correctly prepared on server,
                     * change the target href to point to this file
                     * and trigger a click on it
                     */
                    if (data.error) {
                        msp.Util.message(data.error["message"]);
                    }
                    else {
                        this.target.attr("href", data.url).trigger('click');
                    }
                }
            },{
                title:msp.Util._("Export in progress"),
                cancel:true
            });

        };
        
        /*
         * Return features layer
         */
        this.getFeatures = function(layer) {

            var attribute,
                attributes,
                feature,
                features = [],
                i,
                j,
                l,
                m;

            /*
             * Roll over layer features
             */
            for (i = 0, l = layer.features.length; i < l; i++) {

                /*
                 * Get feature
                 */
                feature = layer.features[i];

                /*
                 * If feature is a cluster, roll over features
                 * within this cluster
                 */
                if (feature.cluster) {

                    /*
                     * Roll over cluster features
                     */
                    for (j = 0, m = feature.cluster.length; j < m; j++) {

                        /*
                         * Add a new entry to features array
                         */
                        attributes = {};
                        features.push(attributes);

                        /*
                         * Add feature attributes to exported array
                         */
                        for (attribute in feature.cluster[j].attributes) {
                            attributes[attribute] = feature.cluster[j].attributes[attribute];
                        }

                        /*
                         * Beware of null geometry
                         */
                        if (feature.geometry) {
                            attributes["wkt"] = msp.Map.Util.p2d(feature.cluster[j].geometry.clone()).toString();
                        }
                        else {
                            attributes["wkt"] = "";
                        }
                    }
                }
                else {

                    /*
                     * Add feature attributes to exported array
                     */
                    attributes = {};
                    features.push(attributes);

                    /*
                     * Add feature attributes to exported array
                     */
                    for (attribute in feature.attributes) {
                        attributes[attribute] = feature.attributes[attribute];
                    }

                    if (feature.geometry) {
                        attributes["wkt"] = msp.Map.Util.p2d(feature.geometry.clone()).toString();
                    }
                    else {
                        attributes["wkt"] = "";
                    }

                }
            }

            return features;

        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Export._o = this;
        
        return this;
        
    };
})(window.msp);