/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * HTTP Client using native fetch()
 *
 * Lightweight replacement for axios using CloudFlare Workers-compatible fetch API.
 * Provides same functionality as axios but with ~40KB smaller bundle size.
 */
/**
 * HTTP error structure (axios-compatible)
 */
export class HttpError extends Error {
    constructor(message, config, response) {
        super(message);
        this.name = 'HttpError';
        this.config = config;
        this.response = response;
    }
}
/**
 * HTTP Client - Axios-compatible interface using native fetch()
 */
export class HttpClient {
    constructor(config) {
        this.responseInterceptors = [];
        this.errorInterceptors = [];
        this.requestInterceptors = new Map();
        this.requestInterceptorId = 0;
        this.baseURL = config.baseURL;
        this.defaultHeaders = config.headers || {};
        this.defaultTimeout = config.timeout || 30000;
        this.transformResponse = config.transformResponse?.[0];
    }
    /**
     * Add request/response interceptors (axios-compatible)
     */
    get interceptors() {
        return {
            request: {
                use: (onFulfilled) => {
                    const id = ++this.requestInterceptorId;
                    if (onFulfilled) {
                        this.requestInterceptors.set(id, onFulfilled);
                    }
                    return id;
                },
                eject: (id) => {
                    this.requestInterceptors.delete(id);
                }
            },
            response: {
                use: (onFulfilled, onRejected) => {
                    if (onFulfilled) {
                        this.responseInterceptors.push(onFulfilled);
                    }
                    if (onRejected) {
                        this.errorInterceptors.push(onRejected);
                    }
                }
            }
        };
    }
    /**
     * Make HTTP request
     */
    async request(config) {
        const { url, method = 'GET', headers = {}, body, timeout = this.defaultTimeout } = config;
        // Combine base URL with request URL
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        // Merge headers
        const requestHeaders = {
            ...this.defaultHeaders,
            ...headers
        };
        // Set up abort controller for timeout
        const controller = new AbortController();
        const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;
        try {
            // Make the fetch request
            const fetchConfig = {
                method,
                headers: requestHeaders,
                signal: controller.signal
            };
            // Add body for non-GET requests
            if (body && method !== 'GET') {
                // FormData should be passed directly (fetch handles it automatically)
                if (body instanceof FormData) {
                    fetchConfig.body = body;
                }
                else {
                    fetchConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
                }
            }
            const response = await fetch(fullUrl, fetchConfig);
            // Clear timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // Parse response body
            const contentType = response.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }
            else {
                data = await response.text();
            }
            // Apply transform if provided
            if (this.transformResponse) {
                data = this.transformResponse(data);
            }
            // Convert Headers to plain object
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            // Create axios-compatible response object
            const httpResponse = {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                config: { ...config, url: fullUrl }
            };
            // Check for HTTP errors
            if (!response.ok) {
                const error = new HttpError(`Request failed with status ${response.status}`, { ...config, url: fullUrl }, {
                    status: response.status,
                    statusText: response.statusText,
                    data,
                    headers: responseHeaders
                });
                // Apply error interceptors
                for (const interceptor of this.errorInterceptors) {
                    interceptor(error);
                }
                throw error;
            }
            // Apply response interceptors
            let finalResponse = httpResponse;
            for (const interceptor of this.responseInterceptors) {
                finalResponse = interceptor(finalResponse);
            }
            return finalResponse;
        }
        catch (error) {
            // Clear timeout on error
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // Handle timeout errors
            if (error.name === 'AbortError') {
                const timeoutError = new HttpError(`Request timeout after ${timeout}ms`, { ...config, url: fullUrl });
                timeoutError.code = 'ECONNABORTED';
                throw timeoutError;
            }
            // Re-throw if already an HttpError
            if (error instanceof HttpError) {
                throw error;
            }
            // Wrap network errors
            const networkError = new HttpError(error.message || 'Network error', { ...config, url: fullUrl });
            networkError.code = 'ERR_NETWORK';
            // Apply error interceptors
            for (const interceptor of this.errorInterceptors) {
                interceptor(networkError);
            }
            throw networkError;
        }
    }
    /**
     * GET request
     */
    async get(url, config) {
        return this.request({ ...config, url, method: 'GET' });
    }
    /**
     * POST request
     */
    async post(url, data, config) {
        return this.request({ ...config, url, method: 'POST', body: data });
    }
    /**
     * PUT request
     */
    async put(url, data, config) {
        return this.request({ ...config, url, method: 'PUT', body: data });
    }
    /**
     * DELETE request
     */
    async delete(url, config) {
        return this.request({ ...config, url, method: 'DELETE' });
    }
    /**
     * PATCH request
     */
    async patch(url, data, config) {
        return this.request({ ...config, url, method: 'PATCH', body: data });
    }
}
/**
 * Factory function to create HTTP client (axios.create compatible)
 */
export function createHttpClient(config) {
    return new HttpClient(config);
}
