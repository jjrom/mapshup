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
        this.voffset = 100;
        
        /*
         * East/West panel width
         */
        this.w = options.w || 320;
        
        /**
         * Panel initialisation
         */
        this.init = function() {
            
            var self = this;
            
            /*
             * East panel are over by default
             */
            if (self.position === 'e') {
                self.over = msp.Config["general"].eastPanelOver;
                self.voffset = msp.Config["general"].eastPanelOffset || self.voffset;
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
            if (self.position === 'n' && msp.Panel._onp) {
                return msp.Panel._onp;
            }
            else if (self.position === 's' && msp.Panel._osp) {
                return msp.Panel._osp;
            }
            else if (self.position === 'e' && msp.Panel._oep) {
                return msp.Panel._oep;
            }
            else if (self.position === 'w' && msp.Panel._owp) {
                return msp.Panel._owp;
            }
            
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
                
                msp.Panel._onp = self;
                
            }
            else if (self.position === 's') {
               
                /*
                 * Hide the panel on the bottom
                 */
                this.$d.css({
                    'bottom':-self.h,
                    'height':self.h
                });
                
                msp.Panel._osp = self;
            }
            else if (self.position === 'e') {
               
                /*
                 * Hide the panel on the right
                 */
                self.$d.css({
                    'right':-self.w,
                    'width':self.w
                });
                
                msp.Panel._oep = self;
            }
            else if (self.position === 'w') {
                
                /*
                 * Hide the panel on the left
                 */
                self.$d.css({
                    'left':-self.w,
                    'width':self.w
                });
                
                msp.Panel._owp = self;
            }
            
            /*
             * !! Panel widths and height follow the width of the map 
             */
            msp.Map.events.register("resizeend", self, function(scope){
                
                /*
                 * !! For North and South panels, the width of the panel is the width of the container
                 */
                if (scope.position === "n" || scope === "s") {
                    scope.$d.width(msp.$container.width());
                }
                
                /*
                 * !! For East and West panels, the height of the panel is
                 *  - the height of the map minus a constant
                 *  - the height of the map in other case
                 */
                else if (scope.position === "e") {
                    scope.$d.height(msp.$map.height() - (scope.over ? scope.voffset : 0));
                    
                    /*
                     * Object with an 'expdbl' class have their height constrain
                     * by the panel height
                     */
                    $('.expdbl').each(function(idx){
                        var $c = $(this);
                        $c.css('height', msp.Panel._oep.$d.height() - $c.offset().top + 10)
                    });
                    
                }
                else if (scope.position === "w") {
                    scope.$d.height(msp.$map.height());
                }
            });
            
            return self;
            
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
         */
        this.add = function() {
            
            var id = msp.Util.getId(),
            /* Panel inner padding depends on Panel position */
            padding = (this.position === 'n' || this.position === 's') ? this.padding.top+'px 0px '+this.padding.bottom+'px 0px' : '0px '+this.padding.right+'px 0px '+this.padding.left+'px',
            item = {
                id:id,
                pn:this,
                $d:msp.Util.$$('#'+id, this.$d).css({
                    'padding':padding
                }) // by default newly created div is not visible
            }
              
            /*
             * Add new item to the items array
             */
            this.items.push(item);
            
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
            extent = msp.Map.map.getExtent(), // Original extent before fire animation
            self = this,
            w = action === 'show' ? mc.width() - self.w : mc.width() + self.w, // msp.$map container width after animation
            h = action === 'show' ? mc.height() - self.h : mc.height() + self.h, // msp.$map container height after animation
            fcpl = function(){
                
                /*
                 * Recenter map after its size change (unless panel "over" attribute is set to true)
                 */
                if (!self.over) {
                    msp.Map.map.setCenter(new OpenLayers.LonLat(lon, lat), msp.Map.map.getZoom());
                    msp.events.trigger('resizeend');
                }
                
                /*
                 * Indicate that the panel animation is over 
                 */
                self.running = false;
                
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
             * If an animation is running do nothing
             */
            if (self.running) {
                return false;
            }
            /*
             * Indicates that the animation starts
             */
            else {
                self.running = true;
            }
 
            /*
             * East panel
             */
            if (self.position === 'e') {
                
                lon = (((w * (extent.right - extent.left)) / msp.$map.width()) + (2 * extent.left)) / 2;
                lat = (extent.top + extent.bottom) / 2;
                
                
                if (action === 'show') {
                    
                    /*
                     * Move the panel to the left
                     */
                    self.$d.animate({
                        right:parseInt(self.$d.css('right'),10) === 0 ? -self.$d.outerWidth() : 0
                    }, 'slow');
                    
                    /*
                     * Push the map
                     */ 
                    if (!self.over) {
                        
                        /*
                         * Reduce the width of the map accordingly
                         */
                        mc.animate({
                            width:parseInt(mc.css('width'),10) ===  w ? -mc.outerWidth() : w
                        },'slow',fcpl);
                    }
                    /*
                     * ... or move toolbar
                     */
                    else {
                        
                        /*
                         * Move the toolbar
                         */
                        if (self.tb) {
                            self.tb.$d.animate({
                                right:parseInt(self.tb.$d.css('right'),10) === 0 ? self.w : 0
                            }, 'slow',fcpl);
                        }
                    }
                }
                else {
                    
                    /*
                     * Move the panel to the right
                     */
                    self.$d.animate({
                        right:parseInt(self.$d.css('right'),10) === -self.w ? self.$d.outerWidth() : -self.w
                    }, 'slow');
                    
                    /*
                     * Show the map
                     */
                    if (!self.over) {
                       
                        /*
                         * Expand the width of the map accordingly
                         */
                        mc.animate({
                            width:parseInt(mc.css('width'),10) === w ? mc.outerWidth() : w
                        },'slow',fcpl);
                    }
                    /*
                     * ... or move toolbar
                     */
                    else {
                        
                        /*
                         * Move the toolbar
                         */
                        if (self.tb) {
                            self.tb.$d.animate({
                                right:parseInt(self.tb.$d.css('right'),10) === self.w ? 0 : self.w
                            }, 'slow',fcpl);
                        }
                    }
                }
                
            }
            
            /*
             * South Panel
             */
            else if (self.position === 's') {
                
                lon = (extent.right + extent.left) / 2;
                lat = (((h * (extent.bottom - extent.top)) / msp.$map.height()) + (2 * extent.top)) / 2;
                
                if (action === 'show') {
                    self.$d.animate({
                        bottom:parseInt(self.$d.css('bottom'),10) === 0 ? -self.$d.outerHeight() : 0
                    }, 'slow');
                    mc.animate({
                        height:parseInt(mc.css('height'),10) ===  h ? -mc.outerHeight() : h
                    },'slow',fcpl);
                }
                else {
                    self.$d.animate({
                        bottom:parseInt(self.$d.css('bottom'),10) === -self.h ? self.$d.outerHeight() : -self.h
                    }, 'slow');
                    mc.animate({
                        height:parseInt(mc.css('height'),10) === h ? mc.outerHeight() : h
                    },'slow',fcpl);
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
            
            var $d;
            
            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }
            
            /*
             * Set item the new active item
             */
            this.setActive(item);
            
            /*
             * Compute the .expdbl class height
             */
            $d = $('.expdbl', item.$d);
            if ($d.length !== 0) {
                $d.css('height', this.$d.height() - $d.offset().top + 10);
            }
           
            /*
             * Set panel visibility
             */
            if (this.isVisible) {
            
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
            this.animate('show', btn);
            
            /*
             * Set the visible status to true
             */
            this.isVisible = true;
            
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