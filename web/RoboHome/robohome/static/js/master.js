/**
 * JavaScript for home automation system prototype
 * Author: Li Quan Khoo
 * Documentation in YUIDoc format
 *   http://yui.github.com/yuidoc/syntax/index.html
 */

var APP = APP || {};
"use strict";

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

/* Declarations are structured this way for easy text-replace in case of API changes
 * It can be restructured at some point from e.g.:
    APP.CONSTANTS = {};
    APP.CONSTANTS.VERSION = '0.1';
 * to
    APP.CONSTANTS = {
        VERSION: '0.1'
    };
 */

// Application constants
APP.CONSTANTS = {};
APP.CONSTANTS.VERSION = '0.1';

// DOM classes and ids
APP.DOM_HOOK = {};
APP.DOM_HOOK.STAGE_CONTENT = 'stage-content';
APP.DOM_HOOK.ENTITY = {};
APP.DOM_HOOK.ENTITY.ITEM_TYPE = 'item-type';
APP.DOM_HOOK.ENTITY.ROOM = 'room';
APP.DOM_HOOK.ENTITY.ITEM = 'item';
APP.DOM_HOOK.ENTITY.DOOR = 'door';
APP.DOM_HOOK.ENTITY.LIGHT = 'light';
APP.DOM_HOOK.ENTITY.WINDOW = 'window';
APP.DOM_HOOK.UPDATING = 'updating';
APP.DOM_HOOK.UPDATED = 'updated';
APP.DOM_HOOK.CONNECTION_ERROR = 'connection-error';

// These are property name bindings as specified by the API
APP.API = {};
APP.API.WRAPPER = {};
APP.API.WRAPPER.STATUS_CODE = 'statusCode';
APP.API.WRAPPER.CONTENT = 'content';
APP.API.VERSION = {};
APP.API.VERSION.SUPPORTED_TYPES = 'supportedTypes';
APP.API.VERSION.SUPPORTED_TYPE = {};
APP.API.VERSION.SUPPORTED_TYPE.NAME = 'name';
APP.API.VERSION.SUPPORTED_TYPE.SUPPORTED_BRANDS = 'supportedBrands';
APP.API.VERSION.SUPPORTED_TYPE.METHODS = 'methods';
APP.API.VERSION.SUPPORTED_TYPE.STATES = 'states';
APP.API.VERSION.SUPPORTED_TYPE.STATE = {};
APP.API.VERSION.SUPPORTED_TYPE.STATE.ID = 'id';
APP.API.VERSION.SUPPORTED_TYPE.STATE.NAME = 'name';
APP.API.VERSION.SUPPORTED_TYPE.STATE.METHOD = 'method';
APP.API.STRUCT = {};
APP.API.STRUCT.ROOMS = 'rooms';
APP.API.STRUCT.ROOM = {};
APP.API.STRUCT.ROOM.ID = 'id';
APP.API.STRUCT.ROOM.NAME = 'name';
APP.API.STRUCT.ROOM.ITEMS = 'items';
APP.API.STRUCT.ROOM.ITEM = {};
APP.API.STRUCT.ROOM.ITEM.ITEM_TYPE = 'itemType';
APP.API.STRUCT.ROOM.ITEM.ID = 'id';
APP.API.STRUCT.ROOM.ITEM.BRAND = 'brand';
APP.API.STRUCT.ROOM.ITEM.IP = 'ip';
APP.API.STRUCT.ROOM.ITEM.NAME = 'name';
APP.API.STATE = {};
APP.API.STATE.STATES = 'states';
APP.API.STATE.STATE = 'state';
APP.API.STATE.ID = 'id';

// RESTful API URL specification
// Remember to specify the trailing slash so Flask does not have to redirect
APP.URL = {};
APP.URL.VERSION = '/version/';
APP.URL.STRUCTURE = '/version/' + APP.CONSTANTS.VERSION + '/structure/';
APP.URL.STATE = '/version/' + APP.CONSTANTS.VERSION + '/state/';
APP.URL.ROOMS = '/version/' + APP.CONSTANTS.VERSION + '/rooms/';
APP.URL.ROOMS_ROOMID = function(roomId) {
    return '/version/' + APP.CONSTANTS.VERSION + '/rooms/' + roomId + '/';
};
APP.URL.ROOMS_ROOMID_ITEMS = function(roomId) {
    return '/version/' + APP.CONSTANTS.VERSION + '/rooms/' + roomId + '/items/';
};
APP.URL.ROOMS_ROOMID_ITEMS_ITEMID = function(roomId, itemId) {
    return '/version/' + APP.CONSTANTS.VERSION + '/rooms/' + roomId + '/items/' + itemId + '/';
};
APP.URL.ROOMS_ROOMID_ITEMS_ITEMID_CMD = function(roomId, itemId, cmd) {
    return '/version/' + APP.CONSTANTS.VERSION + '/rooms/' + roomId + '/items/' + itemId + '/' + cmd + '/';
}
APP.URL.EVENTS = '/version/' + APP.CONSTANTS.VERSION + '/events/';
APP.URL.EVENTS_EVENTID = function(eventId) {
    return '/version/' + APP.CONSTANTS.VERSION + '/events/' + eventId + '/';
};

// ---------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------

/**
 * @method APP.inherit
 * @param {Constructor} C Child class to inherit to
 * @param {Constructor} P Parent class to inherit from
 * @static
 * Standard inheritance function
 * The child inherits members of the parent's prototype only.
 */
APP.inherit = function(C, P) {
    var F = function() {};          // create intermediate
    F.prototype = P.prototype;      // intermediate's prototype borrows from parent's
    C.prototype = new F();          // child inherits from new instance of intermediate. Breaks prototype reference to parent
    C.uber = P.prototype;           // set child's superclass as parent's prototype
    C.prototype.constructor = C;    // reset child's constructor pointer
};

/**
 * @class APP.Map
 * @constructor
 * HashMap implementation
 */
APP.Map = function() {
    this.__items = {};
    this.size = 0;
};

/**
 * @for APP.Map
 * @method hash
 * @param {any} value Any object or primitive to be hashed
 * @return {String} hash of given value
 * Hash function from
 * http://stackoverflow.com/questions/368280/javascript-hashmap-equivalent
 *   Maybe change it to a simpler one which handles only strings for higher performance
 */
