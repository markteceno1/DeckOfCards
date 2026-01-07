/**
 * Centralized environment configuration for k6
 */
export const ENV = {
  BASE_URL: __ENV.BASE_URL ?? 'http://127.0.0.1:8000',
  API_PREFIX: __ENV.API_PREFIX ?? '/api/deck',

  TEST_TYPE: (__ENV.TEST_TYPE ?? 'smoke') as 'smoke' | 'load' | 'endurance',

  PROM_RW_URL: __ENV.K6_PROMETHEUS_RW_SERVER_URL ?? 'http://localhost:9090/api/v1/write',
  HISTOGRAMS: __ENV.K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM ?? 'true',
};
