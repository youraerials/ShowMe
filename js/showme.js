/*jslint indent: 2 */
/*global window */
/*global document */


/*

To get ShowMe functionality installed, you need to copy the "showme" directory
into your source tree's gaia/apps/system tree, peer to the system app's index.html file.

Then, edit the index.html file and add

<!-- Show me -->"
<script defer="" src="showme/js/showme.js"></script>
<link rel="stylesheet" type=\"text/css" href="showme/style/showme.css">

into the <head> block and reflash gaia onto your device

after flashing, in the notifications tray, you will see a small tab at 
the top called ShowMe.  Tapping this opens and closes the ShowMe control
panel

*/


var ShowMe = {

  debug: true,

  socketServer: "",

  canTriggerEvents: true,
  lastEventTime: 0,
  lastMoveEvent: 0,
  lastTarget: 0,
  isController: false,
  startEventTarget: false,
  movedBeyondClick: false,

  init: function () {

    this.log("SHOW ME INIT, binding and loading markup...");

    xhr = new XMLHttpRequest();
    xhr.open('get', 'showme/index.html');
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {

        var response = xhr.responseText;
        
        var controlPanel = document.createElement('div');
        controlPanel.id = "showme-control-panel";
        controlPanel.addEventListener("touchstart", function() {
          
          document.querySelector("#showme-config-server").blur();
          
        }, false);
        
        
        controlPanel.innerHTML = response;
        
        controlPanel.innerHTML += '<div class="input-block"><button type="button" class="show-me-button" id="show-me-peer-touches">disable client touches</button></div>';
        
        controlPanel.innerHTML += '<div id="showme-socket-status">status <span>0</span></div>';
              
        
        document.querySelector("#notifications-container").appendChild(controlPanel);
        
        
        var controlPanelAccess = document.createElement('div');
        controlPanelAccess.innerHTML = "ShowMe";
        controlPanelAccess.id = "showme-control-panel-access";
        controlPanelAccess.addEventListener('touchstart', function () {
          
          document.querySelector("#showme-control-panel").classList.toggle("visible");
          controlPanelAccess.classList.toggle("panel-visible");
          
          document.querySelector("#screen").classList.toggle("showme-config");
          
          
          
        }, false);
        
        document.querySelector("#notifications-container").appendChild(controlPanelAccess);
        
        
        
        var peerTouchToggle = document.querySelector("#show-me-peer-touches");
        peerTouchToggle.addEventListener('touchstart', function () {
          
          
          
         peerTouchToggle.classList.toggle("touches-disabled");
          
          if (peerTouchToggle.classList.contains("touches-disabled")) {
            
            peerTouchToggle.innerHTML = "clients disabled";
            
            //relay touch enabled state!
            SocketTransport.sendHardwareEvent('touches-disabled');
            
          }
          else {
            peerTouchToggle.innerHTML = "disable client touches";
            
            //relay touch enabled state!
            SocketTransport.sendHardwareEvent('touches-enabled');
            
          }
          
          document.querySelector("#showme-socket-status").innerHTML += "DISABLE PEERS <span>0</span>";
          
        }, false);
        

        
        
        var touchIndicatorUI = document.createElement('div');
        touchIndicatorUI.id = "showme-touch-indicator";
        document.querySelector("body").appendChild(touchIndicatorUI);
        
        var showMeEventCatcher = document.createElement('div');
        showMeEventCatcher.id = "showme-event-catcher";
        showMeEventCatcher.innerHTML = "<div id='showme-touchblock-indicator'></div>";
        document.querySelector("body").appendChild(showMeEventCatcher);

        ShowMe.markupLoaded();

      }
    };

    xhr.send();

  },

  markupLoaded: function () {

    this.log("LOADED ALL MARKUP!");
    

    var screenContainer = document.querySelector("#screen");


    // listeners and alternates to bind to.... 
    
    //var screenDiv = document.getElementById("screen");
    //var screenDiv = document.getElementById("showme-event-catcher");
    var screenDiv = window;
    
    screenDiv.addEventListener('touchstart', function (inEvent) {

      //inEvent.stopPropagation();
      //inEvent.preventDefault();

      if (ShowMe.isController) {

        //ShowMe.movedBeyondClick = false;
        //ShowMe.canTriggerEvents = false;

        //screenDiv.style.display = "none";

        ShowMe.log("start " + inEvent.touches[0].pageX + " " + inEvent.touches[0].pageY);

        var target = document.elementFromPoint(inEvent.touches[0].pageX, inEvent.touches[0].pageY);

        ShowMe.log(" target id: " + target);

        ShowMe.lastTarget = target;
        ShowMe.startEventTarget = target;

        ShowMe.lastX = inEvent.touches[0].pageX;
        ShowMe.lastY = inEvent.touches[0].pageY;
        ShowMe.origX = inEvent.touches[0].pageX;
        ShowMe.origY = inEvent.touches[0].pageY;


        // for this version, we ONLY relay events for apps and the home screen!
        if (target.nodeName.toLowerCase() == "iframe") {
          SocketTransport.sendEvent(inEvent, ShowMe.lastTarget, ShowMe.lastTarget.nodeName);
        }

      }

    }, false);
    

    screenDiv.addEventListener('touchend', function (inEvent) {

      //inEvent.stopPropagation();
      //inEvent.preventDefault();


      if (ShowMe.isController) {
        
        var evt = ShowMe.unSynthetizeEvent(inEvent);
        //var evtString = JSON.stringify(evt);
        var endX = evt[2][0];
        var endY = evt[3][0];
        
        var target = document.elementFromPoint(endX, endY);

        console.log("touched from x: " + ShowMe.origX + " y: " + ShowMe.origY);
        console.log("touched  to  x: " + endX + " y: " + endY);

        if (target.nodeName.toLowerCase() == "iframe") {
          SocketTransport.sendEvent(inEvent, ShowMe.lastTarget, ShowMe.lastTarget.nodeName);
        }
        
      } 


    }, false);
    
    
    screenContainer.addEventListener('touchcancel', function (inEvent) {
 
      console.log("!!!! TBD IN SHOWME! DO WE WANT TO HANDLE TOUCH CANCEL?");

    }, false);

    
    document.querySelector("#showme-start").addEventListener('touchend', function () {

      ShowMe.log("CLICK EVENT ON SHOW ME START BUTTON!");

      ShowMe.socketServer = document.querySelector("#showme-config-server").value;
      ShowMe.socketProtocol = "fxos-showme-protocol";
      ShowMe.clientType = ShowMe.isController ? "controller" : "client";
      ShowMe.groupID = document.querySelector('#showme-config-groupid').value;

      ShowMe.log("TRYING TO CONNECT TO SOCKET SERVER: ");
      ShowMe.log("server: " + ShowMe.socketServer + " clientType: " + ShowMe.clientType + " group: " + ShowMe.groupID);

      SocketTransport.openNewSocketCx(
          ShowMe.socketServer, ShowMe.socketProtocol, ShowMe.clientType, ShowMe.groupID
      );


    }, false);
    
    
    
    document.querySelector("#controller-state-toggle").addEventListener('touchstart', function () {
      
      var controllerStateToggle = document.getElementById("controller-state-toggle");
      controllerStateToggle.classList.toggle("is-controller");
      
      // set the controller flag 
      if (controllerStateToggle.classList.contains("is-controller")) {
        
        ShowMe.isController = true;
        
        document.querySelector("#show-me-peer-touches").classList.add("is-controller");
        
      }
      else {
        
        ShowMe.isController = false;
        document.querySelector("#show-me-peer-touches").classList.remove("is-controller");
        
      }
      
      ShowMe.log("CONTROLLER? " + ShowMe.isController);
      
    
    }, false);
    
    
       
    
    
    // Sneak in and listen for hardware buttons....
    window.addEventListener('mozChromeEvent', function(inEvent) {
      
      var eventType = inEvent.detail.type;
      
      document.querySelector("#showme-socket-status").innerHTML = "mozChromeEvent type? <span>" + eventType + "</span>";
       
      
      if (
        eventType == "home-button-press" || 
        eventType == "home-button-release" ||
        eventType == "volume-up-button-press" ||
        eventType == "volume-up-button-release" ||
        eventType == "volume-down-button-press" ||
        eventType == "volume-down-button-release"
        
      ) {
      
        SocketTransport.sendHardwareEvent(eventType);
      
      }
      
    }, false);

  },

  
  handleShowMe: function (inMessage) {

    ShowMe.log("HANDLE SHOW ME MESSAGE, inMessage:" + inMessage);

  },
  

  log: function (inLog) {

    if (this.debug && console) {

      // create some hope of finding this in ddms ;-)
      console.log("*** SHOW ME LOG -- " + inLog);
      
      
      

    }
    if (document.querySelector("#showme-debug")) {
      document.querySelector("#showme-debug").innerHTML = inLog;
    }

  },
  
  findMidpoint: function (inX1, inY1, inX2, inY2) {
      
    var midPointX = Math.round ( (inX1+inX2)/2 );
    var midPointY = Math.round ( (inY1+inY2)/2 );
    
    return { x: midPointX, y: midPointY };
  
  },

  

  fireTouchEvent: function (inEvent, inTarget, inName) {

    var touchEvent = document.createEvent('touchevent');
    
    var touchPoint = document.createTouch(
      window, 
      inTarget, 
      0,
      inEvent.pageX, inEvent.pageY,
      inEvent.pageX, inEvent.pageY,
      inEvent.pageX, inEvent.pageY,
      1, 1, 0, 0
    );
    
    var touchList = document.createTouchList(touchPoint);
    
    touchEvent.initTouchEvent(
      inName, true, true, window, 0, false, false, false, false,touchList, touchList, touchList
    );

    inTarget.dispatchEvent(touchEvent);

  },

  
  fireMouseEvent: function sm_fireMouseEvent (inType, inTarget, x, y) {

      var evt = document.createEvent('MouseEvent');
      
      evt.initMouseEvent(
        inType, true, true, window, 0, x, y, x, y, false, false, false, false, 0, null
      );
      
      inTarget.dispatchEvent(evt);

  },

  
  relayTouchEvent: function sm_relayTouchEvent (inFrame, inEvent) {


    inFrame.sendTouchEvent.apply(null, inEvent);

    ShowMe.log(" +++ sending new touch event +++ ");

  },


  // borrowed from the new app switcher in system!
  unSynthetizeEvent: function sm_unSynthetizeEvent(e) {
    var type = e.type;
    var relevantTouches = (type == 'touchmove') ? e.touches : e.changedTouches;
    var identifiers = [];
    var xs = [];
    var ys = [];
    var rxs = [];
    var rys = [];
    var rs = [];
    var fs = [];

    for (var i = 0; i < relevantTouches.length; i++) {
      var t = relevantTouches[i];

      identifiers.push(t.identifier);
      xs.push(t.pageX);
      ys.push(t.pageY);
      rxs.push(t.radiusX);
      rys.push(t.radiusY);
      rs.push(t.rotationAngle);
      fs.push(t.force);
    }

    return [type, identifiers, xs, ys, rxs, rys, rs, fs, xs.length];
  },

  
  publishEvent: function (inType, inElement) {
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent('softwareButtonEvent', true, false, {
      type: inType
    });
    
    document.querySelector("#showme-socket-status").innerHTML = "FIRE " + inType;
    
    inElement.dispatchEvent(evt);
  }
  

};



