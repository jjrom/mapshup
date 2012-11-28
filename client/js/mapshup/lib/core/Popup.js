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
 * mapshup Popup
 */
(function (M) {

    M.Popup = function (options) {

        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * True to adapt popup size to its content 
         */
        this.autoSize = M.Util.getPropertyValue(options, "autoSize", false);
        
        /*
         * Class names to add to this popup
         * !! WARNING !! Adding class names overide the "autoSize" parameter 
         */
        this.classes = options.classes;
        
        /*
         * True to have popup horizontally centered on the map
         */
        this.centered = M.Util.getPropertyValue(options, "centered", true);
        
        /*
         * Function callback called after popup is removed
         */
        this.onClose = options.onClose;
        
        /*
         * True to display a generic popup (see mapshup.css .tools .generic definition)
         */
        this.generic = M.Util.getPropertyValue(options, "generic", true);
        
        /*
         * True to hide popup when closing it instead of remove it
         */
        this.hideOnClose = M.Util.getPropertyValue(options, "hideOnClose", false);
        
        /*
         * True to set this popup modal.
         * 
         * "In user interface design, a modal window is a child window
         * that requires users to interact with it before they can return
         * to operating the parent application"
         * http://en.wikipedia.org/wiki/Modal_window
         * 
         */
        this.modal = M.Util.getPropertyValue(options, "modal", false);
        
        /*
         * True to not set a popup header
         * !! WARNING !! If set to true, then 'header' parameter is discarded
         */
        this.noHeader = M.Util.getPropertyValue(options, "noHeader", false);
        
        /*
         * True to automatically resize popup on window size change
         */
        this.resize = M.Util.getPropertyValue(options, "resize", true);
        
        /*
         * Parent scope for callback
         */
        this.scope = options.scope || this;
        
        /*
         * If true popup cannot be displayed outside of the map view
         */
        this.unbounded = M.Util.getPropertyValue(options, "unbounded", false);
        
        /*
         * If true popup position is fixed relatively to the map
         * (i.e. it moves with the map). 
         * !! WARNING !! Set the parameter to true overides the "unbounded" parameter
         * since the popup is unbounded in this case
         */
        this.followMap = M.Util.getPropertyValue(options, "followMap", false);
        
        /*
         * Display popup to the specified {OpenLayers.LonLat} map coordinates
         * If 'followMap' is set to true, then popup is anchored to this coordinates
         * when map moves
         */
        this.mapXY = options.mapXY;
        
        /*
         * Initialize Popup object
         */
        this.init = function(options) {
            
            var self = this;
            
            options = options || {};
            
            /*
             * Set an empty modal mask
             */
            self.$m = $();
            
            /*
             * Popup structure
             * 
             * <div id="..." class="po">
             *      <div class="whole">
             *          <div class="header"> // optional
             *          <div class="body generic"> // generic class is not added if this.generic = false
             *      </div>
             *  </div>
             */
            self.$d = M.Util.$$('#'+M.Util.getId(), M.$mcontainer).addClass('po').html('<div class="whole">'+(self.noHeader ? ''  : '<div class="header"></div>')+'<div class="body'+(self.generic ? ' generic' : '')+'"></div></div>');

            /*
             * If popup is modal, set a semi transparent mask
             * under the popup
             */
            if (self.modal) {
                
                /*
                 * Set popup over the mask and over activity
                 */
                self.$d.css({
                    'z-index':'38600'
                });
                
                self.$m = M.Util.$$('#modmask',M.$container)
                .addClass("mask")
                .css(
                {
                    'position':'absolute',
                    'display':'none',
                    'left':'0',
                    'top':'0',
                    'width':'100%',
                    'height':'100%',
                    'z-index':'36000'
                });
            }
            else {
                /*
                 * Set popup under the mask
                 * If popup followMap, then it is displayed behind Toolbars and LayersManager
                 */
                self.$d.css({
                    'z-index':self.followMap ? '19000' : '35900'
                });
            }
            
            /*
             * Set classes or automatic popup size
             */
            self.$d.addClass(self.classes ? self.classes : (self.autoSize ? 'poa' : 'pona'));
            
            /*
             * Set body and header reference
             */
            self.$b = $('.body', self.$d);
            self.$h = $('.header', self.$d);
            
            /*
             * Set header content
             */
            if (options.header) {
                self.$h.html(options.header);
            }
            
            /*
             * Set body content
             */
            if (options.body) {
                self.$b.html(options.body);
            }
            
            /*
             * Add a close button
             */
            M.Util.addClose(self.$d, function(e){
                self.hideOnClose ? self.hide() : self.remove();
            });
            
            /*
             * Compute popup position on window resize
             */
            M.events.register("resizeend", self, function(scope) {
                scope.updatePosition(scope);
            });
            
            /*
             * Move popup on map move
             */
            if (options.followMap) {
                M.Map.map.events.register('move', M.Map.map, function(){
                    if (self.$d.is(':visible')) {
                        self.updatePosition(self);
                    }
                });
            }
            
            /*
             * Compute position on init
             */
            if (self.mapXY) {
                this.setMapXY(self.mapXY);
            }
            
            self.updatePosition(self);
            
            return self;
            
        };
        
        /**
         * Append content to popup header or body
         * 
         * @param {String} html : HTML string to append
         * @param {String} target : 'body' or 'header'
         */
        this.append = function(html, target) {
            
            var $div = target === 'header' ? this.$h : this.$b;
            
            $div.append(html);
            this.updatePosition(this);
            
        };
        
        /*
         * Update position and size of div
         */
        this.updatePosition = function(scope) {
            
            scope = scope || this;
            
            /*
             * Popup body max height is equal to 75% of its container
             */
            if (scope.resize) {
                scope.$b.css({
                    'max-height':Math.round( (3 * ($c.height() - scope.$h.height())) / 4)
                });
            }
            
            /*
             * Center popup if needed
             */
            if (scope.centered) {
                scope.center(scope);
            }
            
            /*
             * Follow map
             */
            if (scope.followMap && scope.mapXY) {
                scope.setMapXY(scope.mapXY);
            }
            
        };
        
        /**
         * Recenter popup
         */
        this.center = function(scope) {
            
            scope = scope || this;
            
            /*
             * Center the popup over its container 
             */
            scope.$d.css({
                'left': ((M.$container.width() - scope.$d.width()) / 2 )
            });
            
        };
        
        /**
         * Hide popup
         */
        this.hide = function() {
            
            var self = this;
            
            self.$d.hide();
            self.$m.hide();
            
            if ($.isFunction(self.onClose)) {
                self.onClose(self.scope);
            }
            
        };
        
        /**
         * 
         * Attach popup to the specified map coordinates
         * when the popup 'followMap'
         * 
         * @param {OpenLayers.LonLat} mapXY
         * 
         */
        this.setMapXY = function(mapXY) {
            
            this.mapXY = mapXY;
            
            var xy = M.Map.map.getPixelFromLonLat(this.mapXY);
                    
            /*
             * Set action info menu position
             * 
             * If popup has an 'apo' class, then it is display
             * so the popup anchor is under mapXY
             * 
             * Otherwise the popup is centered on mapXY
             */
            if (this.$d.hasClass('apo')) {
                this.$d.css({
                    'left': xy.x - 31, //'left': xy.x - self.$d.outerWidth() + 31,
                    'top': xy.y - this.$d.outerHeight() - 12 // 'top': xy.y + 12
                });
            }
            else {
                this.$d.css({
                    'left': xy.x - (this.$d.outerWidth() / 2),
                    'top': xy.y - (this.$d.outerHeight() / 2)
                });
            }
           
        };
        
        /**
         * 
         * Move popup to be centered on pixel
         * 
         * @param {Object} MapPixel : pixel in {x,y} relative to the map
         * 
         */
        this.moveTo = function(MapPixel) {

            var x,y,pixel,
            $d = this.$d,
            parent = M.$map,
            offset = parent.offset();

            /*
             * If popup is not resizable it cannot be moved
             */
            if (!this.resize) {
                return false;
            }
            
            /*
             * (0,0) origin of MapPixel is M.$map
             * (0,0) origin of pixel is window
             */
            pixel = {
                x:MapPixel.x + offset.left,
                y:MapPixel.y + offset.top
            }

            /*
             * If xy is not (or uncorrectly) defined,
             * div is centered on $map div
             */
            if (!pixel || !pixel.x || !pixel.y) {
                x = offset.left + ((parent.width() - $d.width()) / 2);
                y = offset.top + ((parent.height() - $d.height()) / 2);
            }
            /*
             * Non unbounded popup are enterely contained within the map view
             */
            else if (!this.unbounded) {
                
                /*
                 * div left is far too left
                 */
                if ((pixel.x - ($d.width()/2) < offset.left)) {
                    x = offset.left;
                }
                /**
                 * div left is far too right
                 */
                else if ((pixel.x + ($d.width()/2) > (offset.left + parent.width()))) {
                    x = offset.left + parent.width() - $d.width();
                }
                /**
                 * div left is ok
                 */
                else {
                    x = pixel.x - ($d.width() / 2);
                }

                /**
                 * div top is far too top
                 */
                if ((pixel.y - ($d.height()/2) < offset.top)) {
                    y = offset.top;
                }
                /**
                 * div top is far too bottom
                 */
                else if ((pixel.y + ($d.height()/2) > (offset.top + parent.height()))) {
                    y = offset.top + parent.height() - $d.height();
                }
                /**
                 * div top is ok
                 */
                else {
                    y = pixel.y - ($d.height() / 2);
                }
            }
            else {
                x = pixel.x - ($d.width() / 2);
                y = pixel.y - ($d.height() / 2);
            }

            /*
             * Apply div css top/left modifications
             */
            $d.css({
                'top':y,
                'left':x
            });

            return true;
        };
        
        /**
         * Remove popup
         */
        this.remove = function() {
            this.hide();
            M.remove(this);
        };
        
        /**
         * Show popup
         */
        this.show = function() {
            this.$d.show();
            this.$m.show();
            
            if (this.followMap) {
                
                /*
                * Move the map to ensure that feature info panel is completely
                * visible
                */
                var lmo = $('.lm').offset(), // Check if LayersManager is visible
                    dy = this.$d.offset().top - M.$map.offset().top - (lmo ? lmo.top : 0),
                    dx = M.$map.offset().left + M.$map.width() - this.$d.offset().left - this.$d.outerWidth(),
                    c;

                if (dx > 0) {
                    dx = 0;
                }
                if (dy > 0) {
                    dy = 0;
                }
                
                /*
                 * Transform pixels to meters
                 */
                if (dx < 0 || dy < 0) {
                    c = M.Map.map.getPixelFromLonLat(M.Map.map.getCenter());
                    M.Map.map.setCenter(M.Map.map.getLonLatFromPixel(new OpenLayers.Pixel(c.x - dx, c.y + dy)));
                }
            }
        };

        /*
         * Initialize object
         */
        this.init(options);
        
        return this;
    }
    
    
})(window.M);