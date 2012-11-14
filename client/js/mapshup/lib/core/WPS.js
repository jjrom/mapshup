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
 * WPS protocol reader implementation of OGC 05-007r7 and 08-091r6
 * 
 * See http://www.opengeospatial.org/standards/wps
 * 
 */
(function(msp) {
    
     
    /*
     * Initialize msp
     */
    msp = msp || {};
    
    /*
     * Initialize msp.WPS
     */
    msp.WPS = function(url) {
        
        
        /**
         * WPS Events manager reference
         */
        this.events = new msp.WPS.Events();
        
        /**
         * WPS base url
         */
        this.url = url;
        
        /**
         * WPS Title - read from GetCapabilities document
         */
        this.title = null;
        
        /**
         * WPS Abstract - read from GetCapabilities document
         */
        this["abstract"] = null;
        
        /**
         * WPS Service version
         */
        this.version = "1.0.0";
        
        /**
         * WPS Service Provider information - read from GetCapabilities document
         */
        this.serviceProvider = {};
        
        /**
         * Hashtag of msp.WPS.Process objects stored by unique identifier
         */
        this.processes = [];
        
        /**
         * Initialize WPS class
         */
        this.init = function(url) {
            this.url = url;
        };
        
        /**
         * Call GetCapabilities throught ajax request
         * and parse result
         */
        this.getCapabilities = function() {
            
            var url, self = this;
            
            /*
             * getcapabilities has been already called
             *  => no need to call it again !
             */
            if (self.title) {
                self.events.trigger("getcapabilities");
            }
            /*
             * Call GetCapabilities through ajax
             */
            else {
                
                /*
                 * Set GetCapabilities url
                 */
                url = msp.Util.extendUrl(this.url, {
                    service:'WPS',
                    version:self.version,
                    request:'GetCapabilities'
                });

                /*
                 * Retrieve and parse GetCapabilities file
                 */
                msp.Util.ajax({
                    url:msp.Util.proxify(msp.Util.repareUrl(url), "XML"),
                    async:true,
                    dataType:'xml',
                    success:function(xml) {
                        self.parseCapabilities(xml);
                        self.events.trigger("getcapabilities", self);
                    },
                    error:function(e) {
                        msp.Util.message(msp.Util._("Error reading Capabilities file"));
                    }
                }, {
                    title:msp.Util._("WPS") + " : " + msp.Util._("Get capabilities"),
                    cancel:true
                });
            }
            
        };
        
        /**
         * Call DescribeProcess throught ajax request
         * and parse result
         * 
         * @input {Array} identifiers : array of Process unique identifiers
         * 
         */
        this.describeProcess = function(identifiers) {
           
            var url, self = this;
            
            /*
             * Convert input to array if needed
             */
            if (!$.isArray(identifiers)) {
                identifiers = [identifiers];
            }
            
            /*
             * Call DescribeProcess through ajax
             */
            url = msp.Util.extendUrl("http://localhost/mspsrv/plugins/wps/describeProcess_urn-ogc-cstl-wps-jts-buffer.xml", {
                service:'WPS',
                version:self.version,
                request:'DescribeProcess',
                identifier:identifiers.join(',')
            });

            /*
             * Retrieve and parse DescribeProcess file
             */
            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.repareUrl(url), "XML"),
                async:true,
                dataType:'xml',
                success:function(xml) {
                    var i, l, processDescriptions = self.parseDescribeProcess(xml), processes = [];
                    for (i = 0, l = processDescriptions.length; i < l; i++) {
                        self.processes[processDescriptions[i].identifier] = new msp.WPS.Process(processDescriptions[i]);
                        processes.push(self.processes[processDescriptions[i].identifier]);
                    }
                    self.events.trigger("describeprocess", processes);
                },
                error:function(e) {
                    msp.Util.message(msp.Util._("Error reading DescribeProcess file"));
                }
            }, {
                title:identifiers.join(',') + " : " + msp.Util._("Get DescribeProcess"),
                cancel:true
            });
           
            
        };
        
        /**
         * Get an xml GetCapabilities object and return
         * a javascript object
         * 
         * GetCapabilities structure is :
         * 
         * <wps:Capabilities service="WPS" xml:lang="en-EN" version="1.0.0" updateSequence="1352815432361">
         *      <ows:ServiceIdentification>
         *          [...See Service Identification below...]
         *      </ows:ServiceIdentification>
         *      <ows:ServiceProvider>
         *          [...See Service Provider below...]
         *      </ows:ServiceProvider>
         *      <ows:OperationsMetadata>
         *          [...See Operations Metadata below...]
         *      </ows:OperationsMetadata>
         *      <wps:ProcessOfferings>
         *          [...See Process below...]
         *      </wps:ProcessOfferings>
         *      <wps:Languages>
         *          [...]
         *      </wps:Languages>
         *      <wps:WSDL xlink:href=""/>
         *  </wps:Capabilities>
         * 
         */
        this.parseCapabilities = function(xml) {
            
            var self = this;
            
            /*
             * jquery 1.7+ query selector using find('*') and filter()
             * See http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
             */
            $(xml).find('*').filter(function(){
                
                /*
                 * Service identification
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <ows:ServiceIdentification>
                 *      <ows:Title>WPS server</ows:Title>
                 *      <ows:Abstract>WPS server developed by XXX.</ows:Abstract>
                 *      <ows:Keywords>
                 *          <ows:Keyword>WPS</ows:Keyword>
                 *          <ows:Keyword>XXX</ows:Keyword>
                 *          <ows:Keyword>geoprocessing</ows:Keyword>
                 *      </ows:Keywords>
                 *      <ows:ServiceType>WPS</ows:ServiceType>
                 *      <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
                 *      <ows:Fees>NONE</ows:Fees>
                 *      <ows:AccessConstraints>NONE</ows:AccessConstraints>
                 * </ows:ServiceIdentification>
                 * 
                 * Note that this function only store :
                 *      Title
                 *      Abstract
                 *      
                 */
                if (msp.Util.stripNS(this.nodeName) === 'ServiceIdentification') {
                    
                    $(this).children().filter(function() {
                        var nn = msp.Util.stripNS(this.nodeName);
                        if (nn === 'Title' || nn === 'Abstract') {
                            self[msp.Util.lowerFirstLetter(nn)] = $(this).text();
                        }
                    });
                }
                
                /*
                 * Service Provider
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <ows:ServiceProvider>
                 *      <ows:ProviderName>mapshup</ows:ProviderName>
                 *      <ows:ProviderSite xlink:href="http://www.geomatys.com/"/>
                 *      <ows:ServiceContact>
                 *              <ows:IndividualName>Jerome Gasperi</ows:IndividualName>
                 *              <ows:PositionName>CEO</ows:PositionName>
                 *              <ows:ContactInfo>
                 *                  <ows:Phone>
                 *                      <ows:Voice>06 00 00 00 00</ows:Voice>
                 *                      <ows:Facsimile/>
                 *                  </ows:Phone>
                 *                  <ows:Address>
                 *                      <ows:DeliveryPoint>Somewhere</ows:DeliveryPoint>
                 *                      <ows:City>TOULOUSE</ows:City>
                 *                      <ows:AdministrativeArea>Haute-Garonne</ows:AdministrativeArea>
                 *                      <ows:PostalCode>31000</ows:PostalCode>
                 *                      <ows:Country>France</ows:Country>
                 *                      <ows:ElectronicMailAddress>jerome.gasperi@gmail.com</ows:ElectronicMailAddress>
                 *                  </ows:Address>
                 *              </ows:ContactInfo>
                 *     </ows:ServiceContact>
                 * </ows:ServiceProvider>
                 * 
                 * Note that this function only store the following
                 *      
                 *      {
                 *          name
                 *          site
                 *          contact:{
                 *              name
                 *              position
                 *              phone
                 *              address:{
                 *              
                 *              }
                 *          }
                 *      }
                 *              
                 *      
                 */
                else if (msp.Util.stripNS(this.nodeName) === 'ServiceProvider') {
                    
                    var contact = {}, address = {}, phone = {};
                    
                    /*
                     * Initialize serviceProvider
                     */
                    self.serviceProvider = {};
                    
                    $(this).children().filter(function() {
                        
                        switch (msp.Util.stripNS(this.nodeName)) {
                            /* ServiceContact*/
                            case 'ServiceContact':
                                $(this).children().each(function() {
                                    switch(msp.Util.stripNS(this.nodeName)) {
                                        /* ContactInfo*/
                                        case 'ContactInfo':
                                            $(this).children().each(function() {
                                                switch(msp.Util.stripNS(this.nodeName)) {
                                                    /* Phone */
                                                    case 'Phone':
                                                        phone = self.parseLeaf($(this));                      
                                                        break;
                                                    /* Address */
                                                    case 'Address':
                                                        address = self.parseLeaf($(this));
                                                        break;
                                                }
                                            });
                                            break;
                                        default:
                                            contact[msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName))] = $(this).text();
                                            break;
                                    }
                                });
                                break;
                            default:
                                self.serviceProvider[msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName))] = $(this).text();
                                break;
                        }
                        
                    });
                    
                    self.serviceProvider.contact = contact || {};
                    self.serviceProvider.contact["phone"] = phone;
                    self.serviceProvider.contact["address"] = address;
                    
                }
                
                /*
                 * Get individual processes
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <wps:ProcessOfferings>
                 *      <wps:Process wps:processVersion="1.0.0">
                 *          <ows:Identifier>urn:ogc:cstl:wps:jts:intersection</ows:Identifier>
                 *          <ows:Title>Jts : Intersection</ows:Title>
                 *          <ows:Abstract>Computes a intersection Geometry between the source geometry (geom1) and the other (geom2).</ows:Abstract>
                 *      </wps:Process>
                 *      [...]
                 * </wps:ProcessOfferings>
                 * 
                 */
                else if (msp.Util.stripNS(this.nodeName) === 'Process') {
                    self.addProcess(new msp.WPS.Process(self.parseLeaf($(this))));
                }
                
            });
            
            return true;
            
        };
        
        /**
         * Get an xml DescribeProcess object and return a javascript object
         * 
         * DescribeProcess structure is :
         * 
         * <wps:ProcessDescriptions xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" service="WPS" version="1.0.0" xml:lang="en-EN">
         *      <ProcessDescription storeSupported="true" statusSupported="true" wps:processVersion="1.0.0">
         *          <ows:Identifier>urn:ogc:cstl:wps:jts:buffer</ows:Identifier>
         *          <ows:Title>Jts : Buffer</ows:Title>
         *          <ows:Abstract>Apply JTS buffer to a geometry.</ows:Abstract>
         *          <DataInputs>
         *              [...See DataInputs below...]
         *          </DataInputs>
         *          <ProcessOutputs>
         *              [...See DataOutputs below...]
         *          </ProcessOutputs>
         *      </ProcessDescription>
         *      [...]
         *  </wps:Capabilities>
         * 
         */
        this.parseDescribeProcess = function(xml) {
            
            var self = this;
            
            /*
             * Initialize an empty process description
             */
            var processDescriptions = [];
            
            /*
             * jquery 1.7+ query selector using find('*') and filter()
             * See http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
             */
            $(xml).find('*').filter(function(){
                
                /*
                 * Service identification
                 * 
                 * ProcessDescription structure
                 * 
                 * <ProcessDescription>
                 *      <ows:Identifier>urn:ogc:cstl:wps:jts:buffer</ows:Identifier>
                 *      <ows:Title>Jts : Buffer</ows:Title>
                 *      <ows:Abstract>Apply JTS buffer to a geometry.</ows:Abstract>
                 *      <DataInputs>
                 *          [...See DataInputs below...]
                 *      </DataInputs>
                 *      <ProcessOutputs>
                 *          [...See DataOutputs below...]
                 *      </ProcessOutputs>
                 * </ProcessDescription>
                 *      
                 */
                if (msp.Util.stripNS(this.nodeName) === 'ProcessDescription') {
                    
                    
                    var nn, p = {};
                    
                    /* Retrieve ProcessDescription attributes */
                    $.extend(p, msp.Util.getAttributes($(this)));
                    
                    $(this).children().filter(function() {
                        nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));
                        /* Process Inputs and Outupts*/
                        if (nn === 'dataInputs' || nn === 'processOutputs') {
                            p[nn] = self.parseDescribePuts($(this).children());
                        }
                        else if (nn === 'title' || nn === 'identifier' || nn === 'abstract') {
                            p[nn] = $(this).text();
                        }
                        
                    });
                    
                    processDescriptions.push(p);
                }
                
            });
            
            return processDescriptions;
            
        };
        
        
       /**
        * Parse DataInputs (or ProcessOutputs) of the DescribeProcess elements
        * 
        * @input {Object} $obj : jQuery object reference to list of 'Input' (or 'Output') elements
        */
        this.parseDescribePuts = function($obj) {
            
            var nn, self = this, puts = [];
            
            /*
             * Parse each 'Input' (or 'Output') elements
             */
            $obj.each(function(){
                
                var p = {};
                
                /* Get attributes - i.e. minOccurs and maxOccurs for Input */ 
                $.extend(p, msp.Util.getAttributes($(this)));
                
                /*
                 * Parse each element from current element
                 */
                $(this).children().filter(function() {
                    
                    nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));

                    if (nn === 'complexData' || nn === 'complexOutput') {
                        p[nn] = self.parseDescribeComplexPut($(this));
                    }
                    else if (nn === 'literalData' || nn === 'literalOutput') {
                        p[nn] = self.parseDescribeLiteralPut($(this));
                    }
                    else if (nn === 'boundingBoxData' || nn === 'boundingBoxOutput') {
                        p[nn] = self.parseDescribeBoundingBoxPut($(this));
                    }
                    else if (nn === 'title' || nn === 'identifier' || nn === 'abstract') {
                        p[nn] = $(this).text();
                    }

                });
                
                puts.push(p);
            });
            
            return puts;
        };

       /**
        * Parse ComplexData (or ComplexOutput) of the DescribeProcess elements
        * 
        * Structure :
        * 
        *   <ComplexData maximumMegabytes="100">
        *           <Default>
        *                <Format>
        *                    <MimeType>application/gml+xml</MimeType>
        *                    <Encoding>utf-8</Encoding>
        *                    <Schema>http://schemas.opengis.net/gml/3.1.1/base/gml.xsd</Schema>
        *                </Format>
        *            </Default>
        *            <Supported>
        *                <Format>
        *                    <MimeType>text/xml</MimeType>
        *                    <Encoding>utf-8</Encoding>
        *                    <Schema>http://schemas.opengis.net/gml/3.1.1/base/gml.xsd</Schema>
        *                </format>
        *                [...]
        *            </Supported>
        *   </ComplexData>
        * 
        * @input {Object} $obj : jQuery object reference to a ComplexData (or a ComplexOutput) element
        */
        this.parseDescribeComplexPut = function($obj) {
            
            var nn, self = this, p = {};
            
            /* Get attributes - i.e. minOccurs and maxOccurs for Input */ 
            $.extend(p, msp.Util.getAttributes($obj));
                
            /*
             * Parse each ComplexData (or ComplexOutput) element
             */
            $obj.children().filter(function() {

                nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));

                if (nn === 'default') {
                    p[nn] = self.parseLeaf($(this).children());
                }
                else if (nn === 'supported') {
                    p[nn] = [];
                    $(this).children().filter(function() {
                        p[nn].push(self.parseLeaf($(this)));
                    });
                }

            });
            
            return p;
            
        };
        
       /**
        * Parse LiteralData (or LiteralOutput) of the DescribeProcess elements
        * 
        * 
        * 
        * 
        * @input {Object} $obj : jQuery object reference to a LiteralData (or a LiteralOutput) element
        */
        this.parseDescribeLiteralPut = function($obj) {
            
            var nn, self = this, p = {};
            
            /* Get attributes - i.e. minOccurs and maxOccurs for Input */ 
            $.extend(p, msp.Util.getAttributes($obj));
                
            /*
             * Parse each ComplexData (or ComplexOutput) element
             */
            $obj.children().filter(function() {

                nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));

                if (nn === 'default') {
                    p[nn] = self.parseLeaf($(this).children());
                }
                else if (nn === 'supported') {
                    p[nn] = [];
                    $(this).children().filter(function() {
                        p[nn].push(self.parseLeaf($(this)));
                    });
                }

            });
            
            return p;
            
        };

       /**
        * Parse BoundingBoxData (or BoundingBoxOutput) of the DescribeProcess elements
        * 
        *   <BoundingBoxData>
        *       <Default>
        *           <CRS>urn:ogc:def:crs:EPSG:6.6:4326</CRS>
        *       </Default>
        *       <Supported>
        *           <CRSsType>
        *               <CRS>urn:ogc:def:crs:EPSG:6.6:4326</CRS>
        *               <CRS>urn:ogc:def:crs:EPSG:6.6:4979</CRS>
        *           </CRSsType>
        *       </Supported>
        *   </BoundingBoxData>
        * 
        * @input {Object} $obj : jQuery object reference to a BoundingBoxData (or a BoundingBoxOutput) element
        */
        this.parseDescribeBoundingBoxPut = function($obj) {
            
            var nn, self = this, p = {};
            
            /*
             * Parse each ComplexData (or ComplexOutput) element
             */
            $obj.children().filter(function() {

                nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));

                if (nn === 'default') {
                    p[nn] = $(this).children().text();
                }
                else if (nn === 'supported') {
                    p[nn] = [];
                    $(this).children().filter(function() {
                        p[nn].push($(this).text());
                    });
                }

            });
            
            return p;
            
        };

       /**
        * Retrun a json representation of a Leaf jQuery element
        * 
        * @input {Object} $obj : jQuery object reference to a Format element
        * @input {boolean} nolower : if true the javascript is not camel-cased
        */
        this.parseLeaf = function($obj, nolower) {
            
            var p = {};
            
            $obj.children().each(function() {
                p[nolower ? msp.Util.stripNS(this.nodeName) : msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName))] = $(this).text();
            });           
            
            return p;
        };

       /**
        * Add process to this.processes list
        *
        * @param {Object} process : msp.WPS.Process object
        */
        this.addProcess = function(process) {
            
            /*
             * Paranoid mode
             */
            if (!process) {
                return false;
            }
            
            /*
             * Effectively add a new process
             */
            $.extend(process,{
                wps:this
            });
            
            this.processes[process.identifier] = process;
            
            return true;
            
        };
        
        /**
        * Get process from this.processes list based on its identifier
        *
        * @param {String} identifier : msp.WPS.Process object identifier
        */
        this.getProcess = function(identifier) {
            if (!identifier) {
                return null;
            }
            return this.processes[identifier];
        };
        
        this.init(url);
        
        return this;
        
    };
    
    /*
     * WPS Process
     * 
     * @input {Object} options : WPS process initialization options
     * 
     *      {
     *          identifier: // process unique identifier
     *          title: // process title
     *          abstract: // process description
     *          wps: // reference to the msp.WPS parent
     *      }
     */
    msp.WPS.Process = function(options) {
        
        /**
         * msp.WPS object reference
         */
        this.wps = null;
        
        /**
         * Process unique identifier 
         */
        this.identifier = null;
        
        /**
         * Process title
         */
        this.title = null;
        
        /**
         * Process abstract
         */
        this["abstract"] = null;
        
        /*
         * Process initialization
         * options structure :
         * 
         *      {
         *          identifier: // process unique identifier
         *          title: // process title
         *          abstract: // process description
         *          wps: // reference to the msp.WPS parent
         *      }
         * 
         */
        this.init = function(options) {
            $.extend(this, options);
        };
        
        this.init(options);
        
        return this;
    };
    
    /*
     * WPS events
     */
    msp.WPS.Events = function() {

        /*
         * Set events hashtable
         */
        this.events = {
            
            /*
             * Array containing handlers to be call after
             * a successfull GetCapabilities
             */
            getcapabilities:[],
            
            
            /*
             * Array containing handlers to be call after
             * a successfull DescribeProcess
             */
            describeprocess:[]
            
        };
        
        /*
         * Register an event for WPS
         *
         * @input <String> eventname : Event name => 'getcapabilities'
         * @input <function> handler : handler attached to this event
         */
        this.register = function(eventname , scope, handler) {
            
            if (this.events[eventname]) {
                this.events[eventname].push({
                    scope:scope,
                    handler:handler
                });
            }
            
        };

        /*
         * Unregister event
         */
        this.unRegister = function(scope) {
            
            var a, i, key, l;
                
            for (key in this.events) {
                a = this.events[key];
                for (i = 0, l = a.length; i < l; i++) {
                    if (a[i].scope === scope) {
                        a.splice(i,1);
                        break;
                    }
                }
            }
        };
        
        /*
         * Trigger handlers related to an event
         *
         * @input <String> eventname : Event name => 'getcapabilities'
         * @input <Object> extra : object (e.g. a msp.WPS.Process for a 'describeprocess' event name)
         *                         this is optional
         */
        this.trigger = function(eventname, obj) {
            
            var i, a = this.events[eventname];
            
            /*
             * Trigger event to each handlers
             */
            if (a) {
                for (i = a.length; i--;) {
                    a[i].handler(a[i].scope, obj);
                }
            }
        }
        
        return this;

    }
    
})(window.msp);