APP.Map.prototype.hash = function(value) {
    return (typeof value) + ' ' + (value instanceof Object ?
        (value.__hash || (value.__hash = ++arguments.callee.current)) :
        value.toString());
};

/**
 * @for APP.Map
 * @method clear
 * Delete all entries in the hashmap
 */
APP.Map.prototype.clear = function() {
    this.__items = {};
    this.size = 0;
};

/**
 * @for APP.Map
 * @method put
 * @param {any} key Key
 * @param {any} value Value
 * Adds a key-value pair to the hashmap
 */
APP.Map.prototype.put = function(key, value) {
    var hash;
    hash = this.hash(key);
    if(this.__items[hash] === undefined) {
        this.__items[hash] = { key: key, value: value };
        this.size++;
    }
    else this.__items[hash].value = value;
};

/**
 * @for APP.Map
 * @method remove
 * @param {any} key Key of entry to remove
 * Remove an entry from the hashmap
 */
APP.Map.prototype.remove = function(key) {
    var hash,
        item;
    hash = this.hash(key);
    item = this.__items[hash];
    if(item !== undefined) {
        this.size--;
        delete this.__items[hash];
    }
};

/**
 * @for APP.Map
 * @method get
 * @param {any} key Key of entry to retrieve
 * @return {any} Value of key
 * Retrieve the value of the specified key in the hashmap
 */
APP.Map.prototype.get = function(key) {
    var hash,
        item;
    hash = this.hash(key);
    item = this.__items[hash];
    if (item === undefined) { return undefined; } 
    return item.value;
};

/**
 * @for APP.Map
 * @method getAll
 * @return {Array} Array of values
 * Returns array of all values in hashmap
 */
APP.Map.prototype.getAll = function() {
    var valueList = [];
    for (var item in this.__items) {
        valueList.push(this.__items[item].value);
    }
    return valueList;
};

/**
 * @for APP.Map
 * @method getKeys
 * @return {Array} Array of keys
 * Returns array containing the hashes of all keys in the hashmap
 */
APP.Map.prototype.getKeys = function() {
    var hash,
        itemList = [];
    for(var item in this.items) {
        itemList.push(item);
    }
    return itemList;
};

// ---------------------------------------------------------------------
// Active data
// ---------------------------------------------------------------------

APP.data = {
    cache: undefined, // data which does not change unless the version changes
    connection: { // stores Date objects corresponding to last attempt, successful, or unsuccessful connection
        lastAttempt: undefined,
        lastSuccess: undefined,
        lastNoSuccess: undefined
    },
    state: undefined,
    menuManager: undefined,
    stageManager: undefined
};

// ---------------------------------------------------------------------
// Message packing / unpacking
// ---------------------------------------------------------------------

/**
 * @method APP.pack
 * @param {Object} payload  Object to pack
 * @return {Object}         Object in API message format
 * @static
 * Packs given object into API message format
 */
APP.pack = function(payload) {
    var obj = {};
    obj[APP.API.WRAPPER.CONTENT] = payload;
    return obj;
};

/**
 * @method APP.packToJSON
 * @param {Object} payload  Object to pack
 * @return {String}         JSON string in API message format
 * @static
 * Packs given object into JSON string in API message format
 */
APP.packToJSON = function(payload) {
    return JSON.stringify(APP.pack(payload))
};

/**
 * @method APP.unpack
 * @param {String} json JSON string
 * @return {Object}     Object
 * @static
 * Currently equivalent of JSON.parse(obj)
 */
APP.unpack = function(json) {
    return JSON.parse(json);
};

/**
 * @method APP.unpackToPayload
 * @param {String} json JSON string in API message format
 * @return {Object}     Payload object
 * @static
 * Unpacks API JSON string and returns the payload object
 */
APP.unpackToPayload = function(json) {
    return JSON.parse(json)[APP.API.WRAPPER.CONTENT];
};

// ---------------------------------------------------------------------
// AJAX calls
// ---------------------------------------------------------------------

/**
 * @method APP.ajax
 * @param {String} requestType  HTTP request type e.g. 'GET', 'POST', etc.
 * @param {String} url          URL string to send request to
 * @param {Object} payload      Object to pack
 * @param {Function} callback   Callback function
 * @param {Function} error      Function to execute if AJAX request fails
 */
APP.ajax = function(requestType, url, payload, callback, error) {
    var messageObj,
        internalCallback,
        internalError;
    
    message = APP.packToJSON(payload);
    internalCallback = function(args) {
        APP.data.connection.lastSuccess = new Date();
        APP.data.connection.lastSuccess.setTime(APP.data.connection.lastAttempt);
        console.log('AJAX callback called ' + url + ' ' + APP.clock.getTimestamp(APP.data.connection.lastSuccess));
        if(callback) {
            callback(args);
        }
    };
    internalError = function(args) {
        APP.data.connection.lastNoSuccess = new Date();
        APP.data.connection.lastNoSuccess.setTime(APP.data.connection.lastAttempt);
        console.log('AJAX error ' + url + ' ' + APP.clock.getTimestamp(APP.data.connection.lastNoSuccess));
        if(error) {
            error(args);
        }
    };
    APP.data.connection.lastAttempt = APP.clock.getCurrentDate();
    $.ajax({
        type: requestType,
        url: url,
        data: message,
        processData: false,
        cache: false,
        contentType: 'application/json',
        dataType: 'text',
        success: internalCallback,
        error: internalError
    });
};

/**
 * @method APP.ajax_get_structure
 * @param {Function} callback Callback function to execute after response is received
 * Retrieves the latest house structure from the server
 */
APP.ajax_get_structure = function(callback, error) {
    APP.ajax('GET', APP.URL.STRUCTURE, '',
        function(json) {
            var obj = APP.unpackToPayload(json);
            APP.data.houseStructure = obj;
            callback();
        },
        error
    );
};

/**
 * @method APP.ajax_get_version
 * @param {Function} callback Callback function to execute after response is received
 * @param {Function} error      Function to execute if AJAX request fails
 * Retrieves version information and all information that's supposed to be cached
 */
