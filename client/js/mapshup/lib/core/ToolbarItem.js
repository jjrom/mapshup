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
 * Toolbar Item
 *
 */
(function(M) {
    
    /*
     * ToolbarItem options
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
     *      id: // Unique identifier for this item
     *      nohover: // if true, item is not sensitive to onmouseover event
     *      switchable: // boolean - if true, click on item alternate activate/deactivate
     *                             - if false, click on item always activate it
     *                             (default true)
     *      title: // Text displayed within the item display (if no icon specifified)
     *      tt: // Text displayed on mouse over
     *      scope: // reference to the calling plugin
     * }
     *
     */
    M.ToolbarItem = function(tb, options) {
        
        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * If true, click on button make it active
         */
        this.activable = options.hasOwnProperty("activable") ? options.activable : true;
        
        /*
         * Callback function called on click
         */
        this.callback = options.callback;
         
        /*
         * Extra properties container
         */
        this.e = options.e || {};
        
        /*
         * Extra properties container
         */
        this.first = M.Util.getPropertyValue(options, "first", false);
        
        /*
         * Html content for the button - replace title
         */
        this.html = options.html;
        
        /*
         * Url to the button icon image 
         */
        this.icon = options.icon;
        
        /*
         * Unique identifier for this element. Automatically created if not given
         * !! THIS ID IS DIFFERENT FROM THE ID OF THE CREATED jquery $d ELEMENT !!
         */
        this.id = options.id || M.Util.getId();
       
        /*
         * Boolean. If true, button is not sensitive to onmouseover event
         */
        this.nohover = options.nohover || false;
        
        /*
         * If true, click on button make alternate activate/deactivate. If false, click
         * on button make it active
         */
        this.switchable = options.hasOwnProperty("switchable") ? options.switchable : true;
        
        /*
         * Toolbar reference 
         */
        this.tb = tb;
        
        /*
         * Textual content of the button
         */
        this.title = options.title;
        
        /*
         * Title to display on tooltip 
         */
        this.tt = options.tt || "";
        
        /*
         * Plugin scope reference
         */
        this.scope = options.scope;
         
        /*
         * Initialize Item
         */
        this.init = function() {

            var orientation,uid,content,p,self = this;
            
            /*
             * No toolbar - no ToolbarItem
             */
            if (!self.tb) {
                return null;
            }
            
            /*
             * Set extras properties
             */
            for (p in self.e) {
                if (self.e.hasOwnProperty(p)) {
                    self[p] = self.e[p];
                }
            }

            /*
             * Delete self.e
             */
            delete self.e;
            
            /*
             * Add a <li> element to toolbar
             * If button 'first' property is set to true,
             * the button is added at the beginning of the toolbar
             * otherwise it is added at the end of the toolbar
             */
            uid = M.Util.getId();
            
            if (self.html) {
                content = self.html;
            }
            else {
                content = self.title ? M.Util.shorten(self.title,10,true) : '<img class="middle" alt="" src="'+M.Util.getImgUrl(self.icon || "empty.png")+'"/>';
            }
            content = '<div class="'+(self.nohover ? "" : "hover ")+'item" jtitle="'+(M.Util._(self.tt) || "")+'" id="'+uid+'">'+content+'</div>';
            self.first ? self.tb.$d.prepend(content) : self.tb.$d.append(content);
            
            /*
             * Get newly created div reference
             */
            self.$d = $('#'+uid);
            
            /*
             * Define an action to the <li> element
             */
            self.$d.click(function(){

                /*
                 * Activate or deactivate button
                 * Button with 'switchable' set to false are always set to active
                 */
                self.switchable ? self.activate(!self.$d.hasClass('active')) : self.activate(true);
                
                /*
                 * Callback is defined
                 */
                if ($.isFunction(self.callback)) {

                    /*
                     * Return the scope and the clicked <li> to the callback function
                     */
                    self.callback(self.scope, self);
                }

                return false;

            });
                
            /*
             * Add a tooltip depending on orientation
             */
            if (self.tt) {
                orientation = self.tb.orientation || 'h';
                if (self.tb.position) {
                    M.tooltip.add(self.$d, orientation === 'h'? self.tb.position.substr(0,1) : self.tb.position.substr(1,2));
                }
                else {
                    M.tooltip.add(self.$d, orientation === 'h'? 'n' : 'e');
                }
            }
            
            return this;
        };
        
        /*
         * Trigger the button
         */
        this.trigger = function() {
            this.$d.trigger('click');
        };
        
        /*
         * Activate or deactivate item
         * 
         * @param b : boolean - true to activate, false to deactivate
         */
        this.activate = function(b) {
            
            var i,l,item,self = this;
            
            /*
             * Do nothing if item is not activable
             */
            if (!self.activable) {
                return false;
            }
            
            /*
             * Activate item
             */
            if (b) {
                
                /*
                 * Remove all 'active' class from toolbar items
                 * This step is only applied to activable items
                 */
                for (i = 0, l = self.tb.items.length; i < l; i++) {
                    item = self.tb.items[i];
                    if (item.id !== self.id) {
                        if (item.activable) {
                            item.$d.removeClass('active');
                        }
                    }
                }
                
                /*
                 * Add 'active' class to selected item
                 */
                self.$d.addClass("active");
                
            }
            else {
                
                /*
                 * Remove 'active' class from item
                 */
                self.$d.removeClass("active");
                
            }
            
            return true;
            
        };

        /*
         * Initialize object
         */
        return this.init();
      
    };

})(window.M);