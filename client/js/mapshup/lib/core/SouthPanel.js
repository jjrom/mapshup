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
 * Mapshup South panel
 */
(function (msp) {

    msp.SouthPanel = function (options) {
        
        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * Reference of the active item
         */
        this.active = null;
        
        /*
         * Panel height
         */
        this.h = msp.Util.getPropertyValue(options, "h", 300);
        
        /*
         * Panel width
         */
        this.w = msp.Util.getPropertyValue(options, "w", '60%');
        
        /**
         * Current tabs page number
         * Pages go from 0 to Math.ceil((items.length - 1) / perPage)
         * 
         * (Note : perPage value is computed from the panel width)
         */
        this.page = 0;
        
        /*
         * List of panel items
         * Structure 
         * {
         *      id: // unique id to identify item
         *      $d: // jquery object of the created item
         *      $content: // jquery content object reference
         *      $tab: // jquery tab object reference
         * }
         */
        this.items = [];
        
        /*
         * If true, the panel is display over the map
         * If false, the panel "push" the map
         */
        this.over = msp.Util.getPropertyValue(options, "over", true);
        
        /*
         * Item container padding
         */
        this.padding = {
            top:0,
            bottom:0,
            right:0
        };
        
        /**
         * Panel initialisation
         */
        this.init = function() {
        
            var idp = msp.Util.getId(), idn = msp.Util.getId(), self = this;
            
            /*
             * mapshup can have one and only one SouthPanel
             * 
             * If an already initialized panel is requested then
             * it is returned instead of creating a new one
             *
             */
            if (msp.SouthPanel._o) {
                return msp.SouthPanel._o;
            }
            
            /*
             * If height is set to -1 then it is computed from window.height
             * with a minimum value of 300px
             */
            if (self.h === -1) {
                self.h = Math.max(Math.round(2 * msp.$map.height() / 5), 300);
            }
            
            /*
             * Create a Panel div within msp.$container
             * 
             * <div id="..." class="pns"></div>
             */
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$container).addClass('pns').css({
                'bottom':-self.h,
                'height':self.h,
                /* Force width to 100% if panel "push" the map (i.e. over is false) */
                'width':self.over ? self.w : '100%'
            });
            
            /*
             * Add tab paginator
             */
            self.$d.append('<a id="'+idp+'" class="tab ptab">&laquo;</a>');
            self.$d.append('<a id="'+idn+'" class="tab ptab">&raquo;</a>');
            self.$prev = $('#'+idp).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self.goTo(self.page - 1);
            }).css({
                left:'0px'
            });
            self.$next = $('#'+idn).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self.goTo(self.page + 1);
            }).css({
                left:self.$prev.offset().left + self.$prev.outerWidth()
            });
                
            
            /*
             * Panel width follow the width of the map except for "over" panel
             */
            msp.Map.events.register("resizeend", self, function(scope){
                
                if (!scope.over) {
                    scope.$d.width(msp.$container.width());
                }
                
            });
            
            /*
             * Panel width follow the width of the map except for "over" panel
             */
            msp.Map.events.register("resizeend", self, function(scope){
                
                scope.refreshTabs(scope);
                
               /*
                * Reinitialize ul positions and update pagination
                */
                for (var i = 0, l = scope.items.length; i < l; i++) {
                    $('ul',scope.items[i].$d).css('left', 0);
                    scope.updatePaginate(scope.items[i]);
                }
                
            });
            
            /*
             * Set a SouthPanel reference
             */
            msp.SouthPanel._o = self;
            
            return self;
            
        };

        /**
         * Return number of tab page
         */
        this.nbOfPages = function() {
            return Math.ceil((this.items.length) / this.nbOfTabsPerPage()) - 1;
        };
        
        /**
         * Return number of tabs per page
         */
        this.nbOfTabsPerPage = function() {
            return Math.round((2 * this.$d.width() / 3) / 200);
        };
        
        /**
         * Update tabs position and ul left position
         * 
         * @input scope : reference to this object
         */
        this.refreshTabs = function(scope) {
            
            var first,last,perPage,nbPage,i,$t;
            
            /*
             * Hide all tabs
             */
            $('.tab', scope.$d).hide();
            
            /*
             * Maximum number of tabs per page
             */
            perPage = scope.nbOfTabsPerPage();
            
            /*
             * Check that page is not greater that number of page
             * (cf. needed if resizing window when not on page 0)
             */
            nbPage = scope.nbOfPages();
            if (scope.page > nbPage) {
                scope.page = nbPage;
            }
            
            /*
             * A negative page means no more items
             */
            if (scope.page < 0) {
                scope.page = 0;
                $('.ptab', scope.$d).hide();
                return;
            }
            
            /*
             * hide paginator if not needed
             */
            if (nbPage === 0) {
                $('.ptab', scope.$d).hide();
            }
            else {
                $('.ptab', scope.$d).show();
            }
            
            /*
             * Get the first tab in the current page
             */
            first = perPage * scope.page;
            
            /*
             * Get the last tab in the current page
             */
            last = Math.min(first + perPage, scope.items.length);
            
            /*
             * Set first item position right to the paginator
             */
            if (scope.items[first]) {
                scope.items[first].$tab.css({
                    left:scope.$next.is(':visible') ? scope.$next.position().left + scope.$next.outerWidth() : 0
                }).show();
            }
            
            /*
             * Tab position is computed from the first to the last index in the page
             */
            for (i = first + 1; i < last; i++) {
                $t = scope.items[i-1].$tab;
                scope.items[i].$tab.css({
                    left:$t.position().left + $t.outerWidth() + 10
                }).show();
            }
           
            return;
        };
        
        /*
         * Return the page number where an item is
         */
        this.getPageIdx = function(item) {
            
            var i, l;
            
            for (i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i].id === item.id) {
                    /* Bitwise operator is faster than Map.floor */
                    return (i / this.nbOfTabsPerPage())|0;
                }
                
            }
            
            return -1;
        };
        
        /**
         * Display the tabs page with a cycling strategy
         * 
         * If page is greater than the maximum of page, then the first page is displayed
         * If page is lower than 0, then the last page is displayed
         */
        this.goTo = function(page) {
          
            var nbPage,self = this;
            
            nbPage = self.nbOfPages();
            
            if (page < 0) {
                self.page = nbPage;
            }
            else if (page > nbPage) {
                self.page = 0;
            }
            else {
                self.page = page;
            }
            
            self.refreshTabs(self);
          
        };
        
        /*
         * Update pagination visibility
         */
        this.updatePaginate = function(item) {
            
            var $ul = $('ul', item.$d),
            $p = $('#'+item.id+'p'),
            $n = $('#'+item.id+'n');
            
            if ($('li', $ul).size() > 0) {
            
                /*
                 * Display previous 
                 */
                $('li a', $ul).first().offset().left < 0 ? $p.show() : $p.hide();

                /*
                 * Display next
                 */
                $('li a', $ul).last().offset().left > $('.thumbsWrapper',item.$d).width() ? $n.show() : $n.hide();
            
            }
            
        };
        
        /**
         * Update tabs position
         * 
         * @input scope : reference to this object
         */
        this.updateTabs = function(scope) {
            
            var i,l,$t;
            
            /*
             * Set first item position
             */
            if (scope.items[0]) {
                scope.items[0].$tab.css({
                    left:20
                });
            }
            
            /*
             * Compute items position from the first item position
             */
            for (i = 1, l = scope.items.length; i < l; i++) {
                $t = scope.items[i-1].$tab;
                scope.items[i].$tab.css({
                    left:$t.position().left + $t.outerWidth() + 10
                });
            }
            
        };
        
        /**
         * Add an item to the panel
         * 
         * @input content : content structure :
         *        {
         *          id: // Unique identifier for this item - MANDATORY
         *          title: // Text to display within title tab - OPTIONAL
         *          icon: // Icon to display within the title tab - OPTIONAL
         *          unremovable: // If true panel item cannot be removed (default true) - OPTIONAL
         *          html: // Html content to display within panel - OPTIONAL
         *          classes:  // class name(s) to add to main item div - OPTIONAL
         *          onclose: // function called on panel closing - OPTIONAL
         *          onshow: // function called on panel show
         *        }
         *        
         */
        this.add = function(content) {
        
            /*
             * If content is empty why bother to create a new item ?
             */
            if (!content || !content.id) {
                return false;
            }
            
            var item, tid, id, self = this;
            
            /*
             * By default, panel is not removable
             */
            content.unremovable = msp.Util.getPropertyValue(content, "unremovable", true);
            
            /*
             * If an item with identifier 'id' already exists,
             * then replace it with new item
             * Else create a new item
             */
            item = self.get(content.id);
            
            /*
             * Item does not exist - create it
             * 
             * Important : $d object is created with a 'pnsi' or 'pnist' class (see setActive(item) function)
             */
            if (!item) {
                
                item = {
                    id:content.id,
                    pn:self,
                    $d:msp.Util.$$('#'+content.id, self.$d).addClass('pnsi'+(self.over ? 't' : '')).css({
                        'margin':self.padding.top+'px '+ (self.over ? self.padding.right : 0) + 'px '+self.padding.bottom+'px 0px'
                    })
                }
                
                /*
                 * Append tab to panel
                 */
                tid = msp.Util.getId();
                self.$d.append('<a id="'+tid+'t" class="tab vtab">'+(content.icon ? '<img src="'+content.icon+'">&nbsp;' : '')+msp.Util._(content.title)+'</a>');
                
                /*
                 * Set a trigger on tab
                 */
                item.$tab = $('#'+tid+'t');
                item.$tab.click(function(e){
                    e.preventDefault();
                    (!self.active || self.active.id !== item.id) ? self.show(item) : self.hide(item);
                }); 
                
                /*
                 * Add close button
                 */
                if (!content.unremovable) {
                    msp.Util.addClose(item.$tab, function(e){
                        e.stopPropagation();
                        self.remove(item);
                    });
                }
                
                /*
                 * Add new item to the items array
                 * The item is added first !
                 */
                self.items.unshift(item);
                
            }
            
            /*
             * Update item content
             */
            id = msp.Util.getId();
            item.$d.html('<div id="'+id+'" style="height:'+(self.h - self.padding.top - self.padding.bottom)+'px"'+(content.classes ? ' class="'+content.classes+'"' : '')+'>'+(content.html || "")+'</div>');
            
            /*
             * Set jquery content object reference
             * item.$content === item.$d.children().first()
             * 
             * Set callback functions
             */
            $.extend(item,{
                $content:$('#'+id),
                onclose:content.onclose,
                onshow:content.onshow
            });
            
            /*
             * Update tabs position
             */
            self.refreshTabs(self);
            
            /*
             * Return the newly created item
             */
            return item;
            
        };
        
        
        /**
         * Remove an item from the panel
         */
        this.remove = function(item) {
            
            var i,l,self = this;
            
            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }
            
            /*
             * Roll over items to find the item to remove based on unique id
             */
            for (i = 0, l = this.items.length ; i < l; i++) {
                
                if (this.items[i].id === item.id) {
                    
                    /*
                     * Hide panel
                     */
                    self.hide(item);
                    
                    /*
                     * Remove item content
                     */
                    self.items[i].$content.remove();
                    self.items[i].$d.remove();
                    self.items[i].$tab.remove();
                    
                    /*
                     * Remove item from the list of items
                     */
                    self.items.splice(i,1);
                    
                    /*
                     * Update tabs position
                     */
                    self.refreshTabs(self);
                    
                    return true;
                }
            }
            
            return false;
        };
       
        /*
         * Show the panel
         * 
         * @input item : jquery object id to display within this panel
         */
        this.show = function(item) {
            
            var mc,mch,lon,lat,extent,self = this;
            
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
             * Set panel visibility
             */
            if (self.isVisible) {
            
                /*
                 * Call onshow function
                 */
                if ($.isFunction(item.onshow)) {
                    item.onshow();
                }
                
                /*
                 * Panel is already shown to the right div
                 */
                return false;
                
            }
            
            /*
             * Show panel
             */
            if (!self.over) {
                mc = msp.$map.parent(); // msp.$map container reference
                mch = msp.$map.height();
                extent = msp.Map.map.getExtent(),
                lon = (extent.right + extent.left) / 2;
                lat = ((((mc.height() - self.h) * (extent.bottom - extent.top)) / msp.$map.height()) + (2 * extent.top)) / 2;
            }
            
            self.$d.stop().animate({
                'bottom':'0px'
            },
            {
                duration:200,
                queue:true,
                step:function(now,fx) {

                    /*
                     * Push the map
                     */ 
                    if (!self.over) {
                        mc.css('height', mch - self.h - now);
                    }

                },
                complete:function(){

                    /*
                     * Recenter map after its size change (unless panel "over" attribute is set to true)
                     */
                    if (!self.over) {
                        msp.Map.map.setCenter(new OpenLayers.LonLat(lon, lat), msp.Map.map.getZoom());
                        msp.events.trigger('resizeend');
                    }

                    /*
                     * Call onshow function
                     */
                    if ($.isFunction(item.onshow)) {
                        item.onshow();
                    }
                
                }
            });
            
            /*
             * Set the visible status to true
             */
            self.isVisible = true;
            
            return true;
            
        };
        
        /*
         * Return Panel item identified by id
         */
        this.get = function(id) {
            
            var i,l,self = this,item = null;
            
            /*
             * Roll over panel items
             */
            for (i = 0, l = self.items.length; i < l; i++) {
                if (self.items[i].id === id) {
                    item = self.items[i];
                    break;
                }
            }
            
            return item
        };
        
        /*
         * Hide the panel
         * 
         * @input item : item to hide
         */
        this.hide = function(item) {
            
            var mc,mch,lon,lat,extent,self = this;
            
            /*
             * If item is not active, do nothing
             */
            if (!self.active || self.active.id !== item.id) {
                return false;
            }
           
            /*
             * Remove active reference
             */
            self.active = null;
            item.$tab.removeClass('active');
            
            /*
             * Set visible status to false
             */
            self.isVisible = false;
            
            /*
             * Hide panel
             */
            if (!self.over) {
                mc = msp.$map.parent(); // msp.$map container reference
                mch = msp.$map.height();
                extent = msp.Map.map.getExtent(),
                lon = (extent.right + extent.left) / 2;
                lat = ((((mc.height() + self.h) * (extent.bottom - extent.top)) / msp.$map.height()) + (2 * extent.top)) / 2;
            }
            
            self.$d.stop().animate({
                'bottom':'-'+self.h+'px'
            },
            {
                duration:200,
                queue:true,
                step:function(now,fx) {

                    /*
                     * Push the map
                     */ 
                    if (!self.over) {
                        mc.css('height', mch - now);
                    }

                },
                complete:function(){

                    /*
                     * Recenter map after its size change (unless panel "over" attribute is set to true)
                     */
                    if (!self.over) {
                        msp.Map.map.setCenter(new OpenLayers.LonLat(lon, lat), msp.Map.map.getZoom());
                        msp.events.trigger('resizeend');
                    }

                    /*
                     * Call onclose function
                     */
                    if ($.isFunction(item.onclose)) {
                        item.onclose();
                    }
                }
            });
            
            return true;
            
        };
        
        /*
         * Set item the new active item
         */
        this.setActive = function(item) {
            
            var self = this;
            
            /*
             * Hide all 'pnsi' divs
             */
            $('.pnsi,.pnsit',self.$d).each(function(index) {
                
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
             * Remove active class from all tabs
             */
            $('.tab', self.$d).removeClass('active');
            
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
             * Set item tab active
             */
            item.$tab.addClass('active');

            /* 
             * Set the input $id as the new this.active item
             */
            self.active = item;
                
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };
})(window.msp);