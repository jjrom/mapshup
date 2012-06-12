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
 * Connector for CSW EO catalogs
 *
 *********************************************/
(function (msp){
    
    msp.Plugins.Catalog = msp.Plugins.Catalog || {};
    
    /**
     * One connector should be initialized for each catalog layer within the _msp.searchContext property
     * (i.e. layer["_msp"].searchContext.connector = new Connector(layer, options)
     *
     * @input catalog : catalog layer
     * @input options : options object
     * @input registerCallback : callback function called after connector is successfully registered
     * @input filterCallback : callback function called after filter is successfully updated
     */
    msp.Plugins.Catalog.CSWEO = function(catalog, options, registerCallback, filterCallback) {
        
        /*
         * Options
         */
        this.options = {
            
            /*
             * Mandatory description
             * Description can be updated in config file (see "options")
             */
            description: options.description || "CSW EO OGC 06-131r6 connector",

            /*
             * Mandatory connector url
             * Url can be updated in config file (see "options")
             */
            url: options.url || "/plugins/catalog/CSWEOCatalogProxy.php?"
            
        };
        
        /**
         * Reference to the catalog layer
         */
        this.catalog = catalog;
        
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
            'endPosition':'End of acquisition'
        };
       
        
        /**
         * Add an additional action on featureInfo window
         */
        this.action = {
            tt:"Download Metadata file",
            title:"Metadata",
            icon:"download.png",
            sla:function(a, feature) {
                if (feature && feature["attributes"]) {
                    a.attr("target", "_blank").attr("href", msp.Util.repareUrl(feature.layer["_msp"].layerDescription["url"])+'REQUEST=GetRepositoryItem&id='+feature["attributes"].identifier);
                }
            }
        };
        
        /**
         * Register object
         */
        this.register = function() {
            
            /*
             * Filter on dct:subject
             */
            this.filters.push({
                id:"collection",
                title:msp.Util._("Collection"),
                type:"text"
            });
        
            /*
             * Return true because the registration is synchronous
             */
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
                title:'Product',
                value:'product'
            }
            ];
            
        }
    
    }
})(window.msp);
