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
         * @param {Array} identifiers : array of Process unique identifiers
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
            url = msp.Util.extendUrl(self.url, {
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
                    var i, l, p, processDescriptions = self.parseDescribeProcess(xml), processes = [];
                    for (i = 0, l = processDescriptions.length; i < l; i++) {
                        p = new msp.WPS.Process(processDescriptions[i]);
                        self.addProcess(p);
                        processes.push(p);
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
                            p[nn+'Description'] = self.parseDescribePuts($(this).children());
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
        * @param {Object} $obj : jQuery object reference to list of 'Input' (or 'Output') elements
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
        * @param {Object} $obj : jQuery object reference to a ComplexData (or a ComplexOutput) element
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
        * TODO : anyValue with Range (= allowedValues)
        * 
        * @param {Object} $obj : jQuery object reference to a LiteralData (or a LiteralOutput) element
        */
        this.parseDescribeLiteralPut = function($obj) {
            
            var nn, p = {};
            
            /* Get attributes - i.e. minOccurs and maxOccurs for Input */ 
            $.extend(p, msp.Util.getAttributes($obj));
                
            /*
             * Parse each LiteralData (or LiteralOutput) element
             */
            $obj.children().filter(function() {
                nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));
                
                /* Get DataType ows:reference */
                if (nn === 'dataType') {
                    $.extend(p, msp.Util.getAttributes($(this)));
                }
                
                /*
                 * Unit Of Measure case
                 * 
                 *      <UOMs>
                 *          <Default>
                 *              <ows:UOM>m</ows:UOM>
                 *          </Default>
                 *          <Supported>
                 *              <ows:UOM>m</ows:UOM>
                 *              <ows:UOM>Ao</ows:UOM>
                 *              <ows:UOM>[mi_i]</ows:UOM>
                 *          </Supported>
                 *      </UOMs>
                 * 
                 * 
                 */
                if (nn === 'uOMs') {
                    
                    p['UOMs'] = {};
                    
                    $(this).children().filter(function() {
                        
                        nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));

                        if (nn === 'default') {
                            p['UOMs']['default'] = $(this).children().text();
                        }
                        else if (nn === 'supported') {
                            p['UOMs']['supported'] = [];
                            $(this).children().filter(function() {
                                p['UOMs']['supported'].push($(this).text());
                            });
                        }
                    });
                }
                else {
                    p[nn] = $(this).text();
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
        * @param {Object} $obj : jQuery object reference to a BoundingBoxData (or a BoundingBoxOutput) element
        */
        this.parseDescribeBoundingBoxPut = function($obj) {
            
            var nn, p = {};
            
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
        * @param {Object} $obj : jQuery object reference to a Format element
        * @param {boolean} nolower : if true the javascript is not camel-cased
        */
        this.parseLeaf = function($obj, nolower) {
            
            var p = {};
            
            $obj.children().each(function() {
                p[nolower ? msp.Util.stripNS(this.nodeName) : msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName))] = $(this).text();
            });           
            
            return p;
        };


        /**
         * Request 'execute' service on process identified by identifier
         * 
         * @param {String} identifier : msp.WPS.Process object identifier
         */
        this.execute = function(identifier) {
            
            var process = this.getProcess(identifier);
            
            /*
             * Paranoid mode
             */
            if (!process) {
                return false;
            }
            
            return process.execute();
            
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
        
        /**
         * Return WPS server info as an HTML string
         * 
         *      <div>
         *          <h1>wps.title</h1>
         *          <p>wps.abstract</p>
         *          <p>Version wps.version</p>
         *          <h2>Provided by <a href="wps.serviceProvider.providerSite" target="_blank">wps.serviceProvider.providerName</a></h2>
         *          <h2>Contact</h2>
         *          <p>
         *              wps.serviceProvider.contact.individualName
         *              wps.serviceProvider.contact.phone.voice
         *          </p>
         *      </div>
         * 
         */
        this.toHTML = function() {
            
            /*
             * Only process WPS when getCapabilities is read
             */
            if (!this.title) {
                return "";
            }
            
            return msp.Util.parseTemplate(msp.WPS.infoTemplate, {
                "title":this.title,
                "abstract":this["abstract"],
                "version":this.version,
                "providerSite":this.serviceProvider.providerSite,
                "providerName":this.serviceProvider.providerName
            });
            
        };
        
        this.init(url);
        
        return this;
        
    };
    
    /*
     * WPS Process
     * 
     * @param {Object} options : WPS process initialization options
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
         * Execute process in asynchronous mode
         */
        this.async = false;
        
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
        
        /**
         * InputsData description read from describeDescription
         */
        this.inputsDataDescription = null;
        
        /**
         * OutputsProcess description read from describeDescription
         */
        this.outputsProcessDescription = null;
        
        /**
         * List of inputs (Set by msp.Plugins.WPSClient for example)
         * 
         * Input stucture 
         *      {
         *          type: // 'LiteralData', 'ComplexData' or 'BoundingBoxData'  - MANDATORY
         *          identifier: // Unique Input identifier - MANDATORY
         *          data: // Data (e.g. value for LiteralData) - MANDATORY ?
         *          uom: // Unit Of Measure, for LiteralData only - OPTIONAL 
         *          format: // ??? - OPTIONAL
         *      }
         * 
         */
        this.inputs = [];
        
        /**
         * List of outputs (Set by msp.Plugins.WPSClient for example)
         */
        this.outputs = [];
        
        /**
         * Process statusLocation (set during execute)
         */
        this.statusLocation = null,
        
        /**
         * Process status. Could be one of the following :
         *      ProcessAccepted
         *      ProcessStarted
         *      ProcessPaused
         *      ProcessSucceeded
         *      ProcessFailed
         * 
         */
        this.status = null;
        
        /**
         * Result object read from executeResponse
         * 
         * Structure 
         *      [
         *          {
         *              identifier://
         *              data:{
         *                  value://
         *              }
         *          }
         *          ,
         *          ...
         *      ]
         * 
         */
        this.result = null;
        
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
        
        /**
         * Clear inputs and outputs list
         */
        this.clear = function() {
            this.clearInputs();
            this.clearOutputs();
        };
        
        /**
         * Clear inputs list
         */
        this.clearInputs = function() {
            this.inputs = [];
        };
        
        /**
         * Clear outputs list
         */
        this.clearOutputs = function() {
            this.outputs = [];
        };
        
        /**
         * Add an input
         * 
         * @param {}
         */
        this.addInput = function(input) {
            this.inputs.push(input);
        };
        
        /**
         * Add an output
         */
        this.addOutput = function(output) {
            this.outputs.push(output);
        };
        
        /**
         * Launch WPS execute request
         */
        this.execute = function() {
        
            var i, l, data, template, formatStr, put, outputs = "", inputs = "", self = this;
            
            data = msp.Util.parseTemplate(msp.WPS.executeRequestTemplate,{
                identifier:this.identifier, 
                status:this.async
            });
            
            /*
             * Process Inputs
             */
            for (i  = 0, l = this.inputs.length; i < l; i++ ) {
                put = this.inputs[i];
                template = "";
                formatStr ="";
                
                /*
                 * LiteralData
                 */
                if (put.type === "LiteralData") {
                    template = msp.Util.parseTemplate(msp.WPS.literalDataInputTemplate,{
                        identifier:put.identifier,
                        data:put.data,
                        uom:put.uom || ""
                    });
                }
                /*
                else if (input.CLASS_NAME.search("Complex")>-1) {
                    if (input.asReference) {
                        tmpl = OpenLayers.WPS.complexInputReferenceTemplate.replace("$REFERENCE$",escape(input.getValue()));
                    }
                    else {
                        tmpl = OpenLayers.WPS.complexInputDataTemplate.replace("$DATA$",input.getValue());
                    }
                    if (format) {
                        if (format.mimeType) {
                            formatStr += " mimeType=\""+format.mimeType+"\"";
                        }
                        if (format.schema) {
                            formatStr += " schema=\""+format.schema+"\"";
                        }
                        if (format.encoding) {
                            formatStr += " encoding=\""+format.encoding+"\"";
                        }
                    }
                    tmpl = tmpl.replace("$FORMAT$",formatStr);
                }       
                else if (input.CLASS_NAME.search("BoundingBox") > -1) {
                    tmpl = OpenLayers.WPS.boundingBoxInputTemplate.replace("$DIMENSIONS$",input.dimensions);
                    tmpl = tmpl.replace("$CRS$",input.crs);
                    tmpl = tmpl.replace("$MINX$",input.value.minx);
                    tmpl = tmpl.replace("$MINY$",input.value.miny);
                    tmpl = tmpl.replace("$MAXX$",input.value.maxx);
                    tmpl = tmpl.replace("$MAXY$",input.value.maxy);
                }
                */
                inputs += template;
            }

            /*
             * Process Outputs
             */
            for (i  = 0, l = this.outputs.length; i < l; i++ ) {
                put = this.outputs[i];
                template = "";
                formatStr ="";
                
                /*
                 * LiteralOutput
                 */
                if (put.type === "LiteralOutput") {
                    template = msp.Util.parseTemplate(msp.WPS.literalOutputTemplate,{
                        identifier:put.identifier
                    });
                }
                outputs += template;
            }
            
            // outputs
            /*
            var outputs = "";
            for (var i = 0; i < process.outputs.length; i++) {
                var output = process.outputs[i];
                var tmpl = "";
                if (output.CLASS_NAME.search("Complex")>-1) {
                    tmpl = OpenLayers.WPS.complexOutputTemplate.replace("$AS_REFERENCE$",output.asReference);
                    var format = (output.format ? output.format : output.formats[0]);
                    var formatStr ="";
                    if (format) {
                        if (format.mimeType) {
                            formatStr += " mimeType=\""+format.mimeType+"\"";
                        }
                        if (format.schema) {
                            formatStr += " schema=\""+format.schema+"\"";
                        }
                        if (format.encoding) {
                            formatStr += " encoding=\""+format.encoding+"\"";
                        }
                    }
                    tmpl = tmpl.replace("$FORMAT$",formatStr);
                }
                else if (output.CLASS_NAME.search("Literal") > -1) {
                    tmpl = OpenLayers.WPS.literalOutputTemplate;
                }
                else if (output.CLASS_NAME.search("BoundingBox") > -1) {
                    tmpl = OpenLayers.WPS.boundingBoxOutputTemplate;
                }
                tmpl = tmpl.replace("$IDENTIFIER$",output.identifier); 
                outputs += tmpl;
            }
            */
            
            /*
             * Set Inputs and Outputs
             */
            data = msp.Util.parseTemplate(data,{
                dataInputs:inputs,
                dataOutputs:outputs
            });
            
            /*
             * Launch execute request
             */
            msp.Util.ajax({
                url:msp.Util.proxify(msp.Util.repareUrl(self.wps.url), "XML"),
                async:true,
                type:"POST",
                dataType:"xml",
                contentType:"text/xml",
                data:data,
                success:function(xml) {
                    self.result = self.parseExecute(xml);
                    if (self.result) {
                        self.wps.events.trigger("execute", self);
                    }
                },
                error:function(e) {
                    msp.Util.message(e);
                }
            }, {
                title:this.title + " : " + msp.Util._("Execute"),
                cancel:true
            });
            
            return true;
            
        };
        
        /**
         * Get an xml executeResponse object and return a javascript object
         * 
         * executeResponse structure is :
         * 
         *      <wps:ExecuteResponse xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" serviceInstance="http://mywpsserver/?SERVICE=WPS&amp;REQUEST=GetCapabilities" statusLocation="http://mywpsserver/wps/output/d409fb4a-5131-4041-989e-c4de171d2881" service="WPS" version="1.0.0" xml:lang="en-EN">
         *          <wps:Process wps:processVersion="1.0.0">
         *              <ows:Identifier>urn:ogc:cstl:wps:math:add</ows:Identifier>
         *              <ows:Title>Add</ows:Title>
         *              <ows:Abstract>Adds two double.</ows:Abstract>
         *          </wps:Process>
         *          <wps:ProcessOutputs>
         *              <wps:Output>
         *                  <ows:Identifier>urn:ogc:cstl:wps:math:add:output:result</ows:Identifier>
         *                  <ows:Title>Result</ows:Title>
         *                  <ows:Abstract>Addition result</ows:Abstract>
         *                  <wps:Data>
         *                      <wps:LiteralData dataType="http://www.w3.org/TR/xmlschema-2/#double">46.0</wps:LiteralData>
         *                  </wps:Data>
         *              </wps:Output>
         *          </wps:ProcessOutputs>
         *      </wps:ExecuteResponse>
         * 
         */
        this.parseExecute = function(xml) {
            
            var p, nn, result = [], $obj = $(xml);
            
            /*
             * Trap Exception
             */
            if (msp.Util.stripNS($obj.children()[0].nodeName) === 'ExceptionReport') {
                this.parseException(xml);
                return null;
            }
            
            /*
             * Retrieve ExecuteResponse statusLocation attribute
             */
            this.statusLocation = msp.Util.getAttributes($obj.children())["statusLocation"];
            
            /*
             * Process <wps:ProcessOutputs> element
             */
            $obj.children().children().filter(function(){
               
                if (msp.Util.stripNS(this.nodeName) === 'ProcessOutputs') {
                   
                   /*
                    * Process Output i.e. all <wps:Output> elements
                    */
                    $(this).children().each(function() {
                        
                        p = {};
                        
                        $(this).children().each(function() {

                            nn = msp.Util.lowerFirstLetter(msp.Util.stripNS(this.nodeName));

                           /*
                            * Store identifier and data bloc
                            */
                            if (nn === 'identifier') {
                                p[nn] = $(this).text();
                            }
                            else if (nn === 'data') {

                                p['data'] = {};

                                /*
                                * Parse result within <wps:Data> element
                                */
                                $(this).children().filter(function() {

                                    nn = msp.Util.stripNS(this.nodeName);

                                    if (nn === 'LiteralData') {
                                        p['data']['value'] = $(this).text();
                                    }
                                    else if (nn === 'ComplexData') {
                                    // TODO
                                    }
                                    else if (nn === 'BoundingBox') {
                                    // TODO    
                                    }
                                    else if (nn === 'Reference') {
                                    // TODO    
                                    }

                                });

                            }

                        });
                        
                        result.push(p);

                    }); // End of process <wps:Output>
                
                } // End if (msp.Util.stripNS(this.nodeName) === 'ProcessOutputs')
               
            });
            
            return result;
            
        };
        
        /**
         * Return a json representation of a WPS ows:ExceptionReport
         *
         * @param {Object} xml
         */
        this.parseException = function(xml) {
            msp.Util.message("TODO - parse Exception");
        }
        
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
            describeprocess:[],
            
            /*
             * Array containing handlers to be call after
             * a successfull execute process
             */
            execute:[]
            
        };
        
        /*
         * Register an event for WPS
         *
         * @param <String> eventname : Event name => 'getcapabilities'
         * @param <function> handler : handler attached to this event
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
         * @param <String> eventname : Event name => 'getcapabilities'
         * @param <Object> extra : object i.e.
         *                              - msp.WPS for a 'getcapabilities' event name
         *                              - msp.WPS.Process for a 'describeprocess' event name
         *                              - msp.WPS.Process for an 'execute' event name
         *                              
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

    };
    
    /**
     * 
     * HTML template to display WPS server information
     * Used by toHTML() function
     *      <div>
     *          <h1>title</h1>
     *          <p>abstract</p>
     *          <p>Version version</p>
     *          <h2>Provided by <a href="providerSite" target="_blank">providerName</a></h2>
     *      </div>
     */
    msp.WPS.infoTemplate = '<div>'+
        '<h1>{title}</h1>'+
        '<p>{abstract}</p>'+
        '<p>Version {version}</p>'+
        '<h2>Provided by <a href="{providerSite}" target="_blank">{providerName}</a></h2>'+
        '</div>';

    /**
     * XML POST template for WPS execute request
     * 
     *  Template keys :
     *      {identifier} : process identifier
     *      {dataInputs} : data inputs (see *PutsTemplate)
     *      {dataOutputs} : data outputs (see *PutsTemplate)
     *      {status} : status ??
     * 
     */
    msp.WPS.executeRequestTemplate = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
        '<wps:Execute service="WPS" version="1.0.0" '+
            'xmlns:wps="http://www.opengis.net/wps/1.0.0" '+
            'xmlns:ows="http://www.opengis.net/ows/1.1" '+
            'xmlns:xlink="http://www.w3.org/1999/xlink" '+
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '+
            'xsi:schemaLocation="http://www.opengis.net/wps/1.0.0/wpsExecute_request.xsd">'+
                '<ows:Identifier>{identifier}</ows:Identifier>'+
                '<wps:DataInputs>{dataInputs}</wps:DataInputs>'+
                '<wps:ResponseForm>'+
                    '<wps:ResponseDocument wps:lineage="false" '+
                        'storeExecuteResponse="true" '+
                         'status="{status}">{dataOutputs}</wps:ResponseDocument>'+
                '</wps:ResponseForm>'+
            '</wps:Execute>';
        
    /**
     * LiteralDataInput template
     *   
     *   Template keys :
     *      {identifier} : Input identifier
     *      {uom}: unit of measure
     *      {data} : value
     *    
     */
    msp.WPS.literalDataInputTemplate = '<wps:Input>'+
            '<ows:Identifier>{identifier}</ows:Identifier>'+
            '<wps:Data>'+
                '<wps:LiteralData uom="{uom}">{data}</wps:LiteralData>'+
            '</wps:Data>'+
        '</wps:Input>';

    /**
     * ComplexDataInput reference template
     *   
     *   Template keys :
     *      {identifier} : Input identifier
     *      {reference} : url reference to get input data
     *      {format} : Input data format
     *      
     */
    msp.WPS.complexDataInputReferenceTemplate = '<wps:Input>'+
            '<ows:Identifier>{identifier}</ows:Identifier>'+
            '<wps:Data>'+
                '<wps:Reference xlink:href="{reference}" {format}/>'+
            '</wps:Data>'+
        '</wps:Input>';
                            
    /**
     * ComplexDataInput data template
     *   
     *   Template keys :
     *      {identifier} : Input identifier
     *      {format} : Input data format
     *      {data} : ???
     *      
     */
    msp.WPS.complexDataInputDataTemplate = '<wps:Input>'+
            '<ows:Identifier>{identifier}</ows:Identifier>'+
            '<wps:Data>'+
                '<wps:ComplexData {format}>{data}</wps:ComplexData>'+
            '</wps:Data>'+
        '</wps:Input>';
                            
                            
    /**
     * BoundingBoxDataInput template
     *   
     *   Template keys :
     *      {identifier} : Input identifier
     *      {dimension} : dimension of the BoundingBox (generally ???)
     *      {crs} : CRS (Coordinates Reference System) for the bounding box 
     *      {minx} {miny} {maxx} {maxy} : Bounding Box coordinates expressed in {crs} coordinates
     *      
     *
     */
    msp.WPS.boundingBoxDataInputTemplate = '<wps:Input>'+
            '<ows:Identifier>{identifier}</ows:Identifier>'+
            '<wps:Data>'+
                '<wps:BoundingBoxData ows:dimensions="{dimension}" ows:crs="{crs}">'+
                    '<ows:LowerCorner>{minx} {miny}</ows:LowerCorner>'+
                    '<ows:UpperCorner>{maxx} {maxy}</ows:UpperCorner>'+
                '</wps:BoundingBoxData>'+
            '</wps:Data>'+
        '</wps:Input>';
                            
    /**
     * ComplexOutput template
     * 
     *   Template keys :
     *      {asReference} : ???
     *      {identifier} : Output identifier
     *  
     */
    msp.WPS.complexOutputTemplate = '<wps:Output asReference="{asReference}" {format}>'+
            '<ows:Identifier>{identifier}</ows:Identifier>'+
        '</wps:Output>';
                            

    /**
     * LiteralOutput template
     * 
     *   Template keys :
     *      {identifier} : Output identifier
     * 
     */
    msp.WPS.literalOutputTemplate = '<wps:Output asReference="false">'+
            '<ows:Identifier>{identifier}</ows:Identifier>'+
        '</wps:Output>';

    /**
     * BoundingBoxOutpput template
     */
    msp.WPS.boundingBoxOutputTemplate = msp.WPS.literalOutputTemplate;

    
})(window.msp);