APP.ajax_get_version = function(callback, error) {
    APP.ajax('GET', APP.URL.VERSION, '',
        function(json) {
            var obj = APP.unpackToPayload(json);
            APP.data.cache = obj;
            callback();
        },
        error
    );
}

/**
 * @method APP.ajax_get_status
 * @param {Function} callback Callback function to execute after response is received
 * @param {Function} error      Function to execute if AJAX request fails
 * Retrieves the latest available states of all sensors (items)
 */
APP.ajax_get_state = function(callback, error) {
    APP.ajax('GET', APP.URL.STATE, '',
        function(json) {
            var obj = APP.unpackToPayload(json);
            APP.data.state = obj;
            callback();
        },
        error
    );
}

/**
 * @method APP.ajax_put_rooms_roomId_items_itemId
 * @param {int} roomId ID of room
 * @param {int} itemId ID of item
 * @param {String} cmd Command to send to the item
 * @param {Function} callback Callback function to execute after response is received
 * @param {Function} error      Function to execute if AJAX request fails
 * Updates the specified item in the room with the new state
 */
APP.ajax_put_rooms_roomId_items_itemId_cmd = function(roomId, itemId, cmd, callback, error) {
    APP.ajax('PUT', APP.URL.ROOMS_ROOMID_ITEMS_ITEMID_CMD(roomId, itemId, cmd), '',
        function(json) {
            callback();
        },
        error
    );
}

// ---------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------

/**
 * @class APP.ContextMenu
 * @constructor
 * This class handles the context menu for each Stage
 * The context menu is associated with each Stage. Each Stage's construct() and tearDown() will call the 
 * equivalent of the instance of this class associated with the Stage.
 */
APP.ContextMenu = function() {
    var selector = '#context-menu';
    
    /**
     * @for APP.ContextMenu
     * @method getContext
     * Returns the jQuery object of the ContextMenu
     */
    this.getContext = function() {
        return $(selector);
    }
    
    /**
     * @for APP.ContextMenu
     * @method construct
     * This executes the function given in setConstruct().
     * This method is automatically called by the associated Stage's construct() method
     */
    this.construct = function() {};
    
    /**
     * @for APP.ContextMenu
     * @method setConstruct
     * Give the function to execute when the ContextMenu's construct() is called
     */
    this.setConstruct = function(func) {
        this.construct = func;
    }
    
    /**
     * @for APP.ContextMenu
     * @method tearDown
     * This clears the ContextMenu area by calling jQuery's .html('')
     * This is called automatically by the associated Stage's onTearDown() method
     */
    this.tearDown = function() {
        $(selector).html('');
    }
}

/**
 * @class APP.Poller
 * @constructor
 * This class handles periodic function calls via window.setInterval
 */
APP.Poller = function() {
    this.intervalId;
    this.frequency;
    this.poll = function() {};
}

/**
 * @for APP.Poller
 * @method startPolling
 */
APP.Poller.prototype.startPolling = function() {
    if(this.frequency) {
        this.intervalId = window.setInterval(this.poll, this.frequency);
    }
}

/**
 * @for APP.Poller
 * @method stopPolling
 */
APP.Poller.prototype.stopPolling = function() {
    window.clearInterval(this.intervalId);
}

/**
 * @for APP.Poller
 * @method setPoll
 * @param {int} frequency Frequency to call the function
 * @param {Function} func Function to execute repeatedly when startPolling() is called
 */
APP.Poller.prototype.setPoll = function(frequency, func) {
    this.frequency = frequency;
    this.poll = func;
}

/**
 * @class APP.Stage
 * @constructor
 * @param {String} menuId       Element id of menu containing button
 * @param {String} buttonId     Element id of button
 * @param {String} buttonText   Text of button to show/hide the stage and fire onClick() when stage becomes active
 * @param {String} stageId      Id of DOM element which represents the stage
 * Class responsible for running a stage in the UI.
 * Construction and updating behavior are configured via modifying construct() and update()
 * NOTE: setOnShow(), setOnHide(), setTearDown(), onShow(), onHide(), and tearDown() have hardcoded default behavior
 */
APP.Stage = function(menuId, buttonId, buttonText, stageId) {
    var __menuId = menuId,
        __buttonId = buttonId,
        __buttonText = buttonText,
        __stageId = stageId,
        __contextMenu = new APP.ContextMenu(),
        __poller = new APP.Poller(),
        __colorClass;
    
    if(this.menuId === null) {
        __colorClass = $('#' + __buttonId).attr('data-color-class');
    } else {
        __colorClass = $('#' + __menuId).attr('data-color-class');
    }
    
    this.data = {};
    this.menuId = __menuId;
    this.buttonId = __buttonId;
    this.buttonText = __buttonText;
    this.stageId = __stageId;
    this.contextMenu = __contextMenu;
    this.poller = __poller;
    this.colorClass = __colorClass;
    
    /**
     * @for APP.Stage
     * @property data
     * @type {Object}
     * @default {}
     * Data specific to this stage
     */
    this.data = {};
    
    /**
     * @for APP.Stage
     * @method onShow
     * This function is executed when the stage is shown
     * Set this via setOnShow()
     * onShow() and onHide() are called by APP.MenuManager automatically when buttons are clicked on
     * NOTE: This method has default behavior. (calls construct())
     */
    this.onShow = function() {
        this.construct();
    };
    
    /**
     * @for APP.Stage
     * @method onHide
     * This function is executed when the stage is hidden.
     * Set this via setOnHide()
     * onShow() and onHide() are called by APP.MenuManager automatically when buttons are clicked on
     * NOTE: This method has default behavior (calls tearDown())
     */
    this.onHide = function() {
        this.tearDown();
    };
    
    /**
     * @for APP.Stage
     * @method construct
     * This function should specify the behavior for constructing the UI within the stage area.
     * This function calls the construct() method of this stage's ContextMenu every time it is run.
     * It should only need to construct the DOM structure for update() to run on. It should call update()
     *   to update what the UI with the latest data if it needs to do so. You could call tearDown() at the
     *   beginning to make sure the stage has been cleared for construction.
     * Set this via setConstruct()
     */
    this.construct = function() {};
    
    /**
     * @for APP.Stage
     * @method tearDown
     * This function should specify the behavior for deconstructing the UI within the stage area.
     * This should be the opposite of what construct() does
     * Set this via setTeardown()
     * NOTE: This method has default behavior (see source for details)
     */
    this.tearDown = function() {
        this.getContext().html('');     // clear stage area
        this.data = {};                 // clear data
        this.contextMenu.tearDown();    // clear context menu
        this.poller.stopPolling();      // stop any polling
    };
        
    /**
     * @for APP.Stage
     * @method update
     * This function should specify the behavior for updating an existing UI within the stage area, without
     * having to repeatedly construct() and tearDown()
     * Set this via setUpdate()
     */
    this.update = function() {};
    
    /**
     * @for APP.Stage
     * @method updateError
     * This function should specify the behavior of the UI if the update AJAX request fails
     * Set this via setUpdateError()
     */
    this.updateError = function() {};
};

