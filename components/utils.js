class Utility {
    static debounce(callback, delay = 500) {
        let timeoutId; // This will store the ID of the timeout

        return (...args) => {
            // Clear any existing timeout to reset the delay
            clearTimeout(timeoutId);

            // Set a new timeout
            timeoutId = setTimeout(() => {
                callback(...args); // Execute the original function after the delay
            }, delay);
        };
    }
    static deepValue(obj, path, defaultValue = undefined) {
        let prevObj = obj;
        for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
            obj = obj[path[i]];
            if (obj === undefined && defaultValue != undefined) {
                prevObj[path[i]] = defaultValue
                return defaultValue
            }
            prevObj = obj
        }
        return obj;
    }
}

export default Utility;