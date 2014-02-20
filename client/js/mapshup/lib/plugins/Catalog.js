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
(function(M) {

    M.Plugins.Catalog = function() {

        /*
         * Only one Catalog object instance is created
         */
        if (M.Plugins.Catalog._o) {
            return M.Plugins.Catalog._o;
        }

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
            self.options = options || {};

            /*
             * Default options
             */
            $.extend(self.options, {
                nextRecord: self.options.nextRecord || 1,
                connectors: self.options.connectors || []
            });

            /*
             * Store unique identifier for search menu
             */
            self._menuId = M.Util.getId();

            /*
             * Add a "Search" action to the geonames menu
             * This action launch a search on all registered catalogs
             * on a 1x1 square degrees box around the toponym
             */
            if (M.Plugins.Geonames && M.Plugins.Geonames._o) {

                /**
                 * Search all catalogs within the map view
                 */
                M.Plugins.Geonames._o.add([{
                        id: M.Util.getId(),
                        ic: "search.png",
                        ti: "Search in catalogs",
                        cb: function(toponym) {

                            /**
                             * Create a buffer around clicked point
                             */
                            self.searchAll(M.Map.Util.d2p(new OpenLayers.Bounds(toponym.lng - 1, toponym.lat - 1, toponym.lng + 1, toponym.lat + 1)), true);
                            return false;

                        }
                    }]);

            }

            /*
             * Remove layer event
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

                /*
                 * The only interesting case for this plugin is the "remove" action
                 */
                if (action === "remove") {
                    scope.remove(layer);
                }

            });

            /*
             * Update search BBOX on map move
             */
            M.Map.events.register("moveend", self, function(map, scope) {

                var i, l, m;
                /*
                 * Update search BBOX for non initial layers
                 */
                for (i = 0, l = scope.registeredCatalogs.length; i < l; i++) {

                    /*
                     * Important : if search attribute is set, then BBOX should not be updated
                     * the first time
                     */
                    m = scope.registeredCatalogs[i]._M;

                    if (!m.layerDescription.search) {
                        m.searchContext.setBBOX(M.Map.map.getExtent());
                    }
                    else {
                        delete m.layerDescription.search;
                    }

                }

            });

            return true;
        };

        /**
         * This method is called by LayersManager plugin
         * Add a "Search" action to the LayersManager menu item
         * 
         * Note : this does not apply to catalog layer with layerDescription.inactive status set to 'true'
         */
        this.getLayerActions = function(layer) {

            var self = this;

            /**
             * layers of type catalogs get a "Search" action
             */
            if (layer && layer["_M"].layerDescription.type === "Catalog" && !layer["_M"].layerDescription.inactive) {
                return [
                    {
                        id: M.Util.getId(),
                        icon: "search.png",
                        title: "Search",
                        tt: "Search",
                        callback: function() {
                            self.show(layer);
                        }
                    }
                ];
            }
            else {
                return null;
            }
        };

        /**
         * Add a catalog
         *
         * @param layer (type:"Catalog")
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
             * Get layer _M object
             */
            var i, l, c, options,
                    _M = layer["_M"],
                    scope = this,
                    name = _M.layerDescription.connectorName;

            /*
             * This should not be possible...
             * but in case of _M is not set, return false
             */
            if (!_M) {
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
                     * First create a function that return the M.Plugins.Catalog.<name> connector
                     */
                    c = (new Function('return M.Plugins.Catalog.' + name))();

                    /*
                     * If connector object does not exist, nothing is registered
                     */
                    if (!c) {
                        return false;
                    }

                    /*
                     * Create a new connector
                     */
                    c = new c(layer, options, function(connector) {
                        scope.register(scope, connector);
                    }, function(layer) {
                        scope.updateFilters(layer);
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

            var s, i, j, l, m, add, _M, filters, cFilters,
                    layer = connector.catalog;

            /*
             * !! Layer was removed before registration !!
             * Do not register it
             */
            if (layer._tobedestroyed) {
                connector.catalog = null;
                return false;
            }

            _M = layer["_M"];
            filters = _M.layerDescription["filters"];
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
            connector.searchUrl = connector.searchUrl || M.Util.getAbsoluteUrl(M.Util.repareUrl(connector.options.url)) + "catalogUrl=" + encodeURIComponent(_M.layerDescription.url) + "&";

            /*
             * Initialize an empty searchContext
             */
            if (!_M.searchContext) {

                /*
                 * Set new SearchContext
                 */
                _M.searchContext = new M.Map.SearchContext(layer, connector, {
                    autoSearch: false,
                    nextRecord: _M.layerDescription.nextRecord || scope.options.nextRecord,
                    nextRecordAlias: connector.nextRecordAlias,
                    numRecordsPerPage: _M.layerDescription.numRecordsPerPage || M.Config["general"].numRecordsPerPage,
                    numRecordsPerPageAlias: connector.numRecordsPerPageAlias,
                    callback: _M.layerDescription.hasOwnProperty("callback") ? _M.layerDescription.callback : null,
                    scope: scope
                });
            
                /*
                 * Set BBOX to current map view
                 */
                _M.searchContext.setBBOX(M.Map.map.getExtent());

                /*
                 * Clean layerDescription.nextRecord and layerDescription.numRecordsPerPage to avoid confusion
                 */
                delete layer["_M"].layerDescription.nextRecord;
                delete layer["_M"].layerDescription.numRecordsPerPage;
            }

            /*
             * Check if this catalog is already registered
             * If so, do not register it again
             */
            for (i = 0, l = scope.registeredCatalogs.length; i < l; i++) {
                if ((new M.Map.LayerDescription(scope.registeredCatalogs, M.Map)).getMID() === _M.MID) {
                    return true;
                }
            }

            /*
             * Register catalog within connector catalogs array
             */
            scope.registeredCatalogs.push(layer);

            /*
             * Add searchAll action to M.menu
             */
            if (M.menu) {

                if (scope.registeredCatalogs.length === 1) {

                    /**
                     * Search all catalogs within the map view
                     */
                    M.menu.add([{
                            id: scope.menuId,
                            ic: "search.png",
                            ti: "Search in catalogs",
                            cb: function() {
                                scope.searchAll(null, true);
                            }
                        }]);

                }

            }

            /*
             * Update filters
             */
            scope.updateFilters(layer);

            /*
             * If layer got a searchContext within layerDescription,
             * then launch search
             */
            s = layer["_M"].layerDescription.search;

            if (s) {

                /*
                 * Update the search items
                 */
                layer["_M"].searchContext.items = s.items;

                /*
                 * Launch unitary search -
                 */
                layer["_M"].searchContext.search({nextRecord: s.nextRecord});

            }

            /*
             * If layer got a searchOnLoad within layerDescription then launch search
             */
            else if (layer["_M"].layerDescription.hasOwnProperty("searchOnLoad")) {

                /*
                 * Launch unitary search -
                 */
                layer["_M"].searchContext.search({callback: layer["_M"].layerDescription.searchOnLoad});

            }

            return true;
        };

        /**
         * Remove a catalog
         *
         * @param {OpenLayers.Layer} catalog : catalog to be removed
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
                    if (catalog['_M'].layerDescription && catalog['_M'].layerDescription.unremovable) {
                        return false;
                    }

                    this.registeredCatalogs.splice(j, 1);

                    /*
                     * Remove the search panel
                     */
                    if (catalog['_M'].searchContext.btn) {
                        catalog['_M'].searchContext.btn.remove();
                    }

                    /*
                     * Remove searchAll action from M.menu
                     */
                    if (M.menu) {

                        if (this.registeredCatalogs.length === 0) {

                            /**
                             * Search all catalogs within the map view
                             */
                            M.menu.remove(this.menuId);
                        }

                    }

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

        /*
         * Show layer filters
         */
        this.show = function(layer) {

            /*
             * Paranoid mode
             */
            if (!layer) {
                return false;
            }

            var id1 = M.Util.getId(),
                    id2 = M.Util.getId(),
                    sc = layer["_M"].searchContext,
                    self = this;

            /*
             * Paranoid mode
             */
            if (!sc) {
                return false;
            }

            /*
             * Only one search popup can be opened at a time
             */
            if (self.sp && $.isFunction(self.sp.remove)) {
                self.sp.remove();
            }
            
            /*
             * Direct search without showing panel
             */
            if (layer["_M"].layerDescription.directSearch) {
                sc.search();
                return true;
            }
            
            /*
             * Set search popup
             */
            self.sp = new M.Popup({
                modal: false,
                classes: "sp",
                header: '<p>' + layer.name + '</p>',
                body: '<div class="description search"><div class="father">' + M.Util._("Limit search to map view extent") + '&nbsp;&nbsp;<input class="usegeo" type="checkbox" name="usegeo" ' + (sc.useGeo ? "checked" : "") + '/></div><div class="filters"></div><div class="launch"><a href="#" class="button inline" id="' + id1 + '">' + M.Util._("Reset filters") + '</a><a href="#" class="button facebook inline" id="' + id2 + '">&nbsp;&nbsp;search&nbsp;&nbsp;</a></div></div>'
            });

            /*
             * Clear all filters
             */
            $('#' + id1).click(function() {
                sc.clear();
                self.updateFilters(layer);
            });

            /*
             * Launch search
             */
            $('#' + id2).click(function() {

                self.sp.remove();

                /*
                 * Set BBOX
                 */
                if (sc.useGeo) {
                    sc.setBBOX(M.Map.map.getExtent());
                }

                sc.search();
                return false;
            });

            /*
             * Change search bbox on usegeo check 
             */
            $('.usegeo', self.sp.$b).change(function() {

                /*
                 * Swap search restriction between map view extent or to full extent
                 */
                sc.setGeo($(this).attr("checked") === "checked" ? true : false);

            });

            /*
             * Show search popup
             */
            self.sp.show();

            /*
             * Update search filters
             */
            self.updateFilters(layer);

            return true;

        };

        /**
         * Update search filters
         * Structure of panel
         *      <div>
         *          <div class="filters description">
         *      </div>
         *      
         */
        this.updateFilters = function(layer) {

            /*
             * Paranoid mode
             */
            if (!layer) {
                return false;
            }

            var $d,
                    sc = layer["_M"].searchContext,
                    connector = sc.connector,
                    self = this;

            if (!self.sp) {
                return false;
            }

            /*
             * Get the div filters reference
             */
            $d = $('.filters', self.sp.$b).empty();

            /*
             * No filters defined => nevermind but tells it to the user
             */
            if (!connector.filters || connector.filters.length === 0) {
                $d.html(M.Util._("No dedicated filters for this catalog"));
            }

            /*
             * Process the catalog filters
             */
            else {

                self.processItem(connector.filters, null, $d, layer);

                /*
                 * Make a population ratio based tag cloud
                 * for each .tagcloud element
                 */
                $('.tagcloud', $d).each(function(i) {

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
                            $(this).css('font-size', (function(p, b) {
                                return (0.8 + Math.round((10 * p) / b) / 10) + 'em';
                            })($(this).attr("population"), b));
                        });
                    }

                });

            }

            return true;

        };

        /**
         * Process a filter item
         */
        this.processItem = function(item, father, div, layer, _id) {

            var i, l, active,
                    id,
                    tmpItem,
                    newItem,
                    sc = layer["_M"].searchContext;

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
                    id = M.Util.getId();
                    div.append('<span class="father">' + tmpItem.title + ' |</span><span id="' + id + '" class="tagcloud"></span><br/>');
                    this.processItem(tmpItem.son, tmpItem, div, layer, id);
                }
                else {

                    /*
                     * Generate a unique id for class creation
                     */
                    id = M.Util.getId();

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
                            id: father.id,
                            son: [{
                                    id: tmpItem.id
                                }]
                        }) ? ' class="active"' : '';

                        /*
                         * If population is defined => make a ratio based tag-cloud
                         */
                        var pop = tmpItem.population !== undefined ? tmpItem.population : "";

                        /*
                         * Add tag
                         */
                        $('#' + _id).append('<a href="#" id="' + id + '" population="' + pop + '"' + active + '>' + tmpItem.title + '<span class="subscript">' + pop + '</span></a> ');

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
                            div.click(function() {

                                var newItem = {
                                    id: father.id,
                                    title: father.title,
                                    son: [{
                                            id: item.id,
                                            value: item.value,
                                            title: item.title
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
                                            sc.remove(father.son[i].id, father.id, true);
                                        }
                                    }

                                    $(this).addClass('active');
                                    sc.add(newItem);
                                }

                            });
                        })($('#' + id), father, tmpItem, sc);

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
                                    id: tmpItem.id,
                                    title: tmpItem.title,
                                    value: tmpItem.value
                                });
                                tmpItem.value = "";
                            }
                        }

                        /*
                         * Add a keyword action
                         */
                        div.append('<span class="father">' + tmpItem.title + ' |</span><span id="' + id + 't" class="bold">' + (value || "") + '</span>&nbsp;[<a href="#" id="' + id + '">' + (value ? M.Util._("Change") : M.Util._("Set")) + '</a><span id="' + id + 'c"> or <a href="#">' + M.Util._("Clear") + '</a></span>]</span><br/>');

                        /*
                         * Hide 'clear' action if value is not set
                         */
                        if (!value) {
                            $('#' + id + 'c').hide();
                        }

                        /*
                         * Add a 'clear' action
                         */
                        (function(id, item, sc) {
                            $('a', '#' + id + 'c').click(function(e) {

                                /*
                                 * Set item value to ""   
                                 */
                                sc.add({
                                    id: item.id,
                                    title: item.title,
                                    value: ""
                                });

                                /*
                                 * Update link content text with
                                 * the new set value
                                 */
                                $('#' + id + 't').html("");

                                /*
                                 * Hide the 'clear' action
                                 */
                                $('#' + id + 'c').hide();

                                $('#' + id).html(M.Util._("Set"));

                                return false;
                            });
                        })(id, tmpItem, sc);

                        /*
                         * Ask for a free keyword on click
                         */
                        (function(id, item, sc, type) {
                            $('#' + id).click(function(e) {

                                M.Util.askFor({
                                    title: M.Util._(item.title),
                                    dataType: type,
                                    value: sc.getValue(item.id),
                                    callback: function(v) {

                                        /*
                                         * Value is set -> add newItem to searchContext
                                         * Otherwise, remove it
                                         */
                                        if (v) {

                                            /*
                                             * Add newItem to layer searchContext
                                             */
                                            sc.add({
                                                id: item.id,
                                                title: item.title,
                                                value: v
                                            });

                                            /*
                                             * Update link content text with
                                             * the new set value
                                             */
                                            $('#' + id + 't').html(v);

                                            /*
                                             * Show the 'Clear' action
                                             */
                                            $('#' + id + 'c').show();

                                            $('#' + id).html(M.Util._("Change"));

                                        }

                                    }
                                });
                                return false;
                            });
                        })(id, tmpItem, sc, tmpItem.type);

                    }
                }
            }
        };

        /**
         * Launch a search over all catalogs
         *
         * @param <boolean> initialize: if true set nextRecord to 1 for each catalog (optional)
         */
        this.searchAll = function(bounds, initialize) {

            var j, l, sc;

            /**
             * Roll over each catalogs
             */
            for (j = 0, l = this.registeredCatalogs.length; j < l; j++) {
                sc = this.registeredCatalogs[j]["_M"].searchContext;

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
                    sc.setBBOX(sc.useGeo ? M.Map.map.getExtent() : null);
                }
            }

            return true;
        };

        /*
         * Set unique instance
         */
        M.Plugins.Catalog._o = this;

        return this;

    }
})(window.M);