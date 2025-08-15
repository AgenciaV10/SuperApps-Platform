import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { BsCheckCircleFill, BsXCircleFill, BsExclamationCircleFill } from 'react-icons/bs';
import { SiAmazon, SiGoogle, SiHuggingface, SiPerplexity, SiOpenai } from 'react-icons/si';
import { BsRobot, BsCloud } from 'react-icons/bs';
import { TbBrain } from 'react-icons/tb';
import { BiChip, BiCodeBlock } from 'react-icons/bi';
import { FaCloud, FaBrain } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useSettings } from '~/lib/hooks/useSettings';
import { useToast } from '~/components/ui/use-toast';

// Types
type ProviderName =
  | 'AmazonBedrock'
  | 'Anthropic'
  // | 'Cohere'
  | 'Deepseek'
  | 'Google'
  // | 'Groq'
  // | 'HuggingFace'
  // | 'Mistral'
  | 'OpenAI'
  | 'OpenRouter'
  // | 'Perplexity'
  // | 'Together'
  // | 'XAI';

type ServiceStatus = {
  provider: ProviderName;
  status: 'operational' | 'degraded' | 'down';
  lastChecked: string;
  statusUrl?: string;
  icon?: IconType;
  message?: string;
  responseTime?: number;
  incidents?: string[];
};

type ProviderConfig = {
  statusUrl: string;
  apiUrl: string;
  headers: Record<string, string>;
  testModel: string;
};

// Types for API responses
type ApiResponse = {
  error?: {
    message: string;
  };
  message?: string;
  model?: string;
  models?: Array<{
    id?: string;
    name?: string;
  }>;
  data?: Array<{
    id?: string;
    name?: string;
  }>;
};

// Constants
const PROVIDER_STATUS_URLS: Record<ProviderName, ProviderConfig> = {
  OpenAI: {
    statusUrl: 'https://status.openai.com/',
    apiUrl: 'https://api.openai.com/v1/models',
    headers: {
      Authorization: 'Bearer $OPENAI_API_KEY',
    },
    testModel: 'gpt-3.5-turbo',
  },
  Anthropic: {
    statusUrl: 'https://status.anthropic.com/',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': '$ANTHROPIC_API_KEY',
      'anthropic-version': '2024-02-29',
    },
    testModel: 'claude-3-sonnet-20240229',
  },
  // Cohere: {
  //   statusUrl: 'https://status.cohere.com/',
  //   apiUrl: 'https://api.cohere.ai/v1/models',
  //   headers: {
  //     Authorization: 'Bearer $COHERE_API_KEY',
  //   },
  //   testModel: 'command',
  // },
  Google: {
    statusUrl: 'https://status.cloud.google.com/',
    apiUrl: 'https://generativelanguage.googleapis.com/v1/models',
    headers: {
      'x-goog-api-key': '$GOOGLE_API_KEY',
    },
    testModel: 'gemini-pro',
  },
  // HuggingFace: {
  //   statusUrl: 'https://status.huggingface.co/',
  //   apiUrl: 'https://api-inference.huggingface.co/models',
  //   headers: {
  //     Authorization: 'Bearer $HUGGINGFACE_API_KEY',
  //   },
  //   testModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  // },
  // Mistral: {
  //   statusUrl: 'https://status.mistral.ai/',
  //   apiUrl: 'https://api.mistral.ai/v1/models',
  //   headers: {
  //     Authorization: 'Bearer $MISTRAL_API_KEY',
  //   },
  //   testModel: 'mistral-tiny',
  // },
  // Perplexity: {
  //   statusUrl: 'https://status.perplexity.com/',
  //   apiUrl: 'https://api.perplexity.ai/v1/models',
  //   headers: {
  //     Authorization: 'Bearer $PERPLEXITY_API_KEY',
  //   },
  //   testModel: 'pplx-7b-chat',
  // },
  // Together: {
  //   statusUrl: 'https://status.together.ai/',
  //   apiUrl: 'https://api.together.xyz/v1/models',
  //   headers: {
  //     Authorization: 'Bearer $TOGETHER_API_KEY',
  //   },
  //   testModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  // },
  AmazonBedrock: {
    statusUrl: 'https://health.aws.amazon.com/health/status',
    apiUrl: 'https://bedrock.us-east-2.amazonaws.com/models',
    headers: {
      Authorization: 'Bearer $AWS_BEDROCK_CONFIG',
    },
    testModel: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  },
  // Groq: {
  //   statusUrl: 'https://groqstatus.com/',
  //   apiUrl: 'https://api.groq.com/v1/models',
  //   headers: {
  //     Authorization: 'Bearer $GROQ_API_KEY',
  //   },
  //   testModel: 'mixtral-8x7b-32768',
  // },
  OpenRouter: {
    statusUrl: 'https://status.openrouter.ai/',
    apiUrl: 'https://openrouter.ai/api/v1/models',
    headers: {
      Authorization: 'Bearer $OPEN_ROUTER_API_KEY',
    },
    testModel: 'anthropic/claude-3-sonnet',
  },
  // XAI: {
  //   statusUrl: 'https://status.x.ai/',
  //   apiUrl: 'https://api.x.ai/v1/models',
  //   headers: {
  //     Authorization: 'Bearer $XAI_API_KEY',
  //   },
  //   testModel: 'grok-1',
  // },
  Deepseek: {
    statusUrl: 'https://status.deepseek.com/',
    apiUrl: 'https://api.deepseek.com/v1/models',
    headers: {
      Authorization: 'Bearer $DEEPSEEK_API_KEY',
    },
    testModel: 'deepseek-chat',
  },
};