/**
 * @for APP.Stage
 * @method getContext
 * Gets the content area of the stage
 */
APP.Stage.prototype.getContext = function() {
    return $('#' + this.stageId + ' > .' + APP.DOM_HOOK.STAGE_CONTENT);
};

/**
 * @for APP.Stage
 * @method setOnShow
 * @param {Function} func Function to be passed in
 * Give function to run when onShow() is called
 * This function will execute after any hardcoded behavior in onShow()
 * Default behavior: construct()
 */
APP.Stage.prototype.setOnShow = function(func) {
    var self = this;
    this.onShow = function() {
        console.log(self.stageId + ' onShow() called');
        // console.trace(this);
        self.construct(); // default behavior
        func();
    }
};

/**
 * @for APP.Stage
 * @method setOnHide
 * @param {Function} func Function to be passed in
 * Give function to execute when onHide() is called
 * This function will execute after any hardcoded behavior in onHide()
 * Default behavior: tearDown()
 */
APP.Stage.prototype.setOnHide = function(func) {
    var self = this;
    this.onHide = function() {
        console.log(self.stageId + ' onHide() called');
        // console.trace(this);
        self.tearDown(); // default behavior
        func();
    }
};

/**
 * @for APP.Stage
 * @method setConstruct
 * @param {Function} func Function to be passed in
 * Give function to execute when construct() is called.
 * This function will execute after any hardcoded behavior in construct()
 * Default behavior: contextMenu.construct() after func()
 */
APP.Stage.prototype.setConstruct = function(func) {
    var self = this;
    this.construct = function() {
        console.log(self.stageId + ' construct() called');
        // console.trace(this);
        self.contextMenu.construct();
        func();
    }
};

/**
 * @for APP.Stage
 * @method setTearDown
 * @param {Function} func Function to be passed in
 * Give function to execute when tearDown() is called. 
 * tearDown() should be the behavior to clear the stage area of contents
 * Default behavior: getcontext().html(''); contextMenu.tearDown(); poller.stopPolling();
 */
APP.Stage.prototype.setTearDown = function(func) {
    var self = this;
    this.tearDown = function() {
        console.log(self.stageId + ' tearDown() called');
        // console.trace(this);
        self.getContext().html('');
        self.data = {};
        self.contextMenu.tearDown();
        self.poller.stopPolling();
        func();
    }
};

/**
 * @for APP.Stage
 * @method setUpdate
 * @param {Function} func Function to be passed in
 * Give function to execute when update() is called.
 * update() should be the function that's repeatedly called to update the UI constructed by construct()
 * Default behavior: none
 */
APP.Stage.prototype.setUpdate = function(func) {
    var self = this;
    this.update = function() {
        console.log(self.stageId + ' update() called');
        // console.trace(this);
        func();
    }
};

/**
 * @for APP.Stage
 * @method setUpdate
 * @param {Function} func Function to be passed in
 * Give function to execute when updateError() is called.
 * updateError() should be the function that's called if the updating AJAX request fails
 * Default behavior: none
 */
APP.Stage.prototype.setUpdateError = function(func) {
    var self = this;
    this.updateError = function() {
        console.log(self.stageId + ' updateError() called');
        // console.trace(this);
        func();
    }
}

/**
 * @for APP.Stage
 * @method setUpdate
 * @param {Function} func Function to be passed in
 * Give function to construct the Stage's ContextMenu
 * The given function is called automatically when the Stage's construct() function is called
 */
APP.Stage.prototype.setMenuConstruct = function(func) {
    this.contextMenu.setConstruct(func);
}

/**
 * @for APP.Stage
 * @method setPollFunction
 * @param {int} frequency Frequency to execute the given function, in milliseconds
 * @param {Function} func Function to execute repeatedly
 */
APP.Stage.prototype.setPollFunction = function(frequency, func) {
    this.poller.setPoll(frequency, func);
}

/**
 * @class APP.ItemTypeDisplay
 * @constructor
 * @param {Stage} stage Stage object hosting this ItemTypeDisplay
 * @param {Object} roomData Object with room data specified according to API
 * This class handles the controlling of all items contained within one room
 */
APP.ItemTypeDisplay = function(stage, itemType, items) {
    var __stage = stage,
        __itemType = itemType,
        __items = items;
    
    this.stage = __stage;
    this.itemType = __itemType;
    this.items = __items;
};

/**
 * @for APP.ItemTypeDisplay
 * @method construct
 * Constructs the representation of this object on the stage
 */
