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
 * Toolbar is populated by other plugins
 *
 */
(function(msp) {
    
    /*
     * Button options
     * {
     *      activable: // boolean - if true, click on button set or unset 'activate' class
     *                        (default true)
     *      actions: // array of actions - optional.
     *                  Structure of an action object is :
     *                  {
     *                      cssClass: // css classes to define action style (see mapshup.css)
     *                      callback: // callback action to call on click
     *                  }
     *      callback: // function to call on click
     *      close: // boolean - if true, add a close button to the panel
     *      container: // Panel container (i.e. returned object of a msp.Panel().add() function
     *      e: // Extras properties - Properties under this property can be anything
     *      html: // html code to display within the button instead of title - If both html and title
     *               are specified, html has preseance (i.e. title is discarded)
     *      icon: // Url to the icon image (if no text)
     *      id: // Unique identifier for the <li> element. Automatically created if not given
     *      nohover: // if true, button is not sensitive to onmouseover event
     *      onclose: // function to call on close
     *      onhide: // function to call on hide (if container is set)
     *      switchable: // boolean - if true, click on button alternate activate/deactivate
     *                        - if false, click on button always activate it
     *                        (default true)
     *      onshow: // function to call on show (if container is set) 
     *      tb: // Toolbar reference where this button is set
     *      title: // Text displayed within the button display (if no icon specifified)
     *      tt: // Text displayed on mouse over
     *      scope: // reference to the calling plugin
     * }
     *
     */
    msp.Button = function(options) {
        
        /*
         * Paranoid mode
         */
        options = options || {};
        
        /*
         * If true, click on button make it active
         */
        this.activable = options.hasOwnProperty("activable") ? options.activable : true;
        
        /*
         * Array of actions
         * Structure of an action :
         *  {
         *      cssClass: // css classes to define action style (see mapshup.css)
         *      callback: // callback action to call on click
         *  }
         * 
         */
        this.actions = options.actions || [];
        
        /*
         * Callback function called on click
         */
        this.callback = options.callback;
         
        /*
         * True - add a close action to button
         */
        this.close = options.close;
        
        /*
         * Panel container to show/Hide on click
         */
        this.container = options.container;
         
        /*
         * Extra properties container
         */
        this.e = options.e || {};
        
        /*
         * Html content for the button - replace title
         */
        this.html = options.html;
        
        /*
         * Url to the button icon image 
         */
        this.icon = options.icon;
        
        /*
         * Unique identifier for the <li> element. Automatically created if not given
         */
        this.id = options.id || msp.Util.getId();
       
        /*
         * Boolean. If true, button is not sensitive to onmouseover event
         */
        this.nohover = options.nohover || false;
        
        /*
         * Function called before button container is closed
         */
        this.onclose = options.onclose;
        
        /*
         * Function called before button container is hide
         */
        this.onhide = options.onhide;
        
        /*
         * Function called before button container is shown
         */
        this.onshow = options.onshow;
        
        /*
         * If true, click on button make alternate activate/deactivate. If false, click
         * on button make it active
         */
        this.switchable = options.hasOwnProperty("switchable") ? options.switchable : true;
        
        /*
         * Toolbar reference where the button
         * is set.
         * Default is North West - Horizontal toolbar
         */
        this.tb = options.tb || new msp.Toolbar('nw', 'h');
        
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
         * Initialize Button
         */
        this.init = function() {

            var p,
                self = this;
            
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
             * Add this button to the toolbar
             */
            self.$d = this.tb.add(this);
            
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
                 * If button has a container, showHide it
                 */
                if (self.container) {
                    self.container.pn.showHide(self.container, self);
                };
                
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
             * Set button inactive if added to a toolbar with an already visible panel
             */
            if (self.container && self.container.pn.isVisible) {
                self.$d.addClass("inactive");
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
         * Activate or deactivate button
         * 
         * @input b : boolean - true to activate, false to deactivate
         */
        this.activate = function(b) {
            
            var i,l;
            
            /*
             * Do nothing if button is not activable
             */
            if (!this.activable) {
                return false;
            }
            
            /*
             * Active button
             */
            if (b) {
                
                /*
                 * Remove all 'active' class from toolbar buttons and add 'inactive' class
                 */
                for (i = 0, l = this.tb.items.length; i < l; i++) {
                    if (this.tb.items[i].id !== this.id) {
                        this.tb.items[i].$d.removeClass('active').addClass('inactive');
                    }
                }
                
                /*
                 * Add 'active' class to button and remove 'inactive' class
                 */
                this.$d.addClass("active").removeClass('inactive');
                
            }
            else {
             
                /*
                 * Remove all 'inactive' class from toolbar buttons
                 */
                for (i = 0, l = this.tb.items.length; i < l; i++) {
                    if (this.tb.items[i].id !== this.id) {
                        this.tb.items[i].$d.removeClass('inactive');
                    }
                }
                /*
                 * Remove 'active' class from button
                 */
                this.$d.removeClass("active");
                
            }
            
            return true;
            
        };

        /*
         * Remove button
         */
        this.remove = function() {
            
            /*
             * Remove button div from the DOM
             */
            this.$d.remove();
            
            /*
             * If button get a container, also remove container
             */
            if (this.container) {
                this.container.pn.remove(this.container);
            }       
                    
            /*
             * Remove button from toolbar
             */
            this.tb.remove(this);
            
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };

})(window.msp);