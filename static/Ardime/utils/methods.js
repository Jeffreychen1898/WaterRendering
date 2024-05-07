/* @param { JSONObject, JSONObject } */
function processOptions(_defaultOption, _overrideOption) {
    const new_option = { ..._defaultOption };
    if(_overrideOption == undefined)
        return new_option;

    for(const each_option in new_option) {
        // continue if no override is defined
        if(typeof(_overrideOption[each_option]) != typeof(_defaultOption[each_option])
        && _defaultOption[each_option] != null)
            continue;
        
        // override
        const option_type = typeof(_overrideOption[each_option]);
        if(option_type != "object" || _defaultOption[each_option] == null) {
            new_option[each_option] = _overrideOption[each_option];
            continue;
        }

        // objects do not have to have all parts specified
        for(const option_part in _overrideOption[each_option]) {
            if(new_option[each_option][option_part] == undefined)
                continue;
            new_option[each_option][option_part] = _overrideOption[each_option][option_part];
        }
    }

    return new_option;
}

function requireLib(_libraryName, _library) {
    if(!_library)
        return console.error("missing " + _libraryName + "!");
}

export {
    processOptions,
    requireLib
}