APP.ItemTypeDisplay.prototype.construct = function() {
    var self = this;

    function constructItemPanels(items) {
        
        var itemPanel,
            infoBar,
            attachmentsSelf,
            itemPanels = [];
        
        for(var i = 0; i < items.length; i++) {
        
            itemPanel = $('<div></div>').attr({
                class: 'entity-display ' + APP.DOM_HOOK.ENTITY.ITEM,
                'data-id': items[i][APP.API.STRUCT.ROOM.ITEM.ID], // currently used
                'data-ip': items[i][APP.API.STRUCT.ROOM.ITEM.IP],
                'data-name': items[i][APP.API.STRUCT.ROOM.ITEM.NAME],
                'data-brand': items[i][APP.API.STRUCT.ROOM.ITEM.BRAND],
                'data-itemtype': items[i][APP.API.STRUCT.ROOM.ITEM.ITEM_TYPE] // currently used
            });
            
            itemPanel.click(function() {
                if(items[0].state !== undefined) { // if state information has been retrieved
                    var dis = $(this),
                        itemId = $(this).attr('data-id'),
                        itemType = $(this).attr('data-itemtype'),
                        states = APP.data.cache[APP.API.VERSION.SUPPORTED_TYPES][itemType][APP.API.VERSION.SUPPORTED_TYPE.STATES];
                        
                    $(this).addClass(APP.DOM_HOOK.UPDATING);
                    function getNextState(itemId) {
                        for(var j = 0; j < self.items.length; j++) {
                            if(self.items[j][APP.API.STRUCT.ROOM.ITEM.ID] === parseInt(itemId)) {
                                console.log(self.items[j]);
                                for(var k = 0; k < states.length; k++) {
                                    if(self.items[j][APP.API.STATE.STATE] === states[k][APP.API.VERSION.SUPPORTED_TYPE.STATE.ID]) {
                                        return APP.data.cache[APP.API.VERSION.SUPPORTED_TYPES][itemType][APP.API.VERSION.SUPPORTED_TYPE.STATES][(k + 1) % states.length][APP.API.VERSION.SUPPORTED_TYPE.STATE.METHOD];
                                    }
                                }
                            }
                        }
                    }
                    
                    APP.ajax_put_rooms_roomId_items_itemId_cmd(
                        self.stage.data.roomId,
                        itemId,
                        getNextState(itemId),
                        function() {
                            dis.addClass(APP.DOM_HOOK.UPDATED);
                            self.update();
                        }
                    )
                }
            });
            
            infoBar = $('<div></div>').addClass('info-bar');
            infoBar.append($('<h1>' + items[i][APP.API.STRUCT.ROOM.ITEM.NAME] + '</h1>').addClass('entity-name'));
            infoBar.append($('<span>' + items[i][APP.API.STRUCT.ROOM.ITEM.IP] + '</span>').addClass('entity-ip'));
            itemPanel.append(infoBar);
            
            attachmentsSelf = $('<div></div>').addClass('attachments self');
            attachmentsSelf.append($('<div><img src="../static/img/ajax-loader.gif"></img></div>').addClass('status'));
            itemPanel.append(attachmentsSelf);
            
            itemPanels.push(itemPanel);
        }
        return itemPanels;
    }
    
    var itemTypePanel,
        infoBar,
        itemPanels,
        displayedName;
        
    itemPanels = constructItemPanels(this.items);
    itemTypePanel = $('<div></div>').attr({
        class: 'entity-display ' + APP.DOM_HOOK.ENTITY.ITEM_TYPE,
        'data-name': this.itemType
    });
    
    infoBar = $('<div></div>').addClass('info-bar');
    displayedName = APP.data.cache[APP.API.VERSION.SUPPORTED_TYPES][this.itemType][APP.API.VERSION.SUPPORTED_TYPE.NAME];
    if(displayedName === undefined) {
        displayedName === this.itemType;
    }
    infoBar.append($('<h1>' + displayedName + '</h1>').addClass('entity-name'));
    itemTypePanel.append(infoBar);
    
    for(var j = 0; j < itemPanels.length; j++) {
        itemTypePanel.append(itemPanels[j]);
    }
    
    this.stage.getContext().append(itemTypePanel);
            
};

/**
 * @for APP.ItemTypeDisplay
 * @method update
 * Updates the representation of this object on the stage
 */
APP.ItemTypeDisplay.prototype.update = function() {
    var states = APP.data.state[APP.API.STATE.STATES],
        stateList = APP.data.cache[APP.API.VERSION.SUPPORTED_TYPES][this.itemType][APP.API.VERSION.SUPPORTED_TYPE.STATES],
        id,
        itemPanel,
        statePanel;
    
    // for every item of type
    for(var i = 0; i < this.items.length; i++) {
        id = this.items[i][APP.API.STRUCT.ROOM.ITEM.ID];
        
        // update info
        for(var j = 0; j < states.length; j++) {
            if(states[j][APP.API.STATE.ID] === id) {
                this.items[i][APP.API.STATE.STATE] = states[j][APP.API.STATE.STATE];
                break;
            }
        }
        // update UI
        for(var k = 0; k < stateList.length; k++) {
            if(stateList[k][APP.API.VERSION.SUPPORTED_TYPE.STATE.ID] === this.items[i].state) {
                itemPanel = $('.entity-display.item[data-id = ' + this.items[i][APP.API.STRUCT.ROOM.ITEM.ID] + ']');
                statePanel = $('.entity-display.item[data-id = ' + this.items[i][APP.API.STRUCT.ROOM.ITEM.ID] + '] .status');
                itemPanel.removeClass(APP.DOM_HOOK.CONNECTION_ERROR + ' ' + APP.DOM_HOOK.UPDATING + ' ' + APP.DOM_HOOK.UPDATING);
                statePanel.html(stateList[k][APP.API.VERSION.SUPPORTED_TYPE.STATE.NAME]);
                break;
            }
        }
        
    }
};

/**
 * @for APP.ItemTypeDisplay
 * @method updateError
 * Updates the representation to show that an error has occured in fetching the latest state data
 */
APP.ItemTypeDisplay.prototype.updateError = function() {
    var stateList = APP.data.cache[APP.API.VERSION.SUPPORTED_TYPES][this.itemType][APP.API.VERSION.SUPPORTED_TYPE.STATES],
        id,
        itemPanel,
        statePanel;
    
    for(var i = 0; i < this.items.length; i++) {
        id = this.items[i][APP.API.STRUCT.ROOM.ITEM.ID];
        
        if(APP.data.state) { // if client has old state data
            for(var k = 0; k < stateList.length; k++) {
                itemPanel = $('.entity-display.item[data-id = ' + this.items[i][APP.API.STRUCT.ROOM.ITEM.ID] + ']');
                statePanel = $('.entity-display.item[data-id = ' + this.items[i][APP.API.STRUCT.ROOM.ITEM.ID] + '] .status');
                itemPanel.addClass(APP.DOM_HOOK.CONNECTION_ERROR);
                statePanel.html(stateList[k][APP.API.VERSION.SUPPORTED_TYPE.STATE.NAME]);
                break;
            }
        }
    }
};

