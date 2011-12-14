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
 * Connector for CSW EO Charter catalog
 *
 *********************************************/
(function (msp){
    
    msp.Plugins.Catalog = msp.Plugins.Catalog || {};
    
    /**
     * Connector object
     * One connector should be initialized for each catalog layer within the _msp.searchContext property
     * (i.e. layer["_msp"].searchContext.connector = new Connector(layer, options)
     *
     * @input catalog : catalog layer
     * @input options : options object
     * @input registerCallback : callback function called after connector is successfully registered
     * @input filterCallback : callback function called after filter is successfully updated
     */
    msp.Plugins.Catalog.CSWEOCharter = function(catalog, options, registerCallback, filterCallback) {

        /**
         * Reference to the catalog layer
         */
        this.catalog = catalog;

        /**
         * Reference to register callback function
         */
        this.registerCallback = registerCallback;

        /**
         * Reference to filter callback function
         */
        this.filterCallback = filterCallback;   
            
        /*
         * Initialize options
         */
        this.options = {

            /*
             * Mandatory description
             * Description can be updated in config file (see "options")
             */
            description: options.description || "International Charter catalog connector",

            /*
             * Mandatory connector url
             * Url can be updated in config file (see "options")
             */
            url: options.url || "/plugins/catalog/CSWEOCharterCatalogProxy.php?",

            /*
             * Slot combo proxy url
             * Can be updated in config file (see "option")
             */
            slotComboProxyServiceUrl: options.slotComboProxyServiceUrl || "http://www.disasterschartercatalog.org/cecec/scripts/connectors/cecec/DisastersCharter_SlotComboProxy.php?action="
        };
        
        /**
         * Array of available search filters
         */
        this.filters = [];

        /**
         * Metadata translation HasMap
         * Contains key,value association with
         *  - key : metadata property name
         *  - value : metadata "human readable" name in english language
         */
        this.metadataTranslator = {
            'product':'Product',
            'identifier':'Identifier',
            'productType':'Product Type',
            'beginPosition':'Start of acquisition',
            'endPosition':'End of acquisition',
            'disaster':'Disaster',
            'location':'Location',
            'disasterdate':'Disaster Date',
            'disastertype':'Disaster Type',
            'triggeringidentifier':'Call ID',
            'description':'Description'
        };

        /*
         * Called by Catalog plugins to register
         * a CSWEOCharter catalog
         */
        this.register = function() {

            /**
             * Add a reference to this object for ajax calls
             */
            var self = this;

            /**
             * Already registered ? Skip
             */
            if (this.isRegistered) {
                return false;
            }

            /*
             * Filter on disaster date
             */
            this.filters.push({
                id:"disasterStartDate",
                title:msp.Util._("Disaster Date"),
                type:"date"
            });

            /*
             * Filter on disaster CALL_ID
             */
            this.filters.push({
                id:"disasterCallId",
                title:msp.Util._("Call ID"),
                type:"text"
            });

            /*
             * Asynchronous retrieve of disasterType
             */
            $.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(this.options.slotComboProxyServiceUrl)+"getDisastersTypes"),
                dataType:"json",
                success:function(result){

                    if (result) {
                        /*
                         * Paranoid mode
                         */
                        result.data = result.data || [];

                        /*
                         * Insert an empty disasterType filter
                         */
                        var filter = {
                            id:"disasterType",
                            title:msp.Util._("Disaster Type"),
                            type:"enumeration",
                            son:[]
                        }

                        /*
                         * Roll over items
                         */
                        for (var i = 0, l = result.data.length; i < l; i++){
                            if(result.data[i].value !== "---"){
                                filter.son.push({
                                    id:"disasterType|"+result.data[i].value,
                                    value:result.data[i].value,
                                    title:result.data[i].name
                                })
                            }
                        }

                        /*
                         * Add new filter
                         */
                        self.filters.push(filter);

                        /*
                         * Refresh tab for this connector catalog
                         */
                        if (self.filterCallback) {
                            self.filterCallback(self.catalog);
                        }
                    }

                },
                error:function(e) {
                // TODO
                }
            });

            /*
             * Asynchronous retrieve of disasterType
             */
            $.ajax({
                url:msp.Util.proxify(msp.Util.getAbsoluteUrl(this.options.slotComboProxyServiceUrl)+"getSatelliteNames"),
                dataType:"json",
                success:function(result){

                    if (result) {

                        /*
                         * Paranoid mode
                         */
                        result.data = result.data || [];

                        /*
                         * Roll over items
                         */
                        var totpop = 0;
                        var filter = {
                            id:"satelliteName",
                            title:msp.Util._("Satellite name"),
                            type:"enumeration",
                            son:[]
                        }
                        for (var i = 0, l = result.data.length; i < l; i++){
                            totpop += parseInt(result.data[i].population, 10);
                            if(result.data[i].value !== "---"){
                                filter.son.push({
                                    id:"satelliteName|"+result.data[i].name,
                                    population:result.data[i].population,
                                    value:result.data[i].name+"_@_",
                                    title:result.data[i].name
                                })
                            }
                        }

                        /*
                         * Total population
                         */
                        filter.population = totpop;

                        /*
                         * Add new filter
                         */
                        self.filters.push(filter);

                        /*
                         * Refresh tab for this connector catalog
                         */
                        if (self.filterCallback) {
                            self.filterCallback(self.catalog);
                        }
                    }
                },
                error:function(e) {
                // TODO
                }
            });

            return true;
        };

        /*
         * Return an array of the attributes to
         * present in the brief view
         * title is the name of the column to display
         * value is the name of the feature attributes
         */
        this.getBriefAttributes = function() {
            return [
            {
                title:'Preview',
                value:'thumbnail'
            },
            {
                title:'Identifier',
                value:'identifier'
            },
            {
                title:'Call ID',
                value:'triggeringidentifier'
            }
            ];

        }
    };
})(window.msp);