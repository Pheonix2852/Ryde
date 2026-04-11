import { useCallback, useEffect, useState } from "react";

export const fetchAPI = async <T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    const isJSON = contentType.includes("application/json");

    const rawBody = await response.text();
    let body: unknown = rawBody;

    // Some route handlers may return JSON text without setting content-type.
    if (
      isJSON ||
      rawBody.trim().startsWith("{") ||
      rawBody.trim().startsWith("[")
    ) {
      try {
        body = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        body = rawBody;
      }
    }

    if (!response.ok) {
      const details = typeof body === "string" ? body : JSON.stringify(body);
      throw new Error(
        `HTTP error ${response.status}: ${details || response.statusText}`,
      );
    }

    return body as T;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI<{ data: T }>(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
