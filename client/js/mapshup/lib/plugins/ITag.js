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

            var $t, element, self = this;
            
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
             * Create #iTag element
             * 
             * <div id="iTag" class="shadow">
             *      <div class="container">
             *          <table>
             *              <tr>
             *                  <td class='title'>icon + title</td>
             *                  <td>slider</td>
             *                  <td class='value'>percentage</td>
             *                  <td class='clear'></td>
             *              </tr>
             *          </table>
             *      
             *      </div>
             * </div>
             */
            self.$d = msp.Util.$$('#iTag', $('#mwrapper')).addClass('shadow').html('<div class="container"><table><tr></tr></table></div>');
            
            /*
             * Insert iTag panel between theBar and map
             * and remove #theBar shadow
             */
            $('.map').css({
               'top':$('.map').offset().top + self.$d.height()
            });
            
            $t = $('#timeLine');
            if ($t.length > 0) {
                $t.css({
                   'top':$t.offset().top + self.$d.height()
                });
            }
            msp.$header.removeClass('shadow');
            
            /*
             * Roll over classes
             */
            for (element in self.options.elements) {
                
                /*
                 * Add slider for element
                 */
                (function(id, e, $d) {
                    
                    var v, bounds = e.bounds || {};
                    
                    
                    $('tr', $d).append('<td id="'+id+'r" class="title">'+(e.icon ? '<img class="icon" src="'+e.icon+'"/>&nbsp;' : '') + e.title + '<td><div id="'+id+'" class="element"></div></td><td id="'+id+'v" class="value" jtitle="Search without '+e.title+'"></td><td class="clear"></td>')
                    
                    $("#"+id).slider({
                        range: "min",
                        value: e.value || self.options.value,
                        min: bounds.min || self.options.bounds.min,
                        max: bounds.max || self.options.bounds.max,
                        slide: function(event, ui) {
                            $("#"+id+"v").html("&nbsp;" + ui.value + "%");
                            ui.value === 0 ? $("#"+id+"v").removeClass("hilited") : $("#"+id+"v").addClass("hilited");
                        },
                        stop: function(event, ui) {
                            
                            $("#"+id).removeClass("inactive");
                            
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
                            
                            return true;
                        }
                    });
                    
                    /*
                     * Deactivate class on click
                     */
                    $('#'+id+'v').click(function(){
                        $("#"+id).addClass("inactive");
                        $(this).html("&nbsp;---");
                        self.values[e.key] = -1;
                        self.search();
                    });
                    msp.tooltip.add($('#'+id+'v'), "n");
                    
                    /*
                     * Set original value
                     */
                    v = $("#"+id).slider("value");
                    $("#"+id+"v").html("&nbsp;" + v + "%");
                    v === 0 ? $("#"+id+"v").removeClass("hilited") : $("#"+id+"v").addClass("hilited");
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