var SocketTransport = {

  socket: false,
  isOpen: false,
  socketServer: "",
  protocol: "fxos-showme-protocol",
  clientID: "",
  clientType: "client", // can be either "client" or "controller"
  groupID: "",
  callCount: 0,

  openNewSocketCx: function (inSocketServer, inProtocol, inClientType, inGroupID) {

    if (!inSocketServer) {
      return; // TBD: throw / catch some errors here?
    }

    this.socketServer = "ws://" + inSocketServer;

    if (inProtocol) {
      this.protocol = inProtocol;
    }

    if (inClientType) {
      this.clientType = inClientType;
    }

    if (inGroupID) {
      this.groupID = inGroupID;
    }
    
    try {

      if (SocketTransport.socket) {

        SocketTransport.socket.close();

      }

      SocketTransport.socket = new WebSocket(SocketTransport.socketServer, SocketTransport.protocol);

    } catch (er) {

      ShowMe.log("can't create socket, looks like we are offline or blocked? :-/");
      ShowMe.log(er);
      ShowMe.log("-----------------------------------------------------------------");
      SocketTransport.socket = false;

    }


    if (SocketTransport.socket) {
      
      // clean up from recovery, as needed: 
      if (SocketTransport.recoveryInterval) {
        clearInterval(SocketTransport.recoveryInterval); 
      }
      SocketTransport.recoveryInterval = 0;
      SocketTransport.recoveryTries = 0;
      
      

      document.querySelector('#showme-socket-status').innerHTML = "connected: " + SocketTransport.clientType + " <span>0</span>";

      SocketTransport.clientID = SocketTransport.generateID();

      SocketTransport.socket.addEventListener("open", function (event) {

        SocketTransport.isOpen = true;

        ShowMe.log("SOCKET Connected!");

        // say hi to the server!
        var msg = '{ "clientID": "' + SocketTransport.clientID + '", "clientType":"' + SocketTransport.clientType + '", "groupID": "' + SocketTransport.groupID + '", "type": "hello", "status": "ok", "message": "hello", "x": 0, "y": 0 }';
        SocketTransport.socket.send(msg);
        
      
      });


      
      //! Handle messages received from the server
      SocketTransport.socket.addEventListener("message", function (event) {
        //message.textContent = "Server Says: " + event.data;
        
        var returnMessage = JSON.parse(event.data);
        SocketTransport.processMessage(returnMessage);

      });

      
      SocketTransport.socket.addEventListener("error", function (inError) {

        ShowMe.log("there was a socket error: ");
        ShowMe.log(inError.message)

        SocketTransport.isOpen = false;
        document.querySelector('#showme-socket-status').innerHTML = "error. not connected <span>0</span>";
        
        SocketTransport.recoverIfYouCan();
        

      });

      
      SocketTransport.socket.addEventListener("close", function (event) {
        SocketTransport.socket = false;
        SocketTransport.isOpen = false;
        document.querySelector('#showme-socket-status').innerHTML = "not connected <span>0</span>";

      });

    } // end if SocketTransport.socket sanity check
    
    else {
      document.querySelector('#showme-socket-status').innerHTML = "not connected <span>0</span>";
    }
    
    this.callCount = 0;

  },  
  

  // a quicky function to create this client a UUID
  generateID: function () {

    // always start with a letter (for DOM friendlyness)
    var idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
    do {
      // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
      var ascicode = Math.floor((Math.random() * 42) + 48);
      if (ascicode < 58 || ascicode > 64) {
        // exclude all chars between : (58) and @ (64)
        idstr += String.fromCharCode(ascicode);
      }
    } while (idstr.length < 5);

    return (idstr + new Date().getTime());

  },

  
  // we have received a socket message, let's have a look at it...
  // inMessage.type is the "opcode" here, such as it is
  processMessage: function (inMessage) {

    //ShowMe.log("!!!!!!!!!!!!!!!! MESSAGE IN!");
    //ShowMe.log("!!!!!!!!!!!!!!!! " + inMessage.type); 
    
    this.callCount ++;
    
    if (! document.querySelector('#showme-socket-status span')) {
      document.querySelector('#showme-socket-status').innerHTML += "<span>0</span>"; 
    }
    
    document.querySelector('#showme-socket-status span').innerHTML = 
      this.callCount + " " + SocketTransport.socket.bufferedAmount;
    
    
    // handle hardware inputs first...
    if ( inMessage.uiEvent == "hardwareButton" && inMessage.clientID != SocketTransport.clientID ) {
    
      ShowMe.log("incoming hardware button event: " + inMessage.hardwareEvent);
    
      if (inMessage.hardwareEvent == 'home-button-press') {
        ShowMe.publishEvent('home-button-press', window);
      }
      
      else if (inMessage.hardwareEvent == 'home-button-release') {
        ShowMe.publishEvent('home-button-release', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-up-button-press') {
        ShowMe.publishEvent('volume-up-button-press', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-up-button-release') {
        ShowMe.publishEvent('volume-up-button-release', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-down-button-press') {
        ShowMe.publishEvent('volume-down-button-press', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-down-button-release') {
        ShowMe.publishEvent('volume-down-button-release', window);
      }
      
      else if (inMessage.hardwareEvent == 'touches-enabled') {
        console.log("~~~~~ enabling TOUCHES on all clients!");
        document.getElementById("showme-event-catcher").classList.remove("touches-disabled");
      }
      
      else if (inMessage.hardwareEvent == 'touches-disabled') {
        console.log("~~~~~ DISABLING TOUCHES on all clients!");
        document.getElementById("showme-event-catcher").classList.add("touches-disabled");      
      }
      
      
    } // end hardware button event
    
    
    else if (inMessage.type == "uiEvent" && inMessage.clientID != SocketTransport.clientID) {


      //ShowMe.log("INCOMING EVENT RECEIVED!");
      //ShowMe.log("message for group: " + inMessage.groupID);
      //ShowMe.log(inMessage.uiEvent);

      var cleanEvent = inMessage.uiEvent.replace(/'/g, '"');

      var inEvent = JSON.parse(cleanEvent);

      var incomingX = inEvent[2][0];
      var incomingY = inEvent[3][0];
      
      
      var eventCatcher = document.getElementById("showme-event-catcher");
      // hide event catcher as needed to calculate target
      if (eventCatcher.classList.contains("touches-disabled")) {
        eventCatcher.classList.remove("touches-disabled");
        var target = document.elementFromPoint(incomingX, incomingY);
        eventCatcher.classList.add("touches-disabled");
      }
      else { 
        var target = document.elementFromPoint(incomingX, incomingY);
      }
            

      if (inEvent[0] == 'touchstart') {

        //console.log("~~~~~~ TOUCH START: " + cleanEvent);
        
        ShowMe.origX = incomingX;
        ShowMe.origY = incomingY;
        ShowMe.startEvent = inEvent;
        ShowMe.origTarget = target;
        ShowMe.eventStartTime = inMessage.timestamp;
        
        if (target.nodeName.toLowerCase() == "iframe") {
          
          document.querySelector("#showme-touch-indicator").classList.add("visible");
          var translateString = incomingX + "px, " + incomingY + "px, 0";
          document.querySelector("#showme-touch-indicator").style.transform = 
              "translate3d(" + translateString + ")";
        
        }

      } 
      
      else if (inEvent[0] == 'touchend') {

        var translateString = incomingX + "px, " + incomingY + "px, 0";
        document.querySelector("#showme-touch-indicator").style.transform = 
          "translate3d(" + translateString + ")";
        
        
        // the relayed event has ended, fire the events on the target:
        
        var timeDelta = inMessage.timestamp - ShowMe.eventStartTime;
          
        //ShowMe.log("calling relay with a time delta of: " + timeDelta);
          
        // we are only relaying events to iframes for now, i.e. not "system" events 
        if (ShowMe.origTarget.nodeName.toLowerCase() == "iframe") {

          
          console.log("~~~~fire touch start ");
          ShowMe.relayTouchEvent(ShowMe.origTarget, ShowMe.startEvent);
          
          // do we want to fire fake mouse events as well?
          var x = ShowMe.startEvent[2][0];
          var y = ShowMe.startEvent[3][0];
          // ShowMe.fireMouseEvent('mousedown', ShowMe.origTarget, x, y);

          //ShowMe.origTarget.sendMouseEvent('mousedown', x, y, 0, 1, null);
        } 
          
          
        var deltaX = incomingX - ShowMe.origX;
        var deltaY = incomingY - ShowMe.origY;
        
        
        // we want the minimum # of steps here for better performance
        // particularly on older hardware, the event firing takes longer than the interval
        var touchEmulationSteps = 6;
        var vectorIncrement = { x: deltaX / touchEmulationSteps, y: deltaY / touchEmulationSteps };
          
        // on high-res screens, the vector increment in real pixels will be very small
        // so calculate x and y move thresholds based on screen width...
        
        var baseWidth = window.innerWidth;
        var moveThreshold = baseWidth / 12; // that is, we need a move of at least 1/12 the screen width

        
        console.log("~~~~move threshold calculated at " + moveThreshold);
        
        
        // EMULATE MOVES if we have enough delta between touch start and touch end
        if ( Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold ) {
            
          var incrementTimeBasedOnTimeDelta = timeDelta / touchEmulationSteps;
            
          console.log("~~~~~~ setting increment time to: " + incrementTimeBasedOnTimeDelta);
          
          //! TBD: can we switch this to animation frames?

          // now fire [touchEmulationSteps] move events based on the vector:
          var vectorIndex = 1;
          var canRelayMove = ShowMe.origTarget.nodeName.toLowerCase() == "iframe";
          var vectorInterval = setInterval(function() {

              
            if (vectorIndex <= touchEmulationSteps) {
              var x = ShowMe.origX + (vectorIncrement.x * vectorIndex);
              var y = ShowMe.origY + (vectorIncrement.y * vectorIndex);

              ShowMe.startEvent[0] = "touchmove";
              ShowMe.startEvent[2][0] = x;
              ShowMe.startEvent[3][0] = y;
                              
              //console.log("~~~Sending TOUCH MOVE to " + x + " and " + y);
              //ShowMe.relayTouchEvent(ShowMe.origTarget, ShowMe.startEvent);
                
              if (canRelayMove) {
                ShowMe.relayTouchEvent(ShowMe.origTarget, ShowMe.startEvent);
                // ShowMe.fireMouseEvent('mousemove', ShowMe.origTarget, x, y);
                //ShowMe.origTarget.sendMouseEvent('mousemove', x, y, 0, 1, null);
              } 


            }
            else {

              console.log("~~~clearing interval!");
              clearInterval(vectorInterval);

              if (canRelayMove) {
                
                // relay touchend
                console.log("Sending TOUCH END");
                
                ShowMe.relayTouchEvent(target, inEvent);
                // ShowMe.fireMouseEvent('mouseup', target, incomingX, incomingY);
                //target.sendMouseEvent('mouseup', incomingX, incomingY, 0, 1, null);
              
              } 
                
              document.querySelector("#showme-touch-indicator").classList.remove("visible");

            }

            vectorIndex ++;

            }, incrementTimeBasedOnTimeDelta);
          
          }
          
          // otherwise, just fire touch end after 80ms
          else {
            
            
            // some fxos elements seem to only properly recognize selection of elements
            // when MOUSEDOWN and MOUSEUP are fired on them. WTF?
            ShowMe.origTarget.sendMouseEvent('mousedown', incomingX, incomingY, 0, 1, null);
            
            setTimeout(function() {
              
              console.log("~~~~~~ Sending TOUCH END with NO MOVE");
                            
              //ShowMe.relayTouchEvent(target, inEvent);
              if (ShowMe.origTarget.nodeName.toLowerCase() == "iframe") {
                ShowMe.relayTouchEvent(target, inEvent);
                // ShowMe.fireMouseEvent('mouseup', ShowMe.origTarget, incomingX, incomingY);
                //ShowMe.fireMouseEvent('click', ShowMe.origTarget, incomingX, incomingY);
                ShowMe.origTarget.sendMouseEvent('mouseup', incomingX, incomingY, 0, 1, null);
              } 
            

              document.querySelector("#showme-touch-indicator").classList.remove("visible");
              
            }, timeDelta); // try passing the controller's event time delta here
                           // to capture long-press... worst case, hard code to 80 for tap
            
          
          }
      

      } 
      
      
      else { // catch all for other events like cancel

        // just hide the indicator wherever it is
        document.querySelector("#showme-touch-indicator").classList.remove("visible");

      }
 

    }


  }, // end incoming socket message handler


  
  // relay hardware button event
  sendHardwareEvent: function (inEventType) {
    
    if (SocketTransport.clientType == "controller") {

      ShowMe.log("trying to relay hardware event as: " + SocketTransport.clientType);
      
      ShowMe.log("SENDING HARDWARE EVENT");
    
      var timestamp = new Date().getTime();
      
      var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "uiEvent": "hardwareButton", "status": "ok", "hardwareEvent": "' + inEventType + '", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';

      SocketTransport.socket.send(msg);
    
     }
    
  },
  
  
  // relay event to the server
  sendEvent: function (inEvent, inTargetID, inNodeName) {

    ShowMe.log("trying to relay as: " + SocketTransport.clientType);
    
    this.callCount ++;
    
    if (! document.querySelector('#showme-socket-status span')) {
      document.querySelector('#showme-socket-status').innerHTML += "<span>0</span>"; 
    }
    
    document.querySelector('#showme-socket-status span').innerHTML = 
        this.callCount;
    
    if (! SocketTransport.socket.send) {
      
       document.querySelector('#showme-socket-status').innerHTML = "NO SOCKET <span>0</span>";
       return;
    }
    
    
    if (SocketTransport.clientType == "controller") {

      ShowMe.log("SENDING EVENT");

      var evt = ShowMe.unSynthetizeEvent(inEvent);
      var evtString = JSON.stringify(evt);
      evtString = evtString.replace(/"/g, "'");

      ShowMe.log("EVENT STRING");
      ShowMe.log(evtString);


      //! TBD!  Follow action time stamps on controller and repro on client with accurate time...
      var timestamp = new Date().getTime();

      var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "targetID": "' + inTargetID + '", "nodeName": "' + inNodeName + '", "status": "ok", "uiEvent": "' + evtString + '", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';


      try {
        SocketTransport.socket.send(msg);
      }
      catch(er){
        //SocketTransport.queueEvent(inEvent, inTargetID, inNodeName);
        ShowMe.log("SOCKET ERROR, event not sent!!!! " + er.message);
        
        SocketTransport.recoverIfYouCan();
      }

    } 
  
    
  }, // end sendEvent
  
  
  // catch all error coverage, on socket errors, we will try to
  // reconnect every second for up to 120 seconds!
  recoveryQueueMessage: null,
  recoveryTries: 0,
  recoveryInterval: 0,
  recoverIfYouCan: function socket_recover(inMessage) {
    
    if (SocketTransport.recoveryTries < 1) { // that is, if we're already in a recovery loop, don't try again
    
      if (inMessage) {
        SocketTransport.recoveryQueueMessage = inMessage;
    
      }
      
      if (! SocketTransport.recoveryInterval) {
        SocketTransport.recoveryInterval = setInterval(SocketTransport.tryRecover, 1000);
      }
      
    } // end if recoveryTries check
  }, 
  
  tryRecover: function() {
    
    SocketTransport.recoveryTries ++;
    
    console.log("runnign recovery loop: try # " + SocketTransport.recoveryTries);
    
    if (SocketTransport.recoveryTries < 120) {
        
      try {
        
        SocketTransport.openNewSocketCx(
          ShowMe.socketServer, ShowMe.socketProtocol, ShowMe.clientType, ShowMe.groupID
        );
      }
      catch(er) {
       
        console.log("SHOW ME: tryRecover couldn't open socket, " + er.message);
      
      }
  
    }
    else {
       
      console.log("SHOW ME: giving up on trying to reconnect to socket server, trying for 2 minutes");
      
      clearInterval(SocketTransport.recoveryInterval);
      SocketTransport.recoveryTries = 0;
      
    }
  
    
  }


};


ShowMe.init();
