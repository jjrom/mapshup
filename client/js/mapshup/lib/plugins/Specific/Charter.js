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
 * Plugin for the "International Charter Space And Major Disasters" catalog
 *      See http://www.disasterschartercatalog.org
 * 
 * Jerome Gasperi - CNES
 */
(function(M) {

    M.Plugins.Charter = function() {

        /*
         * Only one Spirit object instance is created
         */
        if (M.Plugins.Charter._o) {
            return M.Plugins.Charter._o;
        }

        /**
         * Init plugin
         */
        this.init = function(options) {

            var items, i, l, $d;

            /*
             * Init options
             */
            this.options = options || {};

            $('#Mfooter').append('<table><tr></tr></table>');

            /*
             * Items
             */
            items = [
                {
                    name: "Show all",
                    key: "ALL",
                    color: "#666"
                },
                {
                    name: "Cyclone",
                    key: "CYCLONE",
                    color: "#B0E0E6"
                },
                {
                    name: "Earthquakes",
                    key: "EARTHQUAKE",
                    color: "#DAA520"
                },
                {
                    name: "Floods",
                    key: "FLOOD",
                    color: "#1E90FF"
                },
                {
                    name: "Forest fires",
                    key: "FIRE",
                    color: "#FF0000"
                },
                {
                    name: "Landslides",
                    key: "LANDSLIDE",
                    color: "#800000"
                },
                {
                    name: "Oil spills",
                    key: "OIL_SPILL",
                    color: "#2F4F4F"
                },
                {
                    name: "Others",
                    key: "OTHER",
                    color: "#9ACD32"
                },
                {
                    name: "Volcanic eruptions",
                    key: "VOLCANIC_ERUPTION",
                    color: "#FF4500"
                }
            ];

            $d = $('tr', $('#Mfooter'));
            
            var searchPlugin = M.Plugins.Search._o;
            
            for (i = 0, l = items.length; i < l; i++) {
                (function(item, id) {
                    $d.append('<td id="' + id + '" style="background-color:' + item.color + '">' + M.Util._(item.name) + '</td>');
                    $('#' + id).click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Unselect feature
                        M.Map.featureInfo.clear();
                        
                        // Launch search on disaster type
                        searchPlugin.search(searchPlugin.services[options.service], {searchTerms:"type="+item.key});
                        
                        return false;
                    });

                })(items[i], M.Util.getId());
            }

            return this;

        };

        /*
         * Set unique instance
         */
        M.Plugins.Charter._o = this;

        return this;

    };
})(window.M);