/**
 * @class APP.MenuManager
 * @constructor
 * @param {APP.StageManager} stageManager StageManager object responsible for hiding the stages
 * This class handles the top menus. Linking of buttons in the secondary menu
 *   and the stages are configured under APP.StageManager instead.
 */
APP.MenuManager = function(stageManager) {
    var linked = false,
        stageManager
        // map specifying the menus to generate at the start
        map = {
            'button-home' :  {
                menuId: null,
                buttonText: 'Home',
                class: 'blue'
            },
            'button-control' : {
                menuId: 'menu-control',
                buttonText: 'Control',
                class: 'blue'
            },
            'button-rules' : {
                menuId: 'menu-rules',
                buttonText: 'Rules',
                class: 'green'
            },
            'button-config' : {
                menuId: 'menu-config',
                buttonText: 'Config',
                class: 'yellow'
            }
        },
        primaryMenu = $('#menu-primary'),
        secondaryMenuWrapper = $('#wrapper-secondary'),
        
        init = function() {
            var target,
                mapping;
            
            function constructButton(buttonId, buttonText, cls, menuId) {
                var button;
                if (document.getElementById(buttonId) === null) { 
                    button = $('<a>' + buttonText + '</a>').attr({id: buttonId, class: cls, 'data-color-class': cls, href: '#'});
                    if(menuId === null) { button.addClass('no-menu'); }
                    button = $('<li></li>').append(button);
                    $('#menu-primary').append(button);
                }
            }
            
            function constructSecondaryMenu(menuId, buttons, cls) {
                // construct menu
                var menu;
                if(menuId !== null) {
                    if(document.getElementById(menuId) === null) {
                        menu = $('<ul></ul>').attr({id: menuId, class: 'menu horizontal secondary ' + cls, 'data-color-class': cls});
                        secondaryMenuWrapper.append(menu);
                    } else {
                        menu = $('#' + menuId);
                    }
                }
            }
            
            // This links the buttons with the menus
            function link() {
                var primaryButtons = primaryMenu.children().children(),
                    menus = secondaryMenuWrapper.children();
                primaryButtons.each(function() {
                    $(this).click(function() {
                        target = $(this);
                        if(map[$(this).attr('id')].menuId !== null) {
                            target.toggleClass('selected');
                        }
                        primaryButtons.not(target).each(function() {
                            $(this).removeClass('selected');
                        });
                        mapping = map[$(this).attr('id')].menuId;
                        $('#' + mapping).toggleClass('active');
                        menus.not('#' + mapping).removeClass('active');
                        menus.children().removeClass('selected');
                        // If this button has an associated menu --> not being used as Stage button
                        if(mapping !== null) {
                            var primaryButtonSelector = '#menu-prmary > li > a',
                                secondaryButtonSelector = '#wrapper-secondary > ul > li > a';
                            $(primaryButtonSelector).not(target).removeClass('selected');
                            $(secondaryButtonSelector).not(target).removeClass('selected');
                            stageManager.toggleStage(null);
                        }
                        APP.resizer.resizeStageWrapper();
                    });
                });
            }
            
            for(var buttonId in map) {
                var obj = map[buttonId];
                constructButton(buttonId, obj.buttonText, obj.class, obj.menuId);
                constructSecondaryMenu(obj.menuId, obj.buttons, obj.class);
            }
            if(!linked) {
                linked = true;
                link();
            }
        }
    
    /**
     * @for APP.MenuManager
     * @method init
     * This constructs the top menus according to what's specified in this class.
     */
    this.init = init;
};

/**
 * @class APP.StageManager
 * @constructor
 * This class handles Stage objects
 */
