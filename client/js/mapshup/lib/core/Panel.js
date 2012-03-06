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
 * mapshup information panel
 */
(function (msp) {

    msp.Panel = function (position, options) {
        
        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * Reference of the active panel
         */
        this.$active = null;
        
        /*
         * North/South panel height
         */
        this.h = options.h || 350;
        
        /*
         * List of panel items
         * Structure 
         * {
         *      $d: // jquery object of this item
         * }
         */
        this.items = [];
        
        /*
         * If true, the panel is display over the map with transparency
         * If false, the panel "push" the map
         */
        this.over = false;
        
        /*
         * North/South padding
         */
        this.padding = {
            top:10,
            bottom:10,
            left:10,
            right:10
        };
        
        /*
         * Panel position can be
         *  - e (east)
         *  - w (west)
         *  - n (north)
         *  - s (south)
         *  - f (free)
         *  
         *  (Default e)
         */
        this.position = position || 'e';
        
        /*
         * Toolbar reference. Used for animation when "over" is set to true
         */
        this.tb = options.tb || null;
        
        /*
         * Number of pixels substracted from the map height to compute
         * East/West panel height when "over" boolean is set to true
         */
        this.bottom = 125;
        
        /*
         * Number of pixels from the top of the map to display the panel
         * This property only affects West and East panels
         */
        this.top = 20;
        
        /*
         * East/West panel width
         */
        this.w = options.w || 320;
        
        /**
         * Panel initialisation
         */
        this.init = function() {
            
            var self = this,
                uid = '_o'+self.position+'p';
            
            /*
             * Get Panel characteristics from configuration
             */
            if (msp.Config.panel) {
                if (msp.Config.panel[self.position]) {
                    self.over = msp.Util.getPropertyValue(msp.Config.panel[self.position], "over", self.over);
                    self.top = msp.Util.getPropertyValue(msp.Config.panel[self.position], "top", self.top);
                    self.bottom = msp.Util.getPropertyValue(msp.Config.panel[self.position], "bottom", self.bottom);
                }
            }
            
            /*
             * mapshup can have one and only one panel
             * for each position (i.e. n, s, e, w) which
             * are stored respectively under msp.Panel._onp, msp.Panel._osp,
             * msp.Panel._oep and msp.Panel._owp.
             * 
             * If an already initialized panel is requested then
             * it is returned instead of creating an new panel
             *
             */
            if (msp.Panel[uid]) {
                return msp.Panel[uid];
            }
            /*
             * Create unique Panel reference
             */
            else {
                msp.Panel[uid] = self;
            }
            
            /*
             * Add map header height to top value
             */
            self.top += msp.$header.height();
            
            /*
             * South and North panel heights is computed from window.height
             * with a minimum value of 300px
             */
            self.h = Math.max(Math.round(2 * msp.$map.height() / 5), 300);
            
            /*
             * Create a Panel div within msp.$container
             * 
             * Structure :
             *  <div class="pn pn<position>"></div>
             */
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$container).addClass('pn '+'pn'+self.position+' '+(self.over ? 'pnover' : 'pnnorm'));
            
            /*
             * Create unique panel reference
             * and set absolute positionning of panels
             */
            if (self.position === 'n') {
                
                /*
                 * Hide the panel on the top
                 */
                self.$d.css({
                    'top':-self.h,
                    'height':self.h
                });
                
                
            }
            else if (self.position === 's') {
               
                /*
                 * Hide the panel on the bottom
                 */
                this.$d.css({
                    'bottom':-self.h,
                    'height':self.h
                });
                
            }
            else if (self.position === 'e') {
               
                /*
                 * Hide the panel on the right
                 */
                self.$d.css({
                    'right':-self.w,
                    'width':self.w,
                    'top':self.top
                });
                
            }
            else if (self.position === 'w') {
                
                /*
                 * Hide the panel on the left
                 */
                self.$d.css({
                    'left':-self.w,
                    'width':self.w,
                    'top':self.top
                });
                
            }
            else if (self.position === 'f') {
                
                /*
                 * Free panel width is set to w and hidden by default
                 */
                self.$d.css({
                   'width':self.w 
                }).hide();
            }
            
            /*
             * !! Panel widths and height follow the width of the map 
             */
            msp.Map.events.register("resizeend", self, self.resize);
            
            return self;
            
        };

        /*
         * Resize panel
         */
        this.resize = function(scope) {
            
            /*
             * !! For North and South panels, the width of the panel is the width of the container
             */
            if (scope.position === "n" || scope === "s") {
                scope.$d.width(msp.$container.width());
            }

            /*
             * !! For East and West panels, the height of the panel is
             *  - the height of the map minus the top and minus an offset
             *  - the height of the map in other case
             */
            else if (scope.position === "e" || scope.position === "w") {

                scope.$d.height(msp.$map.height() - (scope.over ? scope.bottom + scope.top : 0));

                /*
                 * Object with an 'expdbl' class have their height constrained
                 * by the panel height
                 */
                $('.expdbl', scope.$d).each(function(idx){
                    var $c = $(this);
                    $c.css('height', scope.$d.height() - $c.position().top - 15)
                });

            }
        };
        
        /**
         * Add an item to the panel
         * 
         * Structure:
         * {
         *      id: // unique id for this item
         *      pn: // this panel reference
         *      $d: // jquery object reference for this item
         * }
         * 
         * @input content : html content (optional)
         * @input extras : class name(s) to add to main item div (optional)
         */
        this.add = function(content, extras) {
            
            var style,
                id = msp.Util.getId(),
                self = this,
                /* Panel inner padding depends on Panel position */
                padding = (self.position === 'n' || self.position === 's') ? self.padding.top+'px 0px '+self.padding.bottom+'px 0px' : '0px '+self.padding.right+'px 0px '+self.padding.left+'px',
                item = {
                    id:id,
                    pn:self,
                    $d:msp.Util.$$('#'+id, self.$d).css({
                        'padding':padding
                    }) // by default newly created div is not visible
                };
            
            /*
             * Set content if specified
             */
            style = self.position === 'n' || self.position === 's' ? 'height:'+self.getInnerDimension().h+'px;' : 'width:'+self.getInnerDimension().w+'px;';
            item.$d.html('<div id="'+msp.Util.getId()+'" style="'+style+'"'+(extras ? ' class="'+extras+'"' : '')+'>'+(content || "")+'</div>');
            
            /*
             * Add new item to the items array
             */
            self.items.push(item);
            
            /*
             * Return the newly created item
             */
            return item;
        };
        
        /**
         * Remove an item from the panel
         */
        this.remove = function(item) {
            
            /*
             * Roll over items to find the item to remove based on unique id
             */
            for (var i = 0, l = this.items.length ; i < l; i++) {
                if (this.items[i].id === item.id) {
                    
                    /*
                     * Hide panel
                     */
                    this.hide(item);
                    
                    /*
                     * Remove item content
                     */
                    this.items[i].$d.remove();
                    
                    /*
                     * Remove item from the list of items
                     */
                    this.items.splice(i,1);
                    
                    break;
                }
            }
        };
        

        /**
         * Animate panel
         */
        this.animate = function(action, btn) {
            
            var lon,
            lat,
            mc = msp.$map.parent(), // msp.$map container reference
            mch = msp.$map.height(),
            mcw = msp.$map.width(),
            extent = msp.Map.map.getExtent(), // Original extent before fire animation
            self = this,
            fcpl = function(){
                
                /*
                 * Recenter map after its size change (unless panel "over" attribute is set to true)
                 */
                if (!self.over) {
                    msp.Map.map.setCenter(new OpenLayers.LonLat(lon, lat), msp.Map.map.getZoom());
                    msp.events.trigger('resizeend');
                }
                
                /*
                 * Triggers onshow and onhide button functions
                 */
                if (btn) {
                    if (action === "show" && $.isFunction(btn.onshow)) {
                        btn.onshow(btn.scope, btn);
                    }
                    else if (action === "hide" && $.isFunction(btn.onhide)) {
                        btn.onhide(btn.scope, btn);
                    }
                }
            };

            /*
             * East panel
             */
            if (self.position === 'e') {
                
                lon = ((((action === 'show' ? mc.width() - self.w : mc.width() + self.w) * (extent.right - extent.left)) / msp.$map.width()) + (2 * extent.left)) / 2;
                lat = (extent.top + extent.bottom) / 2;
                
                
                if (action === 'show') {
                    
                    /*
                     * Move the panel to the left
                     */
                    self.$d.stop(true,true).animate({
                        right:parseInt(self.$d.css('right'),10) === 0 ? -self.$d.outerWidth() : 0
                    },
                    {
                        duration:'slow',
                        step:function(now,fx) {
                            
                            /*
                             * Push the map
                             */ 
                            if (!self.over) {
                                mc.css('width', mcw - self.w - now);
                            }
                            /*
                             * or move toolbar
                             */
                            else {
                                if (self.tb) {
                                    self.tb.$d.css('right', self.w + now);
                                }
                            }
                            
                        },
                        complete:fcpl
                    });
                    
                }
                else {
                    
                    /*
                     * Move the panel to the right
                     */
                    self.$d.animate({
                        right:parseInt(self.$d.css('right'),10) === -self.w ? self.$d.outerWidth() : -self.w
                    },
                    {
                        duration:'slow',
                        step:function(now,fx) {
                            
                            /*
                             * Pull the map
                             */
                            if (!self.over) {
                                mc.css('width', mcw - now);
                            }
                            /*
                             * ... or move toolbar
                             */
                            else {
                                if (self.tb) {
                                    self.tb.$d.css('right', self.w + now);
                                }
                            }
                            
                        },
                        complete:fcpl
                    });
                    
                }
                
            }
            /*
             * West panel does not have button nor toolbar and can only be set to over
             */
            else if (self.position === 'w') {
                
                if (action === 'show') {
                    
                    /*
                     * Move the panel to the right
                     */
                    self.$d.stop(true,true).animate({
                        left:parseInt(self.$d.css('left'),10) === -self.$d.outerWidth() ? 0 : -self.$d.outerWidth()
                    },
                    {
                        duration:'slow'
                    });
                    
                }
                else {
                    
                    /*
                     * Move the panel to the right
                     */
                    self.$d.animate({
                        left:parseInt(self.$d.css('left'),10) === 0 ?  -self.w : 0
                    },
                    {
                        duration:'slow'
                    });
                    
                }
                
            }
            /*
             * South Panel
             */
            else if (self.position === 's') {
                
                lon = (extent.right + extent.left) / 2;
                lat = ((((action === 'show' ? mc.height() - self.h : mc.height() + self.h) * (extent.bottom - extent.top)) / msp.$map.height()) + (2 * extent.top)) / 2;
                
                if (action === 'show') {
                    self.$d.animate({
                        bottom:parseInt(self.$d.css('bottom'),10) === 0 ? -self.$d.outerHeight() : 0
                    },
                    {
                        duration:'slow',
                        queue:true,
                        step:function(now,fx) {
                            
                            /*
                             * Push the map
                             */ 
                            if (!self.over) {
                                mc.css('height', mch - self.h - now);
                            }
                            /*
                             * or move toolbar
                             */
                            else {
                                if (self.tb) {
                                    self.tb.$d.css('bottom', self.h + now);
                                }
                            }
                            
                            
                        },
                        complete:fcpl
                    });
                }
                else {
                    self.$d.animate({
                        bottom:parseInt(self.$d.css('bottom'),10) === -self.h ? self.$d.outerHeight() : -self.h
                    },
                    {
                        duration:'slow',
                        queue:true,
                        step:function(now,fx) {
                            
                            /*
                             * Push the map
                             */ 
                            if (!self.over) {
                                mc.css('height', mch - now);
                            }
                            /*
                             * or move toolbar
                             */
                            else {
                                if (self.tb) {
                                    self.tb.$d.css('bottom', self.h + now);
                                }
                            }
                            
                        },
                        complete:fcpl
                    });
                }
            }
            /*
             * Free panel
             */
            if (self.position === 'f') {
                
                if (action === 'show') {
                    
                    /*
                     * Show free toolbar
                     */
                    self.$d.show();
                    
                }
                else {
                    
                    /*
                     * Hide free toolbar
                     */
                    self.$d.hide();
                }
                
            }
            
            return true;
           
        };

        /*
         * Clear panel content
         * 
         * @input $d : jquery object to remove from this panel
         *             !IMPORTANT! : if $d is not specified then
         *             the whole content of the panel is removed
         */
        this.clear = function($d) {
            $d ? $d.empty() : this.$d.empty();
        };
        
        /*
         * Show the panel
         * 
         * @input id : jquery object id to display within this panel
         * @input btn : button that was clicked to display the panel
         */
        this.show = function(item, btn) {
            
            var self = this;
            
            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }
            
            /*
             * Set item the new active item
             */
            self.setActive(item);
            
            /*
             * Compute the .expdbl class height
             */
            self.resize(self);
           
            /*
             * Set panel visibility
             */
            if (self.isVisible) {
            
                /*
                 * If onshow callback function is defined, call it
                 */
                if (btn && $.isFunction(btn.onshow)) {
                    btn.onshow(btn.scope, btn);
                }
            
                /*
                 * Panel is already shown to the right div
                 */
                return false;
                
            }
            
            /*
             * Animate panel
             */
            self.animate('show', btn);
            
            /*
             * Set the visible status to true
             */
            self.isVisible = true;
            
            return true;
            
        }
        
        /*
         * Return Panel item identified by id
         */
        this.get = function(id) {
            for (var i = 0, l = this.items.length ; i < l; i++) {
                if (this.items[i][id] === id) {
                    return this.items[i];
                }
            }
            return null;
        };
        
        /*
         * Hide the panel
         * 
         * @input item : item to hide
         * @input btn : button clicked to hide the panel
         */
        this.hide = function(item, btn) {
            
            /*
             * If item is not active, do nothing
             */
            if (!this.active || this.active.id !== item.id) {
                return false;
            }
            
            this.animate('hide');
            
            /*
             * Remove active reference
             */
            this.active = null;
            
            /*
             * Set visible status to false
             */
            this.isVisible = false;
            
            return true;
            
        }
        
        /*
         * Show or hide panel content
         * 
         * @input item: item to show/hide
         * @input btn : button clicked to show/hide the panel
         */
        this.showHide = function(item, btn) {
            
            /*
             * No active or active is not item
             */
            (!this.active || this.active.id !== item.id) ? this.show(item, btn) : this.hide(item, btn);
            
        };
        
        /*
         * Set item the new active item
         */
        this.setActive = function(item) {
            
            /*
             * Hide all divs
             */
            this.$d.children().each(function(index) {
                
                /*
                 * This is bit tricky.
                 * If panel item has a 'nodisplaynone' class, then the
                 * item is not hidden using jquery .hide() function, but
                 * instead it's position is set to somewhere outside the
                 * window display.
                 * This avoid the 'display:none' bug when hiding GoogleEarth plugin
                 * iframe for example
                 */
                var $t = $(this);
                $t.hasClass("nodisplaynone") ? $t.css({
                    'position':'absolute',
                    'top':'-1000px',
                    'left':'-1000px'
                }) : $t.hide();

            });

            /*
             * Show the input div
             * 
             * If panel item has a 'nodisplaynone' class, then the
             * item is not shown using jquery .show() function, but
             * instead it's absolute position is set to top:0px,left:0px
             * This avoid the 'display:none' bug when hiding GoogleEarth plugin
             * iframe for example
             * 
             */
            item.$d.hasClass("nodisplaynone") ? item.$d.css({
                'position':'static',
                'top':'0px',
                'left':'0px'
            }) : item.$d.show();

            /* 
             * Set the input $id as the new this.$active div
             */
            this.active = item;
            
        };
        
        /*
         * Return Panel inner dimension
         * i.e. it's height and width minus padding
         */
        this.getInnerDimension = function() {
            return {
                w:this.w - this.padding.left - this.padding.right,
                h:this.h - this.padding.top - this.padding.bottom
            }      
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };
})(window.msp);