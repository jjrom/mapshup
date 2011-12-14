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
 * _msp.searchContext property
 * (i.e. layer["_msp"].searchContext = new msp.plugins["Catalog"].SearchContext(layer,connector,nextRecord,numRecordsPerPage); )
 *
 * @input layer : catalog layer
 * @input connector : catalog connector
 * @input nextRecord : next record value
 * @input numRecordsPerPage : Maximum number of records per page
 * @input btn : msp.Button to store search results
 * @input callback : function to call after a successfull search
 * @input scope : scope of the callback function
 *
 */
(function(msp) {
    
    msp.Map.SearchContext = function(layer, connector, nextRecord, numRecordsPerPage, btn, callback, scope) {

        /**
         * Layer reference
         */
        this.layer = layer;

        /**
         * Next record value
         */
        this.nextRecord = nextRecord || 1;

        /**
         * Maximum number of records per page
         */
        this.numRecordsPerPage = numRecordsPerPage || 20;

        /**
         * Maximum number of results for this search context
         */
        this.totalResults = 0;

        /**
         * Connector reference
         */
        this.connector = connector;

        /**
         * Set catalog endPoint url (i.e. search url)
         */
        this.catalogUrl = msp.Util.getAbsoluteUrl(msp.Util.repareUrl(layer["_msp"].layerDescription.url));

        /**
         * msp.Button attached to the search results
         */
        this.btn = btn;

        /**
         * Callback function to be called when search is successfully performed
         */
        this.callback = callback;

        /**
         * Scope for the Callback function
         */
        this.scope = scope;

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
         * @input newItem
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
                                return true;
                            }
                        }

                        /*
                         * newItem son was not defined => add it
                         */
                        item.son.push(newItem.son[0]);
                    }

                    return true;
                }
            }

            /*
             * newItem was not already defined (i.e. not in the items array)
             * => add it to items array
             */
            this.items.push(newItem);

            return true;
        };

        /**
         * Clear the search context
         */
        this.clear = function() {
            this.items = [];
        };

        /**
         * Return the items array as an HTTP GET key/value pairs string
         */
        this.getSerializedParams = function() {

            /*
             * Initialize serializedParams string
             */
            var serializedParams = "numRecordsPerPage=" + this.numRecordsPerPage;

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++) {

                /*
                 * New key/value pair for item[i]
                 */
                serializedParams += "&" + escape(this.items[i].id) + "=";

                /*
                 * Value is defined at item level
                 */
                if (this.items[i].value !== undefined) {
                    serializedParams += escape(this.items[i].value);
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
                        serializedParams += escape(this.items[i].son[j].value);
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
            return this.search(null, p);
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
            return this.search(null, p);

        };

        /**
         * Remove item 'id' or 'fatherId->id' from items list
         *
         * If fatherId is null then it is assumes that 'id' is already
         * at father level
         */
        this.remove = function(id, fatherId) {

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++){

                /*
                 * fatherId is null means that 'id' is a father
                 */
                if (fatherId === null) {

                    /*
                     * id is found
                     */
                    if (id === this.items[i].id) {

                        /*
                         * Remove item id from items list
                         */
                        this.items.splice(i,1);

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
                    if (fatherId === this.items[i].id) {

                        /*
                         * Roll over each father's son(s)
                         */
                        var m = this.items[i].son.length;
                        for (var j = 0; j < m; j++) {

                            /*
                             * son "id" is found
                             */
                            if (id === this.items[i].son[j].id) {

                                /*
                                 * Remove the son from sons
                                 */
                                this.items[i].son.splice(j,1);

                                /*
                                 * If there is no more son, remove the son array
                                 */
                                if (this.items[i].son.length === 0) {
                                    this.items.splice(i,1);
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
         * @input <OpenLayers.Bounds> bounds : search within the given bounds (optional)
         * @input <int> nextRecord : nextRecord to search (optional)
         */
        this.search = function(bounds, nextRecord) {

            var key,
                extras = "",
                layer = this.layer,
                self = this;

            /*
             * Set nextRecord
             */
            nextRecord = nextRecord || 1;

            /**
             * Set bbox filter to the given bounds
             */
            if (bounds) {
                this.setBBOX(bounds);
            }

            /*
             * Set extras parameters
             */
            if (layer["_msp"] && layer["_msp"].layerDescription.extras) {
                for (key in layer["_msp"].layerDescription.extras) {
                    extras += "&"+key+"="+layer["_msp"].layerDescription.extras[key];
                }
            }

            /**
             * Launch an asynchronous search
             * The result is a GeoJSON object
             */
            msp.Util.ajax({
                url:msp.Util.proxify(this.connector.searchUrl + this.getSerializedParams() + "&nextRecord=" + nextRecord + extras),
                async:true,
                dataType:"json",
                success: function(data) {

                    /*
                     * First check if there is no error
                     * Otherwise, display results
                     */
                    if (data.error) {
                        msp.Util.message(layer.name + " : " + data.error["message"], -1);
                    }
                    else {

                        /*
                         * Set nextRecord new value
                         */
                        layer["_msp"].searchContext.nextRecord = nextRecord;

                        /*
                         * Update the totalResults value
                         */
                        layer["_msp"].searchContext.totalResults = data.totalResults || 0;

                        /*
                         * Clean layer
                         */
                        layer.destroyFeatures();

                        /*
                         * Process the GeoJSON result
                         *
                         * Note: result is in EPSG:4326
                         */
                        var features = new OpenLayers.Format.GeoJSON({
                            internalProjection:msp.Map.map.projection,
                            externalProjection:msp.Map.epsg4326
                        }).read(data);

                        /*
                         * Be kind with users !
                         */
                        if (!features || features.length === 0) {
                            msp.Util.message(msp.Util._(layer.name) + " : " + msp.Util._("No results"));
                        }
                        else {
                            
                            layer.addFeatures(features);
                            
                            /*
                             * Zoom on layer extent
                             */
                            msp.Map.Util.zoomOnAfterLoad(layer);
                            
                            /*
                             * Show layer if it is hidden
                             */
                            if (!layer.visibility) {
                                msp.Map.Util.setVisibility(layer, true);
                            }

                        }

                        /*
                         * See msp.Map.loadContext for explanation
                         */
                        layer["_msp"].zoomOnAfterLoad = true;

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
                title:msp.Util._("Searching") + " : " + msp.Util._(this.layer.name),
                cancel:true
            });

            return true;

        };

        /**
         * Set the boox to the given bounds
         *
         * @input <OpenLayers.Bounds> bounds : bounds in map projection
         */
        this.setBBOX = function(bounds){

            /**
             * bounds is null => remove geometry item from the SearchContext
             */
            if (!bounds) {
                this.remove('bbox', 'geometry');
            }
            else {

                /**
                 * Create the geographical equivalent to the given bounds
                 */
                var geoBounds = msp.Map.Util.p2d(bounds.clone()),
                    item = {
                    id:"bbox",
                    title:msp.Util._("Search Area"),
                    son: [{
                        id:"geometry",
                        title:msp.Map.Util.convert({
                            input:geoBounds,
                            format:"WKT",
                            precision:5
                        }),
                        value:msp.Map.Util.convert({
                            input:geoBounds,
                            format:"EXTENT",
                            precision:5
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
         * @input <OpenLayers.Bounds> bounds : bounds in map projection
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

        }

    };
    
})(window.msp);