APP.StageManager = function() {
    var primaryMenuId = 'menu-primary',
        primaryButtonSelector = '#menu-prmary > li > a',
        secondaryMenuId = 'wrapper-secondary',
        secondaryButtonSelector = '#wrapper-secondary > ul > li > a',
        stageSelector = '#stages > .stage',
        activeStageSelector = '#stages > .stage.active',
        stageContainerSelector = '#stages',
        
        activeStageId = null,
        stages = new APP.Map(),
        
        // private methods
        setActiveStage = function(stageId) {
            activeStageId = stageId;
        },
        
        // public methods
        addStage = function(stage) {
            // construct menu buttons
            if(document.getElementById(stage.buttonId) === null) {
                button = $('<li></li>').append($('<a>' + stage.buttonText + '</a>').attr({id: stage.buttonId, href: '#'}));
                $('#' + stage.menuId).append(button);
            }
            
            // construct stage template
            if(document.getElementById(stage.stageId) === null) {
                var stageElement = $('<div></div>').attr({id: stage.stageId, class: 'stage'});
                stageElement.append($('<div></div>').addClass('stage-content ' + stage.colorClass));
                $(stageContainerSelector).append(stageElement);
            }
            
            // link
            $('#' + stage.buttonId).click(function() {
                var targetButton = $(this);
                // toggle clicked button
                targetButton.toggleClass('selected');
                // toggle sibling buttons
                $(primaryButtonSelector).not(targetButton).removeClass('selected');
                $(secondaryButtonSelector).not(targetButton).removeClass('selected');
                // toggle stages
                toggleStage(stage.stageId);
            });
            
            // register stage
            stages.put(stage.stageId, stage);
            return stage.stageId;
        },
        
        toggleStage = function(stageId) {
            
            var targetStage,
                activeStage;
            
            function hideActiveStage() {
                var activeStage = stages.get(activeStageId);
                activeStageId = null;
                $('#' + activeStage.stageId).removeClass('active');
                activeStage.onHide();
            }
            
            function showNewStage(stageId) {
                var newStage = stages.get(stageId);
                activeStageId = newStage.stageId;
                $('#' + newStage.stageId).addClass('active');
                newStage.onShow();
            }
            
            if(stageId === null) {
                if(activeStageId !== null) {
                    hideActiveStage();
                }
            } else {
                if(activeStageId === null) { // no active stage
                    showNewStage(stageId);
                } else { // has active stage
                    if(activeStageId === stageId) {
                        hideActiveStage();
                    } else {
                        hideActiveStage();
                        showNewStage(stageId);
                    }
                }
            }
            
        },
        
        init = function() {
        
        // home stage
        (function() {
            var stageId = addStage(new APP.Stage(null, 'button-home', '', 'stage-home')),
                stage = stages.get(stageId);
            
            stage.setOnShow(function() {
                // default
            });
            stage.setOnHide(function() {
                // default
            });
            stage.setMenuConstruct(function() {
                // default
            });
            stage.setConstruct(function() {
                // default
            });
            stage.setTearDown(function() {
                // default
            });
            stage.setUpdate(function() {
                // default
            });
            stage.setUpdateError(function() {
                // default
            });
            stage.setPollFunction(1000, function() {
                
            });
        })();
        
        // control stages
        APP.ajax_get_structure(function() {
            var rooms = APP.data.houseStructure[APP.API.STRUCT.ROOMS];
            for(var i = 0; i < rooms.length; i++) {
                
                // for each room...
                (function() {
                    var room = rooms[i],
                        roomName = room[APP.API.STRUCT.ROOM.NAME],
                        safeRoomName = roomName.replace(/\s/, '-'),
                        stageId = addStage(new APP.Stage('menu-control',
                            'button-control-' + safeRoomName, roomName, 'stage-control-' + safeRoomName)),
                        stage = stages.get(stageId);
                    
                    stage.setOnShow(function() {
                        // default
                    });
                    stage.setOnHide(function() {
                        // default
                    });
                    stage.setMenuConstruct(function() {
                        var wrapper = $('<div></div>').addClass('context-menu-inner-wrapper'),
                            content = $('<div></div>').addClass('context-menu-content');
                        
                        function constructRoomsPanel() {
                            var rooms = $('<div></div>');
                            rooms.append($('<h3></h3>').html('Add new room'));
                            rooms.append($('<input></input>').attr({
                                id: 'context-add-room-name-input',
                                type: 'text',
                                placeholder: 'Room name'})
                            );
                            rooms.append($('<a href="#">Add</a>').attr({id: 'context-add-room-button', class: 'button'}));
                            rooms.append($('<h3></h3>').html('Remove this room ('+ room[APP.API.STRUCT.ROOM.NAME] + ')'));
                            rooms.append($('<input></input>').attr({
                                id: 'context-remove-room-name-input',
                                type: 'text',
                                placeholder: 'Confirm this room\'s name'})
                            );
                            rooms.append($('<a href="#">Remove</a>').attr({id: 'context-remove-room-button', class: 'button'}));
                            return rooms;
                        }
                        
                        function constructItemsPanel() {
                            var items = $('<div></div>');
                            items.append($('<h2></h2>').html('Items'));
                            items.append($('<h3></h3>').html('Add'));
                            items.append($('<input></input>').attr({
                                id: 'context-add-item-name-input',
                                type: 'text',
                                placeholder: 'Item\'s name'})
                            );
                            items.append($('<input></input>').attr({
                                id: 'context-add-item-ip-input',
                                type: 'text',
                                placeholder: 'Item\'s static IP address'})
                            );
                            items.append($('<select></select>').attr({id: 'context-add-item-select'}));
                            items.append($('<a href="#">Add</a>').attr({id: 'context-add-item-button', class: 'button'}));
                            items.append($('<h3></h3>').html('Remove'));
                            items.append($('<select></select>').attr({id: 'context-remove-item-select'}));
                            items.append($('<a href="#">Remove</a>').attr({id: 'context-remove-item-button', class: 'button'}));
                            return items;
                        }
                        
                        wrapper.append(content);
                        content.append($('<h1></h1>').html('Room manager'));
                        content.append(constructRoomsPanel());
                        content.append(constructItemsPanel());
                        
                        console.log(room);
                        stage.contextMenu.getContext().append(wrapper);
                    });
                    stage.setConstruct(function() {
                        stage.getContext().append($('<div></div>').attr({id: 'context-bar'}));
                        
                        stage.data.itemTypes = {};
                        var itemTypes = stage.data.itemTypes,
                            items = room[APP.API.STRUCT.ROOM.ITEMS],
                            item,
                            itemType;
                        for(var j = 0; j < items.length; j++) {
                            item = items[j];
                            itemType = item[APP.API.STRUCT.ROOM.ITEM.ITEM_TYPE];
                            if(itemTypes[itemType] === undefined) {
                                itemTypes[itemType] = [];
                            }
                            itemTypes[itemType].push(item);
                        }
                        stage.data.roomId = room[APP.API.STRUCT.ROOM.ITEM.ID];
                        stage.data.itemTypeDisplays = {};
                        for(var itemType in itemTypes) {
                            if(itemTypes.hasOwnProperty(itemType)) {
                                stage.data.itemTypeDisplays[itemType] = new APP.ItemTypeDisplay(stage, itemType, itemTypes[itemType]);
                                stage.data.itemTypeDisplays[itemType].construct();
                            }
                        }
                        stage.poller.startPolling();
                    });
                    stage.setTearDown(function() {
                        // default
                    });
                    stage.setUpdate(function() {
                        $('#context-bar').html('');
                        for(var display in stage.data.itemTypeDisplays) {
                            if(stage.data.itemTypeDisplays.hasOwnProperty(display)) {
                                stage.data.itemTypeDisplays[display].update(APP.data.state);
                            }
                        }
                    });
                    stage.setUpdateError(function() {
                        $('#context-bar').html('Caution: Connection to server lost. Displaying last available state info retrieved at ' + APP.clock.getTimestamp(APP.data.connection.lastSuccess));
                        for(var display in stage.data.itemTypeDisplays) {
                            if(stage.data.itemTypeDisplays.hasOwnProperty(display)) {
                                stage.data.itemTypeDisplays[display].updateError();
                            }
                        }
                    });
                    stage.setPollFunction(1000, function() {
                        APP.ajax_get_state(stage.update, stage.updateError);
                    });
                    
                })();
                
            }
        });
        
        // eca stage
        (function() {
            var stageId = addStage(new APP.Stage('menu-rules', 'button-rules-eca', 'ECA', 'stage-rules-eca')),
                stage = stages.get(stageId);
            
            stage.setOnShow(function() {
                // default
            });
            stage.setOnHide(function() {
                // default
            });
            stage.setMenuConstruct(function() {
                // default
            });
            stage.setConstruct(function() {
                // default
            });
            stage.setTearDown(function() {
                // default
            });
            stage.setUpdate(function() {
                // default
            });
            stage.setUpdateError(function() {
                // default
            });
            stage.setPollFunction(1000, function() {
                
            });
        })();
        
    };
    
    /**
     * @for APP.StageManager
     * @method addStage
     * @param {APP.Stage} stage Stage object to be managed by this manager
     * @return {String}         Input stage element id, for convenience
     * If the new stage shares an existing stageId, it will replace the old stage
     */
    this.addStage = addStage;
    
    /**
     * @for APP.StageManager
     * @method toggleStage
     * @param {String | null} stageId Element id of stage to toggle on/off, or null to toggle off regardless of current active stage
     */
    this.toggleStage = toggleStage;
        
    /**
     * @for APP.StageManager
     * @method init
     */
    this.init = init;
};

