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
(function (msp, Map){
    
    Map.layerTypes["Catalog"] = {
   
        /**
         * icon path relative to the msp.themeDirectory
         */
        icon:"catalog.png",

        /**
         * Catalogs are selectable vector objects
         */
        selectable:true,

        /**
         * Set default styleMap
         */
        hasStyleMap:true,

        /**
         * Catalogs return EPSG:4326 data by default
         */
        projection:Map.epsg4326,

        /**
         * Mandatory properties for
         * valid layerDescription
         */
        mandatories:[
        "connectorName"
        ],

        /**
         * MANDATORY
         *
         * layerDescription = {
         *       type:'Catalog',
         *       title:,
         *       url:,
         *       connectorName:,
         *       color:,
         *       nextRecord:(optional)
         *       numRecordsPerPage:(optional)
         *       collection:(optional),
         *       extras:[
         *          order:"latlon" (optional)
         *       ]
         *  };
         */
        add: function(layerDescription, options) {

            /*
             * Check
             *  1. Catalog plugin is mandatory
             *  2. layerDescription.connector must be defined
             *
             */
            var plugin = msp.plugins["Catalog"];

            if (!plugin) {
                return null;
            }

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

            /*
             * Repare URL if it is not well formed
             */
            layerDescription.url = msp.Util.repareUrl(layerDescription.url);

            /*
             * Set a random footprint color if it is not defined
             */
            layerDescription.color = msp.Util.getPropertyValue(layerDescription, "color", msp.Util.randomColor());

            /*
             * Set dedicated catalog options
             */
            layerDescription.collection = msp.Util.getPropertyValue(layerDescription, "collection", "");

            /**
             * Layer creation
             */
            var newLayer = new OpenLayers.Layer.Vector(layerDescription.title, options);

            /*
             * Add a featuresadded event
             */
            newLayer.events.register("featuresadded", newLayer, function() {
                Map.onFeaturesAdded(this);
            });

            /**
             * Add this catalog to the list of catalogs
             * If for some reason this step is not successfull (false),
             * the newLayer is set to null and not added to the map
             */
            return plugin.add(newLayer) ? newLayer : null;

        },

        /**
         * Display feature info
         * 
         * jFeatureInfo body div is splitted in two div
         * a east and west panel
         * 
         */
        appendDescription: function(feature, div) {

            /**
             * Get feature layer
             */
            var layer = feature.layer;
            if (!layer) {
                return false;
            }

            /**
             * Get the layer connector
             */
            if (!layer["_msp"].searchContext) {
                return false;
            }
            var connector = layer["_msp"].searchContext.connector;
            if (!connector) {
                return false;
            }

            /*
             * First create the div structure
             *   <div id="fimain" class="noflw">
             *      <div class="west">
             *      </div>
             *      <div class="east">
             *          <div class="noflw">
             *              <table></table>
             *          </div>
             *      <div>
             *   </div>
             *      
             */
            div.append('<div id="fimain" class="noflw"><div class="west"></div><div class="east"><div class="noflw"><table></table></div></div></div>');
              
            /*
             * Set variable and references
             */
            var west = $('.west', div),
            east = $('.east table', div),
            sheader = $('.sheader', div.parent()),
            v,
            t,
            id,
            $id,
            i,
            l,
            k,
            kk,
            thumb = feature.attributes['thumbnail'] || feature.attributes['quicklook'] || null,
            kkk;

            /*
             * Set thumbnail in west panel
             */
            if (thumb) {

                /*
                 * Get a unique id for jquery click action
                 */
                var id2,
                    $id1,
                    id1 = msp.Util.getId();

                west.append('<a id="'+id1+'" class="image" alt="'+msp.Util._("Show quicklook")+'" title="'+feature.attributes['identifier']+'" '+'href="'+feature.attributes['quicklook']+'"><img src="'+thumb+'" class="padded"></a>');

                /*
                 * Popup image
                 */
                $id1 = $('#'+id1);
                $id1.click(function() {
                    msp.Util.showPopupImage($id1.attr('href'), $id1.attr('title'));
                    return false;
                });
                

                /*
                 * Add an action on "Add Quicklook to map" link
                 * This action is added only if layer allow to display Quicklook on the map
                 */
                if (layer["_msp"].qlToMap) {
                    id2 = id2 = msp.Util.getId()
                    west.append('<br/><a href="#" class="center" id="'+id2+'">'+msp.Util._('Add quicklook to map')+'</a>');
                    $('#'+id2).click(function() {
                        Map.addLayer({
                            type:"Image",
                            title:feature.attributes['identifier'],
                            /* If removeBorderServiceUrl is defined => use it :) */
                            url:msp.Config["general"].removeBlackBorderServiceUrl != null ? msp.Config["general"].removeBlackBorderServiceUrl + escape(feature.attributes['quicklook']) + msp.Util.abc : feature.attributes['quicklook'],
                            bbox:feature.geometry.getBounds().toBBOX(),
                            /* By default, quicklooks are added to the "Quicklooks" group */
                            groupName:"Quicklooks"
                        });
                    });
                }
            }

            /*
             * Roll over attributes  
             */   
            for (k in feature.attributes) {

                /*
                 * Special keywords
                 */
                if (k === 'identifier' || k === 'icon' || k === 'thumbnail' || k === 'quicklook') {
                    continue;
                }

                /*
                 * Get key value
                 */
                v = feature.attributes[k];
                if(v) {

                    /*
                     * Check type
                     */
                    t = typeof v;

                    /*
                     * Simple case : string
                     */
                    if (t === "string" && msp.Util.isUrl(v)) {
                        east.append('<tr><td>' + msp.Util._(connector.metadataTranslator[k] || k) + '</td><td><a target="_blank" href="'+v+'">'+ msp.Util.shorten(v, 30) +'</a></td></tr>');
                    }
                    /*
                     * Object case
                     */
                    else if (t === "object") {

                        /*
                         * Special case for _madd property
                         * _madd defines an action to add layer
                         * and should contains to properties :
                         *  - title : action title to display
                         *  - layer : layer parameters
                         */
                        if (k === '_madd') {
                            id = msp.Util.getId();
                            west.append('<br/><a href="#" class="center" id="'+id+'">'+v["title"]+'</a>');
                            (function(id,obj){
                                $('#'+id).click(function(){

                                    /*
                                     * Do not zoom on layer after load
                                     */
                                    if (obj) {
                                        obj.zoomOnAfterLoad = false;
                                    }

                                    /*
                                     * Add layer obj
                                     */
                                    Map.addLayer(obj);
                                    return false;
                                });
                            })(id,v["layer"]);
                            continue;
                        }

                        /*
                         * Roll over properties name
                         */
                        for (kk in v) {

                            /*
                             * Check type : if object => create a new tab
                             */
                            if (typeof v[kk] === "object") {

                                /*
                                 * Special case for photos array
                                 * No tab is created but instead a photo gallery
                                 * is displayed within the west panel
                                 */
                                if (kk === 'photo') {
                                    for (i = 0, l = v[kk].length; i < l; i++) {
                                        id = msp.Util.getId();
                                        west.append('<a href="'+v[kk][i]["url"]+'" title="'+v[kk][i]["name"]+'" id="'+id+'"><img height="50px" width="50px" src="'+v[kk][i]["url"]+'"/></a>');
                                        /*
                                         * Popup image
                                         */
                                        $id = $('#'+id);
                                        $id.click(function() {
                                            msp.Util.showPopupImage($id.attr('href'), $id.attr('title'));
                                            return false;
                                        });
                                    }
                                    continue;
                                }

                                /*
                                 * sheader is empty, create it
                                 */
                                id = msp.Util.getId() ;
                                if (sheader.is(':empty')) {
                                    sheader.html('<div id="fitabs"><ul><li><a href="#fimain">'+msp.Util._("Description")+'</a></li></ul></div>');
                                }
                                $('ul', sheader).append('<li><a href="#' + id + '">' + msp.Util._(kk) + '</a></li>');

                                /*
                                 * Create a specific tab
                                 */
                                div.append('<div id="'+id+'" class="noflw"><table></table></div>');

                                /*
                                 * Table reference
                                 */
                                var d = $('table', $('#'+id));

                                /*
                                 * Special case for videos
                                 */
                                if (kk === "video" || kk === "audio") {
                                    for (i = 0, l = v[kk].length; i < l; i++) {
                                        d.append('<tr><td><a href="'+v[kk][i]["url"]+'">' + v[kk][i]["name"] + '</a></td></tr>');
                                    }
                                }
                                else {
                                    for (kkk in v[kk]) {
                                        d.append('<tr><td>' + msp.Util._(connector.metadataTranslator[kkk] || kkk) + '</td><td>' + v[kk][kkk] + '</td></tr>');
                                    }
                                }

                            }
                            else {
                                east.append('<tr><td>' + msp.Util._(connector.metadataTranslator[k] || k) + ' &rarr; ' + msp.Util._(connector.metadataTranslator[kk] || kk) + '</td><td>' + v[kk] + '</td></tr>');
                            }
                        }

                    }
                    else {
                        east.append('<tr><td>' + msp.Util._(connector.metadataTranslator[k] || k) + '</td><td>' + v + '</td></tr>');
                    }
                }
            }

            /*
             * Set the tabs if any
             */
            $("#fitabs ul").idTabs(); 

            /*
             * If an action is defined within the connector,
             * add it to the div parent
             */
            if (connector.action) {

                /*
                 * jFeatureInfo is the parent of the parent of div
                 * (jFeatureInfo->wrapper->body)
                 */
                var parent = div.parent().parent();
                id = msp.Util.getId();

                /*
                 * The "setLinkAttributes" function can be used to set href
                 */
                if (typeof connector.action.setLinkAttributes === "function") {
                    parent.append('<div><a id="'+id+'" class="act '+connector.action["cssClass"]+'" jtitle="'+msp.Util._(connector.action["title"])+'"></a></div>');
                    connector.action.setLinkAttributes($('#'+id), feature);
                }

                /*
                 * The "callback" function is called after a click
                 */
                if (typeof connector.action.callback === "function") {

                    /*
                     * Add the action button
                     */
                    parent.append('<div><a href="#" id="'+id+'" class="act '+connector.action["cssClass"]+'" jtitle="'+msp.Util._(connector.action["title"])+'"></a></div>');

                    /*
                     * Dedicated action
                     */
                    (function(id, feature, action) {
                        $('#'+id).click(function() {
                            var a = $(this);
                            if (a.attr("href") === "#") {
                                action($(this), feature);
                                return false;
                            }
                            return true;
                        });
                    })(id, feature, connector.action["callback"]);

                }

                /*
                 * Add tooltips
                 */
                msp.tooltip.add($('#'+id), 'w');

            }

            return true;
        },

        /*
         * Ask user for connectorName if not specified
         */
        update:function(layerDescription, callback) {

            /*
             * Ask for mandatory connectorName
             */
            var list = [],
            connectors = msp.plugins["Catalog"]["connectors"] || [],
            connector;

            /**
             * Parse available connectors list
             */
            for (var key in connectors) {

                /*
                 * Retrieve the connector
                 */
                connector = connectors[key];

                list.push({
                    title:msp.Util._(connector.options["description"]),
                    value:msp.Util._(key)
                })
            }

            msp.Util.askFor(msp.Util._("Catalog") + ' : ' + layerDescription.title, msp.Util._("What is the format for this catalog ?"), "list", list, function(v){
                layerDescription["connectorName"] = v;
                layerDescription["groupName"] = "Catalogs";
                callback(layerDescription);
            });  

            return true;

        },

        /*
         * Return human readable specific info from
         * input layer description
         */
        getInfo:function(layerDescription) {
            return [
            ["Connector", msp.Util._(layerDescription["connectorName"])]
            ];
        },

        /**
         * MANDATORY
         * Compute an unique mspID based on layerDescription
         */
        getMspID:function(layerDescription) {
            return msp.Util.crc32(layerDescription.type + layerDescription.connectorName + (msp.Util.repareUrl(layerDescription.url) || ""));
        }
    }
})(window.msp, window.msp.Map);
