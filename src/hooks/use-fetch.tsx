"use client";
import { useState } from "react";
import { toast } from "sonner";

export function useFetch<T, Args extends unknown[]>(
  cb: (...args: Args) => Promise<T>,
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const fn = async (...args: Args) => {
    setLoading(true);
    setError(null);

    try {
      const res = await cb(...args);
      setData(res);
      setError(null);
      return res;
    } catch (error) {
      const e = error as Error;
      setError(e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  return { data, loading, error, fn, setData };
}
