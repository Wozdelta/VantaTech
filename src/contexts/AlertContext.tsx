import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextData {
  showAlert: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const showAlert = (opts: AlertOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolver) resolver(value);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => handleClose(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl transform transition-all scale-100 opacity-100 flex flex-col items-center text-center">
            
            {/* Icon */}
            <div className="mb-4">
              {(!options.type || options.type === 'info') && <Info className="w-12 h-12 text-blue-500" />}
              {options.type === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
              {options.type === 'warning' && <AlertTriangle className="w-12 h-12 text-orange-500" />}
              {options.type === 'error' && <X className="w-12 h-12 text-red-500" />}
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {options.title || (options.showConfirm ? 'Confirmação' : 'Aviso')}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {options.message}
            </p>

            <div className="flex justify-center gap-3 w-full">
              {options.showConfirm && (
                <button 
                  onClick={() => handleClose(false)} 
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  {options.cancelText || 'Cancelar'}
                </button>
              )}
              <button 
                onClick={() => handleClose(true)} 
                className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  options.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' :
                  options.type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' :
                  options.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' :
                  'bg-vanta-blue hover:bg-blue-700 shadow-blue-500/30'
                }`}
              >
                {options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
