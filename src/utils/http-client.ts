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
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * HTTP response structure (axios-compatible)
 */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: HttpRequestConfig & { url: string };
}

/**
 * HTTP error structure (axios-compatible)
 */
export class HttpError extends Error {
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
  };
  config?: HttpRequestConfig & { url: string };
  code?: string;

  constructor(
    message: string,
    config?: HttpRequestConfig & { url: string },
    response?: {
      status: number;
      statusText: string;
      data: any;
      headers: Record<string, string>;
    }
  ) {
    super(message);
    this.name = 'HttpError';
    this.config = config;
    this.response = response;
  }
}

/**
 * Response interceptor function type
 */
type ResponseInterceptor = (response: HttpResponse) => HttpResponse;
type ErrorInterceptor = (error: any) => never;

/**
 * HTTP Client - Axios-compatible interface using native fetch()
 */
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private transformResponse?: (data: any) => any;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    timeout?: number;
    transformResponse?: [(data: any) => any];
  }) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.headers || {};
    this.defaultTimeout = config.timeout || 30000;
    this.transformResponse = config.transformResponse?.[0];
  }

  /**
   * Add response interceptor (axios-compatible)
   */
  get interceptors() {
    return {
      response: {
        use: (onFulfilled: ResponseInterceptor, onRejected: ErrorInterceptor) => {
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
  async request<T = any>(config: HttpRequestConfig & { url: string }): Promise<HttpResponse<T>> {
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
      const fetchConfig: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        // FormData should be passed directly (fetch handles it automatically)
        if (body instanceof FormData) {
          fetchConfig.body = body;
        } else {
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
      let data: any;

      if (contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } else {
        data = await response.text();
      }

      // Apply transform if provided
      if (this.transformResponse) {
        data = this.transformResponse(data);
      }

      // Convert Headers to plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Create axios-compatible response object
      const httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        config: { ...config, url: fullUrl }
      };

      // Check for HTTP errors
      if (!response.ok) {
        const error = new HttpError(
          `Request failed with status ${response.status}`,
          { ...config, url: fullUrl },
          {
            status: response.status,
            statusText: response.statusText,
            data,
            headers: responseHeaders
          }
        );

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
    } catch (error: any) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle timeout errors
      if (error.name === 'AbortError') {
        const timeoutError = new HttpError(
          `Request timeout after ${timeout}ms`,
          { ...config, url: fullUrl }
        );
        timeoutError.code = 'ECONNABORTED';
        throw timeoutError;
      }

      // Re-throw if already an HttpError
      if (error instanceof HttpError) {
        throw error;
      }

      // Wrap network errors
      const networkError = new HttpError(
        error.message || 'Network error',
        { ...config, url: fullUrl }
      );
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
  async get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body: data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body: data });
  }
}

/**
 * Factory function to create HTTP client (axios.create compatible)
 */
export function createHttpClient(config: {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  transformResponse?: [(data: any) => any];
}): HttpClient {
  return new HttpClient(config);
}
