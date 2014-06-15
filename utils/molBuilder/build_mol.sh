#!/bin/bash
#
# mapshup - Webmapping made easy
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
if [ $# -lt 1 ]
then
        echo "###"
        echo ""
        echo " ### OpenLayers builder for mapshup client ### "
        echo ""
        echo "    Create a mapshup build of OpenLayers under 'mol' directory"
        echo ""
        echo "    Usage : $0 <OpenLayers source directory>"
        echo ""
        echo "###"
        exit 0
fi

echo "Building mol for $1"

# First create mol
here=`pwd`
oldir=$1
moldir='mol'

if [ ! -x $moldir ]
then
	echo ""
	echo "Create directory $moldir..."
	mkdir $moldir
fi
if [ ! -x $moldir/theme ]
then
        mkdir $moldir/theme
fi
if [ ! -x $moldir/theme/default ]
then
    mkdir $moldir/theme/default
fi

echo "Populating $moldir directory with theme directory..."
cp -Rf $oldir/img $moldir/
cp -Rf $oldir/theme/default/img $moldir/theme/default/
cp -Rf $oldir/theme/default/style.css $moldir/theme/default
cp -Rf $oldir/theme/default/style.mobile.css $moldir/theme/default
cp -Rf addons/google.tidy.css $moldir/theme/default
cp -Rf addons/layer-switcher-maximize.png $moldir/img/
cp -Rf addons/layer-switcher-minimize.png $moldir/img/

echo "Clean $moldir directory..."
rm -Rf $moldir/img/.svn
rm -Rf $moldir/theme/default/img/.svn

echo "Copying addons to OpenLayers directory..."
cp -R addons/OL-OS $oldir/lib/

echo "Copying modified class DragPan.js to OpenLayers directory..."
cp -R addons/DragPan.js $oldir/lib/OpenLayers/Control/

echo "Copying modified class Cluster.js to OpenLayers directory..."
cp -R addons/Cluster.js $oldir/lib/OpenLayers/Strategy/

echo "Copying new class PolygonCluster.js to OpenLayers directory..."
cp -R addons/PolygonCluster.js $oldir/lib/OpenLayers/Strategy/

echo "Copying modified class GeoJSON.js to OpenLayers directory..."
cp -R addons/GeoJSON.js $oldir/lib/OpenLayers/Formats/

echo "Building OpenLayers.js..."
cd $oldir/build
./build.py $here/jOpenLayers_build.cfg
cp OpenLayers.js $here/mol/OpenLayers.js

echo "Building OpenLayersOptimized.js..."
cd $oldir/build
./build.py $here/jOpenLayersOptimized_build.cfg
cp OpenLayers.js $here/mol/OpenLayersOptimized.js


#echo "Building OpenLayers mobile structure..."
#rm -Rf $here/mol/m
#mkdir $here/mol/m
#./build.py $here/jOpenLayersMobile_build.cfg
#cp OpenLayers.js $here/mol/m/OpenLayers.js
#cp -R $here/mol/img $here/mol/m/img
#cp -R $here/mol/theme $here/mol/m/theme

cd $here
echo "Done !"