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
 * Plugin ElasticSearch
 *
 * @param {MapshupObject} M
 *
 */
(function(M) {

    M.Plugins.ElasticSearch = function() {

        /*
         * Only one ElasticSearch object instance is created
         */
        if (M.Plugins.ElasticSearch._o) {
            return M.Plugins.ElasticSearch._o;
        }
        
        /*
         * Reference to ElasticSearch layer
         */
        this.layer = null;

        /*
         * Initialization
         */
        this.init = function(options) {

            var searchId = M.Util.getId(), filterId = M.Util.getId(), self = this;

            /*
             * init options
             */
            self.options = options || {};

            /*
             * Create a South Panel for ElasticSearch querying
             */
            var panelItem = M.southPanel.add({
                id: M.Util.getId(),
                icon: M.Util.getImgUrl('execute.png'),
                title: options.url,
                classes: "wpsclient",
                mask: true,
                html: '<div class="info"><form method="POST" action="#"><input id="' + filterId + '" name="q" type="text" size="40" placeholder="' + M.Util._(options.hint || "e.g. node:tags.amenity=restaurant") + '" autocomplete="off"/><div class="execute"><img src="' + M.Util.getImgUrl('execute.png') + '" id="' + searchId + '" class="button inline" jtitle="' + M.Util._("Execute process") + '"/></div></form></div>'
            });

            self.$filter = $('#' + filterId);

            /*
             * Set execute button
             */
            M.tooltip.add($('#' + searchId).click(function() {
                self.search($.trim(self.$filter.val()));
                return false;
            }), 'n', 20);

            /*
             * Tell user that a new WPS panel is created
             */
            M.southPanel.show(panelItem);

            return self;

        };
        
        /*
         * Launch a search request to ElasticSearch
         * 
         * @param {String} filter
         * @param {Integer} limit
         *  
         * filter should be set like 
         * 
         *      type:key=value
         * 
         * With :
         *      type is 'node' or 'way' (node if not specified)
         *      key is the filter key (e.g. tags.amenity)
         *      value is the filter value (e.g. 'restaurant')
         */
        this.search = function(filter, limit) {

            var type, data, geoStr, self = this, geoBounds = M.Map.Util.p2d(M.Map.map.getExtent());

            /*
             * Set coordinates
             */
            geoStr = '[[' + geoBounds.left + ',' + geoBounds.top + '],[' + geoBounds.right + ',' + geoBounds.bottom + ']]';

            /*
             * Create request
             */
            data = '{"size":' + (limit && M.Util.isInt(limit) ? limit : 100) + ',"query":{"filtered":{"query":{"match_all":{}},"filter":{"and":{"filters":[{"geo_shape":{"shape":{"shape":{"type":"envelope","coordinates":' + geoStr + '}}}}';
            
            /*
             * filter should be defined as key=value
             * 
             *  e.g.
             *      node:tags.cuisine=chinese
             *      node:tags.amenity=restaurant
             *      
             */
            if (filter) {
                var keyval, typeAndfilter = filter.split(':');
                
                if (typeAndfilter.length === 2) {
                    keyval = typeAndfilter[1].split('=');
                    type = typeAndfilter[0];
                }
                else {
                    keyval = typeAndfilter[0].split('=');
                }
                
                if (keyval.length === 2) {
                    data += ',{"term":{"' + keyval[0] + '":"' + keyval[1] + '"}}';
                }
                
            }
            data += ']}}}}}';

            /*
             * Launch asynchronous request to Elastic Search server
             */
            M.Util.ajax({
                url: this.options.url + '/' + (type === 'node' ? 'node' : 'way') +  '/_search',
                async: true,
                dataType: "json",
                type: "POST",
                data: data,
                success: function(obj, textStatus, XMLHttpRequest) {
                    if (XMLHttpRequest.status === 200) {
                        
                        if (!self.layer) {
                            self.layer = M.Map.addLayer({
                                type: "GeoJSON",
                                title: "ElasticResult",
                                clusterized: false, // Very important !
                                editable: true,
                                ol: {
                                    styleMap: new OpenLayers.StyleMap({
                                        'default': {
                                            strokeColor: 'white',
                                            strokeWidth: 1,
                                            fillColor: 'red',
                                            fillOpacity: 0.2,
                                            pointRadius: 5
                                        }
                                    })
                                }
                            });
                        }
                        
                        self.layer.destroyFeatures();
                        M.Map.layerTypes["GeoJSON"].load({
                            data: M.Map.Util.elasticResultToGeoJSON(obj),
                            layer: self.layer
                        });
                    }

                },
                error: function(e) {
                    M.Util.message("&nbsp;" + M.Util._("Error") + "&nbsp;");
                }
            }, {
                title: M.Util._("Search for "),
                cancel: true
            });
            
        };

        /*
         * Set unique instance
         */
        M.Plugins.ElasticSearch._o = this;

        return this;
    };

})(window.M);