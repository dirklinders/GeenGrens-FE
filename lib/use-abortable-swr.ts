'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';

/**
 * An SWR fetcher whose in-flight request is cancelled when its last rendered
 * consumer goes away. SWR deliberately deduplicates requests, but it does not
 * abort a browser fetch when a component unmounts; that is undesirable for
 * fast-changing game tabs on a slow connection.
 */
export function useAbortableSWR<Data>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<Data>,
  config?: SWRConfiguration<Data>,
) {
  const controllerRef = useRef<AbortController | null>(null);

  const abortableFetcher = useCallback(async () => {
    // A revalidation supersedes any older request owned by this component.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      return await fetcher(controller.signal);
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [fetcher]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return useSWR<Data>(key, abortableFetcher, config);
}
