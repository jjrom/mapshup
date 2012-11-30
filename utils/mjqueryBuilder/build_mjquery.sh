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
echo "Building mjquery"

# First create mjquery
jquerydir='jquery'
mjquerydir='mjquery'

if [ ! -x $mjquerydir ]
then
	echo ""
	echo "Create directory $mjquery..."
	mkdir $mjquerydir
fi

echo "Building mjquery.js"
cat $jquerydir/jquery-1.8.3.min.js > $mjquerydir/mjquery.js.tmp
cat $jquerydir/jquery-ui-1.9.1.custom/js/jquery-ui-1.9.1.custom.min.js >> $mjquerydir/mjquery.js.tmp
cat $jquerydir/jquery-ui-touchpunch/jquery-ui-touchpunch.min.js >> $mjquerydir/mjquery.js.tmp
cat $jquerydir/mousewheel/jquery.mousewheel.min.js >> $mjquerydir/mjquery.js.tmp
cat $jquerydir/idTabs/jquery.idTabs.min.js >> $mjquerydir/mjquery.js.tmp
cat $jquerydir/mscrollbar/jquery.mCustomScrollbar.min.js >> $mjquerydir/mjquery.js.tmp

echo "Building mjquery.css"
cat $jquerydir/mscrollbar/jquery.mCustomScrollbar.css > $mjquerydir/mjquery.css

echo "Compress mjquery.js"
java -jar ../packer/compiler.jar $mjquerydir/mjquery.js.tmp > $mjquerydir/mjquery.js.tmp2
cat ./license.txt $mjquerydir/mjquery.js.tmp2 > $mjquerydir/mjquery.js

echo "Building mjquery.jqplot.js"
cat $jquerydir/jqplot/jquery.jqplot.min.js > $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jqplot/plugins/jqplot.canvasTextRenderer.min.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jqplot/plugins/jqplot.canvasAxisLabelRenderer.min.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jqplot/plugins/jqplot.canvasAxisTickRenderer.min.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jqplot/plugins/jqplot.highlighter.min.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jqplot/plugins/jqplot.cursor.min.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQRangeSliderMouseTouch.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQRangeSliderDraggable.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQRangeSliderHandle.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQRangeSliderBar.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQRangeSliderLabel.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQRangeSlider.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/jQDateRangeSliderHandle.js >> $mjquerydir/mjquery.jqplot.js.tmp
cat $jquerydir/jQRangeSlider/mjQDateRangeSlider.js >> $mjquerydir/mjquery.jqplot.js.tmp

echo "Building mjquery.jqplot.css"
cat $jquerydir/jqplot/jquery.jqplot.min.css > $mjquerydir/mjquery.jqplot.css

echo "Compress mjquery.jqplot.js"
java -jar ../packer/compiler.jar $mjquerydir/mjquery.jqplot.js.tmp > $mjquerydir/mjquery.jqplot.js.tmp2
cat ./license.txt $mjquerydir/mjquery.jqplot.js.tmp2 > $mjquerydir/mjquery.jqplot.js

/bin/rm $mjquerydir/mjquery.js.tmp*
/bin/rm $mjquerydir/mjquery.jqplot.js.tmp*

echo "Copy images in mjquery directory"
cp $jquerydir/mscrollbar/mCSB_buttons.png $mjquerydir/
echo "Done !"

