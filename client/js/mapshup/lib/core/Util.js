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
(function(window, M, document) {
    
    /*
     * Initialize M
     */
    M = M || {};
    
    /*
     * Initilaze M.Util
     */
    M.Util = {
        
        /**
         * Associative array of message
         */
        messages:[],
        
        /**
         * abc is added to proxyURL KVP (see scripts/proxy.php)
         */
        abc: (function() {
            var a = Math.round(Math.random()*865),
            b = Math.round(Math.random()*757);
            return '&a='+a+'&b='+b+'&c='+((a+17) - (3*(b-2)));
        })(),
        
        /*
         * Cookie object
         */
        Cookie: {
            
            /**
             * Get cookie
             * 
             * @param {String} name
             */
            get: function(name) {
                var nameEQ = name + "=",
                ca = document.cookie.split(';'),
                i,
                l,
                c;
                for(i = 0, l = ca.length; i < l; i++) {
                    c = ca[i];
                    while (c.charAt(0)===' ') c = c.substring(1,c.length);
                    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
                }
                return null;
            },
            
            /**
             * Delete cookie "name"
             * 
             * @param {String} name
             */
            remove:function(name) {
                this.set(name,"",-1);
            },
            
            /**
             * Set cookie "name=value" valid for days
             * 
             * @param {String} name
             * @param {String} value
             * @param {String} days
             */
            set: function(name,value,days) {

                var expires, domain, slash, stripped, path = "",
                date = new Date();
                
                if (days) {
                    date.setTime(date.getTime()+(days*24*60*60*1000));
                    expires = "; expires="+date.toGMTString();
                }
                else {
                    expires = "";
                }
                
                /*
                 * Compute domain and path from configuration properties
                 * rootUrl and indexPath
                 * It is assumes that rootUrl always start with "http//"
                 */
                stripped = M.Config["general"].rootUrl.substr(7, M.Config["general"].rootUrl.length);
                slash = stripped.indexOf('/');
                if (slash === -1) {
                    domain = stripped;
                    path = "/";
                }
                else {
                    domain = stripped.substr(0,slash);
                    path = stripped.substr(slash, stripped.length);
                }
                document.cookie = name+"="+value+expires+"; domain="+domain+"; path="+path;
            }
        },

        device:(function() {

            /*
             * Initialize user agent string to lower case
             */
            var device,
            touch,
            uagent = navigator.userAgent.toLowerCase();

            /*
             * android ?
             */
            if (uagent.indexOf("android") !== -1) {
                device = "android";
                touch = true;
            }
            /*
             * iphone ?
             */
            else if (uagent.indexOf("iphone") !== -1) {
                device = "iphone";
                touch = true;
            }
            /*
             * ipod ?
             */
            else if (uagent.indexOf("ipod") !== -1) {
                device = "ipod";
                touch = true;
            }
            /*
             * ipad ?
             */
            else if (uagent.indexOf("ipad") !== -1) {
                device = "ipad";
                touch = true;
            }
            /*
             * Normal device
             */
            else {
                device = "normal";
                touch = false;
            }

            return {
                type:device,
                touch:touch
            };
        })(),

        /*
         * Escapable and meta character protection
         * See https://github.com/douglascrockford/JSON-js/blob/master/json2.js
         *
         */
        escapable: /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
          
        meta: {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        
        /**
         * Sequence number to guarantee unique IDs
         */
        sequence:0,
        
        /**
         * Internationalisation i18n function.
         * Each displayed message are translated through
         * this function
         * 
         * @param {String} s
         */
        _: function(s) {
            if (M.i18n === undefined) {
                return s;
            }
            /*
             * Warning : if s is oneof the name of Array function ("shift", "splice", "push", etc)
             * it should be returned without translation to avoid function error
             */
            var i18nized = M.i18n[s];
            return typeof i18nized === "string" ? i18nized : s;
        },

        /**
         * Create the div "divname" under "context" and return it
         * If this div already exist, jsut return it
         *
         * Nota : if "context" is not specified, "divName" is created under "body"
         * 
         * @param {String} divName
         * @param {String} context
         */
        $$: function(divName, context) {
            context = context || 'body';
            var div = $(divName, context);
            if (div.length === 0) {
                var type = divName.substring(0,1) === "." ? "class" : "id";
                $(context).append('<div '+type+'="'+divName.substring(1,divName.length)+'"></div>');
                div = $(divName);
            }
            return div;
        },
        
        /**
         * Append a close button to input div
         * 
         * @param $d : jquery object reference
         * @param callback : callback function to call on click on close
         */
        addClose: function($d, callback) {
            
            var id = M.Util.getId();
            
            $d.append('<span id="'+id+'" class="close" title="'+M.Util._('close')+'"></span>');
            
            $('#'+id).click(function(e){
                $.isFunction(callback) ? callback(e) : $d.hide();
            });
        },
        
        /**
         * Clone object
         * 
         * Code from Keith Devens
         * (see http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone)
         * 
         * @param srcInstance
         */
        clone: function(srcInstance) {
            if(typeof(srcInstance) !== 'object' || srcInstance === null) {
                return srcInstance;
            }
            var i, newInstance = srcInstance.constructor();
            for(i in srcInstance) {
                newInstance[i] = this.clone(srcInstance[i]);
            }
            return newInstance;
        },
        
        /**
         * Return GetCapabilities from an OGC service
         * 
         * @param XMLHttpRequestObj : the XMLHttpRequest object
         * @param format : format of the GetCapabilities file.
         *                 can be one of :
         *                      new OpenLayers.Format.WFSCapabilities()
         *                      new OpenLayers.Format.WMSCapabilities()
         *                      new OpenLayers.Format.WMTSCapabilities()
         */
        getCapabilities: function(XMLHttpRequestObj, format) {

            var capability = null;

            if (XMLHttpRequestObj.status !== 200 || !format) {
                return null;
            }
            try {
                capability = format.read(M.Util.textToXML(XMLHttpRequestObj.responseText));
            }
            catch(e) {
                M.Util.message(M.Util._("Error reading Capabilities file"));
            }

            return capability;
        },
        
        /**
         * Return the length of an associative array
         * 
         * @param h : associative array
         */
        getHashSize: function (h) {
            var v,r = 0;
            
            for (v in h) {
                r++;
            }
            return r;
        },
        
        /**
         * Return a unique title from layerDescription
         * 
         * @param layerDescription : input layerDescription object
         */
        getTitle: function(layerDescription) {
            layerDescription = layerDescription || {};
            return layerDescription.title ? layerDescription.title : (layerDescription.type || "Unknown") + "#" + this.sequence++;
        },
        
        /*
         * Returns UserInfo from LayersManager plugin
         * If not specified return an object with userid set to -1
         */
        getUserInfo: function() {
            
            var lm = M.Plugins["LayersManager"];
            
            if (lm && lm._o && lm._o.userInfo) {
                return lm._o.userInfo;
            }
            
            return {
                userid:-1
            };
            
        },
        
        /**
        * Extend URL parameters with newParams object
        *
        * @param {String} url : url
        * @param {Object} newParams : 
        *
        * @return {String} new URL
        */
        extendUrl: function(url, newParams) {
            
            var key, value, i, l, sourceParamsList, sourceParams = {}, newParamsString = "", sourceBase = url.split("?")[0];
            
            try {
                sourceParamsList = url.split("?")[1].split("&");
            }
            catch (e) {
                sourceParamsList = [];
            }
            for (i = 0, l = sourceParamsList.length; i < l; i++) {
                key = sourceParamsList[i].split('=')[0];
                value = sourceParamsList[i].split('=')[1];
                if (key && value) {
                    sourceParams[key] = value;
                }
            }
            
            newParams = $.extend(sourceParams, newParams);

            for (key in newParams) {
                if (newParams[key] !== null) {
                    newParamsString += key+"="+newParams[key]+"&";
                }
            }
            return sourceBase+"?"+newParamsString;
            
        },
        
        /**
         * Add a "display image" action to the given jquery 'a'
         * A click on 'a' will open the image within a fullscreen popup
         * 
         * @param {String} href
         * @param {String} title
         */
        showPopupImage:function(href, title) {

            /*
             * Popup reference
             */
            var popup = new M.Popup({
                modal:true,
                resize:false,
                autoSize:true,
                noHeader:true
            }),
            image = new Image();

            /*
             * Show Activity
             */
            M.activity.show();

            /*
             * Clear popup
             */
            popup.hide();

            /*
             * Show parent Mask
             */
            popup.$m.show();

            /*
             * Create image object
             */
            image.src = href;

            /*
             * Compute image after load
             */
            $(image).load(function() {

                /*
                 * Array of size :
                 *      0 => Image width
                 *      1 => Image height
                 *      2 => 80% of Window width
                 *      3 => 80% of Window height
                 */
                var sizes = [image.width, image.height, window.innerWidth * 0.8, window.innerHeight * 0.8],
                width = sizes[0],
                height = sizes[1];

                /*
                 * Image height is bigger than window height
                 * => reduce width/height to the window height preserving ratio
                 */
                if (height > sizes[3]) {
                    height = sizes[3];
                    width = (width * height) / sizes[1];
                }

                /*
                 * Image width is bigger than window width
                 * => reduce width/height to the window width preserving ratio
                 */
                if (width > sizes[2]) {
                    width = sizes[2];
                    height = (height * width) / sizes[0];
                }

                popup.$b.html('<div class="imageContent"><div class="padded"><img src="'+href+'" height="'+height+'" width="'+width+'"/><div class="innerTitle" style="width:'+width+'px;">'+title+'</div></div></div>');
                popup.$d.css({
                    'left':(window.innerWidth - popup.$d.width()) / 2,
                    'top':0
                });

                /*
                 * Hide Activity
                 */
                M.activity.hide();

                /*
                 * Show popup image
                 */
                popup.show();
            }).error(function () {
                
                /*
                 * Hide activity/popup
                 */
                M.activity.hide();
                popup.hide();
                
                M.Util.message("Error loading image");
                
            });

        },
        
        /**
         * Add a "display video" action to the given jquery 'a'
         * A click on 'a' will open the within within a fullscreen popup
         * 
         * @param video : object describing video i.e. 
         *                  {
         *                      title://Video title
         *                      url://url to the video
         *                      type://video type - one of mp4, ogg or webm
         *                      img://url to an image
         *                      w://width of the player (default 640)
         *                      h: height of the player (default 264)
         *                  }
         *                     
         */
        showPopupVideo: function(video) {
            
            /*
             * Popup reference
             */
            var type,w,h,img,codec,content,
            popup = new M.Popup({
                modal:true,
                resize:false,
                autoSize:true,
                noHeader:true
            });

            /*
             * Paranoid mode
             */
            video = video || {};
            if (!video.url) {
                this.message(this._("Error : url is not defined"));
                return false;
            }
            
            /*
             * Initialize default values
             */
            w = video.w || 640;
            h = video.h || 264;
            img = video.img || "";
            type = video.type;
            
            /*
             * Try to guess the video type from url if not specified
             */
            if (!type) {
                type = video.url.substring(video.url.length - 3,video.url.length).toLowerCase();
            }
            
            /*
             * Get codec from type
             */
            switch (type) {
                case "ogg":
                    codec = "video/ogg";
                    break;
                case "webm":
                    codec = "video/webm";
                    break;
                default:
                    codec = "video/mp4";
                    break;
            }
  
            /*
             * Show parent Mask
             */
            popup.$m.show();

            /*
             * Create videocontent
             * See http://camendesign.com/code/video_for_everybody for more information
             */
            content = '<video width="'+w+'" height="'+h+'" controls>'
            +'<source src="'+video.url+'" type="'+codec+'" />'
            +'<object width="'+w+'" height="'+h+'" type="application/x-shockwave-flash" data="http://releases.flowplayer.org/swf/flowplayer-3.2.1.swf">'
            +'<param name="movie" value="http://releases.flowplayer.org/swf/flowplayer-3.2.1.swf" />'
            +'<param name="allowfullscreen" value="true" />'
            +'<param name="flashvars" value="controlbar=over&amp;image='+img+'&amp;file='+video.url+'" />'
            +'<img src="'+img+'" width="'+w+'" height="'+h+'" alt="'+video.title+'" title="'+video.title+'"/>'
            +'</object>'
            +'</video>'
            +'<p class="vjs-no-video"><a href="'+video.url+'" target="_blank">'+this._("Download Video")+'</a></p>'
            +'</div>';
            popup.$b.html('<div class="imageContent"><div class="padded">'+content+'</div></div>');
            popup.$d.css({
                'left':(window.innerWidth - popup.$d.width()) / 2,
                'top':(window.innerHeight - popup.$d.height()) / 2
            });

            /*
             * Show popup image
             */
            popup.show();

            return true;
        },
        
        /*
         * Convert an input string into the right type
         * (for example "1" will be converted to an integer "true" to a boolean...etc)
         * 
         * @param {String} string : string to convert
         */
        stringToRealType:function(string) {
            
            if (!string) {
                return string;
            }
            
            if ($.isNumeric(string)) {
                return parseFloat(string);
            }
            
            if (string.toLowerCase() === 'true') {
                return true;
            }
            
            if (string.toLowerCase() === 'false') {
                return false;
            }
            
            return string;
        },
        
        /*
         * Return all node attributes without namespaces
         * 
         * @param obj : a jquery element
         */
        getAttributes:function(obj) {
            
            var a, i, l, attributes = {};
            
            if (obj && obj.length) {
                a = obj[0].attributes;
                for (i = 0, l = a.length; i < l; i++) {
                    attributes[M.Util.stripNS(a[i].nodeName)] = M.Util.stringToRealType(a[i].nodeValue);
                }
            }
            
            return attributes;
        },
        
        /*
         * Return nodeName without namespace
         * 
         * @param nodeName : a nodeName (e.g. "toto", "ns:toto", etc.)
         */
        stripNS:function(nodeName) {
            if (!nodeName) {
                return null;
            }
            var s = nodeName.split(':');
            return s.length === 2 ? s[1] : s[0];
        },
        
        /**
         * Strip HTML tags from input string
         *
         * @param {String} html : an html input string
         */
        stripTags: function(html) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText;
        },
        
        /**
         * Launch an ajax call
         * This function relies on jquery $.ajax function
         * 
         * @param {Object} obj
         * @param {Object} options
         */
        ajax: function(obj, options) {

            var ajax;
            
            /*
             * Paranoid mode
             */
            if (typeof obj !== "object") {
                return null;
            }

            /*
             * Ask for a Mask
             */
            if (options) {
                
                var id = this.getId();
                
                obj['complete'] = function(c) {
                    M.mask.abort(id);
                };
                
                ajax = $.ajax(obj);
                
                /**
                 * Add information about loading
                 */
                M.mask.add({
                    title:options.title || this._("Processing"),
                    cancel:options.cancel === true ? options.cancel : false,
                    id:id,
                    request:ajax
                });
            }
            else {
                ajax = $.ajax(obj);
            }

            return ajax;
        },
        
        /**
         * Display a modal popup to ask user for
         * a particular value
         * 
         * @param {Object} options : constructor options
         * 
         * 
         * Warning : mandatory options depend on dataType - see comments in the function
         * 
         *   option structure {
         *      title: // popup title
         *      content: // html content appended within Popup <div class='description'></div> DOM element
         *      hint: // hint to displayed within input box
         *      dataType: // dataType
         *      size: // Input box size
         *      value: // default value to be displayed (or enumeration in case of dataType="list")
         *      callback: // callback function on value change
         */
        askFor:function(options) {
            
            options = options || {};
            
            var id,
            data,
            self = this,
            input = [],
            /* Create popup */
            popup = new M.Popup({
                modal:true,
                autoSize:true,
                centered:true,
                header:options.title,
                body:options.content ? options.content : ''
                
            });
            
            /*
             * dataType='list' special case
             * 
             * options.value should be an array of object
             *      {
             *          title: Display item title
             *          value: Value returned on click
             *          icon: // optional
             *      }
             */
            if (options.dataType === "list") {
                
                var el,icon,count = 0;
                
                /*
                 * Roll over items
                 */
                for (var i in options.value) {
                    id = this.getId();
                    el = options.value[i];
                    icon = el.icon ? '<img class="middle" src="'+el.icon+'"/>&nbsp;' : '';
                    popup.append('<a href="#" class="button marged" id="'+id+'">'+icon+el.title+'</a>', 'body');
                    
                    /*
                     * Return item value to callback on click
                     */
                    (function(d, a, c, v){
                        a.click(function(e){
                            if ($.isFunction(c)){
                                c(v);
                            }
                            d.remove();
                            return false;
                        });
                    })(popup, $('#'+id), options.callback, el.value);
                
                    count++;
                }
                
            }
            /*
             * dataType='complexData' special case
             * 
             * Dedicated options are 
             *      
             *      supportedFormat:  // optional
             *      maximumMegaBytes: // optional
             *      file: // File object - optional 
             *      fileUrl: // Url to file - optional
             *      upload: // Set to true to upload selected file on server
             *                 before sending back result to callback function
             *                 In this case, callback function will always get
             *                 a fileUrl back 
             *     
             * Structure of supportedFormat is
             * 
             *      [
             *          {
             *              mimeType://
             *              encoding://
             *              schema://
             *          },
             *          ...
             *      ]
             * 
             * A Drag&Drop zone is set with an hidden OK button
             * When user Drop a valid file, the OK button is shown
             * 
             * 
             */
            else if (options.dataType === "complexData") {
                
                /*
                 * Set validate button
                 */
                id = this.getId();
                
                /*
                 * Set drop zone
                 */
                if (M.DDZone) {
                    new M.DDZone({
                        parent:popup.$b,
                        maximumMegaBytes:options.maximumMegaBytes,
                        supportedFormats:options.supportedFormats,
                        file:options.file,
                        fileUrl:options.fileUrl,
                        success:function(_data) {
                            popup.center();
                            data = _data;
                            $('#'+id).show();
                        }
                    });
                }
                popup.append('<p class="big center padded"><br/><a href="#" class="button inline validate" id="'+id+'">'+M.Util._("Set")+'</a></p>', 'body');
                $('#'+id).click(function(){
                    
                    /*
                     * If options.upload is set to true, then
                     * the dropped file is uploaded to the server
                     * This is equivalent to transform a local 'file'
                     * to a 'fileUrl' - callback function is then
                     * call with a 'fileUrl'
                     * This 
                     *  
                     */
                    if (options.upload && data.file) {
                        self.upload(data.file,{
                            formats:options.supportedFormats,
                            maximumMegabytes:options.maximumMegaBytes,
                            callback:function(items) {
                                
                                /*
                                 * Only one file has been dropped, but the result
                                 * can contains more than one item (it is the case for
                                 * jpeg dropped files for example, where mapshup automatically
                                 * associate a "Photography" layer referenced by a second item
                                 * 
                                 * In this case, we pick up the first item
                                 */
                                if ($.isArray(items)) {
                                    if ($.isFunction(options.callback)) {
                                        options.callback({
                                            fileUrl:items[0].url
                                        });
                                    }
                                    popup.remove();
                                }
                                else {
                                    M.Util.message("Error : cannot upload file on server");
                                }
                            }
                        });
                    }
                    else {
                        if ($.isFunction(options.callback)) {
                            options.callback(data);
                        }
                        popup.remove();
                    }
                });
                
                /*
                 * Hide "set" button
                 */
                if(!options.file && !options.fileUrl) {
                    $('#'+id).hide();
                }
                
            }
            else {
                
                /*
                 * Get unique ids
                 */
                id = this.getId();
                
                /*
                 * Append input text box to body
                 */
                popup.append('<input id="'+id+'" type="text" size="'+(options.size || 10)+'"/>', 'body');
                
                /*
                 * Set default value if defined
                 * Input value is encoded to avoid javascript code injection
                 */
                input = $('#'+id);
                if (options.value) {
                    input.val(this.stripTags(options.value));
                }
                /*
                 * Or set input text box placeholder
                 */
                else if (options.hint) {
                    input.attr('placeholder', options.hint);
                }
                
                /*
                 * Add action on input text box (see fct above)
                 */
                input.focus(function(){
                    this.select();
                }).keypress(function(e){
                    
                    /*
                     * Input value is encoded to avoid javascript code injection
                     */   
                    var isValid = false, v = self.stripTags($(this).val());
                    
                    /*
                     * Close on ESC key
                     */
                    if (e.keyCode === 27) {
                        popup.remove(); 
                    }
                    
                    /*
                     * Return or tab keys
                     */
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        
                        switch(options.dataType.toLowerCase()) {
                            case"date":
                                self.isDateOrInterval(v) || self.isISO8601(v) ? isValid = true : self.message(self._("Expected format is YYYY-MM-DD for a single date or YYYY-MM-DD/YYYY-MM-DD for a date interval"));
                                break;
                            case "bbox":
                                self.isBBOX(v) ? isValid = true : self.message(self._("Expected format is lonmin,latmin,lonmax,latmax"));
                                break;
                            case "integer":
                                self.isInt(v) ?  isValid = true : self.message(self._("Error : not a valid Integer"));
                                break;
                            case "float":
                                self.isFloat(v) ?  isValid = true : self.message(self._("Error : not a valid Float"));
                                break;     
                            case "double":
                                self.isFloat(v) ?  isValid = true : self.message(self._("Error : not a valid Double"));
                                break;
                            case "boolean":
                                self.isBoolean(v) ?  isValid = true : self.message(self._("Error : not a valid Boolean"));
                                break;
                            default:
                                isValid = true;
                        }
                        
                        /*
                         * Send back value to callback function and close popup
                         */
                        if (isValid) {
                            if ($.isFunction(options.callback)) {
                                options.callback(v);
                            }
                            popup.remove(); 
                        }
                        
                        return false;
                        
                    }
                    
                });
                
            }
            
            /*
             * Show the modal window
             */
            popup.show();
            
            /*
             * Set focus on input box if defined
             */
            if (input.length > 0) {
                input.focus();
            }
            
            return popup;
            
        },
        
        /**
         * Modified checksum function used to generate unique MID based on layer description
         * 
         * Based on http://noteslog.com/post/crc32-for-javascript/
         * (c) 2006 Andrea Ercolino http://www.opensource.org/licenses/mit-license.php
         * 
         * @param {String} str : string to coompute checksum on
         * @param {Integer} crc
         */
        crc32: function(str, crc) {
            
            var n = 0, x = 0; // number between 0 and 255
            
            if (crc === window.undefined) {
                crc = 0;
            }
            
            // hex number
            crc = crc ^ (-1);
            for( var i = 0, iTop = str.length; i < iTop; i++ ) {
                n = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
                x = "0x" + "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".substr( n * 9, 8 );
                crc = ( crc >>> 8 ) ^ x;
            }
            return "mid" + Math.abs(crc ^ (-1));
        },
        
        /**
         * Update html content of #message div and display it during "duration" ms
         * css('left') is computed each time to reflect map resize
         * 
         * @param {html} content
         * @param {Integer} duration (in milliseconds)
         */
        message: function(content, duration) {
            
            var $d,$content,fct,
            self = this,
            id = self.getId();
            
            /*
             * Create a message container and associate it
             * to a new entry within the messages array
             */
            M.$container.append('<div id="' + id + '" class="message"><div class="content"></div></div>');
            $d = $('#' + id);
            self.messages[id] = $d;
            
            /*
             * Set update position function
             */
            fct = function() {
                
                var $message, message, top = 30;
                
                for (message in self.messages) {
                    $message = self.messages[message];
                    $message.css({
                        'top':top
                    });
                    top = $message.position().top + $message.height() + 5;
                }
                
            };
            
            /*
             * Set content
             */
            $content = $('.content',$d).html(content);
            self.addClose($content,function(e){
                delete self.messages[$d.attr('id')];
                $d.remove();
                fct();
            });
                
            /*
             * duration is set to -1
             * In this case, message is not automatically closed
             */
            if (duration && duration === -1) {
                $d.show();
                fct();
            }
            else {
                $d.fadeIn('slow').delay(duration || 2000).fadeOut('slow', function(){
                    delete self.messages[$d.attr('id')];
                    $d.remove();
                    fct();
                });
            }
            
            $d.css({
                'left': (M.$container.width() - $d.width()) / 2,
                'top' : 30
            });

            return $d;
        },
        
        /**
         * Replace all space,',",.,: and # characters from "str" by "_"
         * 
         * @param {String} str
         */
        encode: function(str) {
            if (!str) {
                return str;
            }
            return str.replace(/[',", ,\.,#,\:,\ ]/g,"_");
        },
    
        /**
         * Return base url (i.e. url without parameters) from an input url
         * E.g. extractBaseUrl("http://myserver.com/test?foo=bar") will return "http://myserver.com/test?"
         * 
         * @param {String} url
         * @param {Array} arr : if arr is not specified remove all url parameters
         *                      otherwiser only remove parameters set in arr
         */
        extractBaseUrl: function(url, arr) {
            
            var baseUrl, u = this.repareUrl(url);
            
            if (!u) {
                return null;
            }
            
            /*
             * Extract base url i.e. everything befor '?'
             */
            baseUrl = u.match(/.+\?/)[0];
            
            if (!arr || arr.length === 0) {
                return baseUrl;
            }
        
            var addToBaseUrl, key, i, l, kvps = this.extractKVP(url, true);
            
            for (key in kvps) {
                addToBaseUrl = true;
                for (i = 0, l = arr.length;i<l;i++) {
                    if (key === arr[i]) {
                        addToBaseUrl = false;
                        break;
                    }
                }
                if (addToBaseUrl) {
                    baseUrl += encodeURIComponent(key) + "=" + encodeURIComponent(kvps[key]) + "&";
                }
            }
        
            return baseUrl;
            
        },
        
        /**
         * Extract Key/Value pair from an url like string
         * (e.g. &lon=123.5&lat=2.3&zoom=5)
         * 
         * @param {String} str
         * @param {boolean} lowerCasedKey
         */
        extractKVP: function(str, lowerCasedKey) {
            var c = {};
            str = str || "";
            str.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key )] = (value === undefined) ? true : decodeURIComponent(value);
            });
            return c;
        },
            
        /**
         * Return an absolute URL.
         * If input url starts with '/', it is assumed that input url
         * is relative to the Config.general.serverRootUrl
         * 
         *  @param {String} url
         */
        getAbsoluteUrl: function(url) {

            /*
             * url is absolute => return url
             * else return absolute url
             */
            if (url && M.Config["general"].serverRootUrl) {

                /*
                 * Be carefull of array of url !
                 */
                if (typeof url === "object") {
                    return url;
                }
                
                /*
                 * If url does not start with '/' then returns it without modification
                 */
                return (this.isUrl(url) || url.substr(0,1) !== '/') ? url : M.Config["general"].serverRootUrl + url;
                
            }
            
            return url;
        },

        /**
         * Return a unique id
         */
        getId: function() {
            return "mid"+this.sequence++;
        },
        
        /**
         * Return a unique id
         * 
         * @param {String} f : fileName
         */
        getImgUrl: function(f) {
            
            /*
             * fileName is returned as is if it is :
             *  - null
             *  - a fully qualified url (i.e. starts with http:)
             *  - a base64 encoded image stream (i.e. starts with data:)
             */
            return (!f || f.substr(0,5) ==='http:' || f.substr(0,6) ==='https:' || f.substr(0,5) ==='data:') ? f : M.Config["general"].rootUrl + M.Config["general"].themePath+"/img/"+f;
        },
        
        /**
         * Return the obj.property value if defined or value if not
         * 
         * @param {Object} obj
         * @param {Object} property
         * @param {String} value
         */
        getPropertyValue: function(obj, property, value) {
            
            /*
             * This should never happened...
             */
            if (obj === undefined || property === undefined) {
                return undefined;
            }
            
            /*
             * Property is set, returns its value
             */
            if (obj.hasOwnProperty(property)) {
                return obj[property];
            }
            
            /*
             * Returns the input value
             */
            return value;
        },
        
        /**
         * 
         * A valid BBOX object should be defined as
         *      {
         *          bounds:"xmin,ymin,xmax,ymax"
         *          srs: // optional if srs is specified
         *          crs: // optional is crs is specified
         *      }
         *      
         *  If input bbox is valid, then this function returns
         *  the unmodified bbox
         *  
         *  Else if input bbox is a string as "xmin,ymin,xmax,ymax" then
         *  this function returns the following object
         *      {
         *          bounds: input bbox,
         *          srs:"EPSG:4326"
         *      }
         *  
         *  Otherwise, this function returns the default value
         *  
         *  @param {Object} bbox
         *  @param {Object} value
         *  
         */
        getValidBBOX: function(bbox, value) {
            
            /*
             * Paranoid mode
             */
            if (bbox === undefined) {
                return value;
            }
            
           /*
            * If input bbox is a String then it is supposed that the input string corresponds
            * to an EPSG:4326 string (i.e. lonMin,latMin,lonMax,latMax)
            */
            if (typeof bbox === "string") {
                bbox = {
                    bounds: bbox,
                    srs: 'EPSG:4326'
                };
            }
            
            /*
             * Property is set, returns its value
             */
            if (bbox.hasOwnProperty("bounds")) {
                return bbox;
            }
            
            /*
             * Returns the input value
             */
            return value;
        },
            
        /**
         * Return true if input value is a boolean
         * i.e. an integer number with value
         * between -9007199254740990 to 9007199254740990
         * 
         *  @param {String} n
         */
        isBoolean: function(n) {
            if (typeof n === "boolean") {
                return true;
            }
            return n === "true" || n === "false" ? true : false;
        },
        
        
        /**
         * Return true if input value is an integer
         * i.e. an integer number with value
         * between -9007199254740990 to 9007199254740990
         * 
         *  @param {String} n
         */
        isInt: function(n) {
            if (!$.isNumeric(n)) {
                return false;
            }
            return !(parseFloat(n) % 1);
        },
         
        /**
         * Return true if input value is a float
         * i.e. a real number including Infinity and -Infinity but not NaN
         * 
         *  @param {String} n
         */
        isFloat: function(n) {
            return $.isNumeric(n);
        },
         
        /**
         * Check if a string is a valid BBOX
         * A valid BBOX is :
         *   - 4 decimal values comma separated A,B,C,D
         *   - A < C
         *   - B < D
         *   
         * @param {String} str
         */
        isBBOX: function (str) {
            if (!str || str.length === 0) {
                return false;
            }
            var arr = str.split(',');
            if (arr.length !== 4) {
                return false;
            }
            for (var i=0;i<3;i++) {
                if (!$.isNumeric(arr[i])) {
                    return false;
                }
            }
            if (parseFloat(arr[0]) > parseFloat(arr[2]) || parseFloat(arr[1]) > parseFloat(arr[3])) {
                return false;
            }
            return true;
        },

        /**
         * Check if a string is a valid date i.e. YYYY-MM-DD
         * 
         * @param {String} str
         */
        isDate: function(str) {

            /*
             * Paranoid mode
             */
            if (!str || str.length === 0) {
                return false;
            }

            /*
             * Days in month
             */
            var daysInMonth = [31,29,31,30,31,30,31,31,30,31,30,31],
            elements = str.split('-');
            
            /*
             * Format is YYYY-MM-DD
             */
            if (elements.length !== 3) {
                return false;
            }

            var y = parseInt(elements[0], 10),
            m = parseInt(elements[1], 10),
            d = parseInt(elements[2], 10);

            /*
             * February has 29 days in any year evenly divisible by four,
             * EXCEPT for centurial years which are not also divisible by 400.
             */
            var daysInFebruary = ((y % 4 === 0) && ( (!(y % 100 === 0)) || (y % 400 === 0))) ? 29 : 28;

            if (elements[0].length !==4 || y < 1900 || y > 2100) {
                return false;
            }
            if (elements[1].length !==2 || m < 1 || m > 12) {
                return false;
            }
            if (elements[2].length !==2 || d < 1 || d > 31 || (m === 2 && d > daysInFebruary) || d > daysInMonth[m]) {
                return false;
            }

            return true;
        },
        
        /**
         * Check if a string is a valid date or date interval
         * i.e. YYYY-MM-DD or YYYY-MM-DD/YYYY-MM-DD
         * 
         * @param {String} str
         */
        isDateOrInterval:function(str) {
            
            /*
             * Paranoid mode
             */
            if (str === undefined || str.length === 0) {
                return false;
            }
            
            /*
             * Input strDate can be a date or an interval
             * YYYY-MM-DD or YYYY-MM-DD/YYYY-MM-DD
             */
            var dates = str.split('/'),
            empty = 0,
            i,
            l;
                
            if (dates.length > 2) {
                return false;
            }
            
            /*
             * Roll over dates
             */
            for (i = 0, l = dates.length; i < l; i++) {
                
                /*
                 * Date is not valid return false
                 * unless it is empty (see below)
                 */
                if (!this.isDate(dates[i])) {
                    if (dates[i] === "") {
                        empty++;
                    }
                    else {
                        return false;
                    }
                }
            }
            
            /*
             * We want to allow unclosed interval
             * i.e. YYYY-MM-DD/ and /YYYY-MM-DD
             * so if only one empty is present the 
             * interval is still valid
             */
            if (dates.length - empty < 1) {
                return false;
            } 
            
            return true;

        },
        
        /**
         * Check if a string is a valid email adress
         * 
         * @param {String} str
         */
        isEmailAdress: function (str) {
            if (!str || str.length === 0) {
                return false;
            }
            var pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/;
            return pattern.test(str);
            
        },
        
        /**
         * Check if input mimeType is supported
         * 
         * @param {Array} formats : // Array of {mimeType://}
         * @param {String} mimeType
         */
        isSupportedMimeType:function(formats, mimeType) {
            
            formats = formats || [];
            
            var i, l = formats.length;
            
            /*
             * If no supportedFormats are defined, then
             * it supposes that every format is supported
             */
            if (l === 0) {
                return true;
            }

            for (i = 0; i < l; i++) {
                if (formats[i].mimeType.toLowerCase() === mimeType.toLowerCase()) {
                    return true;
                }
            }
            
            return false;
            
        },
        
        /**
         * Check if a string is a valid ISO8601 date or interval
         * i.e. YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss/YYYY-MM-DDTHH:mm:ss
         * 
         * @param {String} str
         */
        isISO8601: function (str) {

            /*
             * Paranoid mode
             */
            if (str === undefined || str.length === 0) {
                return false;
            }
            
            /*
             * Input strDate can be a date or an interval
             * YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss/YYYY-MM-DDTHH:mm:ss
             */
            var isos = str.split('/');
            if (isos.length > 2) {
                return false;
            }

            var arr;

            /*
             * Roll over iso8601s
             */
            for (var i = 0, l = isos.length; i < l; i++) {
                arr = isos[i].split('T');
                if (arr.length !== 2) {
                    return false;
                }
                if (!this.isDate(arr[0])) {
                    return false;
                }
                if (!this.isTime(arr[1])) {
                    return false;
                }
            }

            return true;

        },
        
        /**
         * Check if a string is a valid time i.e. HH:mm:ss or HH:mm:ssZ
         * 
         * @param {String} str
         */
        isTime: function(str) {

            /*
             * Paranoid mode
             */
            if (!str || str.length === 0) {
                return false;
            }

            /*
             * Remove last character if it's a Z
             */
            if (str.indexOf('Z') === str.length - 1) {
                str = str.substring(0,str.length - 1);
            }

            /*
             * Format is HH:mm:ss.mmm
             */
            var elements = str.split(':');
            if (elements.length !== 3) {
                return false;
            }

            var h = parseInt(elements[0], 10),
            m = parseInt(elements[1], 10),
            s = parseInt(elements[2], 10);
            
            if (elements[0].length !==2 || h < 0 || h > 23) {
                return false;
            }
            if (elements[1].length !==2 || m < 0 || m > 59) {
                return false;
            }
            if (elements[2].length !==2 || s < 0 || s > 59) {
                return false;
            }

            return true;
        },
        
        /*
         * Return true if input string is a valid url
         */
        isUrl: function(str) {
            
            if (str && typeof str === "string") {
                
                var s = str.substr(0,7);
                
                if (s === 'http://' || s === 'https:/' || s === 'ftp://') {
                    return true;
                }
            }
                
            return false;
            
        },
        
        /**
         * Add pagination info to an input url
         *
         * @param {String} url : url to paginate
         * @param {Object} p : pagination info
         *                  {
         *                      nextRecord:{
         *                          name: // name of the nextRecord key
         *                          value: // value of nextRecord
         *                      },
         *                      numRecordsPerPage:{
         *                          name: // name of the numRecordsPerPage key
         *                          value: // value of numRecordsPerPage
         *                      }
         *                  }
         *                  
         */
        paginate: function(url, p) {
            if (p) {
                if (p.nextRecord) {
                    url = this.repareUrl(url) + p.nextRecord.name + "=" + p.nextRecord.value;
                }
                if (p.numRecordsPerPage) {
                    url = this.repareUrl(url) + p.numRecordsPerPage.name + "=" + p.numRecordsPerPage.value;
                }
            }
            return url;
        },
        
        
        /**
         * Return a "proxified" version of input url
         *
         * @param {String} url : url to proxify
         * @param {String} returntype : force HTTP header to the return type //optional
         */
        proxify: function(url, returntype) {
            
            /*
             * If proxyUrl is set then proxify input url
             */
            if (M.Config["general"].proxyUrl && M.Config["general"].proxyUrl !== "") {
                return this.getAbsoluteUrl(M.Config["general"].proxyUrl)+this.abc+(returntype ? "&returntype="+returntype : "")+"&url="+encodeURIComponent(url);
            }
            
            /*
             * otherwise, do nothing i.e. just return unmodified url
             */
            return url;
        },
        
        /**
         * Return a random color hex value
         */
        randomColor: function(){
            var colors = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"],
            d1 = "",
            d2 = "",
            d3 = "",
            i;
            for (i=0;i<2;i++) {
                d1=d1+colors[Math.round(Math.random()*15)];
                d2=d2+colors[Math.round(Math.random()*15)];
                d3=d3+colors[Math.round(Math.random()*15)];
            }
            return '#'+d1+d2+d3;
        },

        /**
         * Parse a string containing keys between dollars $$ and replace these
         * keys with obj properties.
         * Example :
         *      str = "Hello my name is $name$ $surname$"
         *      keys = {name:"Jerome", surname:"Gasperi"}
         *      modifiers = {name:{transform:function(v){...}}
         *
         *      will return "Hello my name is Jerome Gasperi"
         *
         * @param {String} template : template with keys to process
         * @param {Object} keys : object containing the property keys/values
         * @param {Object} modifiers : object containing the property keys
         */
        parseTemplate: function (template, keys, modifiers) {

            /*
             * Paranoid mode
             */
            keys = keys || {};
            modifiers = modifiers || {};
            
            /*
             * Be sure that str is a string
             */
            if (typeof template === "string") {

                /*
                 * Replace all $key$ within string by obj[key] value
                 */
                return template.replace(/\$+([^\$])+\$/g, function(m) {
                    
                    var k,
                    key = m.replace(/[\$\$]/g, ''),
                    value = keys[key];
                        
                    /*
                    * Roll over the modifiers associative array.
                    * 
                    * Associative array entry is the key
                    * 
                    * This array contains a list of objects
                    * {
                    *      transform: // function to apply to value before replace it
                    *            this function should returns a string
                    * }
                    */
                    for (k in modifiers) {

                        /*
                        * If key is found in array, get the corresponding value and exist the loop
                        */
                        if (key === k) {

                            /*
                            * Transform value if specified
                            */
                            if ($.isFunction(modifiers[k].transform)) {
                                return modifiers[k].transform(value);
                            }
                            break;
                        }
                    }

                    /*
                    * Return value or unmodified key if value is null
                    */
                    return value != null ? value : "$"+key+"$";
                    
                });
                
            }

            return template;

        },
        
        /**
         * Repare a wrong URL regarding the following principles :
         *
         *  - If no "?" character is found, returns url+"?"
         *  - else if last character is "?" or "&", returns url
         *  - else if a "?" character is found but the last character is not "&", returns url+"&"
         *
         * @param {String} url
         */
        repareUrl: function(url) {
            if (!url) {
                return null;
            }
            var questionMark = url.indexOf("?");
            if (questionMark === -1) {
                return url+"?";
            }
            else if (questionMark === url.length - 1 || url.indexOf("&",url.length - 1) !== -1) {
                return url;
            }
            else {
                return url+"&";
            }
        },

        /**
         * Reduce the length of a string "str" to "sizemax"
         *
         * @param {String} str : String to reduce
         * @param {Integer} sizemax : maximum length of the returned string
         * @param {boolean} end : 'true'  the end of str is shrinked
         *                        'false' the middle of str is shrinked
         */
        shorten: function(str,sizemax,end) {
            
            if (!str) {
                return null;
            }
            
            var ta = document.createElement("textarea");
            ta.innerHTML = str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
            str = ta.value;
            ta = null;
            end = end || false;
            
            if (str) {
                
                var size = str.length;
                
                /*
                 * Input string length is lower than sizemax.
                 * Return input string
                 */
                if (size <= sizemax) {
                    return str;
                }

                /*
                 * Shrink the end of the input string
                 */
                if (end) {
                    return str.substring(0,sizemax - 3)+"...";
                }

                /*
                 * Default : shrink the middle of input string
                 */
                var halfsize = Math.round(sizemax/2);
                return str.substring(0,halfsize-1)+"..."+str.substring(size-halfsize+3);
            }
            return str;
        },
        
        /**
         * Find "shorten_sizemax" class within a $div and reduce the length of
         * the class content text() to sizemax (30 by default)
         *
         * @param {jQuery} $div
         * @param {boolean} end : 'true'  the end of str is shrinked
         *                        'false' the middle of str is shrinked
         */
        findAndShorten:function($div, end) {
            
            /*
             * Find shorten_*
             */
            $('[class^=shorten]', $div).each(function(){
                
                // Find shorten classname
                var i, l, sizemax = 30, names = $(this).attr("class").split(" ");
                for (i = 0, l = names.length; i < l; i++) {
                    if (names[i].indexOf("shorten") === 0) {
                        sizemax = parseInt(names[i].split("_")[1]);
                    }
                }
                $(this).html(M.Util.shorten($(this).text(), sizemax, end));
            });
        
        },
            
        /**
         * Sort input array in alphabetical order
         * using key property
         * 
         * @param {Array} arr
         * @param {String} key
         */ 
        sortArray:function(arr, key) {
            if (typeof arr === "object" && arr.length && key) {
                var scope = this;
                arr.sort(function(a,b){
                    var nameA = scope._(a[key]).toLowerCase();
                    var nameB = scope._(b[key]).toLowerCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                });
            }   
        },
        
        /*
         * Convert an XML text to XML object
         */
        textToXML: function(text) {
            try {
                var parser, found, xml = null;

                if ( window.DOMParser ) {

                    parser = new DOMParser();
                    xml = parser.parseFromString( text, "text/xml" );

                    found = xml.getElementsByTagName( "parsererror" );

                    if ( !found || !found.length || !found[ 0 ].childNodes.length ) {
                        return xml;
                    }

                    return null;
                }
                else {

                    xml = new ActiveXObject( "Microsoft.XMLDOM" );

                    xml.async = false;
                    xml.loadXML( text );

                    return xml;
                }
            } catch (e) {
                return null;
            }
        },
        
        lowerFirstLetter:function(string) {
            return string.charAt(0).toLowerCase() + string.slice(1);
        },
        
        /**
         * Upload files to server
         *
         * @param {Array} files : array of files to upload
         * @param {Object} options : upload options
         *                          {
         *                              formats: // Array of {mimeType:}
         *                              maximumMegabytes: // max size for uploaded file // MANDATORY
         *                              callback: callback function on successfull upload
         *                          }
         * 
         */
        upload:function(files, options) {

            var i, l, form, validFiles = [], self = this;
            
            options = options || {};
            
            /*
             * input files should be an array
             */
            if (!$.isArray(files)) {
                files = [files];
            }
            
            /*
             * Tell user that we are processing things !
             */
            M.mask.add({
                title:this._("Upload files")+"...",
                cancel:false
            });

            /*
             * Roll over files and check validity
             */
            $(files).each(function(key, file) {

                /*
                 * mimeType checking
                 */
                if (!self.isSupportedMimeType(options.formats, file.type)) {
                    self.message(M.Util._("Error : mimeType is not supported")+ ' ['+file.type+']');
                    return false;
                }
                /*
                 * size checking
                 */
                if (file.size/1048576 > options.maximumMegabytes) {
                    self.message(M.Util._("Error : file is to big")+ ' ['+file.name+']');
                    return false;
                }
                
                /*
                 * Add a valid file
                 */
                validFiles.push(file);
                
                return true;
            });
            
            /*
             * Upload validFiles
             */
            if (validFiles.length > 0) {

                /*
                 * Work-around for Safari occasionally hanging when doing a
                 * file upload.  For some reason, an additional HTTP request for a blank
                 * page prior to sending the form will force Safari to work correctly.
                 *
                 * See : http://www.smilingsouls.net/Blog/20110413023355.html
                 */
                $.get('./blank.html');

                var http = new XMLHttpRequest();

                /*
                 * Listen the end of the process
                 */
                http.onreadystatechange = function() {

                    var result;
                    
                    /*
                     * End of the process is readyState 4
                     * Successfull status is 200 or 0 (for localhost)
                     */
                    if (http.readyState === 4 && (http.status === 200 || http.status === 0)) {

                        M.mask.hide();

                        result = JSON.parse(http.responseText);

                        /*
                         * In case of success, roll over processed items
                         */
                        if (result.error) {
                            M.Util.message(result.error["message"]);
                        }
                        else {
                            if (result.items) {
                                if ($.isFunction(options.callback)) {
                                    options.callback(result.items);
                                }
                            }
                        }
                    }
                };

                if (typeof(FormData) !== 'undefined') {

                    form = new FormData();
                    form.append('path', '/');

                    for (i = 0, l = files.length; i < l; i++) {
                        form.append('file[]', files[i]);
                    }
                    
                    http.open('POST', M.Util.getAbsoluteUrl(M.Config["upload"].serviceUrl)+M.Util.abc+"&magic=true");
                    http.send(form);
                } else {
                    M.Util.message('Error : your browser does not support HTML5 Drag and Drop');
                }
            }
            else {
                M.Util.message('Error : this file type is not allowed');
                M.mask.hide();
            }
        }
        
    };

})(window, window.M, window.document);