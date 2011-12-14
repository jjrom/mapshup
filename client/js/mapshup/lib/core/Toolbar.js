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
    
    msp.Toolbar = function(position, orientation, parent) {
        
        /*
         * List of toolbar msp.Button
         */
        this.items = [];
         
        /*
         * Toolbar orientation can be
         *  - h (horizontal)
         *  - v (vertical)
         *  
         *  (Default h)
         */
        this.orientation = orientation || 'h';
        
        /*
         * Toolbar div is created within its parent in the DOM
         */
        this.parent = parent || msp.$map.parent();
        
        /*
         * Toolbar position can be
         *  - ne (north east)
         *  - nw (north west)
         *  - se (south east)
         *  - sw (south west)
         *  - ss (south south)
         *  - fr (free)
         *  
         *  (Default nw)
         */
        this.position = position || 'nw';
        
        /**
         * Initialize toolbar
         */
        this.init = function() {

            /*
             * mapshup can have one and only one toolbar
             * for each position (i.e. nw, ne, sw, se, ss) which
             * are stored respectively under msp.Toolbar._onwtb, msp.Toolbar._onetb,
             * msp.Toolbar._oswtb and msp.Toolbar._osetb.
             * 
             * If an already initialized toolbar is requested then
             * it is returned instead of creating an new toolbar
             * 
             * IMPORTANT: note that the orientation is never changed
             * i.e. if for example msp.Toolbar._onwtb has been initialized as
             * a horizontal toolbar, any new nwtb toolbar created will
             * in fact returned this toolbar and thus the orientation parameter
             * will be ignored.
             */
            if (this.position === 'nw' && msp.Toolbar._onwtb) {
                return msp.Toolbar._onwtb;
            }
            else if (this.position === 'ne' && msp.Toolbar._onetb) {
                return msp.Toolbar._onetb;
            }
            else if (this.position === 'sw' && msp.Toolbar._oswtb) {
                return msp.Toolbar._oswtb;
            }
            else if (this.position === 'se' && msp.Toolbar._osetb) {
                return msp.Toolbar._osetb;
            }
            else if (this.position === 'ss' && msp.Toolbar._osstb) {
                return msp.Toolbar._osstb;
            }
            
            /*
             * South south toolbar cannot be vertical
             */
            if (this.position === "ss") {
                this.orientation = 'h';
            }
            
            /*
             * If position is not "free" then create a toolbar div within #mapcontainer i.e. msp.$map.parent()
             * Otherwise, just create the div without position constraint
             * 
             * Toolbar is a div container of <div class="item"> divs
             * 
             * Structure :
             *  <div class="tb shadow">
             *      <div class="item"></div>
             *      <div class="item"></div>
             *      ...
             *  </div>
             *  
             */
            this.$d = msp.Util.$$('#'+msp.Util.getId(), this.parent);
            
            /*
             * "Non-free" toolbar are absolutely positionned
             */
            if (this.position !== 'fr') {
                this.$d.css({
                    'position':'absolute',
                    'z-index':'10250'
                });
            }
            
            /*
             * Add classes
             */
            this.$d.addClass('tb tb'+this.position+this.orientation+' tb'+this.orientation);
            
            /*
             * "shadow" class is not added to 'fr', 'ss' or 'v' toolbars
             */
            if (this.orientation === 'h' && this.position !== 'fr' && this.position !== 'ss') {
                this.$d.addClass('shadow');
            }
            
            
            /*
             * Create unique toolbar reference
             */
            if (this.position === 'nw') {
                msp.Toolbar._onwtb = this;
            }
            else if (this.position === 'ne') {
                msp.Toolbar._onetb = this;
            }
            else if (this.position === 'sw') {
                msp.Toolbar._oswtb = this;
            }
            else if (this.position === 'se') {
                msp.Toolbar._osetb = this;
            }
            else if (this.position === 'ss') {
                msp.Toolbar._osstb = this;
            }

            return this;
        };

        /**
         * Add a button to the toobar
         * (i.e. a <div class="item"> in this.$d
         *
         * @input {Object} obj : input msp.Button
         * Note: if both btn.icon && btn;title are givens, title is displayed and not icon
         */
        this.add = function(btn) {

            /*
             * Set content to item.text if defined or item.url in other case
             */
            var action,
                i,
                id,
                l,
                $d,
                content = btn.title ? msp.Util.shorten(btn.title,10,true) : '<img class="middle" alt="" src="'+msp.Util.getImgUrl(btn.icon || "empty.png")+'"/>';
            
            /*
             * Add a <li> element to toolbar
             */
            this.$d.append('<div class="hover item" jtitle="'+(msp.Util._(btn.tt) || "")+'" id="'+btn.id+'">'+content+'</div>');
            
            /*
             * Get newly created div reference
             */
            $d = $('#'+btn.id);
            
            /*
             * Add a WEST/EAST/NORTH/SOUTH tooltip depending on orientation
             */
            if (this.position !== 'fr') {
                msp.tooltip.add($d, this.orientation === 'h'? this.position.substr(0,1) : this.position.substr(1,2));
            }
            else {
                msp.tooltip.add($d, this.orientation === 'h'? 'n' : 'e');
            }
            
            /*
             * Add a close action to button
             */
            if (btn.close) {
                id = msp.Util.getId();
                $d.append('<div id="'+id+'" class="act actnne icnclose"></div>');
                $('#'+id).click(function() {
                    
                    msp.Util.askFor(msp.Util._("Delete tab"), msp.Util._("Do you really want to remove this tab ?"), "list", [{
                        title:msp.Util._("Yes"), 
                        value:"y"
                    },
                    {
                        title:msp.Util._("No"), 
                        value:"n"
                    }
                    ], function(v){
                        if (v === "y") {
                            
                            /*
                             * Callback function onclose
                             */
                            if (typeof btn.onclose === "function") {
                                btn.onclose(btn);
                            }

                            btn.remove();
                            
                        }
                    });
                    
                    return false;
                });
            }
            
            /*
             * Add additional actions
             */
            for (i = 0, l = btn.actions.length; i < l; i++) {
                action = btn.actions[i];
                id = msp.Util.getId();
                $d.append('<div id="'+id+'" class="act '+action["cssClass"]+'"></div>');
                (function($id, action){
                    $id.click(function() {
                        /*
                         * Callback function 
                         */
                        if (typeof action.callback === "function") {
                            action.callback(btn);
                        }
                        return false;
                    });
                })($('#'+id), action);   
            }
            
            /*
             * Add a new item
             */
            this.items.push(btn);
            
            /*
             * Return the newly created action div
             */
            return $d;

        };

        /*
         * Return msp.Button identified by id
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
         * Remove button
         */
        this.remove = function(btn) {
            for (var i = 0, l = this.items.length ; i < l; i++) {
                if (this.items[i].id === btn.id) {
                    this.items.splice(i,1);
                    btn = null;
                    break;
                }
            }
        };
        
        /*
         * Initialize object
         */
        return this.init();
      
    };

})(window.msp);
