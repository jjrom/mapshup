/**
 * Plugin for the "Take5" project
 * See http://take5.ptsc.fr
 * 
 * @author : Jerome Gasperi @ CNES
 * @date   : 2013.04.19
 *  
 * @param {MapshupObject} M
 */
(function(M) {

    M.Plugins.Take5 = function() {

        /*
         * Only one Take5 object instance is created
         */
        if (M.Plugins.Take5._o) {
            return M.Plugins.Take5._o;
        }

        /*
         * Set to true when plugin is initialized
         */
        this.initialized = false;

        /*
         * Sites layer
         */
        this.layer = null;

        /*
         * Site features
         */
        this.features = [];

        /**
         * Init plugin
         * 
         * @param {Object} options
         */
        this.init = function(options) {

            var options, id = M.Util.getId(), self = this;

            /*
             * Init options
             */
            options = options || {};

            $.extend(self, {
                searchService: options.searchService,
                rootUrl: options.rootUrl
            });

            /*
             * Set mapshup logo
             */
            M.$map.append('<div style="position:absolute;bottom:10px;right:30px;z-index:999;"><a href="http://mapshup.info" title="Powered with mapshup" target="_blank"><img src="./img/mapshuplogo.png"/></a></div>');

            /*
             * Set Help and links
             */
            M.Util.$$('#Mheader').append('<div class="links"><ul><li id="' + id + 'a">' + self._("About") + '</li><li><a href="http://ptsc.teledetection.fr" target="_blank">PTSC</a></li></ul></div>');

            $('#' + id + 'a').click(function() {
                if (M.Plugins.Help && M.Plugins.Help._o) {
                    M.Plugins.Help._o.show();
                }
            });
            $('#' + id + 'l').click(function() {
                $('#ptsclink').trigger('click');
            });

            /*
             * Tell user that Take5 initializes
             */
            M.mask.add({
                title: self._("Initializing Take5"),
                cancel: false
            });

            /*
             * Asynchronously retrieve sites description from GeoJSON layer
             */
            self.layer = M.Map.addLayer({
                type: "GeoJSON",
                url: options.sitesUrl + M.Config.i18n.lang,
                title: "Take5 Sites",
                hidden: false,
                clusterized: false,
                color: '#FFFF00',
                opacity: 0,
                unremovable: true,
                featureInfo: {
                    noMenu: true,
                    onSelect: function(f) {
                        if (self.$s) {
                            $('option[value=' + f.attributes.identifier + ']', self.$s).prop('selected', 'selected');
                            self.$s.change();
                        }

                    }
                },
                ol: {
                    displayInLayerSwitcher: false
                }
            });

            /*
             * Set MMI after GeoJSON sites layer had been loaded
             */
            M.Map.events.register("layersend", self, function(action, layer, scope) {

                if (!self.initialized && layer.id === self.layer.id && action === "features") {

                    var id = M.Util.getId(), i, l;

                    /*
                     * Display sites within select form
                     * 
                     * +---------------------------------------------------+
                     * |                                                   |
                     * |  +-------------------container------------------+ |
                     * |  |+------------+ +----------rightCol-----------+| |
                     * |  ||            | |                             || |
                     * |  ||  leftCol   | |   lastql      quickselector || |
                     * |  ||            | |                             || |
                     * |  ||            | |                  download   || |
                     * |  |+------------+ +-----------------------------+| |
                     * |  +----------------------------------------------+ |
                     * |                     copyright                     |
                     * +---------------------------------------------------+
                     * 
                     */
                    $('#Mfooter').html('<div class="container"><div id="leftCol"><form><p class="title">' + self._("Choose a site") + '</p><select id="' + id + '"></select></form><p class="description"></p></div><div id="rightCol"><div id="side1"></div><div id="side2"></div></div></div>');
                    self.$s = $('#' + id);
                    self.$s.append('<option name="---" value="---">---</option>');
                    for (i = 0, l = layer.features.length; i < l; i++) {
                        (function($s, site) {
                            $s.append('<option name="' + site.attributes.identifier + '" value="' + site.attributes.identifier + '">' + site.attributes.title + '</option>');
                        })(self.$s, layer.features[i]);
                    }

                    /*
                     * Select first class by default
                     */
                    $('option:first-child', self.$s).attr("selected", "selected");

                    /*
                     * SelectBoxIt
                     */
                    self.$s.selectBoxIt({
                        aggressiveChange: true
                    });

                    self.$s.change(function() {

                        /*
                         * Get site (i.e. an OpenLayers.Feature)
                         */
                        var site = self.getSite($(':selected', $(this)).attr("name"));
                        if (site) {

                            /*
                             * Select feature on map if not already selected
                             */
                            if (!M.Map.featureInfo.selected || (M.Map.featureInfo.selected && M.Map.featureInfo.selected.id !== site.id)) {
                                M.Map.featureInfo.select(site, true);
                            }
                            else {
                                M.Map.map.zoomToExtent(site.geometry.getBounds());
                                self.showSite(site);
                            }
                        }
                        else {
                            M.Map.setCenter(M.Map.Util.d2p(new OpenLayers.LonLat(0, 40)), 2, true);
                            M.Map.featureInfo.clear();
                            self.clear();
                        }

                    });

                    /*
                     * Copyright
                     */
                    $('#Mfooter').append('<div class="copyright">' + self._("Take 5 project") + ' | <a href="http://www.cnes.fr">CNES</a> - <a href="http://www.cesbio.ups-tlse.fr">Cesbio</a> - <a href="http://www.usgs.gov">USGS</a> | ' + self._("All right reserved") + ' - copyright <a href="http://www.cnes.fr">CNES</a> © ' + (new Date()).getFullYear() + '</div>');

                    /*
                     * Avoid multiple initialization
                     */
                    self.initialized = true;
                    M.mask.hide();

                }

            });

            /*
             * Main quicklook size should be recalculated when widow is resized
             */
            M.Map.events.register("resizeend", self, function(scope) {
                scope.resize();
            });

            return self;

        };

        this.resize = function() {

            /*
             * Avoid quicklook to be outside its container
             */
            $('#lastql').css({
                'max-height': $('#Mfooter').height() - 120,
                'max-width': $('#side1').width() - 20
            });

        };


        /*
         * Get site from identifier
         * 
         * @param {String} identifier
         * @return {OpenLayers.Feature}
         */
        this.getSite = function(identifier) {
            if (identifier && this.layer && this.layer.features) {
                for (var i = 0, l = this.layer.features.length; i < l; i++) {
                    if (this.layer.features[i].attributes.identifier === identifier) {
                        return this.layer.features[i];
                    }
                }
            }
            return null;
        };

        /*
         * Show site description
         * 
         * @param {OpenLayers.Feature} site
         * 
         */
        this.showSite = function(site) {

            var self = this;

            /*
             * Show site description
             */
            $('#leftCol .description').html(site.attributes.description);

            /*
             * Asynchronously retrieve products from site
             */
            M.Util.ajax({
                url: M.Util.proxify(M.Util.getAbsoluteUrl(self.searchService + site.attributes.identifier)),
                async: true,
                dataType: "json",
                success: function(json) {

                    var i, l, id = M.Util.getId();

                    /*
                     * Double check if there are products
                     */
                    if (json.features && json.features.length) {

                        self.features = json.features;

                        l = self.features.length;

                        if (l > 0) {

                            /*
                             * Display products clickable thumbnails
                             * 
                             * +--------+--------+--------+
                             * |        |        |        |
                             * | thumb1 | thumb2 | thumb3 |
                             * |        |        |        |
                             * +--------+--------+--------+
                             * 
                             *           Download
                             *           Download serie
                             */
                            $('#side2').html('<p class="title">' + self._("Available products") + '</p><div class="quickselector"><ul id="' + id + '"></ul></div><div class="center"><a id="' + id + 'd" class="button inline download">&nbsp;&nbsp;' + self._("Download product") + '&nbsp;&nbsp;</a></div></br><div class="center"><a id="' + id + 'da" class="button inline downloadall">&nbsp;&nbsp;' + self._("Download serie") + '&nbsp;&nbsp;</a></div>');

                            for (i = 0; i < l; i++) {

                                self.features[i].id = M.Util.getId();

                                /*
                                 * Activate or not
                                 */
                                (function(feature, $d) {

                                    $d.append('<li id="' + feature.id + '" jtitle="' + self.stripTime(feature.properties.startDate) + '" class="thumbs"><img src="' + feature.properties.thumbnail + '"/></li>');
                                    M.tooltip.add($('#' + feature.id), 's');

                                    /*
                                     * Display Quicklook on click
                                     */
                                    $('#' + feature.id).click(function(e) {

                                        e.preventDefault();
                                        e.stopPropagation();

                                        /*
                                         * Activate/Deactivate 
                                         */
                                        self.activate(feature.id);

                                        /*
                                         * Callback
                                         */
                                        $('#side1').html('<div class="center"><img id="lastql" src="' + feature.properties.quicklook + '"/><p class="title">' + self.stripTime(feature.properties.startDate) + '</p></div>');
                                        self.resize();

                                        return false;
                                    });

                                })(self.features[i], $('#' + id));

                            }

                            /*
                             * Trigger click on newest image
                             */
                            $('#' + self.features[0].id).trigger("click");

                            /*
                             * Set downlad link
                             */
                            $('#' + id + 'd').click(function() {

                                /*
                                 * Get active product
                                 */
                                var href = '#';
                                for (var i = 0, l = self.features.length; i < l; i++) {
                                    if ($('img', $('#' + self.features[i].id)).hasClass('active')) {
                                        href = self.features[i].properties.services.download.url;
                                        break;
                                    }
                                }

                                $(this).attr('target', '_blank').attr('href', href);

                                return true;

                            });
                            
                            /*
                             * Set downladall link
                             */
                            $('#' + id + 'da').click(function() {

                                alert("TODO");
                                return false;

                            });

                        }
                    }
                    /*
                     * Otherwise clear info
                     */
                    else {
                        self.clear();
                    }

                    return true;

                }
            },
            {
                title: self._("Search products")
            }
            );

        };

        /*
         * Activate thumbnail for product identified by identifier
         * 
         * @param {String} identifier
         */
        this.activate = function(identifier) {
            for (var i = 0, l = this.features.length; i < l; i++) {
                $('img', $('#' + this.features[i].id)).removeClass('active');
            }
            $('img', $('#' + identifier)).addClass('active');
        };

        /*
         * Clear MMI
         */
        this.clear = function() {
            $('#side1').empty();
            $('#side2').empty();
        };

        /*
         * Take an ISO 8601 timeStamp (i.e. YYYY-MM-DDTHH:MM:SS)
         * and return simplified date (i.e. YYYY-MM-DD)
         * 
         * @param {String} timeStamp
         */
        this.stripTime = function(timeStamp) {
            if (timeStamp && timeStamp.length > 9) {
                return timeStamp.substr(0, 10);
            }
            return timeStamp;
        };

        /*
         * Translate text
         * 
         * @param {String} text
         */
        this._ = function(text) {
            var texts = [];
            texts["About"] = ["A propos"];
            texts["Initializing Take5"] = ["Take 5 : initialisation"];
            texts["Choose a site"] = ["Sélectionner un site"];
            texts["Available products"] = ["Produits disponibles"];
            texts["Search products"] = ["Recherche de produits"];
            texts["Download product"] = ["Télécharger le produit"];
            texts["Download serie"] = ["Télécharger la série"];
            texts["All right reserved"] = ["Tous droits réservés"];
            texts["Take 5 project"] = ["Projet Take 5"];
            
            if (M.Config.i18n.lang === 'fr') {
                return texts[text] || text;
            }

            return text;

        };

        /*
         * Set unique instance
         */
        M.Plugins.Take5._o = this;

        return this;

    };
})(window.M);