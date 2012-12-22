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
 * Mapshup TabPaginator
 * 
 * @param {Object} M : mapshup main object
 * 
 */
(function(M) {
    
    /*
     * TabPaginator constructor
     * 
     * @param {Object} options : should contain
     *                  {
     *                      target: // reference to the paginator target
     *                              (i.e. LayersManager plugin or SouthPanel) - MANDATORY
     *                      $container: // jQuery DOM element used to compute the
     *                                  nbOfTabsPerPage - OPTIONAL (set to M.$container if not specified)
     *                  }
     */
    M.TabPaginator = function(options) {
        
        /**
         * Paginator target
         * Target should be one of the following
         *   - LayersManager plugin
         *   - SouthPanel
         */
        this.target = options.target;
        
        /**
         * jQuery DOM element which the width is
         * used to compute nbrOfTabsPerPage
         */
        this.$container = options.$container || M.$container;
        
        /**
         * CSS left position in pixel relative to the map container
         */
        this.left = options.left || 0;
        
        /**
         * Current tabs page number
         * Pages go from 0 to Math.ceil((items.length - 1) / perPage)
         * 
         * (Note : perPage value is computed from the panel width)
         */
        this.page = 0;
        
        /**
         * Tab paginator initializer
         */
        this.init = function() {
            
            var idp = M.Util.getId(), idn = M.Util.getId(), self = this;
            
            /*
             * Paginator cannot be set if target is null
             */
            if (!self.target) {
                return null;
            }
        
            /*
             * Add tab paginator
             */
            self.target.$d.append('<a id="'+idp+'" class="tab ptab">&laquo;</a><a id="'+idn+'" class="tab ptab">&raquo;</a>');
            self.$prev = $('#'+idp).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self.goTo(self.page - 1);
            }).css({
                left:self.left
            });
            self.$next = $('#'+idn).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                self.goTo(self.page + 1);
            }).css({
                left:self.$prev.offset().left + self.$prev.outerWidth()
            });
            
            /*
             * Panel width follow the width of the map
             */
            M.events.register("resizeend", self, function(scope){
                
                var i, l, item;
                
                scope.refresh();
                
               /*
                * Reinitialize ul positions and update pagination
                */
                if (scope.target && scope.target.items) {
                    for (i = 0, l = scope.target.items.length; i < l; i++) {
                        item = scope.target.items[i];
                        $('ul',item.$d).css('left', 0);
                        scope.updatePaginate(item);
                    }
                }
            });
            
            return this;
        };
        
        /**
         * Return number of tab page
         */
        this.nbOfPages = function() {
            return Math.ceil((this.target.items.length) / this.nbOfTabsPerPage()) - 1;
        };
        
        /**
         * Return number of tabs per page
         */
        this.nbOfTabsPerPage = function() {
            return Math.round((2 * this.$container.width() / 3) / 200);
        };
        
        /**
         * Update tabs position and ul left position
         */
        this.refresh = function() {
            
            var first, last, perPage, nbPage, i, $t, self = this, $d;
            
            /*
             * Paranoid mode
             */
            if (!self.target) {
                return;
            }
            
            $d = self.target.$d;
        
            /*
             * Hide all tabs
             */
            $('.tab', $d).hide();
            
            /*
             * Maximum number of tabs per page
             */
            perPage = self.nbOfTabsPerPage();
            
            /*
             * Check that page is not greater that number of page
             * (cf. needed if resizing window when not on page 0)
             */
            nbPage = self.nbOfPages();
            if (self.page > nbPage) {
                self.page = nbPage;
            }
            
            /*
             * A negative page means no more items
             */
            if (self.page < 0) {
                self.page = 0;
                $('.ptab', $d).hide();
                return;
            }
            
            /*
             * hide paginator if not needed
             */
            if (nbPage === 0) {
                $('.ptab', $d).hide();
            }
            else {
                $('.ptab', $d).show();
            }
            
            /*
             * Get the first tab in the current page
             */
            first = perPage * self.page;
            
            /*
             * Get the last tab in the current page
             */
            last = Math.min(first + perPage, self.target.items.length);
            
            /*
             * Set first item position right to the paginator
             */
            if (self.target.items[first]) {
                self.target.items[first].$tab.css({
                    left:self.$next.is(':visible') ? self.$next.position().left + self.$next.outerWidth() : self.left
                }).show();
            }
            
            /*
             * Tab position is computed from the first to the last index in the page
             */
            for (i = first + 1; i < last; i++) {
                $t = self.target.items[i-1].$tab;
                self.target.items[i].$tab.css({
                    left:$t.position().left + $t.outerWidth() + 10
                }).show();
            }
           
            return;
        };
        
        /*
         * Return the page number where an item is
         */
        this.getPageIdx = function(item) {
           for (var i = 0, l = this.target.items.length; i < l; i++) {
                if (this.target.items[i].id === item.id) {
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
         * 
         * @param {Integer} page
         * 
         */
        this.goTo = function(page) {
          
            var self = this, nbPage = self.nbOfPages();
            
            if (page < 0) {
                self.page = nbPage;
            }
            else if (page > nbPage) {
                self.page = 0;
            }
            else {
                self.page = page;
            }
            
            self.refresh();
          
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
        
        return this.init();
        
    };

})(window.M);