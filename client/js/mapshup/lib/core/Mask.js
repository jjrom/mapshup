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
 * mapshup Mask
 */
(function (msp) {

    msp.Mask = function () {

        /*
         * Only one Mask object instance is created
         */
        if (msp.Mask._o) {
            return msp.Mask._o;
        }
  
        /**
         * Generaly only one request should be active at a time
         * but in some cases you can have multiple active requests
         * (e.g. a searchAll() on more than one "Catalog" layers
         */
        this.activeRequests = [];

        /*
         * Initialize Mask object
         */
        this.init = function() {
            
            /*
             * Create #jMask
             */
            this.$m = msp.Util.$$('#'+msp.Util.getId(),msp.$container).addClass("mask").css(
            {
                'position':'absolute',
                'display':'none',
                'left':'0',
                'top':'0',
                'width':'100%',
                'height':'100%',
                'z-index':'36000'
            }).html('<div class="content"><div class="loading"></div></div>');
    
            /*
             * Reference to .mask .loading class
             */
            this.$l = $('.loading', this.$m);
            
        };
        
        /**
         * Abort request id
         *
         * @input <string> id : request identifier - if not provided, all requests are aborted
         */
        this.abort = function(id) {

            /**
             * Roll over activeRequests
             */
            for (var key in this.activeRequests) {


                /**
                 * id is not defined => abort all requests
                 */
                if (!id) {
                    if (this.activeRequests[key]) {
                        this.activeRequests[key].abort();
                    }
                    delete this.activeRequests[key];
                    $('#'+key).remove();
                }
                /**
                 * id is defined => only abort the corresponding request
                 */
                else {
                    if (key === id) {
                        if (this.activeRequests[key]) {
                            this.activeRequests[key].abort();
                        }
                        delete this.activeRequests[key];
                        $('#'+key).remove();
                        break;
                    }
                }
            }

            /*
             * This case occurs for ids without active requests
             */
            $('#'+id).remove();

            /**
             * No more active requests ?
             * => hide the Mask
             */
            if (this.$l.children().length === 0) {
                this.hide();
            }

        };

        /**
         * Add an item to the Mask
         *
         * @input <object> obj : structure
         * {
         *      title: (Line of text to be displayed on the Mask)
         *      cancel: (true => user can cancel the request / false => not possible) OPTIONAL
         *      id: (unique identifier for this request) OPTIONAL
         *      request: (reference of the ajax request) OPTIONAL
         * }
         */
        this.add = function(obj) {

            var self = this;
            
            /**
             * Object intialization
             */
            $.extend(obj,
            {
                title:obj.title || "",
                cancel:obj.cancel || false,
                id:obj.id || msp.Util.getId(),
                request:obj.request || null
            });

            /**
             * A reference to the ajax request is defined
             * => store it within the activeRequests hashtable
             */
            if (obj.request) {
                this.activeRequests[obj.id] = obj.request;
            }

            /**
             * If cancel is to true, user can close the Mask
             */
            if (obj.cancel) {
                this.$l.append('<div id="'+obj.id+'">'+obj.title+'&nbsp;(<a href="#" id="aj'+obj.id+'">'+msp.Util._("Cancel")+'</a>)</div>');

                /**
                 * The class name of the link is the id which uniquely
                 * identifies the request in the activeRequests hashtable
                 * 
                 * I really love jquery :)
                 */
                $('#aj'+obj.id).click(function(){
                    self.abort(obj.id);
                });
            }
            else {
                this.$l.append('<div id="'+obj.id+'">'+obj.title+'</div>');
            }

            /**
             * Show the Mask
             */
            this.show();

            return obj.id;

        };

        /**
         * Show the Mask
         * 
         * @input a : boolean - if true do not show the activity indicator
         */
        this.show = function(a) {
            this.$m.show();
            if (!a) {
                msp.activity.show();
            }
        };

        /**
         * Hide the Mask
         */
        this.hide = function() {
            this.$l.empty();
            this.$m.hide();
            msp.activity.hide();
        };
        
        /*
         * Initialize object
         */
        this.init();
        
        /*
         * Create unique instance
         */
        msp.Mask._o = this;
        
        return this;
    }
    
    
})(window.msp);