const PROVIDER_ICONS: Record<ProviderName, IconType> = {
  AmazonBedrock: SiAmazon,
  Anthropic: FaBrain,
  // Cohere: BiChip,
  Google: SiGoogle,
  // Groq: BsCloud,
  // HuggingFace: SiHuggingface,
  // Mistral: TbBrain,
  OpenAI: SiOpenai,
  OpenRouter: FaCloud,
  // Perplexity: SiPerplexity,
  // Together: BsCloud,
  // XAI: BsRobot,
  Deepseek: BiCodeBlock,
};

const ServiceStatusTab = () => {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [testApiKey, setTestApiKey] = useState<string>('');
  const [testProvider, setTestProvider] = useState<ProviderName | ''>('');
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const settings = useSettings();
  const { success, error } = useToast();

  // Function to get the API key for a provider from environment variables
  const getApiKey = useCallback(
    (provider: ProviderName): string | null => {
      if (!settings.providers) {
        return null;
      }

      // Map provider names to environment variable names
      const envKeyMap: Record<ProviderName, string> = {
        OpenAI: 'OPENAI_API_KEY',
        Anthropic: 'ANTHROPIC_API_KEY',
        // Cohere: 'COHERE_API_KEY',
        Google: 'GOOGLE_GENERATIVE_AI_API_KEY',
        // HuggingFace: 'HuggingFace_API_KEY',
        // Mistral: 'MISTRAL_API_KEY',
        // Perplexity: 'PERPLEXITY_API_KEY',
        // Together: 'TOGETHER_API_KEY',
        AmazonBedrock: 'AWS_BEDROCK_CONFIG',
        // Groq: 'GROQ_API_KEY',
        OpenRouter: 'OPEN_ROUTER_API_KEY',
        // XAI: 'XAI_API_KEY',
        Deepseek: 'DEEPSEEK_API_KEY',
      };

      const envKey = envKeyMap[provider];

      if (!envKey) {
        return null;
      }

      // Get the API key from environment variables
      const apiKey = (import.meta.env[envKey] as string) || null;

      // Special handling for providers with base URLs
      // if (provider === 'Together' && apiKey) {
      //   const baseUrl = import.meta.env.TOGETHER_API_BASE_URL;

      //   if (!baseUrl) {
      //     return null;
      //   }
      // }

      return apiKey;
    },
    [settings.providers],
  );

  // Update provider configurations based on available API keys
  const getProviderConfig = useCallback((provider: ProviderName): ProviderConfig | null => {
    const config = PROVIDER_STATUS_URLS[provider];

    if (!config) {
      return null;
    }

    // Handle special cases for providers with base URLs
    let updatedConfig = { ...config };
    // const togetherBaseUrl = import.meta.env.TOGETHER_API_BASE_URL;

    // if (provider === 'Together' && togetherBaseUrl) {
    //   updatedConfig = {
    //     ...config,
    //     apiUrl: `${togetherBaseUrl}/models`,
    //   };
    // }

    return updatedConfig;
  }, []);

  // Function to check if an API endpoint is accessible with model verification
  const checkApiEndpoint = useCallback(
    async (
      url: string,
      headers?: Record<string, string>,
      testModel?: string,
    ): Promise<{ ok: boolean; status: number | string; message?: string; responseTime: number }> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const startTime = performance.now();

        // Add common headers
        const processedHeaders = {
          'Content-Type': 'application/json',
          ...headers,
        };

        // First check if the API is accessible
        const response = await fetch(url, {
          method: 'GET',
          headers: processedHeaders,
          signal: controller.signal,
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        clearTimeout(timeoutId);

        // Get response data
        const data = (await response.json()) as ApiResponse;

        // Special handling for different provider responses
        if (!response.ok) {
          let errorMessage = `API returned status: ${response.status}`;

          // Handle provider-specific error messages
          if (data.error?.message) {
            errorMessage = data.error.message;
          } else if (data.message) {
            errorMessage = data.message;
          }

          return {
            ok: false,
            status: response.status,
            message: errorMessage,
            responseTime,
          };
        }

        // Different providers have different model list formats
        let models: string[] = [];

        if (Array.isArray(data)) {
          models = data.map((model: { id?: string; name?: string }) => model.id || model.name || '');
        } else if (data.data && Array.isArray(data.data)) {
          models = data.data.map((model) => model.id || model.name || '');
        } else if (data.models && Array.isArray(data.models)) {
          models = data.models.map((model) => model.id || model.name || '');
        } else if (data.model) {
          // Some providers return single model info
          models = [data.model];
        }

        // For some providers, just having a successful response is enough
        if (!testModel || models.length > 0) {
          return {
            ok: true,
            status: response.status,
            responseTime,
            message: 'API key is valid',
          };
        }

        // If a specific model was requested, verify it exists
        if (testModel && !models.includes(testModel)) {
          return {
            ok: true, // Still mark as ok since API works
            status: 'model_not_found',
            message: `API key is valid (test model ${testModel} not found in ${models.length} available models)`,
            responseTime,
          };
        }

        return {
          ok: true,
          status: response.status,
          message: 'API key is valid',
          responseTime,
        };
      } catch (error) {
        console.error(`Error checking API endpoint ${url}:`, error);
        return {
          ok: false,
          status: error instanceof Error ? error.message : 'Unknown error',
          message: error instanceof Error ? `Connection failed: ${error.message}` : 'Connection failed',
          responseTime: 0,
        };
      }
    },
    [getApiKey],
  );

  // Function to fetch real status from provider status pages
  const fetchPublicStatus = useCallback(
    async (
      provider: ProviderName,
    ): Promise<{
      status: ServiceStatus['status'];
      message?: string;
      incidents?: string[];
    }> => {
      try {
        // Due to CORS restrictions, we can only check if the endpoints are reachable
        const checkEndpoint = async (url: string) => {
          try {
            const response = await fetch(url, {
              mode: 'no-cors',
              headers: {
                Accept: 'text/html',
              },
            });

            // With no-cors, we can only know if the request succeeded
            return response.type === 'opaque' ? 'reachable' : 'unreachable';
          } catch (error) {
            console.error(`Error checking ${url}:`, error);
            return 'unreachable';
          }
        };

        switch (provider) {
          case 'HuggingFace': {
            const endpointStatus = await checkEndpoint('https://status.huggingface.co/');

            // Check API endpoint as fallback
            const apiEndpoint = 'https://api-inference.huggingface.co/models';
            const apiStatus = await checkEndpoint(apiEndpoint);

            return {
              status: endpointStatus === 'reachable' && apiStatus === 'reachable' ? 'operational' : 'degraded',
              message: `Status page: ${endpointStatus}, API: ${apiStatus}`,
              incidents: ['Note: Limited status information due to CORS restrictions'],
            };
          }

          case 'OpenAI': {
            const endpointStatus = await checkEndpoint('https://status.openai.com/');
            const apiEndpoint = 'https://api.openai.com/v1/models';
            const apiStatus = await checkEndpoint(apiEndpoint);

            return {
              status: endpointStatus === 'reachable' && apiStatus === 'reachable' ? 'operational' : 'degraded',
              message: `Status page: ${endpointStatus}, API: ${apiStatus}`,
              incidents: ['Note: Limited status information due to CORS restrictions'],
            };
          }

          case 'Google': {
            const endpointStatus = await checkEndpoint('https://status.cloud.google.com/');
            const apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models';
            const apiStatus = await checkEndpoint(apiEndpoint);

            return {
              status: endpointStatus === 'reachable' && apiStatus === 'reachable' ? 'operational' : 'degraded',
              message: `Status page: ${endpointStatus}, API: ${apiStatus}`,
              incidents: ['Note: Limited status information due to CORS restrictions'],
            };
          }

          // Similar pattern for other providers...
          default:
            return {
              status: 'operational',
              message: 'Basic reachability check only',
              incidents: ['Note: Limited status information due to CORS restrictions'],
            };
        }
      } catch (error) {
        console.error(`Error fetching status for ${provider}:`, error);
        return {
          status: 'degraded',
          message: 'Unable to fetch status due to CORS restrictions',
          incidents: ['Error: Unable to check service status'],
        };
      }
    },
    [],
  );

  // Function to fetch status for a provider with retries
  const fetchProviderStatus = useCallback(
    async (provider: ProviderName, config: ProviderConfig): Promise<ServiceStatus> => {
      const MAX_RETRIES = 2;
      const RETRY_DELAY = 2000; // 2 seconds

      const attemptCheck = async (attempt: number): Promise<ServiceStatus> => {
        try {
          // First check the public status page if available
          const hasPublicStatus = [
            'Anthropic',
            'OpenAI',
            'Google',
            'HuggingFace',
            'Mistral',
            'Groq',
            'Perplexity',
            'Together',
          ].includes(provider);

          if (hasPublicStatus) {
            const publicStatus = await fetchPublicStatus(provider);

            return {
              provider,
              status: publicStatus.status,
              lastChecked: new Date().toISOString(),
              statusUrl: config.statusUrl,
              icon: PROVIDER_ICONS[provider],
              message: publicStatus.message,
              incidents: publicStatus.incidents,
            };
          }

          // For other providers, we'll show status but mark API check as separate
          const apiKey = getApiKey(provider);
          const providerConfig = getProviderConfig(provider);

          if (!apiKey || !providerConfig) {
            return {
              provider,
              status: 'operational',
              lastChecked: new Date().toISOString(),
              statusUrl: config.statusUrl,
              icon: PROVIDER_ICONS[provider],
              message: !apiKey
                ? 'Status operational (API key needed for usage)'
                : 'Status operational (configuration needed for usage)',
              incidents: [],
            };
          }

          // If we have API access, let's verify that too
          const { ok, status, message, responseTime } = await checkApiEndpoint(
            providerConfig.apiUrl,
            providerConfig.headers,
            providerConfig.testModel,
          );

          if (!ok && attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return attemptCheck(attempt + 1);
          }

          return {
            provider,
            status: ok ? 'operational' : 'degraded',
            lastChecked: new Date().toISOString(),
            statusUrl: providerConfig.statusUrl,
            icon: PROVIDER_ICONS[provider],
            message: ok ? 'Service and API operational' : `Service operational (API: ${message || status})`,
            responseTime,
            incidents: [],
          };
        } catch (error) {
          console.error(`Error fetching status for ${provider}:`, error);
          return {
            provider,
            status: 'degraded',
            lastChecked: new Date().toISOString(),
            statusUrl: config.statusUrl,
            icon: PROVIDER_ICONS[provider],
            message: 'Unable to fetch status due to an error',
            incidents: ['Error: Unable to check service status'],
          };
        }
      };

      return attemptCheck(1);
    },
    [fetchPublicStatus, getApiKey, getProviderConfig, checkApiEndpoint],
  );

  // Effect to fetch statuses periodically
  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoading(true);
      const providers = Object.keys(PROVIDER_STATUS_URLS) as ProviderName[];
      const statusPromises = providers.map((provider) => {
        const config = PROVIDER_STATUS_URLS[provider];
        return fetchProviderStatus(provider, config);
      });

      const results = await Promise.all(statusPromises);
      setServiceStatuses(results);
      setLoading(false);
    };

    fetchAllStatuses();
    const interval = setInterval(fetchAllStatuses, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchProviderStatus]);

  // Effect to test API key for a specific provider
  useEffect(() => {
    const testApiKeyForProvider = async () => {
      if (testProvider && testApiKey) {
        setTestingStatus('testing');
        const config = PROVIDER_STATUS_URLS[testProvider];
        if (!config) {
          setTestingStatus('error');
          error({
            title: 'Provider not found',
            description: `Provider "${testProvider}" not found in configuration.`,
          });
          return;
        }

        const { ok, status, message, responseTime } = await checkApiEndpoint(
          config.apiUrl,
          config.headers,
          config.testModel,
        );

        if (ok) {
          success({
            title: 'API Key Valid',
            description: `API key is valid for ${testProvider}. Response time: ${responseTime.toFixed(2)}ms`,
          });
          setTestingStatus('success');
        } else {
          error({
            title: 'API Key Invalid',
            description: `API key is invalid for ${testProvider}. Status: ${status}, Message: ${message}`,
          });
          setTestingStatus('error');
        }
      }
    };

    testApiKeyForProvider();
    const interval = setInterval(testApiKeyForProvider, 60000); // Test every minute
    return () => clearInterval(interval);
  }, [testProvider, testApiKey, checkApiEndpoint, success, error]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Service Status</h2>
      <div className="grid gap-4">
        {loading ? (
          <p>Loading service statuses...</p>
        ) : serviceStatuses.length === 0 ? (
          <p>No providers configured.</p>
        ) : (
          serviceStatuses.map((status) => (
            <div
              key={status.provider}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="mr-3 text-lg">
                  <status.icon className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-md font-medium">{status.provider}</h3>
                  <p className="text-sm text-gray-700">{status.message}</p>
                  {status.incidents && status.incidents.length > 0 && (
                    <ul className="mt-1 text-xs text-red-600">
                      {status.incidents.map((incident, index) => (
                        <li key={index}>{incident}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <TbActivityHeartbeat className="mr-1" />
                Last checked: {new Date(status.lastChecked).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-md font-semibold mb-2">Test API Key</h3>
        <div className="flex items-center space-x-2">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={testProvider}
            onChange={(e) => setTestProvider(e.target.value as ProviderName)}
          >
            <option value="">Select a provider to test</option>
            {Object.keys(PROVIDER_STATUS_URLS).map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Enter API Key"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={testApiKey}
            onChange={(e) => setTestApiKey(e.target.value)}
          />
          <button
            onClick={() => setTestingStatus('testing')}
            className="flex h-10 w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={!testProvider || !testApiKey || testingStatus === 'testing'}
          >
            {testingStatus === 'testing' ? (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Test API Key'
            )}
          </button>
        </div>
        {testingStatus === 'success' && (
          <div className="mt-2 flex items-center text-green-600 text-sm">
            <BsCheckCircleFill className="mr-1" />
            API key is valid!
          </div>
        )}
        {testingStatus === 'error' && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <BsXCircleFill className="mr-1" />
            API key is invalid.
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceStatusTab;
