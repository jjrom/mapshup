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
 * Flickr layer type
 * 
 * @param {MapshupObject} M
 * @param {M.Map} Map
 */
(function (M, Map){
    
    Map.layerTypes["Flickr"] = {

        /**
         * MANDATORY
         */
        forceReload:true,

        /**
         * MANDATORY
         */
        icon:"flickr.png",

        /**
         * Flickr return EPSG:4326 data
         */
        projection:Map.pc,

        /**
         * MANDATORY
         */
        removeOnEmpty:true,

        /**
         * MANDATORY
         */
        selectable:true,

        /**
         * MANDATORY
         *
         * layerDescription = {
         *      type:"Flickr",
         *      title:,
         *      userID:,
         *      q:,
         *      machineTags:,
         *      bbox:
         *  };
         *  
         *  @param {Object} layerDescription
         *  @param {Object} options
         */
        add: function(layerDescription, options) {

            /*
             * Flickr layer is a GeoJSON layer
             */
            var geojson = Map.layerTypes["GeoJSON"];

            /*
             * No url or no GeoJSON support => return null
             */
            if (!geojson) {
                return null;
            }
            
            /*
             * Set Layer description url
             * Full url with parameters is already set in case of and OpenSearch request
             * Otherwise we need to build it with layerDescription parameters
             */
            if (!layerDescription.url) {
                
                var e = Map.map.getExtent();
                
                /*
                 * Check if bbox is defined in layerDescription
                 */
                layerDescription.bbox = M.Util.getPropertyValue(layerDescription, "bbox", {
                    bounds:[e.left, e.bottom, e.right, e.top],
                    crs:M.Map.map.getProjection()
                });

                /*
                 * Set an empty search term value if not set
                 */
                layerDescription.q = M.Util.getPropertyValue(layerDescription, "q", "");

                /*
                 * Build url
                 */
                layerDescription.url = M.Util.getAbsoluteUrl("/plugins/flickr/search.php?q="+layerDescription.q+"&bbox="+Map.Util.getGeoBounds(layerDescription.bbox).toBBOX());
                
            }
            
            /*
             * Extend options object with Flickr specific properties
             */
            $.extend(options,
            {
                /*
                 * Fixed StyleMap : point with icon made from flickr thumbnail
                 */
                styleMap:new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style({
                        externalGraphic: "${icon}",
                        pointRadius : 25
                    }),
                    "select": new OpenLayers.Style({
                        pointRadius: 35
                    })
                })

            });

            return geojson.add(layerDescription, options);

        },
        
        /*
         * Refresh
         */
        refresh: function(layer) {
            
            /*
             * Flickr layer is a GeoJSON layer
             */
            var geojson = Map.layerTypes["GeoJSON"];

            /*
             * No url or no GeoJSON support => return null
             */
            if (!geojson) {
                return null;
            }
            
            return geojson.refresh(layer, null);
        },
        
        /*
         * Overide FeatureInfo setBody() function
         */
        setFeatureInfoBody: function(feature, $info) {

            var i,l,tags,$tags,
            id = M.Util.getId();
            
            /*
             * Photo page url :
             *      http://www.flickr.com/photos/{user-id}/{photo-id}
             *
             * (see http://www.flickr.com/services/api/misc.urls.html)
             */
            $info.html('<div class="padded">'+feature.attributes['description']+'</div><div class="tags"></div><br/><div class="center"><a target="_blank" href="http://www.flickr.com/photos/'+feature.attributes['owner']+'/'+feature.attributes['identifier']+'">'+M.Util._("Go to flickr page")+'</a></div>');
            
            $tags = $('.tags', $info);
            if (feature.attributes["tags"]) {
                tags = feature.attributes["tags"].split(' ');
                for (i = 0, l = tags.length ; i < l; i++) {
                    (function(tag, id) {
                        $tags.append('<a href="#" id="'+id+'">'+tag+'</a> ');
                        $('#' + id).click(function(){
                            M.Util.askFor({
                                title:M.Util._("Search"),
                                content:M.Util._("Do you really want to search for")+" "+tag,
                                dataType:"list",
                                value:[{
                                    title:M.Util._("Yes"), 
                                    value:"y"
                                },
                                {
                                    title:M.Util._("No"), 
                                    value:"n"
                                }
                                ],
                                callback:function(v){
                                    if (v === "y") {
                                        Map.addLayer({
                                            type:"Flickr",
                                            title:tag,
                                            q:tag
                                        },{
                                            noDeletionCheck:true
                                        });
                                    }
                                }
                            });
                            
                            return false;
                        });
                    })(tags[i], M.Util.getId());
                }
            }
        },

        /**
         * MANDATORY
         * Compute an unique MID based on layerDescription
         * 
         * @param {object} layerDescription
         */
        getMID:function(layerDescription) {
            return layerDescription.MID || M.Util.crc32(layerDescription.type + (layerDescription.title || "") + (layerDescription.userID || "") + (layerDescription.q || "") + (layerDescription.machineTags || ""));
        }
    };
})(window.M, window.M.Map);
