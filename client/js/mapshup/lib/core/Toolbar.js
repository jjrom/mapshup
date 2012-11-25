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
 * Toolbar
 *
 * Add a toolbar to the map
 * Toolbar is populated by items
 *
 */
(function(M) {
    
    M.Toolbar = function(options) {
        
        /*
         * List of toolbar items
         */
        this.items = [];
         
        /*
         * CSS classes name to add to the created toolbar
         */
        this.classes = options.classes;
            
        /*
         * Toolbar orientation can be
         *  - h (horizontal)
         *  - v (vertical)
         *  
         *  Default is no orientation
         */
        this.orientation = M.Util.getPropertyValue(options, "orientation", null);
        
        /*
         * Toolbar div is created within its parent in the DOM
         */
        this.parent = M.Util.getPropertyValue(options, "parent", M.$map.parent());
        
        /*
         * Toolbar pre-defined position can be
         * 
         *  - ne (north east)
         *  - nw (north west)
         *  - se (south east)
         *  - sw (south west)
         *  
         *  (Default is no position)
         */
        this.position = M.Util.getPropertyValue(options, "position", null);
        
        /**
         * Initialize toolbar
         */
        this.init = function() {

            var classes = 'tb', self = this,
            uid = '_o'+(this.position ? self.position : M.Util.getId())+'tb';
            
            /*
             * mapshup can have one and only one toolbar
             * for each position (i.e. nw, ne, nn, sw, se, ss) which
             * are stored respectively under M.Toolbar._onwtb, M.Toolbar._onetb,
             * M.Toolbar._onntb,M.Toolbar._oswtb, M.Toolbar._osetb and M.Toolbar._osstb,.
             * 
             * If an already initialized toolbar is requested then
             * it is returned instead of creating an new toolbar
             * 
             * IMPORTANT: note that the orientation is never changed
             * i.e. if for example M.Toolbar._onwtb has been initialized as
             * a horizontal toolbar, any new nwtb toolbar created will
             * in fact returned this toolbar and thus the orientation parameter
             * will be ignored.
             */
            if (M.Toolbar[uid]) {
                return M.Toolbar[uid];
            }
            /*
             * Create unique toolbar reference
             */
            else {
                M.Toolbar[uid] = self;
            }
            
            /*
             * If position is set then create a toolbar div within #mapcontainer i.e. M.$map.parent()
             * Otherwise, just create the div without position constraint
             * 
             * Toolbar is a div container of <div class="item"> divs
             * 
             * Structure :
             *  <div class="tb">
             *      <div class="item"></div>
             *      <div class="item"></div>
             *      ...
             *  </div>
             *  
             */
            self.$d = M.Util.$$('#'+M.Util.getId(), self.parent);
            
            /*
             * Pre-defined toolbar are absolutely positionned
             */
            if (self.position) {
                self.$d.css({
                    'position':'absolute',
                    'z-index':'19500'
                });
            }
            
            /*
             * Add classes
             */
            if (self.orientation) {
                classes += ' tb' + self.orientation;
            }
            if (self.position) {
                classes += ' tb' + self.position + (self.orientation ? self.orientation : 'h');
            }
            
            self.$d.addClass(classes + (self.classes ? ' ' + self.classes : ''));
            
            return self;
        };

        /**
         * Add an item to the toolbar
         * (i.e. a <div class="item"> in this.$d
         *
         * @param {Object} obj : item
         * 
         *  {
         *      activable: // boolean - if true, click on button set or unset 'activate' class
         *                        (default true)
         *      callback: // function to call on click
         *      e: // Extras properties - Properties under this property can be anything
         *      first:// boolean - if true item is added as the first element of the toolbar
         *                       - if false item is added at the end of the toolbar
         *                       (default false)
         *      html: // html code to display within the button instead of title - If both html and title
         *               are specified, html has preseance (i.e. title is discarded)
         *      icon: // Url to the icon image (if no text)
         *      id: // Unique identifier for the <li> element. Automatically created if not given
         *      nohover: // if true, item is not sensitive to onmouseover event
         *      switchable: // boolean - if true, click on item alternate activate/deactivate
         *                             - if false, click on item always activate it
         *                             (default true)
         *      title: // Text displayed within the item display (if no icon specifified)
         *      tt: // Text displayed on mouse over
         *      scope: // reference to the calling plugin
         * }
         */
        this.add = function(item) {

            var tbItem, self = this;
            
            /*
             * Create a ToolbarItem
             */
            tbItem = new M.ToolbarItem(self, item);
            
            /*
             * Add a new item
             */
            self.items.push(tbItem);
            
            /*
             * Return the newly created action div
             */
            return tbItem;

        };

        /*
         * Activate ToolbarItem identified by id
         * 
         * @param id : item to activate/deactivate
         * @param activate: true to activate, false to deactivate
         */
        this.activate = function(id, activate) {
            
            var self = this, tbItem = self.get(id);
            
            if (tbItem){
                tbItem.activate(activate);
            }
            
        };
        
        /*
         * Return ToolbarItem identified by id
         */
        this.get = function(id) {
            for (var i = 0, l = this.items.length ; i < l; i++) {
                if (this.items[i].id === id) {
                    return this.items[i];
                }
            }
            return null;
        };
        
        /*
         * Remove ToolbarItem
         */
        this.remove = function(id) {
            
            var i,l,self = this;
            
            for (i = 0, l = self.items.length ; i < l; i++) {
                if (self.items[i].id === id) {
                    self.items.splice(i,1);
                    self.items[i].$d.remove();
                    break;
                }
            }
           
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };

})(window.M);