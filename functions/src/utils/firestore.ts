function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

export function sanitizeFirestoreData<T>(value: T): T {
    if (value === undefined) {
        return undefined as T;
    }

    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => sanitizeFirestoreData(item))
            .filter((item) => item !== undefined) as T;
    }

    if (!isPlainObject(value)) {
        return value;
    }

    const sanitizedEntries = Object.entries(value).flatMap(([key, entryValue]) => {
        const sanitizedValue = sanitizeFirestoreData(entryValue);
        return sanitizedValue === undefined ? [] : [[key, sanitizedValue] as const];
    });

    return Object.fromEntries(sanitizedEntries) as T;
}
