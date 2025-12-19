// lib/utils/logger.ts
export function createSimpleLogger(service: string) {
  return {
    info: (message: string, data?: any) => {
      console.log(
        `[${service}] INFO: ${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      );
    },
    error: (message: string, data?: any) => {
      console.error(
        `[${service}] ERROR: ${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      );
    },
  };
}
