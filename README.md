ShowMe
======

a touch event relay for firefox os

To get ShowMe functionality installed, you need to copy the "ShowMe" directory
into your source tree's gaia/apps/system tree, peer to the system app's index.html file.

Then, edit the system app's index.html file and add

&lt;!-- Show me --&gt;
&lt;script defer="" src="ShowMe/js/showme.js"&gt;&lt;/script&gt;
&lt;link rel="stylesheet" type="text/css" href="ShowMe/style/showme.css"&gt;

into the &lt;head&gt; block and reflash gaia onto your device

after flashing, in the notifications tray, you will see a small tab at 
the top called ShowMe.  Tapping this opens and closes the ShowMe control
panel.

you can use the test relay server on bunnyandboar.com for reference or pull down 
the ShowMeServer project here and run your own!
