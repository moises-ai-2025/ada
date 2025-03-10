export function createSampler<T extends (...args: any[]) => any>(fn: T, sampleInterval: number): T {
    let lastArgs: Parameters<T> | null = null;
    let lastTime = 0;
    let timeout: NodeJS.Timeout | null = null;
  
    // Create a function with the same type as the input function
    const sampled = function (this: any, ...args: Parameters<T>) {
      const now = Date.now();
      lastArgs = args;
  
      // If we're within the sample interval, just store the args
      if (now - lastTime < sampleInterval) {
        // Set up trailing call if not already set
        if (!timeout) {
          timeout = setTimeout(
            () => {
              timeout = null;
              lastTime = Date.now();
  
              if (lastArgs) {
                fn.apply(this, lastArgs);
                lastArgs = null;
              }
            },
            sampleInterval - (now - lastTime),
          );
        }
  
        return;
      }
  
      // If we're outside the interval, execute immediately
      lastTime = now;
      fn.apply(this, args);
      lastArgs = null;
    } as T;
  
    return sampled;
  }