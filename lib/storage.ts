export const STORAGE_KEYS = {
    SETTINGS: 'lavanderia_settings',
    HISTORY: 'lavanderia_history',
    NOTES: 'lavanderia_notes',
};

export class StorageService {
    static isClient(): boolean {
        return typeof window !== 'undefined';
    }

    static getItem<T>(key: string, defaultValue: T): T {
        if (!this.isClient()) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading key "${key}" from localStorage:`, error);
            return defaultValue;
        }
    }

    static setItem<T>(key: string, value: T): void {
        if (!this.isClient()) return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            // Dispatch a custom event so other components can listen for changes (optional but good for sync)
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error(`Error writing key "${key}" to localStorage:`, error);
        }
    }

    static removeItem(key: string): void {
        if (!this.isClient()) return;
        try {
            localStorage.removeItem(key);
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error(`Error removing key "${key}" from localStorage:`, error);
        }
    }
}
