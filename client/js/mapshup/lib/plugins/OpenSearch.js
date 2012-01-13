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
 * Plugin: OpenSearch
 * 
 * Add support for OpenSearch feeds
 * OpenSearch plugin is activated through a
 * msp.Button and displayed within a msp.Panel
 * 
 *********************************************/
(function(msp) {
    
    msp.Plugins.OpenSearch = function() {
        
        /*
         * Only one CountryPicker object instance is created
         */
        if (msp.Plugins.OpenSearch._o) {
            return msp.Plugins.OpenSearch._o;
        }
        
        this.lastSearch = "";

        this.regExp = {
            all:(/\{(\w|:)+\??\}/g),
            trimCurly:(/(^\{|\??\}$)/g),
            searchTerms:(/\{searchTerms\}/g),
            bbox:(/\{geo:box\??\}/g)
        };

        /**
         * Search toolbar reference
         */
        this.stb = null;
        
        /**
         * Initialize plugin
         */
        this.init = function(options) {

            var d,
                i,
                l,
                pn,
                $s,
                tb,
                id = msp.Util.getId(),
                self = this;
            
            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set default options
             */
            $.extend(self.options,
            {
                position:self.options.position || 'ne',
                orientation:self.options.orientation || 'v',
                descriptions:self.options.descriptions || [],
                title:self.options.title || "Search for media"
            }
            );

            /*
             * Register CountryPicker action within NorthEast Toolbar triggering East panel 
             */
            tb = new msp.Toolbar(self.options.position, self.options.orientation);
            pn = new msp.Panel('e',{tb:tb});
            self.btn = new msp.Button({
                tb:tb,
                icon:"opensearch.png",
                tt:self.options.title,
                /*
                 * Set the panel container content with the following html structure
                 * 
                 * <div id="...">
                 *      <div class="header"></div>
                 *      <div class="search block"></div>
                 *      <div class="result block expdbl">
                 *          
                 *      </div>
                 * </div>
                 */
                container:pn.add('<div class="header">'+msp.Util._("Search for media")+'</div><div class="search block"></div><div class="rtitle block">'+msp.Util._("No result")+'</div><div class="result block expdbl jstfy"></div>'), //  AddLayer plugin is displayed within an East msp.Panel
                activable:true,
                scope:self
            });
            
            /*
             * Get search ($s) and result ($r) jquery object references
             */
            $s = $('.search', self.btn.container.$d);
            self.$r = $('.result', self.btn.container.$d);
            self.$t = $('.rtitle', self.btn.container.$d);
            
            /*
             * Create OpenSearch feed toolbar
             */
            self.stb = new msp.Toolbar('fr', 'h', $s);
            
            /*
             * Add the input text box
             */
            $s.append('<br/><input id="'+id+'" type="text"/>');
            
            /*
             * Set default value if defined
             * Input value is encoded to avoid javascript code injection
             */
            //self.$input = $('#'+id).watermark(msp.Util._("Search")+"...").autocomplete("test");
            self.$input = $('#'+id).watermark(msp.Util._("Search")+"...");
            
            /*
             * Add search actions
             */
            self.$input.keypress(function(event) {
                if (event.keyCode === 13) {
                    return self.search();
                }
            });
            
            /*
             * Add an OpenLayers layer for each opensearch.xml description
             */
            self.strategies = [];
            for (i = 0, l = self.options.descriptions.length; i < l ;i++){
                d = self.options.descriptions[i];
                d.url = msp.Util.getAbsoluteUrl(d.url)
                self.strategies[i] = new OpenLayers.Strategy.OpenSearch({
                    descriptionurl: d.url,
                    mspDescription:d,
                    autoActivate:false
                });
                self.strategies[i].events.on({
                    "descriptionloadend": self.addSearchEngine,
                    scope:self
                });
            }

            /*
             * Create the Opensearch result layer.
             * This layer is unremovable
             */
            self.layer = new OpenLayers.Layer.Vector("OpenSearchTmpResult", {
                strategies:self.strategies,
                displayInLayerSwitcher:false
            });

            self.layer.events.on({
                "loadstart": function(e){
                    self.onResultsLoadstart(self,e);
                },
                "loadend": function(e){
                    self.onResultsLoadend(self, e);
                },
                scope:self
            });

            /**
             * Add new layer to Map
             */
            msp.Map.addLayer({
                type:"Generic",
                title:self.layer.name,
                selectable:true,
                unremovable:true,
                initialLayer:true,
                layer:self.layer
            });

            
            return this;

        };
        
        /**
         * Add a search engine
         */
        this.addSearchEngine = function(engine) {
            
            var self = this;
            
            /*
             * Description is defined
             */
            if(engine.description) {

                /*
                 * Add a new button to Search toolbar
                 */
                new msp.Button({
                    tb:self.stb,
                    tt:engine.description.name,
                    switchable:false,
                    icon:engine.description.icon,
                    /*title:msp.Util._(engine.description.name).substring(0,1),*/
                    activable:true,
                    callback:function() {
                        self.selectSearchEngine(engine.url);
                    }
                }).activate(true);
             
                self.selectSearchEngine(engine.url);
            }
            
        },

        /*
         * Method: selectSearchEngine
         */
        this.selectSearchEngine = function(url) {

            var i,
                l,
                strategy,
                self = this;

            for (i = 0, l = self.strategies.length; i < l; i++) {
                strategy = self.strategies[i];

                if (strategy.descriptionurl === url) {
                    strategy.activate();
                    self.activeStrategy = strategy;
                }
                else {
                    strategy.deactivate();
                }
            }
            
            /*
             * Firefox bug with watermark ?
             */
            if(self.$input.val().length > 1 && self.$input.val() != msp.Util._("Search")+"...") {
                self.search();
            }
        };

        /**
         * Method: search
         */
        this.search = function() {

            /*
             * Avoid XSS vulnerability
             */
            this.$input.val(msp.Util.htmlEntitiesEncode(this.$input.val()));

            for (var i = 0, l = this.strategies.length; i < l; i++) {
                this.strategies[i].setSearchTerms(this.format(this.$input.val()));
            }
            return false;
        };

        /**
         * Method: onResultsLoadstart
         */
        this.onResultsLoadstart = function(scope, event) {

            var searchTerms = scope.activeStrategy.searchParams["searchTerms"] || "",
                bbox = scope.activeStrategy.searchParams["geo:box"] || "-180,-90,180,90",
                searchUrl = scope.activeStrategy.URLTemplate,
                logger = msp.plugins["Logger"];
                
            searchUrl = searchUrl.replace(scope.regExp.searchTerms,searchTerms);
            searchUrl = searchUrl.replace(scope.regExp.bbox,bbox);
            searchUrl = searchUrl.replace(scope.regExp.all,"");
            if (logger) {
                logger.log({
                     bbox:bbox,
                     searchservice:scope.activeStrategy.description.name,
                     searchterms:searchTerms,
                     searchurl:encodeURIComponent(searchUrl)
                });
            }
                
            /**
             * Add a request to the mask
             */
            msp.mask.add({
                title:msp.Util._(scope.activeStrategy.description.name)+' : '+msp.Util._("Searching")+" "+ scope.$input.val(),
                cancel:true
            });

        };

        /**
         * Method: onResultsLoadend
         */
        this.onResultsLoadend = function(scope, event) {

            /**
             * Feature description rendering depend on feature type
             */
            var type = scope.activeStrategy["mspDescription"].layerType;

            /*
             * Hide search mask
             */
            msp.mask.hide();

            /**
             * Clean result div
             */
            scope.$r.empty();

            /**
             * Initialize totalPages and currentPage
             */
            scope.totalPages = 0;
            scope.currentPage = 0;

            /**
             * Roll over features
             */
            if (scope.layer.features.length !== 0) {

                /*
                 * Update header with number of results and actions (add, previous and next)
                 */
                var i,
                    l,
                    _id = msp.Util.getId();

                scope.$t.html('<p>' + scope.layer.features.length + " " + msp.Util._("results") + ' - <a href="#" id="'+_id+'" class="hover">'+msp.Util._("Add to map")+'</p>');

                $('#'+_id).click(function(){
                    scope.addLayer();
                    return false;
                });

                /**
                 * Only display maxResults features
                 */
                for (i = 0, l = scope.layer.features.length; i < l; i++) {
                    scope.addResult(scope.layer.features[i], type);
                }

                /*
                 * Show results
                 */
                msp.Map.Util.setVisibility(scope.layer, true);

            }
            else {
                msp.Util.message(msp.Util._("No results"));
            }

        };

        /**
         * Method: renderFeatureAttributes
         */
        this.addResult = function(feature, type) {

            /*
             * Unique identifier (encoded to avoid special chars problems)
             */
            var id = msp.Util.encode(feature.id),
                description = "",
                txt,
                selector,
                attribute,
                lis,
                j,
                l;

            /**
             * Feature description rendering depend on feature type
             */
            if (type && $.isFunction(msp.Map.layerTypes[type].appendOpenSearchDescription)) {
                msp.Map.layerTypes[type].appendOpenSearchDescription(feature, id, this.$r);
            }
            else {
                for (attribute in feature.attributes) {
                    if (attribute === "name") {
                        this.$r.append('<div class="title"><a href="#" id="os'+id+'"><b>'+feature.attributes[attribute] + '</b></a><br/>');
                        (function(id, feature) {
                            $('#os'+id).click(function() {
                                msp.Map.zoomTo(feature.geometry.getBounds());
                            });
                        })(id, feature);
                    }
                    else if (attribute === "description") {

                        /**
                         * Replace unwanted <ul><li>...</li></ul> structure
                         * with <br/>.
                         */
                        txt = "";
                        selector = null;
                        
                        try {
                            selector = $(feature.attributes[attribute]);
                        }
                        catch (e) {}
                        if (selector) {
                            lis = $('li',$(feature.attributes[attribute]));
                            for (j = 0, l = lis.length; j < l; j++) {
                                txt += $(lis[j]).text()+"<br/>";
                            }
                        }

                        if (txt === "") {
                            txt = feature.attributes[attribute];
                        }
                        description += txt;
                    }
                    else {
                        description += msp.Util._(attribute) + " : " + feature.attributes[attribute] + '<br/>';
                    }
                }

                this.$r.append('<div class="description">'+description+'</div>');
            }
        };

        /**
         * Add a new layer with current features
         */
        this.addLayer = function() {

            var newLayer,
                self = this;

            /**
             * Add new layer to Map
             *
             * Special case for Youtube and Flickr
             */
            if (self.activeStrategy["mspDescription"].layerType) {
                newLayer = msp.Map.addLayer({
                    type: self.activeStrategy["mspDescription"].layerType,
                    title:self.$input.val(),
                    q:self.$input.val(),
                    bbox:self.activeStrategy.searchParams["geo:box"] || "-180,-90,180,90"
                }, true);
            }
            else {
                newLayer = msp.Map.addLayer({
                    type:"OpenSearch",
                    url:self.activeStrategy.descriptionurl,
                    title:self.$input.val(),
                    q:self.$input.val()
                },true);
            }

            /*
             * Clean OpenSearch layer
             */
            if (newLayer) {
                self.layer.destroyFeatures();
                msp.Map.Util.setVisibility(self.layer, false);
            }

        };

        /**
         * Take input search string then remove multiple white spaces between keywords
         * and replace it with a comma
         */
        this.format = function(str) {
            return str.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/\s+/g,',').replace(/,+/g,',');
        }

        /*
         * Set unique instance
         */
        msp.Plugins.OpenSearch._o = this;
        
        return this;
        
    };
})(window.msp);