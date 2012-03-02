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
/*********************************************
 *
 * PLUGIN: catalog
 *
 * This plugin requires layerTypes/Catalog.js
 *********************************************/
(function(msp) {
    
    msp.Plugins.Catalog = function() {
        
        /**
         * List of registered catalogs as an array of layers
         */
        this.registeredCatalogs = [];

        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var self = this;
            
            /*
             * Init options
             */
            this.options = options || {};

            /*
             * Default options
             */
            $.extend(this.options, {
                nextRecord:this.options.nextRecord || 1,
                numRecordsPerPage:this.options.numRecordsPerPage || 20,
                connectors:this.options.connectors || []
            });

            /*
             * Set the south panel
             */
            this.pn = new msp.Panel('s');
            
            /*
             * Add items to msp.menu
             */
            if (msp.menu) {
                
                /**
                 * Search all catalogs within the map view
                 */       
                msp.menu.add([{
                    id:msp.Util.getId(),
                    ic:"search.png",
                    ti:"Search in catalogs",
                    cb:function() {
                        self.searchAll(null, true);
                    }
                }]);
                
            }
           
            /*
             * Add a "Search" action to the geonames menu
             * This action launch a search on all registered catalogs
             * on a 1x1 square degrees box around the toponym
             */
            if (msp.Plugins.Geonames && msp.Plugins.Geonames._o) {
                
                /**
                 * Search all catalogs within the map view
                 */       
                msp.Plugins.Geonames._o.add([{
                    id:msp.Util.getId(),
                    ic:"search.png",
                    ti:"Search in catalogs",
                    cb:function(toponym) {
                        
                        /**
                         * Create a buffer around clicked point
                         */
                        self.searchAll(msp.Map.Util.d2p(new OpenLayers.Bounds(toponym.lng - 1, toponym.lat - 1, toponym.lng + 1,toponym.lat + 1)),true);
                        return false;
                        
                    }
                }]);
                
            }
            
            /*
             * Register events
             */
            msp.Map.events.register("layersend", this, this.onLayersEnd);
            msp.Map.events.register("resizeend", this, this.onResizeEnd);

            return true;
        };

        /**
         * East side panel size affects the table result container size
         */
        this.onResizeEnd = function(scope) {
            if ($.isFunction($().fixedHeaderTable)) {
                $('.catalog').each(function(index) {
                    var c = $(this);
                    if (!c.is(':empty')) {
                        c.fixedHeaderTable('destroy').fixedHeaderTable(
                        {
                            footer: true, 
                            cloneHeadToFoot: false, 
                            fixedColumn: false
                        }); 
                    }

                });
            }
        };

        /*
         * Called when a layer is remove
         */
        this.onLayersEnd = function(action, layer, scope) {

            /*
             * The only interesting case for this plugin is the "remove" action
             */
            if (action === "remove") {
                scope.remove(layer);
            }

        };

        /**
         * This method is called by LayersManager plugin
         * Add a "Search" action to the LayersManager menu item
         */
        this.getLmngActions = function(layer,li) {

            /**
             * layers of type catalogs get a "Search" action
             */
            if (layer && layer["_msp"].searchContext) {
                return [
                {
                    id:msp.Util.getId(),
                    ic:"search.png",
                    ti:"Search",
                    cb:function() {
                        layer["_msp"].searchContext.search();
                    }
                }
                ]
            }
            else {
                return null;
            }
        };

        /*
         * Add a catalog
         *
         * @input layer (type:"Catalog")
         * @output boolean : true if the catalog is successfully added or already added
         *                   false otherwise
         *
         */
        this.add = function(layer) {

            /*
             * Layer is null => return false
             */
            if (!layer) {
                return false;
            }

            /*
             * Get layer _msp object
             */
            var i, 
            l,
            c,
            options,
            _msp = layer["_msp"],
            scope = this,
            name = _msp.layerDescription.connectorName;

            /*
             * This should not be possible...
             * but in case of _msp is not set, return false
             */
            if (!_msp) {
                return false;
            }

            /*
             * Connector plugin definition
             * 
             * First roll over options.connectors array to see if 
             * connector is defined
             * 
             * Then create a new connector instance
             */
            for (i = 0, l = scope.options.connectors.length; i < l; i++) {
                if (scope.options.connectors[i].name === name) {
                    options = this.options.connectors[i].options || {};
                    
                    /*
                     * This is the tricky part
                     *
                     * First create a function that return the msp.Plugins.Catalog.<name> connector
                     */
                    c = (new Function('return msp.Plugins.Catalog.'+name))();
                    
                    /*
                     * If connector object does not exist, nothing is registered
                     */
                    if (!c) {
                        return false;
                    }
                    
                    /*
                     * Create a new connector
                     */
                    c = new c(layer, options, function(connector){
                        scope.register(scope, connector);
                    }, function(layer) {
                        scope.searchPanel.displayFilters(scope,layer);
                    });
                    
                    /*
                     * Callback to effectively add the catalog to mapshup
                     */
                    if (c.register()) {
                        scope.register(scope, c);
                    }
                    
                    return true;
                }
            }
            
            return false;

        };

        /**
         * This function is called after a connector registration is complete
         * and successfull
         */
        this.register = function(scope, connector) {

            if (!connector) {
                return false;
            }

            var i,j,l,m,add,_msp,filters,cFilters,
            layer = connector.catalog;

            /*
             * !! Layer was removed before registration !!
             * Do not register it
             */
            if (layer._tobedestroyed) {
                connector.catalog = null;
                return false;
            }
            
            _msp = layer["_msp"];
            filters = layer["_msp"].layerDescription["filters"];
            cFilters = connector.filters;
            
            /*
             * If layer layerDescription set filters, add it to
             * the layer connector
             */
            if (filters) {

                /*
                 * Roll over layerDescription filters
                 */
                for (i = 0, l = filters.length; i < l; i++) {

                    /*
                     * By default, add the filter
                     */
                    add = true;

                    /*
                     * Check against connector already defined filters
                     * If it is the case, the connector filter is superseed
                     * by the layerDescription filter
                     * In other case, the layerDescription filter is added
                     * to the connector filters
                     */
                    for (j = 0, m = cFilters.length; j < m; j++) {

                        /*
                         * Superseed filter
                         */ 
                        if (filters[i].id === cFilters[j].id) {
                            cFilters[j] = filters[i];
                            add = false;
                            break;
                        } 

                    }

                    /*
                      * Filter wasn't already defined - add it to connector filters
                      */
                    if (add) {
                        cFilters.push(filters[i]);
                    }
                }

            }

            /*
             * Initialize connector searchUrl if not defined
             */
            connector.searchUrl = connector.searchUrl || msp.Util.getAbsoluteUrl(msp.Util.repareUrl(connector.options.url)) + "catalogUrl=" + encodeURIComponent(_msp.layerDescription.url) + "&";

            /*
             * Initialize an empty searchContext
             */
            if (!_msp.searchContext) {
                
                /*
                 * Get the "South" panel reference
                 */
                var btn = new msp.Button({
                    tb:new msp.Toolbar('ss', 'h'),
                    tt:msp.Util._("Catalog") + " : " + layer.name,
                    title:layer.name,
                    container:scope.pn.add('<div class="west"><div style="width:99%;height:99%;overflow:auto;"></div></div><div class="east"><div style="height:99%;overflow:auto;"></div></div>'),
                    /* Add a search action */
                    actions:[
                    {   
                        cssClass:"actnnw icnsearch",
                        callback:function(btn){
                            btn.layer["_msp"].searchContext.search()
                        }
                    }
                    ],
                    activable:true,
                    scope:scope,
                    /* Important : on button click,
                     * call the onResizeEnd function to ensure
                     * that results table size is well computed
                     */
                    callback:scope.onResizeEnd,
                    e:{
                        layer:layer // Important : add the layer reference to the button
                    }
                }); 
 
                /*
                 * Add $w and $e reference to btn
                 */
                btn.$w = $('.west', btn.container.$d).children().first();
                btn.$e = $('.east', btn.container.$d).children().first();
                
                /*
                 * Set new SearchContext
                 */ 
                _msp.searchContext = new msp.Map.SearchContext(layer, connector, btn, {
                    autoSearch:msp.Util.getPropertyValue(layer["_msp"].layerDescription, "autoSearch", false),
                    nextRecord:layer["_msp"].layerDescription.nextRecord || scope.options.nextRecord, 
                    numRecordsPerPage:layer["_msp"].layerDescription.numRecordsPerPage || scope.options.numRecordsPerPage, 
                    callback:scope.searchPanel.show, 
                    scope:scope
                });

                /*
                 * Clean layerDescription.nextRecord and layerDescription.numRecordsPerPage to avoid confusion
                 */
                delete layer["_msp"].layerDescription.nextRecord;
                delete layer["_msp"].layerDescription.numRecordsPerPage;
            }

            /*
             * Check if this catalog is already registered
             * If so, do not register it again
             */
            for (i = 0, l = scope.registeredCatalogs.length; i < l; i++) {
                if ((new msp.Map.LayerDescription(scope.registeredCatalogs, msp.Map)).getMspID() === _msp.mspID) {
                    return true;
                }
            }

            /*
             * Register catalog within connector catalogs array
             */
            scope.registeredCatalogs.push(layer);
            
            /*
             * Process filters on panel west side
             */
            scope.searchPanel.displayFilters(scope, layer);
            
            return true;
        };

        /**
         * Remove a catalog
         *
         * @input {OpenLayers.Layer} catalog : catalog to be removed
         * @output boolean : true if the catalog is successfully unregistered
         */ 
        this.remove = function(catalog) {
            
            /*
             * Roll over catalogs description within the connector
             */
            for (var j = 0, l = this.registeredCatalogs.length; j < l; j++) {

                var registeredCatalog = this.registeredCatalogs[j];

                /*
                 * Catalog is found => remove it
                 */
                if (registeredCatalog.id === catalog.id) {

                    /*
                     * If this layer is unremovable, do not remove it. End of the process
                     * (this should never occurs but who knows...)
                     */
                    if (catalog['_msp'].layerDescription && catalog['_msp'].layerDescription.unremovable) {
                        return false;
                    }

                    this.registeredCatalogs.splice(j,1);

                    /*
                     * Remove the search panel
                     */
                    catalog['_msp'].searchContext.btn.remove();
                    
                    /**
                     * Catalog is removed
                     */
                    return true;
                }
            }

            /**
             * Catalog is not removed
             */
            return false;
        };
        
        /**
         * The configuration panel contains one tab per catalog
         */
        this.searchPanel = {

            /*
             * Refresh and display the tab content
             */
            show: function(scope, layer) {
                
                var btn = layer["_msp"].searchContext.btn,
                self = scope.searchPanel;
                
                /*
                 * Only display search panel is result is not empty
                 */
                if (layer.hasOwnProperty("features") && layer.features.length > 0) {
                    
                    /*
                     * Activate layer button
                     */
                    btn.activate(true);

                    /*
                     * Show panel content
                     */
                    btn.container.pn.show(btn.container);
                    
                }
                
                /*
                 * Process filters on panel west side
                 */
                self.displayFilters(scope, layer);
                
                /*
                 * Process result on panel east side
                 */
                self.displayResults(scope, layer);
               
                return true;
            },
            
            /*
             * Show search filters in panel west side
             * Structure of the West panel
             *      <div class="west">
             *          <div class="title">Search parameters</div>
             *          <div class="filters description">
             *      </div>
             *      
             */
            displayFilters:function(scope, layer) {

                /*
                 * Paranoid mode
                 */
                if (!layer) {
                    return false;
                }
                
                var d,
                id = msp.Util.getId(),
                sc = layer["_msp"].searchContext,
                connector = sc.connector,
                self = scope.searchPanel;
                    
                /*
                 * Set west panel structure 
                 */
                sc.btn.$w.html('<div class="title"><p>'+msp.Util._("Search parameters")+'</p><p><input type="checkbox" name="usegeo" '+(sc.useGeo ? "checked" : "")+'/>'+msp.Util._("Limit search to map view extent")+' | <a href="#" id="'+id+'">'+msp.Util._("Reset filters")+'</a></p></div><div class="description filters"></div>');
                
                /*
                 * Clear all filters
                 */
                $('#'+id).click(function(){
                    sc.clear();
                    self.displayFilters(scope,layer);
                });
                
                /*
                 * Change search bbox on usegeo check 
                 */
                $('input', sc.btn.$w).change(function() {
                    
                    /*
                     * Swap search restriction between map view extent or to full extent
                     */
                    sc.setGeo($(this).attr("checked") === "checked" ? true : false);
                });
                
                /*
                 * Get the div filters reference
                 */
                d = $('.filters', sc.btn.$w);

                /*
                 * No filters defined => nevermind but tells it to the user
                 */
                if (!connector.filters || connector.filters.length === 0) {
                    d.html(msp.Util._("No dedicated filters for this catalog"));
                }

                /*
                 * Process the catalog filters
                 */
                else {

                    self.processItem(connector.filters, null, d, layer);

                    /*
                     * Make a population ratio based tag cloud
                     * for each .tagcloud element
                     */
                    $('.tagcloud', d).each(function(i){

                        var a = $('a', $(this)),
                        b = 0;

                        /*
                         * Roll over <a> element and get 
                         * the bigger (b) population value
                         */
                        a.each(function(j) {
                            b = Math.max($(this).attr("population"), b);
                        });

                        /*
                         * Then set a proportionnal font-size to the
                         * bigger element
                         */
                        if (b != 0) {
                            a.each(function(j) {

                                /*
                                 * Set a proportionnal font-size
                                 * from 0.8 to 1.8 em
                                 */
                                $(this).css('font-size', (function(p,b){
                                    return (0.8 + Math.round((10 * p) / b) / 10) + 'em';
                                })($(this).attr("population"),b));
                            });
                        }

                    });

                }
                
                return true;

            },
            
            /*
             * Show search results in panel east side
             * 
             * East side panel is swith in two horizontal parts :
             *  - a table containing the result
             *  - the previous/next actions in the lower part of the panel
             *  
             *  Both parts size are computed against the east panel size
             *  to avoid overflows
             *  
             *  Structure of the East panel
             *      <div class="east">
             *          <div class="title">XXX results</div>
             *          <div class="description">
             *              <a class="previous">...</a>
             *              <a class="next">...</a>
             *          </div>
             *      </div>
             *  
             */
            displayResults:function(scope, layer) {

                /*
                 * Paranoid mode
                 */
                if (!layer) {
                    return false;
                }
                
                /*
                 * Get the container div reference
                 * based on the layer.id prefixed by sr
                 */
                var key,i,l,j,m,a,attributes,html,table,
                nbOfFeatures = 0,
                pid = msp.Util.getId(),
                nid = msp.Util.getId(),
                sc = layer["_msp"].searchContext,
                features = msp.Map.Util.getFeatures(layer); // Important ! Get unclusterized features
                
                /*
                 * Create the east side panel structure:
                 * 
                 * <table class="catalog">
                 *      ...Search results...
                 * </table>
                 */
                sc.btn.$e.html('<table class="catalog" id="sr'+msp.Util.encode(layer.id)+'"></table>');

                /*
                 * Initialize table container
                 */
                if ($.isFunction(sc.connector.getBriefAttributes)) {
                    attributes = sc.connector.getBriefAttributes();
                    html = '<thead><tr>';
                    for (i = 0, l = attributes.length; i < l; i++) {
                        html += '<th>' + attributes[i].title + '</th>';
                    }
                    html += '</tr></thead><tbody>';

                    /*
                     * Roll over features
                     */ 
                    for (key in features) {
                        html += '<tr class="hover" fid="'+key+'">';
                        for (j = 0, m = attributes.length; j < m; j++) {
                            a = features[key].attributes[attributes[j].value];
                            if (attributes[j].title === "Preview") {
                                html += '<td><img src="' + (a ? a : msp.Util.getImgUrl('nodata.png')) + '"/></td>'
                            }
                            /*
                             * Identifier special case, strip out urn prefix
                             */
                            else if (a && attributes[j].title === "Identifier") {
                                html += '<td title="' + a + '">' + msp.Util.shorten(a.replace(/urn:ogc:def:EOP:/,""), 30) + '</td>';
                            }
                            else {
                                html += '<td title="' + a + '">' + msp.Util.shorten(a, 30) + '</td>';
                            }
                        }
                        html += '</tr></tbody>';
                        
                        /*
                         * Count the number of features
                         */
                        nbOfFeatures++;
                    }

                    /*
                     * Set the footer with next/previous action
                     */
                    html += '<tfoot><tr><td colspan="'+l+'"><a href="#" id="'+pid+'" class="hover">&larr;&nbsp</a> ' + sc.nextRecord + " " + msp.Util._("to") + " " + (sc.nextRecord + nbOfFeatures - 1) + " " + msp.Util._("on") + " " + sc.totalResults + ' <a href="#" id="'+nid+'" class="hover">&rarr;</a></td></tr></tfoot>';

                    /*
                     * Populate the table results and make fixed headder
                     */
                    table = $('#sr'+msp.Util.encode(layer.id));
                    table.html(html);

                    (function(sc, div) {
                        div.click(function(){
                            sc.previous();
                            return false;
                        })
                    })(sc, $('#'+pid));
                    (function(sc, div) {
                        div.click(function(){
                            sc.next();
                            return false;
                        })
                    })(sc, $('#'+nid));

                    /*
                     * Hide or display "next" action
                     */
                    (sc.nextRecord + sc.numRecordsPerPage < sc.totalResults) ? $('#'+nid).show() : $('#'+nid).hide();

                    /*
                     * Hide or display "previous" action
                     */
                    (sc.nextRecord - sc.numRecordsPerPage > 0) ? $('#'+pid).show() : $('#'+pid).hide();

                    /*
                     * Update SearchContext reference
                     * (See Map.Util.FeatureInfo for explanation)
                     */
                    sc.$t = $('tbody tr', table);
                    
                    /*
                     * Select feature on click
                     */
                    (function($d,features) {
                        $d.click(function(){

                            /*
                             * Remove active class for every <tr>
                             */
                            $('tr', table).removeClass('active');

                            /*
                             * Set this <tr> active and select the current
                             * feature. Note that the 'force' input parameter
                             * is set to true
                             */
                            var f = features[$(this).addClass('active').attr('fid')];

                            /*
                             * Zoom on feature and select it
                             */
                            msp.Map.zoomTo(f.geometry.getBounds());
                            msp.Map.featureInfo.select(f, true);

                        });
                    })($('tbody tr', table),features);
                    
                    /*
                     * Compute size
                     */
                    scope.onResizeEnd();

                }

                return true;
            },

            /**
             * Process a filter item
             */
            processItem: function(item, father, div, layer, _id) {

                var i,l,active,
                id,
                tmpItem,
                newItem,
                sc = layer["_msp"].searchContext;

                /**
                 * item can be an array
                 */
                for (i = 0, l = item.length; i < l; i++) {

                    /*
                     * Get item[i] reference
                     */
                    tmpItem = item[i];

                    /*
                     * item[i] has son => process the son
                     */
                    if (tmpItem.son) {
                        id = msp.Util.getId();
                        div.append('<span class="father">'+tmpItem.title+' |</span><span id="'+id+'" class="tagcloud"></span><br/>');
                        this.processItem(tmpItem.son, tmpItem, div, layer, id);
                    }
                    else {

                        /*
                         * Generate a unique id for class creation
                         */
                        id = msp.Util.getId();

                        /*
                         * enumeration
                         *
                         * Will create a tag-cloud with all the enumeration items
                         */
                        if (father && father.type === 'enumeration') {

                            /*
                             * If newItem is already defined in the
                             * layer searchContext, add an active class
                             * to the tag 
                             */
                            active = sc.isDefined({
                                id:father.id,
                                son:[{
                                    id:tmpItem.id
                                }]
                            }) ? ' class="active"' : '';

                            /*
                             * If population is defined => make a ratio based tag-cloud
                             */
                            var pop = tmpItem.population !== undefined ? tmpItem.population : "";

                            /*
                             * Add tag
                             */
                            $('#'+_id).append('<a href="#" id="'+id+'" population="'+pop+'"'+active+'>'+tmpItem.title+'<span class="subscript">'+pop+'</span></a> ');

                            /*
                             * Click on one enumeration item :
                             *  - if item is not already present, add it
                             *    and add an 'active' class to the element
                             *  - if item is already present, remove it
                             *    and remove 'active' class from the element
                             *  - if fater.unique is set to true then only
                             *    one enumeration item can be selected at a time
                             */
                            (function(div, father, item, sc) {
                                div.click(function(){

                                    var newItem = {
                                        id:father.id,
                                        title:father.title,
                                        son:[{
                                            id:item.id,
                                            value:item.value,
                                            title:item.title
                                        }]
                                    };

                                    /*
                                     * Remove or add newItem depending
                                     * on if it is already present or not
                                     */
                                    if (sc.isDefined(newItem)) {
                                        $(this).removeClass('active');
                                        sc.remove(item.id, father.id);
                                    }
                                    else {

                                        /*
                                         * Unique enumeration - one item selected
                                         * at a time. Clear all others items
                                         */
                                        if (father.unique) {
                                            $(this).parent().children().removeClass('active');
                                            for (var i = 0, l = father.son.length; i < l; i++) {
                                                sc.remove(father.son[i].id, father.id);
                                            }
                                        }

                                        $(this).addClass('active');
                                        sc.add(newItem);
                                    }

                                });
                            })($('#'+id), father, tmpItem, sc);

                        }

                        /*
                         * text or date
                         *
                         * Ask for a text or a date
                         */
                        else if (tmpItem.type === 'text' || tmpItem.type === 'date') {

                            /*
                             * First get the value within the searchContext...
                             */
                            var value = sc.getValue(tmpItem.id);

                            /*
                             * If there is no value then set the value to the
                             * default connector value or ""
                             */
                            if (value === null) {
                                value = tmpItem.value || "";
                                
                                /*
                                 * if tmpItem.value is set then 
                                 * initialize SearchContext object with this value
                                 */
                                if (tmpItem.value) {
                                    sc.add({
                                        id:tmpItem.id,
                                        title:tmpItem.title,
                                        value:tmpItem.value
                                    });
                                    tmpItem.value = "";
                                }
                            }

                            /*
                             * Add a keyword action
                             */
                            div.append('<span class="father">'+tmpItem.title+' |</span><span id="'+id+'t" class="bold">'+(value || "")+'</span>&nbsp;[<a href="#" id="'+id+'">'+(value ? msp.Util._("Change") : msp.Util._("Set"))+'</a><span id="'+id+'c"> or <a href="#">'+msp.Util._("Clear")+'</a></span>]</span><br/>');

                            /*
                             * Hide 'clear' action if value is not set
                             */
                            if (!value) {
                                $('#'+id+'c').hide();
                            }

                            /*
                             * Add a 'clear' action
                             */
                            (function(id, item, sc) {
                                $('a', '#'+id+'c').click(function(e) {

                                    /*
                                     * Set item value to ""   
                                     */    
                                    sc.add({
                                        id:item.id,
                                        title:item.title,
                                        value:""
                                    });

                                    /*
                                     * Update link content text with
                                     * the new set value
                                     */
                                    $('#'+id+'t').html("");

                                    /*
                                     * Hide the 'clear' action
                                     */
                                    $('#'+id+'c').hide();

                                    $('#'+id).html(msp.Util._("Set"));

                                    return false;
                                });
                            })(id, tmpItem, sc);

                            /*
                             * Ask for a free keyword on click
                             */
                            (function(id, item, sc, type) {
                                $('#'+id).click(function(e) {
                                    
                                    msp.Util.askFor(msp.Util._(item.title), null, type, sc.getValue(item.id), function(v){

                                        /*
                                         * Value is set -> add newItem to searchContext
                                         * Otherwise, remove it
                                         */
                                        if (v) {

                                            /*
                                             * Add newItem to layer searchContext
                                             */
                                            sc.add({
                                                id:item.id,
                                                title:item.title,
                                                value:v
                                            });

                                            /*
                                             * Update link content text with
                                             * the new set value
                                             */
                                            $('#'+id+'t').html(v);

                                            /*
                                             * Show the 'Clear' action
                                             */
                                            $('#'+id+'c').show();

                                            $('#'+id).html(msp.Util._("Change"));

                                        }

                                    });
                                    return false;
                                });
                            })(id, tmpItem, sc, tmpItem.type);

                        }
                    }
                }
            }

        };
        
        /**
         * Launch a search over all catalogs
         *
         * @input <boolean> initialize: if true set nextRecord to 1 for each catalog (optional)
         */
        this.searchAll = function (bounds,initialize) {

            var j,l,sc;
            
            /**
             * Roll over each catalogs
             */
            for (j = 0, l = this.registeredCatalogs.length; j < l; j++) {
                sc = this.registeredCatalogs[j]["_msp"].searchContext;

                /**
                 * initialize is set to true => force nextRecord to 1
                 * (i.e. start a new search for each catalog)
                 */
                if (initialize) {
                    sc.nextRecord = 1;
                }

                /**
                 * Set the search BBOX to the current bounds
                 */
                if (bounds) {
                    sc.setBBOX(bounds);
                }
                
                /**
                 * Launch an unitary search for catalog
                 */
                sc.search();
                
                /**
                 * Set back search BBOX to the map bounds
                 */
                if (bounds) {
                    sc.setBBOX(sc.useGeo ? msp.Map.map.getExtent() : null);
                }
            }  

            return true;
        };
        
        return this;

    }
})(window.msp);