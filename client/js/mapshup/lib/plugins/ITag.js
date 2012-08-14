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
 * Plugin iTag
 *
 * Image tagging search
 * 
 * iTag classification from glc2000
 *   100=>Artificial (22)
 *   200=>Cultivated (15 + 16 + 17 + 18)
 *   310=>Forests (1 + 2 + 3 + 4 + 5 + 6)
 *   320=>Herbaceous (9 + 11 + 12 + 13)
 *   330=>Deserts (10 + 14 + 19)
 *   335=>Snow and ice (21)
 *   400=>Flooded (7 + 8)
 *   500=>Water (20);
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.ITag = function() {
        
        /*
         * Only one ITag object instance is created
         */
        if (msp.Plugins.ITag._o) {
            return msp.Plugins.ITag._o;
        }
        
        /*
         * Hash tag containing value
         */
        this.values = [];
        
        /*
         * Initialization
         */
        this.init = function (options) {

            var element, self = this;
            
            /*
             * init options
             */
            self.options = options || {};

            $.extend(self.options,{
                url:options.url || null,
                elements:options.elements || [],
                bounds:options.bounds || {
                    min:0, 
                    max:100
                },
                value:msp.Util.getPropertyValue(options, "value", 0)
            });
            
            /*
             * If url is not defined, the plugin is not loaded
             */
            if (!self.options.url) {
                return null;
            }
            
            /*
             * Add iTag panel
             */
            //self.$d = msp.Util.$$('#iTag', msp.$mcontainer);
            self.$d = msp.Util.$$('#iTag');
            
            /*
             * Roll over classes
             */
            for (element in self.options.elements) {
                
                /*
                 * Add slider for element
                 */
                (function(id, e, $d) {
                    var v, style = "", classes = "", bounds;
                    bounds = e.bounds || {};
                    
                    /*
                     * Set image as slider background
                     */
                    if (e.image) {
                        style = "background-image:url('"+e.image+"')";
                        classes = 'class="image"';
                    }
                    
                    $d.append('<div style="'+style+'" ' + classes + '>' + e.title + ' <span id="'+id+'v"/></span></div><div id="'+id+'" class="element"></div>')
                    $("#"+id).slider({
                        range: "min",
                        value: e.value || self.options.value,
                        min: bounds.min || self.options.bounds.min,
                        max: bounds.max || self.options.bounds.max,
                        slide: function(event, ui) {
                            $("#"+id+"v").html(ui.value === 0 ? "not set" : "&gt; " + ui.value + "%");
                        },
                        stop: function(event, ui) {
                            
                            /*
                             * Store value 
                             */
                            if (ui.value === 0) {
                                delete self.values[e.key];
                            }
                            else {
                                self.values[e.key] = ui.value;
                            }
                            self.search();
                        }
                    });
                
                    /*
                     * Set original value
                     */
                    v = $("#"+id).slider("value");
                    $("#"+id+"v").html(v === 0 ? " not set" : " &gt; " + v + "%");
                    if (v === 0) {
                        delete self.values[e.key];
                    }
                    else {
                        self.values[e.key] = v;
                    }
                    
                })(msp.Util.getId(), self.options.elements[element], self.$d);
	
            }
            
            return self;
            
        };
        
        /*
         * Launch search
         */
        this.search = function() {
        
            var key, sp, service, params = "", self = this;
            
            /*
             * No Search plugin, no iTag
             */
            if (!msp.Plugins.Search) {
                return false;
            }
            
            /*
             * Get Search plugin instance
             */            
            sp = msp.Plugins.Search._o;
            if (!sp) {
                return false;
            }
            
            /*
             * Get service
             */
            service = sp.services[self.options.url];
            if (!service) {
                return false;
            }
            
            /*
             * Set additional parameters
             */
            for (key in self.values) {
                params += "&"+key+"="+self.values[key];
            };
            
            /*
             * Reset Search input value
             */
            sp.$input.val("");
            
            sp.search(service, {
                title:"iTag",
                params:params || "&" // params should always differs from "" to launch search
            });
            
            return true;
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.ITag._o = this;
        
        return this;
    };
})(window.msp);