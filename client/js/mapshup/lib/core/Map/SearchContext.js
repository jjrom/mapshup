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
 * Search context function
 * One searchContext should be initialized for each catalog layer within the
 * _M.searchContext property
 * (i.e. layer["_M"].searchContext = new M.plugins["Catalog"].SearchContext(layer,connector,options);)
 *
 * @param layer : catalog layer
 * @param connector : catalog connector
 * @param options : possible options are
 * {
 *      autosearch : true to set an auto search mode
 *      nextRecord : next record value
 *      nextRecordAlias : alias name for "nextRecord" property - see OpenSearch catalog connector
 *      numRecordsPerPage : Maximum number of records per page
 *      numRecordsPerPageAlias : alias name for "numRecordsPerPage" property - see OpenSearch catalog connector
 *      callback : function to call after a successfull search
 *      scope : scope of the callback function
 * }
 * 
 */
(function(M) {
    
    M.Map.SearchContext = function(layer, connector, options) {

        /*
         * Paranoid mode
         */
        options = options || {};
        
        /**
         * If autoSearch is set to true, search() function is triggered
         * each time an item is added/removed/updated from the items list
         */
        this.autoSearch = M.Util.getPropertyValue(options, "autoSearch", false);

        /**
         * Connector reference
         */
        this.connector = connector;
        
        /**
         * Layer reference
         */
        this.layer = layer;

        /**
         * Next record value
         */
        this.nextRecord = M.Util.getPropertyValue(options, "nextRecord", 1);

        /**
         * Next record alias value
         */
        this.nextRecordAlias = options.nextRecordAlias || "nextRecord";
        
        /**
         * Maximum number of records per page
         */
        this.numRecordsPerPage = M.Util.getPropertyValue(options, "numRecordsPerPage", 20);
        
        /**
         * Maximum number of records per page
         */
        this.numRecordsPerPageAlias = options.numRecordsPerPageAlias || "numRecordsPerPage";
        
        /**
         * Maximum number of results for this search context
         */
        this.totalResults = 0;

        /**
         * Callback function to be called when search is successfully performed
         */
        this.callback = options.callback;

        /**
         * Scope for the Callback function
         */
        this.scope = options.scope;
        
        /**
         * When useGeo is set to true, search is restricted to the map view extent
         */
        this.useGeo = true;

        /**
         * VERY IMPORTANT !
         *
         * items array contains "filter item"
         *
         * An item is defined like this :
         *  {
         *      id: unique item identifier
         *      title: item title
         *      value: value sent to the server (only mandatory if son is defined)
         *      operator: operator linking item to its son,
         *      son:[{
         *          id: son identifier (unique within this item),
         *          title: son title
         *          value: value sent to the server,
         *          javascript: action (optional)
         *      }]
         *  }
         *  
         */
        this.items = [];

        /**
         * Check if input item is already
         * defined
         */
        this.isDefined = function(_item) {

            /*
             * Roll over items list (i.e. roll over items already added)
             */
            for (var i = 0, l = this.items.length; i < l; i++){

                var item = this.items[i];

                /*
                 * newItem is already stored in items array
                 */
                if (_item.id === item.id) {

                    /*
                     * newItem has value at the father level
                     * => return true
                     */
                    if (_item.value !== undefined) {
                        return true;
                    }

                    /*
                     * newItem has no value at the father level
                     * => check if son is defined
                     */
                    else {

                        if (item.son && _item.son && _item.son.length > 0) {
                            /*
                             * Roll over newItem sons
                             */
                            for (var j = 0, m = item.son.length; j < m; j++) {

                                /*
                                 * newItem son is already defined
                                 * => return true
                                 */
                                if (_item.son[0].id === item.son[j].id) {
                                    return true;
                                }
                            }
                        }

                    }

                }
            }

            /*
             * If you get there it means that the item
             * is not already defined
             */
            return false;

        };

        /**
         * Add an item to the items array
         *
         * @param newItem
         */
        this.add = function(newItem) {

            /*
             * Roll over items list (i.e. roll over items already added)
             */
            for (var i = 0, l = this.items.length; i < l; i++){

                var item = this.items[i];

                /*
                 * newItem is already stored in items array
                 * do not added again but instead update the content
                 */
                if (newItem.id === item.id) {

                    /*
                     * newItem has value at the father level
                     * => update this value
                     */
                    if (newItem.value !== undefined) {
                        item.value = newItem.value;
                        item.title = newItem.title;
                    }

                    /*
                     * newItem has no value at the father level
                     * => update the son values
                     */
                    else {

                        /*
                         * Roll over newItem sons
                         */
                        for (var j = 0, m = item.son.length; j < m; j++) {

                            /*
                             * newItem son is already defined
                             */
                            if (newItem.son[0].id === item.son[j].id) {
                                
                                item.son[j].value = newItem.son[0].value;
                                item.son[j].title = newItem.son[0].title;
                                
                                /* Automatically trigger search() function if requested */
                                if (this.autoSearch && newItem.id !== "bbox") {
                                    this.search();
                                }
                                
                                return true;
                            }
                        }

                        /*
                         * newItem son was not defined => add it
                         */
                        item.son.push(newItem.son[0]);
                    }

                    /* Automatically trigger search() function if requested */
                    if (this.autoSearch && newItem.id !== "bbox") {
                        this.search();
                    }
                                
                    return true;
                }
            }

            /*
             * newItem was not already defined (i.e. not in the items array)
             * => add it to items array
             */
            this.items.push(newItem);

            /* Automatically trigger search() function if requested */
            if (this.autoSearch && newItem.id !== "bbox") {
                this.search();
            }
            
            return true;
        };

        /**
         * Clear the search context
         * 
         * @param {boolean} notTime : if set to true, time filter is not cleared
         */
        this.clear = function(notTime) {
            this.items = [];
            this.setGeo(this.useGeo);
            if (notTime) {
                this.setTime(M.timeLine.getInterval());
            }
        };
        
        /**
         * Return the items array as an HTTP GET key/value pairs string
         */
        this.getSerializedParams = function() {

            /*
             * Initialize serializedParams string
             */
            var serializedParams = this.numRecordsPerPageAlias + "=" + this.numRecordsPerPage;

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++) {

                /*
                 * New key/value pair for item[i]
                 */
                serializedParams += "&" + encodeURIComponent(this.items[i].id) + "=";

                /*
                 * Value is defined at item level
                 */
                if (this.items[i].value !== undefined) {
                    serializedParams += encodeURIComponent(this.items[i].value);
                }
                /*
                 * No value defined at item level => get the son values
                 */
                else {
                    
                    /*
                     * Roll over item's sons
                     */
                    for (var j = 0, m = this.items[i].son.length; j < m; j++) {
                        if (j>0) {
                            serializedParams += "|";
                        }
                        serializedParams += encodeURIComponent(this.items[i].son[j].value);
                    }
                }
            }

            return serializedParams;
        };

        /**
         * Get the value of an item
         */
        this.getValue = function(_id) {

            for (var i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i].id === _id) {
                    return this.items[i].value;
                }
            }

            return null;

        };

        /**
         * Make a search on the next page of records
         */
        this.next = function() {

            /*
             * Set the new nextRecord value
             */
            var p = this.nextRecord + this.numRecordsPerPage;

            /*
             * We are already at the last page
             * Do nothing and returns false
             */
            if (p > this.totalResults) {
                return false;
            }

            /*
             * Launch a search
             */
            return this.search(p);
        };

        /**
         * Make a search on the previous page of records
         */
        this.previous = function() {

            /*
             * Set the new next record
             */
            var p = this.nextRecord - this.numRecordsPerPage;

            /*
             * We are already at the first page
             * Do nothing and returns false
             */
            if (p < 0) {
                return false;
            }

            /*
             * Launch a search
             */
            return this.search(p);

        };

        /**
         * Remove item 'id' or 'fatherId->id' from items list
         *
         * If fatherId is null then it is assumes that 'id' is already
         * at father level
         * 
         * @param <boolean> noauto : if true, autosearch is deactivated
         */
        this.remove = function(id, fatherId, noauto) {
            
            var i, j, l, m, self = this;
             
            /*
             * Roll over items
             */
            for (i = 0, l = self.items.length; i < l; i++){

                /*
                 * fatherId is null means that 'id' is a father
                 */
                if (fatherId === null) {

                    /*
                     * id is found
                     */
                    if (id === self.items[i].id) {

                        /*
                         * Remove item id from items list
                         */
                        self.items.splice(i,1);

                        /* Automatically trigger search() function if requested */
                        if (!noauto) {
                            if (self.autoSearch && fatherId !== "bbox") {
                                self.search();
                            }
                        }
                        
                        return true;
                    }
                }

                /*
                 * fatherId is defined means that 'id' is at son level
                 */
                else  {

                    /*
                     * father "fatherId" is found
                     */
                    if (fatherId === self.items[i].id) {

                        /*
                         * Roll over each father's son(s)
                         */
                        for (j = 0, m = self.items[i].son.length; j < m; j++) {

                            /*
                             * son "id" is found
                             */
                            if (id === self.items[i].son[j].id) {

                                /*
                                 * Remove the son from sons
                                 */
                                self.items[i].son.splice(j,1);

                                /*
                                 * If there is no more son, remove the son array
                                 */
                                if (self.items[i].son.length === 0) {
                                    self.items.splice(i,1);
                                }

                                /* Automatically trigger search() function if requested */
                                if (!noauto) {
                                    if (self.autoSearch  && fatherId !== "bbox") {
                                        self.search();
                                    }
                                }
                                return true;
                            }
                        }
                    }
                }

            }
            return false;
        };

        /**
         * Launch a search request on this SearchContext
         *
         * @param <int> nextRecord : nextRecord to search (optional)
         */
        this.search = function(nextRecord) {

            var key,
            extras = "",
            layer = this.layer,
            self = this;

            /*
             * Set nextRecord
             */
            nextRecord = nextRecord || 1;

            /*
             * Set extras parameters
             */
            if (layer["_M"] && layer["_M"].layerDescription.extras) {
                for (key in layer["_M"].layerDescription.extras) {
                    extras += "&"+key+"="+layer["_M"].layerDescription.extras[key];
                }
            }

            /**
             * Launch an asynchronous search
             * The result is a GeoJSON object
             */
            M.Util.ajax({
                url:M.Util.proxify(this.connector.searchUrl + this.getSerializedParams() + "&" + self.nextRecordAlias + "=" + nextRecord + extras),
                async:true,
                dataType:"json",
                success: function(data) {

                    var l, lm = M.Plugins.LayersManager;
                    
                    /*
                     * First check if there is no error
                     * Otherwise, display results
                     */
                    if (!data) {
                        
                        /*
                         * Endless search
                         * If nextRecord is greater than 1 then it is assumes that the search
                         * is paginate. In this case the existing features are not removed
                         * Otherwise it is assumes that this is a new search and the existing
                         * features are removed
                         */
                        if (nextRecord === 1) {
                            layer.destroyFeatures();
                        }
                        
                        /*
                         * Tells mapshup that features changed
                         */
                        M.Map.events.trigger("layersend", {
                            action:"features",
                            layer:layer
                        });
                        
                        /*
                         * Be kind with user
                         */
                        M.Util.message(layer.name + " : " + M.Util._("No resut"));
                        
                        
                    }
                    else if (data.error) {
                        M.Util.message(layer.name + " : " + data.error["message"], -1);
                    }
                    else {

                        /*
                         * Endless search
                         * If nextRecord is greater than 1 then it is assumes that the search
                         * is paginate. In this case the existing features are not removed
                         * Otherwise it is assumes that this is a new search and the existing
                         * features are removed
                         */
                        if (nextRecord === 1) {
                            layer.destroyFeatures();
                        }
                        
                        /*
                         * Process the GeoJSON result
                         *
                         * Note: result is in EPSG:4326
                         */
                        var features = new OpenLayers.Format.GeoJSON({
                            internalProjection:M.Map.map.projection,
                            externalProjection:M.Map.pc
                        }).read(data);

                        
                        /*
                         * Empty result
                         */
                        l = features.length;
                        
                        if (!features || l === 0) {
                            
                            /*
                             * Be kind with users !
                             */
                            M.Util.message(M.Util._(layer.name) + " : " + M.Util._("No result"));
                            
                        }
                        else {
                            
                            /*
                             * Add features to the layer 
                             */
                            layer.addFeatures(features);
                            
                            /*
                             * Zoom on layer extent
                             */
                            M.Map.Util.zoomOn(layer);
                            
                            /*
                             * Show result in LayersManager
                             */
                            if (lm && lm._o) {
                                lm._o.show(lm._o.get(layer['_M'].MID));
                            }
                            
                        }
                        
                        /*
                         * Avoid case where server don't take care of numRecordsPerPage value
                         */
                        if (l > self.numRecordsPerPage) {
                            self.numRecordsPerPage = l;
                        }
                        
                        /*
                         * Set nextRecord new value
                         */
                        layer["_M"].searchContext.nextRecord = nextRecord;

                        /*
                         * Update the totalResults value
                         * If data.totalResults is not set then set totalResults to the number of features
                         */
                        layer["_M"].searchContext.totalResults = data.hasOwnProperty("totalResults") ? data.totalResults : l;
                        
                        /*
                         * Endless search - Tricky part
                         * 
                         * If this is the first search (i.e. nextRecord === 1) then
                         * tell LayersManager to compute entirely features thumbs (send "features" action)
                         * Otherwise tells LayersManager to refresh features thumbs without removing
                         * previous features (send "featureskeep" action)
                         */
                        M.Map.events.trigger("layersend", {
                            action:nextRecord === 1 ? "features" : "featureskeep",
                            layer:layer
                        });
                        
                        /*
                         * Finally tells callback function that the search was
                         * successfully performed
                         */
                        if (self.callback) {
                            self.callback(self.scope,layer);
                        }

                    }

                }

            },{
                title:M.Util._("Searching") + " : " + M.Util._(this.layer.name),
                cancel:true
            });

            return true;

        };
                                
        /*
         * Set use of search bbox 
         * 
         * @param <booelean> b: true to use search bbox. false otherwise
         * 
         */
        this.setGeo = function(b) {
            
            var self = this;
            
            self.useGeo = b;
            self.setBBOX(self.useGeo ? M.Map.map.getExtent() : null);
            if (self.autoSearch) {
                self.search();
            }
        };
        
        /**
         * Set the bbox to the given bounds
         *
         * @param <OpenLayers.Bounds> bounds : bounds in map projection
         */
        this.setBBOX = function(bounds){

            /**
             * bounds is null => remove geometry item from the SearchContext
             */
            if (!bounds) {
                this.remove('geometry', 'bbox');
            }
            else {

                /**
                 * Create the geographical equivalent to the given bounds
                 */
                var geoBounds = M.Map.Util.p2d(bounds.clone()),
                item = {
                    id:"bbox",
                    title:M.Util._("Search Area"),
                    son: [{
                        id:"geometry",
                        title:"geometry",
                        value:M.Map.Util.convert({
                            input:geoBounds,
                            format:"EXTENT",
                            precision:5,
                            limit:true
                        })
                    }
                    ]
                };
                this.add(item);
            }
        };

        /**
         * Set filter to the given value
         *
         * @param <OpenLayers.Bounds> bounds : bounds in map projection
         */
        this.setFilter = function(id, value) {

            /*
             * Search for item corresponding to the filterId in the connector
             */
            for (var i = 0, l = this.connector.filters.length; i < l; i++) {

                /*
                 * Filter matches
                 */
                if (this.connector.filters[i].id === id) {

                    /*
                     * Only "text" type is supported at the moment
                     */
                    if (this.connector.filters[i].type === "text") {

                        /*
                         * Add a newItem
                         */
                        var newItem = {
                            id:this.connector.filters[i].id,
                            title:this.connector.filters[i].title,
                            operator:this.connector.filters[i].operator,
                            value:value
                        };

                        this.add(newItem);
                    }

                    break;
                }
            }

        };
        
        /**
         * Set time interval
         * 
         * @param interval : array of 2 ISO 8601 date
         */
        this.setTime = function(interval) {
            
            var startDate, completionDate, self = this;
            
            /*
             * Set startDate and completionDate
             */
            startDate = self.connector.startDateAlias;
            completionDate = self.connector.completionDateAlias;
            
            /**
             * startDate is null => remove startDate item from the SearchContext
             */
            if (!interval) {
                self.remove(startDate, null);
                self.remove(completionDate, null);
            }
            else {
                if (startDate) {
                    this.add({
                        id:startDate,
                        title:M.Util._("Date"),
                        value:interval[0]
                    });
                }
                if (completionDate) {
                    this.add({
                        id:completionDate,
                        title:M.Util._("Date"),
                        value:interval[1]
                    });
                }
            }
        };
        
        /**
         * Set searchTerms for full text search
         * 
         * @param {String} searchTerms 
         */
        this.setSearchTerms = function(searchTerms) {
            
            /*
             * Set startDate and completionDate
             */
            var searchKey = this.connector.searchKeyAlias ? this.connector.searchKeyAlias : 'q';
            
            /**
             * startDate is null => remove startDate item from the SearchContext
             */
            if (!searchTerms) {
                this.remove(searchKey, null);
            }
            else {
                this.add({
                    id:searchKey,
                    title:M.Util._("searchTerms"),
                    value:searchTerms
                });
            }
        };
        
        /*
         * Return this object
         */
        return this;
    };
    
})(window.M);