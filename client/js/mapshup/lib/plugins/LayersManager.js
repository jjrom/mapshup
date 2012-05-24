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
 * Layers manager plugin
 * 
 * This is one of the main mapshup plugin.
 * 
 * Each layer is managed within a panel containing layer actions
 * and feature list
 * 
 */
(function (msp) {

    msp.Plugins.LayersManager = function() {
        
        /**
         * Only one Context object instance is created
         */
        if (msp.Plugins.LayersManager._o) {
            return msp.Plugins.LayersManager._o;
        }
        
        /*
         * Reference of the active item
         */
        this.active = null;
        
        /**
         * List of panel items
         * Structure 
         * {
         *      id: // unique id for this item
         *      raster: // boolean if true then the item is the raster item
         *      icon: // icon to display in the title tab
         *      title: // text to display in the title tab
         *      layer: // layer reference (null for raster item - see below)
         *      features: // features array for the layer (null for raster item - see below)
         *      $d: // item jquery object reference
         *      $tab: // item tab jquery object reference
         * }
         */
        this.items = [];
        
        /**
         * Current tabs page number
         * Pages go from 0 to Math.ceil((items.length - 1) / perPage)
         * 
         * (Note : perPage value is computed from the map container width)
         */
        this.page = 0;
        
        /**
         * Panel initialisation
         */
        this.init = function(options) {
            
            var idp = msp.Util.getId(),idn = msp.Util.getId(),self = this;
            
            /*
             * Init options
             */
            self.options = options || {};
            
            /*
             * Set options
             * 
             * Possible panel 'position' are :
             *   - 'n' for North (default)
             *   - 's' for South
             *
             */
            $.extend(self.options, {
                position:msp.Util.getPropertyValue(self.options, "position", "n"),
                onTheFly:msp.Util.getPropertyValue(options, "onTheFly", true)
            });
            
            /*
             * Check if you are not on a touch device...
             */
            if (msp.Util.device.touch) {
                self.options.onTheFly = false;
            }
            
            /*
             * Create a Panel div within msp.$container
             * 
             * <div id="..." class="lm {lmn or lms}"></div>
             */
            self.$d = msp.Util.$$('#'+msp.Util.getId(), msp.$container).addClass('lm lm'+self.options.position);
            
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
                left:20+'px'
            });
            self.$next = $('#'+idn).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self.goTo(self.page + 1);
            }).css({
                left:self.$prev.offset().left + self.$prev.outerWidth()
            });
                
            /*
             * Add an hidden raster item within the panel
             */
            self.rasterItem = new function(lm) {
            
                /*
                 * Add raster tab
                 */
                var self = this,
                id = msp.Util.getId(),
                tid = msp.Util.getId();
                
                lm.$d.append('<a id="'+tid+'" class="tab rastertab"><img src="'+msp.Util.getImgUrl("image.png")+'">&nbsp;'+msp.Util._("Images")+'</a>');
                
                self.item = {
                    id:id,
                    type:'r',
                    features:[],
                    $d:msp.Util.$$('#'+id, lm.$d).addClass("thumbs images").html('<div class="thumbsWrapper"><ul></ul></div><div class="text"><div class="navigation"><div class="fi">'+msp.Util._("Images")+'</div><div class="fp"><a href="#" id="'+id+'p" title="'+msp.Util._("Previous page")+'">&laquo;</a>&nbsp;<a href="#" id="'+id+'n" title="'+msp.Util._("Next page")+'">&raquo;</a></div></div></div>'),
                    $tab:$('#'+tid)
                };

                /*
                 * Set a trigger on tab
                 */
                self.item.$tab.click(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    (!lm.active || lm.active.id !== self.item.id) ? lm.show(self.item) : lm.hide(self.item);
                });
                
                /*
                 * Add pagination action
                 */
                lm.addPagination(self.item);
                
                /*
                 * Add new item to the items array
                 * The item is added first !
                 */
                lm.items.push(self.item);
                
                /*
                 * Add a raster layer to rasterItem
                 * 
                 * @input layer: raster layer to add
                 */
                self.add = function(layer) {
                        
                    
                    var icon, id, $id, $ul, self = this;

                    /*
                     * Paranoid mode
                     */
                    if (!layer) {
                        return false;
                    }
                    
                    /*
                     * The id is based on layer unique id
                     */
                    id = layer['_msp'].mspID;
                    icon = layer['_msp'].icon;

                    /*
                     * Get <ul> reference
                     */
                    $ul = $('ul', self.item.$d).prepend('<li><a href="" id="'+id+'"><span'+(icon ? '' : ' style="display:block;"')+' class="title">'+$('<div>'+layer.name+'</div>').text()+'</span><span class="rtools"></span><img src="'+(icon ? icon : msp.Util.getImgUrl('nodata.png'))+'"></a></li>')
                    
                    /*
                     * Set new width
                     */
                    $ul.css({
                        'width': (($('li', $ul).length * 95) + 95) + 'px' // Size of each thumb is 85px + 10px for the margin
                    });
                    
                    $id = $('#'+id);
                    
                    /*
                     * Some tricky part here :
                     * 
                     *   - use of jquery .text() to strip out html elements
                     *     from the msp.Map.featureInfo.getTitle() function return
                     *     
                     *   - If icon or thumbnail is not defined in the feature attributes,
                     *     then force text span display
                     */
                    $id.click(function(e){

                        e.preventDefault();
                        e.stopPropagation();
                        
                        /*
                         * Zoom on layer
                         */
                        msp.Map.zoomTo(layer.getDataExtent() || layer["_msp"].bounds);
                        
                        /*
                         * Set layer visibility to true
                         */
                        msp.Map.Util.setVisibility(layer, true);

                        return false; 
                    });

                    

                    /*
                     * TODO
                     *
                     *
                   if (self.options.onTheFly) {
                        $id.mouseover(function(e){
                            var left = $div.offset().left + ($div.width() - self.target.pn.$d.width()) / 2;
                            left = Math.max(0, left);
                            left = Math.min(left,msp.$container.width() - self.target.pn.$d.width());
                            self.target.pn.$d.css({
                                'left':left
                            });
                            msp.Map.featureInfo.setInfo(f, self.target);
                            msp.Map.featureInfo.show(self.target);

                        }).mouseout(function(e){
                            self.target.pn.hide();
                        });
                    }
                     */
                   
                     
                    /*
                     * Add close button
                     */
                    msp.Util.addClose($id, function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        msp.Map.removeLayer(layer, true);
                        return false;
                    });
                   
                    
                    /*
                     * Add hide button
                     * // TODO
                    
                    $('.rtools', $id).append('<span id="'+id+'vy" class="item" jtitle="'+msp.Util._("Hide this layer")+'"><img class="middle" src="'+msp.Util.getImgUrl("hide.png")+'"/></span>');
                    $d = $('#'+id+'vy');
                    msp.tooltip.add($d, 'w');
                    $d.click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        msp.Map.Util.setVisibility(layer, false);
                        return false;
                    });
                    */
                    /*
                     * Show rasterImage tab
                     */
                    self.item.$tab.show();
                    lm.show(self.item);
                    
                    return true;
                    
                };
                
                /*
                 * Remove raster layer from item
                 */
                self.remove = function(layer) {
                    
                    var l, $ul = $('ul', self.item.$d);
                    
                    /*
                     * Paranoid mode
                     */
                    if (!layer) {
                        return false;
                    }
                    
                    /*
                     * Remove <li> reference
                     */
                    $('#'+layer["_msp"].mspID).parent().remove();
                    
                    /*
                     * Set new width
                     */
                    l = $('li', $ul).length;
                    $ul.css({
                        'width': ((l * 95) + 95) + 'px' // Size of each thumb is 85px + 10px for the margin
                    });
                    
                    /*
                     * Hide tab if there are no layers left
                     */
                    if (l === 0) {
                        lm.hide(self.item);
                        self.item.$tab.hide();
                    }
                    
                    return true;
                };
                
                return self;
                
            }(self);
            
            /*
             * Create feature info over panel
             */
            if (self.options.onTheFly) {
                
                var pn,$content;
                
                /*
                 * Feature Information is displayed within a dedicated panel
                 */
                pn = new msp.Panel();

                /*
                 * Add content
                 */
                $content = pn.add('<div class="header"><div class="title"></div></div><div class="tabs"></div><div class="body expdbl"></div>', 'pfi').addClass('shadow');

                /*
                 * Set panel position and height
                 */
                pn.$d.css({
                    'top':100,
                    'left':20
                });

                /*
                 * Set div references
                 */
                self.target = {
                    pn:pn,
                    $t:$('.tabs', $content), // Tabs
                    $b:$('.body', $content), // Body
                    $h:$('.header', $content) // Header
                }
                
            }
            
            /*
             * Track layersend events
             */
            msp.Map.events.register("layersend", self, function(action, layer, scope) {

                var item;
                
                /*
                 * The following layers are not processed :
                 *   - layers that should not be display within the Layer managager
                 *   - backgrounds layers
                 */   
                if (!layer.displayInLayerSwitcher || layer.isBaseLayer) {
                    return false;
                }
                
                /* 
                 * Rasters layers are processed differently from vector layers.
                 * A vector layer got its own individual tab.
                 * All raster layers are displayed within a single "rasters" tab 
                 */
                if (msp.Map.Util.isRaster(layer)) {
                    
                    /*
                     * Add a raster layer
                     */
                    if (action === "add" && !layer._tobedestroyed) {
                        self.rasterItem.add(layer);
                    }
                    
                    /*
                     * Remove a raster layer
                     */
                    if (action === "remove") {
                        self.rasterItem.remove(layer);
                    }
                }
                else {
                    
                    /*
                     * Get item reference depending
                     */
                    item = scope.get(layer['_msp'].mspID);
                    
                    /*
                     * A layer is added
                     */
                    if (action === "add" && !layer._tobedestroyed) {

                        /*
                         * First check if item exist - if so update content
                         * Otherwise add a new item and show panel
                         */
                        if (!scope.updateFeatures(item, msp.Map.Util.getFeatures(layer, layer['_msp'].layerDescription.sort))) {

                            item = scope.add({
                                icon:layer["_msp"].icon,
                                title:layer.name,
                                layer:layer,
                                features:msp.Map.Util.getFeatures(layer, layer['_msp'].layerDescription.sort)
                            });

                            /*
                             * Do not show panel during mapshup initialization
                             */
                            if (msp.isLoaded) {
                                scope.show(item);
                            }
                        }

                        /*
                         * Update visibility status
                         */
                        scope.updateVisibility(layer);

                    }

                    /*
                     * Layer is updated
                     */
                    if ((action ==="update" || action === "features") && !layer._tobedestroyed) {
                        scope.updateFeatures(item, msp.Map.Util.getFeatures(layer, layer['_msp'].layerDescription.sort));
                    }

                    /*
                     * Layer is removed
                     */
                    if (action === "remove") {
                        scope.remove(item);
                    }

                }
                
                return true;
        
            });
            
            /*
             * Event on a change in layer visibility
             */
            msp.Map.events.register("visibilitychanged", self, function (layer, scope) {
                scope.updateVisibility(layer);
            });
            
            /*
             * Recompute tab position on window resize
             */
            msp.Map.events.register("resizeend", self, function(scope) {
                scope.updateTabs(scope);
            });
            
            return self;
            
        };

        /**
         * Update tabs position
         * 
         * @input scope : reference to this object
         */
        this.updateTabs = function(scope) {
            
            var first,last,perPage,nbPage,i,$t;
            
            /*
             * Hide all tabs except rastertab
             */
            $('.vtab', scope.$d).hide();
            
            /*
             * Maximum number of tabs per page
             */
            perPage = Math.round((2 * msp.$container.width() / 3) / 200);
            
            /*
             * Check that page is not greater that number of page
             * (cf. needed if resizing window when not on page 0)
             */
            nbPage = Math.ceil((scope.items.length - 1) / perPage) - 1;
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
             * 
             * Note: the last elements is the rasterItem tab which is not part of the
             * processed tabs - that's why we remove 1 from the tabs list length
             */
            last = Math.min(first + perPage - 1, scope.items.length - 1);
            
            /*
             * Set first item position right to the paginator
             */
            if (scope.items[first] && scope.items[first].id !== scope.rasterItem.item.id) {
                scope.items[first].$tab.css({
                    left:scope.$next.is(':visible') ? scope.$next.position().left + scope.$next.outerWidth() : 20
                }).show();
            }
            
            /*
             * Tab position is computed from the first to the last index in the page
             */
            for (i = first + 1; i <= last; i++) {
                $t = scope.items[i-1].$tab;
                if (scope.items[i].id === scope.rasterItem.item.id) {
                    continue;
                }
                scope.items[i].$tab.css({
                    left:$t.position().left + $t.outerWidth() + 10
                }).show();
            }
            
            return;
        };
        
        /**
         * Add a vector item to the panel
         * 
         * @input content : item content structure
         *      {
         *          icon: // icon to display in the title tab - OPTIONAL
         *          title: // text to display in the title tab - OPTIONAL
         *          layer: // layer reference - MANDATORY
         *          features: // features array for the layer - OPTIONAL
         *      }
         */
        this.add = function(content) {
        
            /*
             * If content is empty why bother to create a new item ?
             */
            if (!content || !content.layer) {
                return false;
            }
            
            /*
             * Paranoid mode
             */
            content.features = content.features || [];
            
            var $d,item,j,k,a,key,l,plugin,menuactions,
            tools = [],
            id = msp.Util.getId(),
            tid = msp.Util.getId(),
            self = this,
            uid = content.layer['_msp'].mspID;
            
            /*
             * If and item with identifier 'uid' already exists,
             * then replace it with new item
             * Else create a new item
             */
            item = self.get(uid);
            
            /*
             * Item does not exist already
             */
            if (!item) {
            
                /*
                 * Set content
                 * 
                 *  <div class="thumbs images" id="...">
                 *      <div class="thumbsWrapper">
                 *        <ul></ul>
                 *      </div>
                 *      <div class="text">
                 *          <div class="navigation">
                 *              <div>
                 *                  ....
                 *              </div>
                 *              <div>
                 *                  <a href="#" id="{uid}p"></a>
                 *                  <a href="#" id="{uid}n"></a>
                 *              <div>
                 *          </div>    
                 *      </div>
                 *  </div>
                 */
                $d = msp.Util.$$('#'+id, self.$d).addClass("thumbs images").html('<div class="thumbsWrapper"><ul></ul></div><div class="text"><div class="navigation"><div class="fi"></div><div class="fp"><a href="#" id="'+uid+'p" title="'+msp.Util._("Previous page")+'">&laquo;</a>&nbsp;<a href="#" id="'+uid+'n" title="'+msp.Util._("Next page")+'">&raquo;</a></div></div></div><div id="'+uid+'m2" class="mask"><h2>'+msp.Util._("This layer is empty")+'</h2></div><div id="'+uid+'m" class="mask"><h2>'+msp.Util._("This layer is hidden")+'</h2>(Click to show it)</div>');
                
                /*
                 * Append tab to panel
                 */
                self.$d.append('<a id="'+tid+'" class="vtab tab">'+(content.icon ? '<img src="'+content.icon+'">&nbsp;' : '')+msp.Util._(content.title)+'<span class="tools"></span><span class="loading"></span></a>');
                
                /*
                 * Set item
                 */
                item = {
                    id:uid,
                    layer:content.layer,
                    $d:$d,
                    $tab:$('#'+tid)
                };
                
                /*
                 * Add close button
                 */
                if (!content.layer["_msp"].unremovable) {
                    msp.Util.addClose(item.$tab, function(e){
                        e.stopPropagation();
                        msp.Map.removeLayer(item.layer, true);
                    });
                }
                
                /*
                 * Set a trigger on tab
                 */
                item.$tab.click(function(e){
                    e.preventDefault();
                    (!self.active || self.active.id !== item.id) ? self.show(item) : self.hide(item);
                });
                
                /*
                 * Set a trigger on visibility mask
                 */
                $('#'+uid+'m').click(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    msp.Map.Util.setVisibility(content.layer, true);
                });
                
                /*
                 * Add pagination action
                 */
                self.addPagination(item);
                
                /*
                 * Set tools
                 */
                
                /*
                 * Add item from other plugins
                 */
                for(key in msp.plugins) {
                    plugin = msp.plugins[key];
                    if (plugin) {
                        if ($.isFunction(plugin.getLayerActions)) {
                            menuactions = plugin.getLayerActions(item.layer);
                            if (menuactions) {
                                if (menuactions instanceof Array) {
                                    for (j = 0, l = menuactions.length; j < l;j++) {
                                        tools.push(menuactions[j]);
                                    }
                                }
                                else {
                                    tools.push(menuactions);
                                }
                            }
                        }
                    }
                }
                
                /*
                 * Track layer
                 */
                if (content.layer["_msp"].refreshable) {
                    tools.push({
                        id:uid+"rf",
                        icon:content.layer["_msp"].refresh ? "spinoff.png" : "spin.png",
                        title:content.layer["_msp"].refresh ? "Stop tracking" : "Start tracking",
                        callback:function() {
                            
                            var $d = $('#'+uid+'rf');
                            
                            /*
                             * Update refresh status
                             */
                            content.layer["_msp"].refresh = !content.layer["_msp"].refresh;
                            
                            /*
                             * Update action
                             */
                            $d.attr('jtitle', content.layer["_msp"].refresh ? "Stop tracking" : "Start tracking");
                            $('img', $d).attr('src',msp.Util.getImgUrl(content.layer["_msp"].refresh ? "spinoff.png" : "spin.png"));
                        }
                   });
                }
               
                /*
                 * Switch visibility
                 */
                tools.push({
                    id:uid+"vy",
                    icon:"hide.png",
                    title:"Hide this layer",
                    callback:function() {
                        msp.Map.Util.setVisibility(content.layer, false);
                    }
                });
                
                /*
                 * Do not set a zoomOn capability on layer
                 * with _msp.noZoomOn set to true
                 */
                if (!content.layer["_msp"].noZoomOn) {
                    tools.push({
                        id:uid+"zm",
                        icon:"center.png",
                        title:"Center view on layer",
                        callback:function() {
                            msp.Map.zoomTo(content.layer.getDataExtent());
                        }
                    });
                }
                
                /*
                 * Roll over layer actions
                 */
                for (j = 0, k = tools.length; j < k; j++) {
                    a = tools[j];
                    $('.tools',item.$tab).append('<span id="'+a.id+'" class="item" jtitle="'+msp.Util._(a.title)+'"><img class="middle" src="'+msp.Util.getImgUrl(a.icon)+'"/></span>');
                    d = $('#'+a.id);
                    msp.tooltip.add(d, 'n');
                    (function(d,a){
                        d.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            a.callback();
                            return false;
                        });
                    })(d,a);
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
            self.updateFeatures(item, content.features);
            
            /*
             * Update tabs position
             */
            self.updateTabs(self);
            
            /*
             * Return the newly created item
             */
            return item;
        };
        
        /**
         * Add previous/next actions on item tab
         */
        this.addPagination = function(item) {
            
            var $ul, scrollAllow = true;
            
            if (!item) {
                return false;
            }
            
            /*
             * Set triggers on next and previous div
             */
            $ul = $('ul', item.$d);

            $('#'+item.id+'n').click(function(e) {

                if(scrollAllow){
                    scrollAllow = false;
                    var spacefit = $(window).width() - 44,
                    fit = Math.floor(spacefit / 95),
                    left = parseFloat($ul.css('left'),10),
                    moveleft = left - (fit*95),
                    ulWidth = msp.Util.getHashSize(item.features) * 95 + 95;

                    /*
                     * We reach the last page. If click on next, 
                     * then go back at the beginning
                     */
                    if(ulWidth - Math.abs(left) < $(window).width()){
                        moveleft = 0;
                    }
                    $ul.animate({
                        'left':moveleft+'px'
                    },1000,function(){
                        scrollAllow = true;
                    });
                    e.preventDefault();
                }
            });
            $('#'+item.id+'p').click(function(e) {
                if(scrollAllow){
                    scrollAllow = false;
                    var spacefit = $(window).width() - 44,
                    fit = Math.floor(spacefit / 95),
                    left = parseFloat($ul.css('left'),10),
                    moveleft = left + (fit*95);

                    if(left >= 0){ 
                        scrollAllow = true;
                        e.preventDefault();
                        return;
                    }
                    $ul.animate({
                        'left':moveleft+'px'
                    },1000,function(){
                        scrollAllow = true;
                    });
                    e.preventDefault();
                }
            });

            return true;
        };
        
        /**
         * Return item identified by id
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
        
        /**
         * Display the tabs page with a cycling strategy
         * 
         * If page is greater than the maximum of page, then the first page is displayed
         * If page is lower than 0, then the last page is displayed
         */
        this.goTo = function(page) {
          
            var perPage,nbPage,self = this;
            
            perPage = Math.round((2 * msp.$container.width() / 3) / 200);
            nbPage = Math.ceil((self.items.length - 1) / perPage) - 1;
            
            if (page < 0) {
                self.page = nbPage;
            }
            else if (page > nbPage) {
                self.page = 0;
            }
            else {
                self.page = page;
            }
            
            self.updateTabs(self);
          
        };
        
        /**
         * Remove a layer from the panel
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
            for (i = 0, l = self.items.length ; i < l; i++) {
                
                if (self.items[i].id === item.id) {
                    
                    /*
                     * Important to avoid ghost div upon the map container
                     */
                    self.hide(self.items[i]);
                    
                    /*
                     * Remove item content
                     */
                    self.items[i].$d.remove();
                    self.items[i].$tab.remove();
                    
                    /*
                     * Remove item from the list of items
                     */
                    self.items.splice(i,1);
                    
                    /*
                     * Update tabs position
                     */
                    self.updateTabs(self);
                    
                    /*
                     * Activate first element
                     */
                    if (self.isVisible && self.items[0]) {
                        self.setActive(self.items[0]);
                    }
                    else {
                        /*
                         * Remove active reference
                         */
                        self.active = null;

                        /*
                         * Set visible status to false
                         */
                        self.isVisible = false;
                    }
                  
                    return true;
                }
            }
            
            return false;
            
        };
        
        /*
         * Update features array of an existing item
         * 
         * @input item
         */
        this.updateFeatures = function(item, features) {
            
            var i, f, icon, $m, size, id, $ul, self = this;
            
            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }
            
            /*
             * Set new item features
             */
            item.features = features;
            
            /*
             * Get features array size
             */
            size = features.length;
            
            /*
             * Tell user that layer is empty 
             */
            $m = $('#'+item.layer["_msp"].mspID+"m2");
            size === 0 ? $m.show() : $m.hide();
            
            /*
             * Populate <ul> with items and set max width
             */
            $ul = $('ul', item.$d).empty().css({
                'left':'0px',
                'width': ((size * 95) + 95) + 'px' // Size of each thumb is 85px + 10px for the margin
            });
            
            /*
             * Roll over features
             */ 
            for (i = 0; i < size; i++) {
                
                f = features[i];
                
                /*
                 * This is very important to ensure that feature are correctly synchronized
                 */
                if (!f.layer) {
                    continue;
                }
                
                /*
                 * The id is based on feature unique id
                 */
                id = msp.Util.encode(f.id);
                
                /*
                 * Some tricky part here :
                 * 
                 *   - use of jquery .text() to strip out html elements
                 *     from the msp.Map.featureInfo.getTitle() function return
                 *     
                 *   - If icon or thumbnail is not defined in the feature attributes,
                 *     then force text span display
                 */
                icon = msp.Map.featureInfo.getIcon(f);
                $ul.append('<li><a href="" id="'+id+'"><span'+(icon ? '' : ' style="display:block;"')+' class="title">'+$('<div>'+msp.Map.featureInfo.getTitle(f)+'</div>').text()+'</span><img src="'+(icon ? icon : msp.Util.getImgUrl('nodata.png'))+'"></a></li>');
                (function(f,$div){
                    $div.click(function(e){
                        
                        e.preventDefault();
                        e.stopPropagation();
                        
                        /*
                         * Zoom on feature and select it
                         */
                        msp.Map.zoomTo(f.geometry.getBounds());
                        msp.Map.featureInfo.select(f, true);
                        
                        return false; 
                    });
                    if (self.options.onTheFly) {
                        $div.mouseover(function(e){
                            
                            /*
                             * Constrain the over popup position
                             * to be totally included within the map
                             */
                            var left = $div.offset().left + ($div.width() - self.target.pn.$d.width()) / 2;
                            left = Math.max(0, left);
                            left = Math.min(left,msp.$container.width() - self.target.pn.$d.width());
                            self.target.pn.$d.css({
                                'left':left
                            });
                            msp.Map.featureInfo.setInfo(f, self.target);
                            msp.Map.featureInfo.show(self.target);
                            
                        }).mouseout(function(e){
                            self.target.pn.hide();
                        });
                    }
                })(f,$('#'+id));
            }
            
            /*
             * Set loading indicator visibility
             */
            $('.loading', item.$tab).css('visibility', item.layer["_msp"].isLoaded ? 'hidden' : 'visible');
            
            /*
             * Set features info
             */
            $('.fi', item.$d).html(size + "&nbsp;" + msp.Util._(size < 2 ? "feature" : "features"));
            
            return true;
                        
        };
        
        /*
         * Update visibility indicator for a given layer
         * 
         * @input item
         */
        this.updateVisibility = function(layer) {
            
            var $a, $m;
            
            /*
             * Paranoid mode
             */
            if (!layer) {
                return false;
            }
            
            /*
             * Set mask information and hide action visible or hidden
             */
            $a = $('#'+layer['_msp'].mspID+'vy');
            $m = $('#'+layer['_msp'].mspID+'m');
            if (layer.getVisibility()) {
                $m.hide();
                $a.show();
            }
            else {
                $m.show();
                $a.hide();
            }
            
            return true;
        };
        
        /*
         * Show the panel
         * 
         * @input id : jquery object id to display within this panel
         */
        this.show = function(item) {
            
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
             * Set panel visibility
             */
            if (self.isVisible) {
            
                /*
                 * Panel is already shown to the right div
                 */
                return false;
                
            }
            
            /*
             * Show panel
             */
            self.$d.stop().animate(self.options.position === 'n' ? {
                'top':'0px'
            } : {
                'bottom':'0px'
            },200);
            
            /*
             * Set the visible status to true
             */
            self.isVisible = true;
            
            return true;
            
        };
        
        /*
         * Hide the panel
         * 
         * @input item : item to hide
         */
        this.hide = function(item) {
            
            var self = this;
            
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
            self.$d.stop().animate(self.options.position === 'n' ? {
                'top':'-96px'
            } : {
                'bottom':'-96px'
            },200);
            
            /*
             * Hide tools
             */
            $('.tools', item.$tab).hide();
            
            return true;
            
        };
        
        /*
         * Set item the new active item
         */
        this.setActive = function(item) {
            
            var self = this;
            
            /*
             * Hide all divs
             */
            $('.thumbs', self.$d).hide();
            
            /*
             * Remove active class from all tabs
             */
            $('.tab', self.$d).removeClass('active');
            
            /*
             * Show the input div
             */
            item.$d.show();
            
            /*
             * Set item tab active
             */
            item.$tab.addClass('active');
            
            /*
             * Show tools
             */
            $('.tools', self.$d).hide();
            $('.tools', item.$tab).show();
            
            /* 
             * Set the input $id as the new this.active item
             */
            self.active = item;
            
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.LayersManager._o = this;
        
        return this;
        
    };
})(window.msp);