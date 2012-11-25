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
 * mapshup contextual menu
 */
(function (M) {

    M.Menu = function (limit) {

        /*
         * Only one Activity object instance is created
         */
        if (M.Menu._o) {
            return M.Menu._o;
        }
        
        /**
         * Last mouse click is stored to display menu
         */
        this.lonLat = new OpenLayers.LonLat(0,0);

        /**
         * Check is menu is loaded
         */
        this.isLoaded = false;
        
        /**
         * Menu items array
         */
        this.items = [];
        
        /**
         * Menu is not displayed within the inner border of the map
         * of a size of "limit" pixels (default is 0 pixels)
         */
        this.limit = limit || 0;
        
        /**
         * Set to true to disable menu
         */
        this.isNull = false;
        
        /**
         * Menu initialisation
         *
         * <div id="jMenu">
         *      <div class="wrapper">
         *          <ul></ul>
         *      </div>
         * </div>
         */
        this.init = function() {
            
            /*
             * Variables initialisation
             */
            var self = this;

            /*
             * menu is already initialized ? => do nothing
             */
            if (self.isLoaded) {
                return self;
            }

            /*
             * M config says no menu
             * Menu is considered to be loaded (isLoaded) but jMenu
             * is not created. Thus hide() and show() function will do
             * nothing
             */
            if (!M.Config["general"].displayContextualMenu) {
                self.isLoaded = true;
                self.isNull = true;
                self.$m = $();
                return self;
            }

            /*
             * Create the jMenu div
             */
            M.$map.append('<div id="menu"><div class="cross"><img src="'+M.Util.getImgUrl("x.png")+'"</div></div>');
            
            /*
             * Set jquery #menu reference
             */
            self.$m = $('#menu');
            
            /*
             * Add "close" menu item
             */
            self.add([
                /* Add "close" menu item */
                {
                    id:M.Util.getId(),
                    ic:"x.png",
                    ti:"Close menu",
                    cb:function(scope) {}
                }
                /* Add "zoom in" menu item
                {
                    id:M.Util.getId(),
                    ic:"plus.png",
                    ti:"Zoom here",
                    cb:function(scope) {
                        M.Map.map.setCenter(scope.lonLat, M.Map.map.getZoom() + 1);
                    }
                },
                */
                /* Add "zoom out" menu item
                {
                    id:M.Util.getId(),
                    ic:"minus.png",
                    ti:"Zoom out",
                    cb:function(scope) {
                        M.Map.map.setCenter(scope.lonLat, Math.max(M.Map.map.getZoom() - 1, M.Map.lowestZoomLevel));
                    }
                }
                */
            ]);

            /*
             * Menu is successfully loaded
             */
            self.isLoaded = true;
            
            return self;

        };
        
        /*
         * Add an external item to the menu
         * This function should be called by plugins
         * that require additionnal item in the menu
         * 
         * @param items : array of menu items
         * 
         * Menu item structure :
         * {
         *      id: // identifier
         *      ic: // icon url,
         *      ti: // Displayed title
         *      cb: // function to execute on click
         * }
         */
        this.add = function(items) {
            
            if (this.isNull) {
                return false;
            }
            
            if ($.isArray(items)) {
                /*
                 * Add new item
                 */
                for (var i = 0, l = items.length;i<l;i++) {
                    this.items.push(items[i]);
                }

                /*
                 * Recompute items position within the menu
                 */
                this.refresh();
            }
            
            return true;
            
        };
        
        /**
         * Force menu to init
         */
        this.refresh = function() {
            
            /*
             * Items are displayed on a circle.
             * Position from above and below 60 degrees are forbidden
             */
            var i,x,y,rad,
                scope = this,
                start = 45,
                offsetX = 80,
                angle = 180 - start,
                left = true,
                l = scope.items.length,
                step = (4 * start) / l,
                a = Math.sqrt(l) * 40,
                b = 1.3 * a;
            
            /*
             * Clean menu
             */
            $('.item', scope.$m).remove();
           
            for (i = 0; i < l; i++) {
                (function(item, $m) {
                
                    /*
                     * First item position is located at "2 * start" on the circle
                     * Position between (start and 2*start) and (3*start and 4*start) are forbidden 
                     */
                    if (angle > start && angle < (180 - start)) {
                        angle = 180 - start + angle;
                        left = true;
                    }
                    else if (angle > (180 + start) && angle < (360 - start)) {
                        angle = 180 - angle + step;
                        left = false;
                    }

                    /*
                     * Convert angle in radians
                     */
                    rad = (angle * Math.PI) / 180;

                    if (left) {
                        $m.append('<div class="item right" id="'+item.id+'">'+M.Util._(item.ti)+'&nbsp;<img class="middle" src="'+M.Util.getImgUrl(item.ic)+'"/></div>');
                        x = Math.cos(rad) * a - 200 + offsetX;
                    }
                    else {
                        $m.append('<div class="item left" id="'+item.id+'"><img class="middle" src="'+M.Util.getImgUrl(item.ic)+'"/>&nbsp;'+M.Util._(item.ti)+'</div>');
                        x = Math.cos(rad) * a - offsetX;
                    }

                    y = Math.sin(rad) * b - 10;
                    $('#'+item.id).click(function(){
                        scope.hide();
                        item.cb(scope);
                        return false;
                    }).css({
                        'left': Math.round(x),
                        'top': Math.round(y)
                    });

                    /*
                     * Increment angle
                     */ 
                    angle = angle + step;
                })(scope.items[i], scope.$m);
            }

        };
        
        /*
         * Remove an item from the menu
         * 
         * @param id : id of item to remove
         * 
         */
        this.remove = function(id) {
            
            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length;i<l;i++) {
                
                /*
                 * Remove item with corresponding id
                 */
                if (this.items[i].id === id) {
                    
                    this.items.splice(i,1);
                    
                    /*
                     * Recompute items position within the menu
                     */
                    this.refresh();
                    
                    return true;
                }
            }
            
            return false;

        };

        /**
         * menu display function
         * menu is entirely included inside the "#map" div
         */
        this.show = function() {

            var x,y;
            
            if (this.isNull) {
                return false;
            }

            /**
             * menu is displayed at "pixel" position
             * If pixel is not given as input, it is inferred
             * from this.lonLat position (i.e. last click on #map div)
             */
            if (M.Map.mouseClick) {

                x = M.Map.mouseClick.x;
                y = M.Map.mouseClick.y;

                /**
                 * Click on the border of the map are
                 * note taken into account
                 */
                if (y < this.limit || y > (M.$map.height() - this.limit) || x < this.limit || x > (M.$map.width() - this.limit)) {
                    this.$m.hide();
                    return false;
                }
                this.lonLat = M.Map.map.getLonLatFromPixel(M.Map.mouseClick);
            }
            else {
                return false;
            }

            /**
             * menu is not loaded ? => initialize it
             */
            if (!this.isLoaded) {
                this.init();
            }

            /**
             * Show '#menu' at the right position
             * within #map div
             */
            this.$m.css({
                'left': x,
                'top': y
            }).show();

            return true;
        };
        
        /*
         * Update menu position
         */
        this.updatePosition = function() {
            
            if (this.isNull) {
                return false;
            }
            
            var xy = M.Map.map.getPixelFromLonLat(this.lonLat);
            this.$m.css({
                'left': xy.x,
                'top': xy.y
            });
            
            return true;
        };
        

        /**
         * Hide menu
         */
        this.hide = function() {
            
            if (this.isNull) {
                return false;
            }
            
            this.$m.hide();
            
            return true;
        }
        
        /*
         * Initialize object
         */
        this.init();
        
        /*
         * Set unique instance
         */
        M.Menu._o = this;
        
        return this;
    };
    
})(window.M);