/**
 * @static
 * This object handles time and the clock
 */
APP.clock = {
    
    /**
     * @for APP.clock
     * @method getCurrentDate
     * returns the current date object
     */
    getCurrentDate: function() {
        return new Date();
    },
    
    /**
     * @for APP.clock
     * @method getTimestamp
     * @param {Date} dateInput Input Date object. If not defined, this method uses the current date
     * @return {String} String formatted to represent current time, from hours to milliseconds
     */
    getTimestamp: function(dateInput) {
        var date;
        if(dateInput) { date = dateInput; }
        else { date = new Date(); }
        function pad(num) {
            return (num < 10) ? "0" + num : num;
        }
        function padK(num) {
            if(num < 10) { return "00" + num; }
            if(num < 100) { return "0" + num; }
            return num;
        }
        return (pad(date.getFullYear()) + ' ' + pad(parseInt(date.getMonth()) + 1) + ' ' + pad(date.getDate()) + ' ' + pad(date.getHours()) + '' + pad(date.getMinutes()) + ' ' + pad(date.getSeconds()) + ' ' + padK(date.getMilliseconds()));
    },
    
    /**
     * @for APP.clock
     * @method getCurrentTime
     * Updates the clock defined on the DOM with the current system time
     */
    getCurrentTime: function() {
        var date = new Date(),
            currentYear = date.getFullYear(),
            currentMonth = date.getMonth(),
            currentDate = date.getDate(),
            currentHours = date.getHours(),
            currentMinutes = date.getMinutes(),
            currentDay = date.getDay(),
            timeOfDay;
            
        if (currentMinutes < 10) { currentMinutes = "0" + currentMinutes; }
        if (currentHours >= 12) {
            if (currentHours === 12) {
                currentHours = 12;
                timeOfDay = 'PM';
            } else {
                currentHours -= 12;
                timeOfDay = 'PM';
            }
        } else {
            timeOfDay = "AM";
        }

        switch(currentDay) {
        case 0: currentDay = "Sunday"; break;
        case 1: currentDay = "Monday"; break;
        case 2: currentDay = "Tuesday"; break;
        case 3: currentDay = "Wednesday"; break;
        case 4: currentDay = "Thursday"; break;
        case 5: currentDay = "Friday"; break;
        case 6: currentDay = "Saturday"; break;
        }
        
        switch(currentMonth) {
        case 0: currentMonth = "January"; break;
        case 1: currentMonth = "February"; break;
        case 2: currentMonth = "March"; break;
        case 3: currentMonth = "April"; break;
        case 4: currentMonth = "May"; break;
        case 5: currentMonth = "June"; break;
        case 6: currentMonth = "July"; break;
        case 7: currentMonth = "August"; break;
        case 8: currentMonth = "September"; break;
        case 9: currentMonth = "October"; break;
        case 10: currentMonth = "November"; break;
        case 11: currentMonth = "December"; break;
        }
        
        $('#hours-minutes').html(currentHours + ":" + currentMinutes);
        $('#am-pm').html(timeOfDay);
        $('#day').html(currentDay);
        $('#date').html(currentDate + " " + currentMonth + " " + currentYear);
         
    },
    
    /**
     * @for APP.clock
     * @method startClock
     * Starts the scripts that runs the clock on the DOM
     */
    startClock: function() {
        APP.clock.getCurrentTime();
        setInterval(APP.clock.getCurrentTime, 1000);
    }
};

/**
 * @static
 * This object handles window resizing
 */
APP.windowResizeListener = {
    /**
     * @for APP.windowResizeListener
     * @method listen
     */
    listen: function() {
        $(window).resize(function() {
            APP.resizer.resizeAll();
        });
    }
};

/**
 * @static
 * This object handles dynamic resizing of elements and font size
 */
APP.resizer = {
    /**
     * @for APP.resizer
     * @method resizeAll
     */
    resizeAll: function() {
        for(var method in APP.resizer) {
            if(method === 'resizeAll') { continue; }
            APP.resizer[method]();
        }
    },
    /**
     * @for APP.resizer
     * @method resizeText
     */
    resizeText: function() {
        var masterFontSize;
        masterFontSize = (window.innerWidth / 100) + 'px';
        $('body').css('font-size', masterFontSize);
    },
    /**
     * @for APP.resizer
     * @method resizeStageWrapper
     */
    resizeStageWrapper: function() {
        var stageHeight;
        stageHeight = (window.innerHeight - $('#wrapper-primary').height() - $('#wrapper-secondary').height()) + 'px';
        $('#wrapper-stage').css('height', stageHeight);
    },
    /*
     * @for APP.resizer
     * @method resizeLeftPanel
     */
    /*
    resizeLeftPanel: function() {
        var panelHeight;
        panelHeight = (window.innerHeight - $('#chronograph').height()) + 'px';
        $('#left-panel').css('height', panelHeight);
    }
    */
};

$(document).ready(function() {
    
    APP.ajax_get_version(function() {
        // Instantiate manager objects
        APP.data.stageManager = new APP.StageManager(),
        APP.data.menuManager = new APP.MenuManager(APP.data.stageManager);
        
        // Construct menus
        APP.data.menuManager.init();
        APP.data.stageManager.init();
        
        // Start clock
        APP.clock.startClock();
        
        // Listen to size changes
        APP.windowResizeListener.listen();
        APP.resizer.resizeAll();
        
        // remove UI mask
        // start polling    
    });
        
});
