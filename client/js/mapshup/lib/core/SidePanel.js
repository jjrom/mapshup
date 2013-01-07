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
 * Mapshup Side Panel
 * 
 * A side panel is a panel displayed at the left or right border of the Map
 * It pushes the map to the right or the left depending on its position
 * 
 * @param {MapshupObject} M
 * 
 */
(function(M) {

    M.SidePanel = function(options) {

        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * Reference of the active item
         */
        this.active = null;

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
         * Panel width
         */
        this.w = M.Util.getPropertyValue(options, "w", 400);
        
        /*
         * Item container padding
         */
        this.padding = {
            top: 0,
            bottom: 0,
            right: 0
        };
    
        /**
         * Panel initialisation
         */
        this.init = function() {

            var self = this;

            /*
             * mapshup can have one and only one SidePanel
             * 
             * If an already initialized panel is requested then
             * it is returned instead of creating a new one
             *
             */
            if (M.SidePanel._o) {
                return M.SidePanel._o;
            }

            /*
             * Create a Panel div within M.$container
             * 
             * <div id="..." class="spn"></div>
             */
            self.$d = M.Util.$$('#' + M.Util.getId(), M.$container).addClass('spn').css({
                'right': -self.w,
                'height': '100%',
                'width': self.w
            });
        
            /*
             * Set a SidePanel reference
             */
            M.SidePanel._o = self;

            return self;

        };

        /**
         * Show the panel
         * 
         * @param {Object} item // optional item to show
         */
        this.show = function(item) {

            var self = this;
            
            /*
             * Set the input item active
             */
            self.setActive(item);
            
            /*
             * Set panel visibility
             */
            if (self.isVisible) {

                /*
                 * Panel is already shown
                 */
                return false;

            }

            /*
             * Show panel
             */
            self.$d.stop().animate({
                'right': 0
            },
            {
                duration: 200,
                queue: true,
                step: function(now, fx) {
                    M.$container.css('left', - now - self.w);
                },
                complete: function() {
                    M.Map.map.updateSize();
                }
            });

            /*
             * Set the visible status to true
             */
            self.isVisible = true;

            return true;

        };

        /**
         * Hide the panel
         * 
         * @param {Object} item
         */
        this.hide = function(item) {

            var self = this;

            /*
             * If Panel is not visible do nothing
             */
            if (!self.isVisible) {
                return false;
            }
            
            /*
             * If an item is specified, only hide the panel
             * if the active item is the input item
             */
            if (item) {
                if (self.active && self.active.id !== item.id) {
                    return false;
                }
            }
        
            /*
             * Set visible status to false
             */
            self.isVisible = false;

            self.$d.stop().animate({
                'right': -self.w
            },
            {
                duration: 200,
                queue: true,
                step: function(now, fx) {
                    M.$container.css('left', - now - self.w);
                },
                complete: function() {
                    M.Map.map.updateSize();
                }
            });

            return true;

        };
        
        /**
         * Add an item to the panel
         * 
         * @param content : content structure :
         *        {
         *          id: // Unique identifier for this item - MANDATORY
         *          html: // Html content to display within panel - OPTIONAL
         *          classes:  // class name(s) to add to main item div - OPTIONAL
         *          onclose: // function called on panel closing - OPTIONAL
         *          onshow: // function called on panel show,
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

            var item, id = M.Util.getId(), self = this;

            /*
             * If an item with identifier 'id' already exists,
             * then replace it with new item
             * Else create a new item
             */
            item = self.get(content.id);

            /*
             * Item does not exist - create it
             */
            if (!item) {

                item = {
                    id: content.id,
                    pn: self,
                    $d: M.Util.$$('#' + content.id, self.$d).css({
                        'margin': self.padding.top + 'px ' + (self.over ? self.padding.right : 0) + 'px ' + self.padding.bottom + 'px 0px'
                    })
                };

                /*
                 * Add new item to the items array
                 * The item is added first !
                 */
                self.items.unshift(item);

            }
            
            item.$d.html('<div id="' + id + '"'  + (content.classes ? ' class="' + content.classes + '"' : '') + '>' + (content.html || "") + '</div>');

            /*
             * Set jquery content object reference
             * item.$content === item.$d.children().first()
             * 
             * Set callback functions
             */
            $.extend(item, {
                $content: $('#' + id),
                onclose: content.onclose,
                onshow: content.onshow
            });

            /*
             * Return the newly created item
             */
            return item;

        };


        /**
         * Remove an item from the panel
         * 
         * @param {Object} item
         */
        this.remove = function(item) {

            var i, l, self = this;

            /*
             * Paranoid mode
             */
            if (!item) {
                return false;
            }

            /*
             * Roll over items to find the item to remove based on unique id
             */
            for (i = 0, l = this.items.length; i < l; i++) {

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
                    self.items.splice(i, 1);

                    return true;
                }
            }

            return false;
        };
    
        /**
         * Return Panel item identified by id
         * 
         * @param {String} id
         */
        this.get = function(id) {

            var i, l, item = null;

            /*
             * Roll over panel items
             */
            for (i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i].id === id) {
                    item = this.items[i];
                    break;
                }
            }

            return item;
        };
        
        /*
         * Set item the new active item
         */
        this.setActive = function(item) {

            var i, l;
            
            if (!item) {
                return false;
            }
        
            /*
             * Hide all items
             */
            for (i = 0, l = this.items.length; i < l; i++) {
                this.items[i].$d.hide();
            }
            
            item.$d.show();
            
            /* 
             * Set the input $id as the new this.active item
             */
            this.active = item;
            
            return true;

        };
    
        /*
         * Initialize object
         */
        return this.init();

    };
})(window.M);