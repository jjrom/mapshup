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
 * mapshup TimeLIne object
 */
(function(M) {
    
    
    /*
     * @param {Object} options : timeLine options
     *                   {
     *                      enable://true to enable timeLine, false otherwise
     *                      position:{
     *                          top: // in pixels (not set if bottom is set)
     *                          bottom: // in pixels (not set if bottom is set)
     *                      },
     *                      absolutes:{
     *                          min:// TimeLine minimum year selectable
     *                          max:// TimeLine maximum year selectable
     *                      },
     *                      bounds:{
     *                          min:// TimeLine displayed start date
     *                          max:// TimeLine displayed end date
     *                      },
     *                      values:{
     *                          min:// Selected start date for interval
     *                          max:// Selected end date for interval
     *                      }
     *                   }
     */
    M.TimeLine = function(options) {
        
        /*
         * Only one TimeLine object instance is created
         */
        if (M.TimeLine._o) {
            return M.TimeLine._o;
        }
        
        /*
         * True if initialized
         */
        this.isLoaded = false;
        
        /*
         * Registered items
         * Structure :
         * {
         *      sync://boolean true if layer is synchronised 
         *      layer: // layer reference
         * }
         */
        this.items = [];
        
        /*
         * True to enable time slider. False otherwise
         */
        this.enabled = true;
        
        /*
         * True to automatically refresh all registered layers
         * when dates change
         */
        this.autoRefresh = true;
        
        /*
         * Initial width of toolbar
         */
        this._tw = 0;
        
        /*
         * Initialize TimeLine 
         * TimeLine is located immediatly below mapshup header
         * 
         * @param {Object} options : timeLine options
         *                   {
         *                      enable://true to enable timeLine, false otherwise
         *                      disablable://true to allow user to disable timeline
         *                      position: // top or bottom
         *                      absolutes:{
         *                          min:// TimeLine minimum year selectable
         *                          max:// TimeLine maximum year selectable
         *                          editable:// True to allow user to modify values; false otherwise
         *                      },
         *                      bounds:{
         *                          min:// TimeLine displayed start date
         *                          max:// TimeLine displayed end date
         *                      },
         *                      values:{
         *                          min:// Selected start date for interval
         *                          max:// Selected end date for interval
         *                          editable:// True to allow user to modify values; false otherwise
         *                      }
         *                   }
         */
        this.init = function(options) {
            
            var self = this;
            
            options = options || {};
            
            /*
             * No timeLine
             */
            if (!options.enable) {
                self.enabled = false;
                return false;
            }
        
            /*
             * Set absolutes values
             */
            self.absolutes = options.absolutes || {
                min:1990,
                max:(new Date()).getFullYear() + 1
            };
            
            /*
             * Position
             */
            self.position = options.position || {
                top:0
            };
            
            $.extend(options, {
                disablable:M.Util.getPropertyValue(options, "disablable", false),
                bounds:options.bounds || {
                    min:new Date(2000,0,1),
                    max:new Date()
                },
                values:options.values || {
                    min:new Date(2011,0,1),
                    max:new Date()
                }
            });
            
            /*
             * Create timeLine object
             * 
             * <div id="timeLine">
             *      <div class="timeLine"></div>
             *      <div class="tools"></div>
             * </div>
             * 
             */
            self.$d = M.Util.$$('#timeLine', $('#mwrapper')).html('<div class="timeLine"></div><div class="mask"><h2>'+M.Util._("Date filter disabled")+'</h2>('+M.Util._("Click to enable")+')</div>');
            
            /*
             * Create actions Toolbar
             */
            self.tb = new M.Toolbar({
                parent:self.$d, 
                classes:'tools'
            });
            
            if (self.absolutes.editable) {
                self.tb.add({
                    id:M.Util.getId(),
                    icon:M.Util.getImgUrl("clock.png"),
                    tt:M.Util._("Set time line bounds"),
                    onoff:false,
                    onactivate:function() {
                        self.changeBounds();
                    }
                });
                self._tw += 90;
            }
            
            if (options.values.editable) {
                self.tb.add({
                    id:M.Util.getId(),
                    icon:M.Util.getImgUrl("clock.png"),
                    tt:M.Util._("Set time interval bounds"),
                    onoff:false,
                    onactivate:function() {
                        self.changeValues();
                    }
                });
                self._tw += 90;
            }
            
            if (options.disablable) {
                self.tb.add({
                    id:M.Util.getId(),
                    icon:M.Util.getImgUrl("disable.png"),
                    tt:M.Util._("Disable date filter"),
                    onoff:false,
                    onactivate:function() {
                        self.enable(false);
                    }
                });
                self._tw += 90;
            }
            
            /*
             * Set a trigger on visibility mask
             */
            $('.mask', self.$d).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self.enable(true);
            });
            
            /*
             * Set timeLine reference
             */
            self.$timeLine = $('.timeLine', self.$d);
            
            /*
             * Compute size
             */
            self.resize(self);
            
            /*
             * Initialize values for time interval
             */
            self.min = options.values.min;
            self.max = options.values.max;
            
            /*
             * Initialize values for scale interval
             */
            self.amin = options.bounds.min.getFullYear();
            self.amax = options.bounds.max.getFullYear() + 1;
            
            /*
             * Set time slider
             */
            self.$timeLine.dateRangeSlider({
                arrows:false,
                wheelMode:"scroll",
                valueLabels:"moving",
                bounds:options.bounds,
                defaultValues:options.values
            });
            
            /*
             * Register event on date changes
             */
            self.$d.bind("valuesChanging", function(event, ui) {
                
                /*
                 * Continuing store date changes
                 */
                self.min = ui.values.min;
                self.max = ui.values.max;
                
            }).bind("valuesChanged", function(event, ui) {
                
                /*
                 * Propagate date changes to layers
                 */
                self.setTime(self.getInterval());
                
            });
            
            /*
             * Move map object
             * 
             * The label position (CSS class 'ui-rangeSlider-label') depends
             * on the timeLine position (top or bottom)
             * 
             * If the timeLine is on top, the labels are displayed below
             * the timeLine. Otherwise they are displayed above.
             * 
             */
            if (self.position.hasOwnProperty('top')) {
                self.$d.css('top', self.position.top + $('#theBar').offset().top + $('#theBar').height());
                $('.map').css({
                    'top':$('.map').offset().top + self.position.top + self.$d.height()
                });
                $('.ui-rangeSlider-label').css('top', 45);
            }
            else if (self.position.hasOwnProperty('bottom')) {
                self.$d.css('bottom', self.position.bottom);
                $('.map').css({
                    'bottom':self.position.bottom + self.$d.height()
                });
                $('.ui-rangeSlider-label').css('top', -35);
            } 
        
            /*
             * Recompute size when window is resized
             */
            M.events.register("resizeend", self, self.resize);
            
            /*
             * Resize
             */
            self.resize(self);
            
            return true;
            
        };
        
        /*
         * Attach a layer to the timeLine
         */
        this.add = function(layer) {
            
            var i, l, self = this;
            
            if (!self.enabled) {
                return false;
            }
            
            /*
             * Paranoid mode
             */
            if (!layer || !layer['_M']) {
                return false;
            }
            
            if ($.isFunction(layer['_M'].setTime)) {
                for (i = 0, l = self.items.length; i < l; i++) {
                    if (self.items[i].layer.id === layer.id) {
                        return false;
                    }
                }
                self.items.push({
                    layer:layer,
                    upToDate:false
                });
                return true;
            }
            
            return false;
            
        };
        
        /*
         * Display popup to change bounds values
         */
        this.changeBounds = function() {
            
            var i, fct,
            t = "",
            id1 = M.Util.getId(),
            id2 = M.Util.getId(),
            self = this;
            
            /*
             * Be sure that popup is not already displayed
             */
            if (self._p) {
                return false;
            }
            
            /*
             * Set absolutes values if not set
             */
            for (i = self.absolutes.min; i <= self.absolutes.max; i++) {
                t += '<option value="'+i+'">'+i+'</option>';
            }
            
            /*
             * Set search popup
             */
            self._p = new M.Popup({
                modal:true,
                header:'<p>TimeLine</p>',
                body:'<div class="description"><form>Change scale bounds from <select id="'+id1+'">'+t+'</select> to <select id="'+id2+'">'+t+'</select></form></div>',
                onClose:function() {
                    self._p = null;
                }
            });
            
            /*
             * Ensure that selectable bounds are the same as the input bounds
             */
            $('#'+id1+' option[value='+self.amin+']').attr("selected", "selected");
            $('#'+id2+' option[value='+self.amax+']').attr("selected", "selected");
            
            fct = function(msg) {
                
                var v1 = $('#'+id1).attr('value'),
                v2 = $('#'+id2).attr('value');
               
                /*
                 * lower bound is always lower than upper bound
                 */
                if (parseInt(v1) < parseInt(v2)) {
                    self.amin = v1;
                    self.amax = v2;
                    self.$timeLine.dateRangeSlider('bounds', new Date(v1,0,1), new Date(v2,0,1));
                }
                else {
                    M.Util.message(M.Util._(msg));
                    return false;
                }
                
                return true;
                
            };
            
            /*
             * Bind dateRangeSlider bounds(min, max) method to the selector onchange event
             */
            $('#'+id1).change(function() {
                if (!fct("Error : lower bound should be lower than upper bound")) {
                    $('#'+id1+' option[value='+self.amin+']').attr("selected", "selected");
                }
            });
            $('#'+id2).change(function() {
                if (!fct("Error : upper bound should be upper than lower bound")) {
                    $('#'+id2+' option[value='+self.amax+']').attr("selected", "selected");
                }
            });
            
            self._p.show();
            
            return true;
            
        };
        
        /*
         * Display popup to change interval values
         */
        this.changeValues = function() {
            
            var d1, d2, id1 = M.Util.getId(),
            id2 = M.Util.getId(),
            self = this;
            
            /*
             * Set search popup
             */
            self._p = M.Util.askFor({
                title:M.Util._("TimeLine"),
                content:'<form>Set time interval from <input id="'+id1+'" type="text" style="width:100px" value="'+self.toISO8601(self.min, true)+'"> to <input id="'+id2+'" type="text" style="width:100px" value="'+self.toISO8601(self.max, true)+'"></form>',
                dataType:"list",
                value:[{
                        title:M.Util._("Ok"), 
                        value:"y"
                    },
                    {
                        title:M.Util._("Cancel"), 
                        value:"n"
                    }],
                callback:function(v){
                    if (v === "y") {
                        d1 = new Date($('#'+id1).val());
                        d2 = new Date($('#'+id2).val());
                        self.$timeLine.dateRangeSlider('values', d1, d2);
                        self.min = d1;
                        self.max = d2;
                        self.setTime(self.getInterval());
                    }
                }
            });
                    
            
            /*
             * Ensure that selectable bounds are the same as the input bounds
             */
            $('#'+id1).datepicker({
                dateFormat:"yy-mm-dd",
                defaultDate:self.min
            });
            $('#'+id2).datepicker({
                dateFormat:"yy-mm-dd",
                defaultDate:self.max
            });
            
            return true;
            
        };
        
        /*
         * Enable/disable date filters
         */
        this.enable = function(b) {
            
            var self = this;
            
            self.enabled = b;
            
            if (b) {
                $('.mask', self.$d).hide();
                self.setTime(self.getInterval());
            }
            else {
                $('.mask', self.$d).show();
                self.setTime(null);
            }
            
        };
        
        /*
         * Return time interval in ISO 8601
         * 
         * @return interval : array of 2 ISO 8601 dates
         *                    i.e. [YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ss]
         */
        this.getInterval = function() {
            var self = this;
            return self.enabled ? [self.toISO8601(self.min), self.toISO8601(self.max)] : ['',''];
        };
        
        /*
         * Unattach a layer to the timeLine
         */
        this.remove = function (layer) {
            for (var i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i].layer.id === layer.id) {
                    this.items.splice(i,1);
                    break;
                }
            }
        };
        
        /*
         * Recompute size when window is resized
         * Note scope._tw is the width of the toolbar
         */
        this.resize = function(scope) {
            if (scope._tw !== 0) {
                scope.$timeLine.css({
                    'right':scope._tw + 'px'
                });
            }
        };
        
        /*
         * Update time filter for catalog layers
         */
        this.setTime = function(interval) {
        
            var i, l, item;
            
            for (i = 0, l = this.items.length; i < l; i++) {
                item = this.items[i];
                
                /*
                 * Hidden layer are not updated !!!
                 */
                if (item.layer.getVisibility()) {
                    item.layer["_M"].setTime(interval);
                    item.upToDate = true;
                }
                else {
                    item.upToDate = false;
                }
                
            }
            
        };
        
        /*
         * Transform a date into an ISO8601 representation
         */
        this.toISO8601 = function(date, notime) {
            
            if (!date || !$.isFunction(date.getMonth)) {
                return '1900-01-01' + (!notime ? 'T00:00:00' : '');
            }
            
            var m = "" + (date.getMonth() + 1),
            d = "" + date.getDate();
            
            /*
             * Pad to 2 digits
             */
            if (d.length === 1) {
                d = "0" + d;
            }
            if (m.length === 1) {
                m = "0" + m;
            }
            return date.getFullYear() + "-" + m + "-" + d + (!notime ? 'T00:00:00' : '');
            
        };
        
        
        /* 
         * Initialize object
         */
        this.init(options);
        
        /*
         * Create unique instance
         */
        M.TimeLine._o = this;
        
        /*
         * Initialize object
         */
        return this;
        
    }
    
})(window.M);