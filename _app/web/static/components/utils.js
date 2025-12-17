function object2Array(obj) {
    const inputObject = obj;
    var objArray = []
    for (var attr in inputObject) {
        let objValue = inputObject[attr]
        objValue["_id"] = attr
        objArray.push(objValue)
    }
    return objArray
}

function deepCopy(obj) {
    // Note: deepCopy cannot handle undefined due to JSON.stringify limitation
    if (obj === undefined) return obj
    return JSON.parse(JSON.stringify(obj))
}

function sort(elements, key) {
    if (!Array.isArray(elements)) {
        throw new Error('First parameter must be an array');
    }
    
    if (!key || typeof key !== 'string') {
        throw new Error('Sort key must be a non-empty string');
    }
    
    return elements.sort((a, b) => {
        let valueA = a[key];
        let valueB = b[key];

        // Handle null/undefined values - put them at the end
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;
        
        // Convert to numbers and sort numerically
        return valueA - valueB;
    });
}


function sortFormElements(elements, key = 'order') {
    if (!Array.isArray(elements)) {
        throw new Error('First parameter must be an array');
    }
    
    if (!key || typeof key !== 'string') {
        throw new Error('Sort key must be a non-empty string');
    }
    
    return elements.sort((a, b) => {
        let valueA = a[key];
        let valueB = b[key];

        if (a["type"] == "object" ) {
            valueA = 15000
        }
        if (b["type"] == "object" ) {
            valueB = 15000
        }

        if (a["type"] == "array" ) {
            valueA = 10000
        }
        if (b["type"] == "array" ) {
            valueB = 10000
        }

        // Handle null/undefined values - put them at the end
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;
        
        // Convert to numbers and sort numerically
        return valueA - valueB;
    });
}



export { object2Array, deepCopy, sort, sortFormElements };