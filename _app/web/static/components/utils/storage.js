class LocalStorageManager {

    constructor(namespace) {
        this.namespace = namespace ? `${namespace}:` : '';
    }
    /**
     * Sets an item in local storage.
     * @param {string} key - The key for the item.
     * @param {*} value - The value to store. Objects and arrays will be stringified.
     */
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error(`Error setting item "${key}" in local storage:`, error);
        }
    }

    /**
     * Gets an item from local storage.
     * @param {string} key - The key of the item to retrieve.
     * @returns {*} The retrieved value, parsed from JSON if possible, otherwise the raw string.
     */
    getItem(key) {
        try {
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) {
                return null;
            }
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error(`Error getting item "${key}" from local storage:`, error);
            // Return the raw string if parsing fails (e.g., not a valid JSON string)
            return localStorage.getItem(key);
        }
    }

    /**
     * Removes an item from local storage.
     * @param {string} key - The key of the item to remove.
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing item "${key}" from local storage:`, error);
        }
    }

    /**
     * Clears all items from local storage for the current origin.
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error("Error clearing local storage:", error);
        }
    }

    /**
     * Gets the key at a specific index in local storage.
     * @param {number} index - The index of the key.
     * @returns {string|null} The key name, or null if the index is out of bounds.
     */
    getKey(index) {
        try {
            return localStorage.key(index);
        } catch (error) {
            console.error(`Error getting key at index "${index}" from local storage:`, error);
            return null;
        }
    }
}

export default LocalStorageManager;