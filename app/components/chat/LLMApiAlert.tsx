import { AnimatePresence, motion } from 'framer-motion';
import type { LlmErrorAlertType } from '~/types/actions';
import { classNames } from '~/utils/classNames';

interface Props {
  alert: LlmErrorAlertType;
  clearAlert: () => void;
}

export default function LlmErrorAlert({ alert, clearAlert }: Props) {
  const { title, description, provider, errorType } = alert;

  const getErrorIcon = () => {
    switch (errorType) {
      case 'authentication':
        return 'i-ph:key-duotone';
      case 'rate_limit':
        return 'i-ph:clock-duotone';
      case 'quota':
        return 'i-ph:warning-circle-duotone';
      default:
        return 'i-ph:warning-duotone';
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'authentication':
        return `Falha na autenticação com ${provider}. Verifique sua chave de API.`;
      case 'rate_limit':
        return `Limite de taxa excedido para ${provider}. Aguarde antes de tentar novamente.`;
      case 'quota':
        return `Cota excedida para ${provider}. Verifique os limites da sua conta.`;
      default:
        return 'Ocorreu um erro ao processar sua solicitação.';
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'authentication':
        return 'Erro de Autenticação';
      case 'rate_limit':
        return 'Limite de Taxa Excedido';
      case 'quota':
        return 'Cota Excedida';
      default:
        return 'Erro do Servidor';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-6 mb-4 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-start">
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <div className={`${getErrorIcon()} text-2xl text-red-500 drop-shadow-sm`}></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-[#FF7C3F] via-[#FF4C7D] to-[#A24CFF] rounded-full animate-pulse"></div>
            </div>
          </motion.div>

          <div className="ml-3 flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-1"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {getErrorTitle()}
              </h3>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-[#FF7C3F] via-[#FF4C7D] to-[#A24CFF] text-white shadow-sm">
                SuperApps
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-sm text-bolt-elements-textSecondary"
            >
              <p>{getErrorMessage()}</p>

              {description && (
                <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg mt-3 mb-3 border border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Detalhes do erro:</span> {description}
                </div>
              )}
            </motion.div>

            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex gap-2">
                <button
                  onClick={clearAlert}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#FF7C3F] via-[#FF4C7D] to-[#A24CFF] text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Dispensar
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
