#!/bin/bash
#
#  mapshup - Webmapping made easy
#  http://mapshup.info
# 
#  Copyright Jérôme Gasperi, 2011.12.08
# 
#  jerome[dot]gasperi[at]gmail[dot]com
# 
#  This software is a computer program whose purpose is a webmapping application
#  to display and manipulate geographical data.
# 
#  This software is governed by the CeCILL-B license under French law and
#  abiding by the rules of distribution of free software.  You can  use,
#  modify and/ or redistribute the software under the terms of the CeCILL-B
#  license as circulated by CEA, CNRS and INRIA at the following URL
#  "http://www.cecill.info".
# 
#  As a counterpart to the access to the source code and  rights to copy,
#  modify and redistribute granted by the license, users are provided only
#  with a limited warranty  and the software's author,  the holder of the
#  economic rights,  and the successive licensors  have only  limited
#  liability.
# 
#  In this respect, the user's attention is drawn to the risks associated
#  with loading,  using,  modifying and/or developing or reproducing the
#  software by the user in light of its specific status of free software,
#  that may mean  that it is complicated to manipulate,  and  that  also
#  therefore means  that it is reserved for developers  and  experienced
#  professionals having in-depth computer knowledge. Users are therefore
#  encouraged to load and test the software's suitability as regards their
#  requirements in conditions enabling the security of their systems and/or
#  data to be ensured and,  more generally, to use and operate it in the
#  same conditions as regards security.
# 
#  The fact that you are presently reading this means that you have had
#  knowledge of the CeCILL-B license and that you accept its terms.
#
if [ $# -lt 6 ]
then
	echo "###"
	echo ""
	echo " ### PACKER tool for mapshup ###"
	echo ""
	echo "    Create a <mapshup_target_dir> directory from <mapshup_source_directory>"
	echo "    This directory contains a production mapshup build i.e. without useless files i.e. : "
	echo "        - all js files compressed within one mapshup.js file"
	echo "        - all css files compressed within one mapshup.css file"
	echo "        - only one configuration file (default.js also compressed)"
	echo "        - index.html at the root level"
	echo ""
	echo "    !! img/_external directory is not copied !!"
	echo "" 
	echo "    Usage : $0 <mapshup_client_svn_repository> <mapshup_target_dir> <theme> <path_to_config_file> <path_to_build_file> <debug>"
        echo ""
	echo "            NOTE : to not specify <path_to_config_file>, <path_to_build_file> or <debug>, set their value to 0"
        echo "                   mapshup_target_dir should generaly be equal to https://code.google.com/p/mapshup "
	echo ""
	echo "###"
	exit 0
fi

# Input Parameters
REPO=$1
TARGET=$2
THEME=$3
CONFIG=$4
BUILDFILE=$5
DEBUG=$6

# First copy
if [ ! -x $TARGET ]
then
	echo ""
	echo "Compile repository $REPO"
        CLIENTDIR=`echo $REPO/client/`
        SERVERDIR=`echo $REPO/server/`
	
        # Create target directories
        mkdir -p $TARGET/js/mapshup/config

        # Copy javascript files
        /bin/cp -Rf $CLIENTDIR/js/mapshup/buildfile.txt $TARGET/js/mapshup
	/bin/cp -Rf $CLIENTDIR/js/mapshup/i18n $TARGET/js/mapshup
	/bin/cp -Rf $CLIENTDIR/js/mapshup/lib $TARGET/js/mapshup
	/bin/cp -Rf $CLIENTDIR/js/mapshup/theme $TARGET/js/mapshup
	/bin/cp $CLIENTDIR/js/mapshup/config/default.js $TARGET/js/mapshup/config
	
        # Copy external javascript libraries
	/bin/cp -Rf $CLIENTDIR/js/mjquery $TARGET/js
	/bin/cp -Rf $CLIENTDIR/js/mol $TARGET/js
        /bin/cp -Rf $CLIENTDIR/js/proj4js $TARGET/js

        # Copy images files
	/bin/cp -Rf $CLIENTDIR/img $TARGET/img

        # Copy presentation files
        if [ -d $CLIENTDIR/welcome.html_files ]
        then
            /bin/cp -Rf $CLIENTDIR/welcome.html_files $TARGET/
        fi

        # Copy index*.html files
        # If config file is specified...
        if [ $CONFIG != "0" ]
        then
            # Copy config file
            /bin/cp $CONFIG $TARGET/js/mapshup/config
            CONFIG_FILE=`basename $CONFIG`
            
            # Copy index*.html files and replace __CONFIG__ with input config file
            cat $CLIENTDIR/index_prod.html | sed s/__CONFIG__/$CONFIG_FILE/g > $TARGET/tmp_index.html
            
            # Replace theme name in index files
            sed s/__THEME__/$THEME/g $TARGET/tmp_index.html > $TARGET/index.html
        else
            # Copy index*.html files
            cat $CLIENTDIR/index_prod.html | grep -v "__CONFIG__" > $TARGET/index.html
        fi
        
        /bin/cp -Rf $CLIENTDIR/blank.html $TARGET/
        /bin/cp -Rf $CLIENTDIR/error.html $TARGET/
        /bin/cp -Rf $CLIENTDIR/welcome.html $TARGET/
        /bin/cp -Rf $CLIENTDIR/robots.txt $TARGET/
        /bin/cp -Rf $CLIENTDIR/license-fr.txt $TARGET/
        /bin/cp -Rf $CLIENTDIR/license-en.txt $TARGET/
        /bin/cp -Rf $CLIENTDIR/favicon.ico $TARGET/
        /bin/cp -Rf $CLIENTDIR/reset.css $TARGET/

        # Copy server file to export directory
        /bin/cp -Rf $SERVERDIR $TARGET/s

fi

DIR=`dirname $0`
CSS_COMPRESSOR=`echo $DIR"/yuicompressor-2.4.2.jar"`
JS_COMPRESSOR=`echo $DIR"/compiler.jar"`
LICENSE=`echo $DIR"/license.txt"`

if [ $BUILDFILE = "0" ]
then
    BUILDFILE=`echo $TARGET/js/mapshup/buildfile.txt`
fi

echo ""
echo "Concatenate js files to _mapshup.js"
touch $TARGET/js/mapshup/_mapshup.js
JSFILES=`grep "\.js" $BUILDFILE | grep -v "#" | awk '{print $1}'`
for js in $JSFILES
do
        echo 'Processing : '$js
	cat $TARGET/js/mapshup/$js >> $TARGET/js/mapshup/_mapshup.js
done

# DEBUG
if [ $DEBUG != "0" ]
then
    cp $TARGET/js/mapshup/_mapshup.js $TARGET/js/mapshup/debug.js
fi

echo ""
echo "Compress mapshup.js file..."
java -jar $JS_COMPRESSOR $TARGET/js/mapshup/_mapshup.js > $TARGET/js/mapshup/mapshup.js.tmp
cat $LICENSE $TARGET/js/mapshup/mapshup.js.tmp > $TARGET/js/mapshup/_mapshup.js

echo ""
echo "Compress default.js file..."
java -jar $JS_COMPRESSOR $TARGET/js/mapshup/config/default.js > $TARGET/js/mapshup/config/default.js.tmp
cat $LICENSE $TARGET/js/mapshup/config/default.js.tmp > $TARGET/js/mapshup/config/default.js

echo ""
echo "Compress css files..."
java -jar $CSS_COMPRESSOR $TARGET/js/mapshup/theme/$THEME/mapshup.css > $TARGET/js/mapshup/theme/$THEME/mapshup.css.tmp
cat $LICENSE $TARGET/js/mapshup/theme/$THEME/mapshup.css.tmp > $TARGET/js/mapshup/theme/$THEME/mapshup.css

echo ""
echo "Clean..."
/bin/rm -Rf $TARGET/js/mapshup/buildfile.txt
/bin/rm -Rf $TARGET/js/mapshup/mapshup.js.tmp
/bin/rm -Rf $TARGET/js/mapshup/config/default.js.tmp
/bin/rm -Rf $TARGET/js/mapshup/theme/$THEME/mapshup.css.tmp
/bin/rm -Rf $TARGET/js/mapshup/lib
/bin/rm -Rf $TARGET/tmp_index.html
mv $TARGET/js/mapshup/_mapshup.js $TARGET/js/mapshup/mapshup.js

echo ""
echo "Done !"

