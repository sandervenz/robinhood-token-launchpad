import { BaseError, ContractFunctionRevertedError } from 'viem';

export interface ParsedTxError {
  type: 'rejected' | 'slippage' | 'graduated' | 'insufficient' | 'revert' | 'unknown';
  message: string;
}

export function parseTransactionError(error: any): ParsedTxError {
  if (!error) return { type: 'unknown', message: 'An unknown error occurred.' };

  const message = error.message || String(error);

  // 1. User rejection in wallet
  if (
    error.code === 4001 ||
    error.name === 'UserRejectedRequestError' ||
    message.includes('User rejected') ||
    message.includes('User denied') ||
    message.includes('rejected the request')
  ) {
    return {
      type: 'rejected',
      message: 'Transaksi ditolak oleh user di wallet.',
    };
  }

  // 2. Viem ContractFunctionRevertedError check
  if (error instanceof BaseError) {
    const revertError = error.walk(
      (e) => e instanceof ContractFunctionRevertedError
    ) as ContractFunctionRevertedError | undefined;

    if (revertError?.data?.errorName) {
      if (revertError.data.errorName === 'SlippageExceeded') {
        return {
          type: 'slippage',
          message: 'Slippage Exceeded: Pergerakan harga melebihi batas toleransi slippage yang Anda tentukan. Coba naikkan toleransi slippage.',
        };
      }
      if (revertError.data.errorName === 'CurveGraduated') {
        return {
          type: 'graduated',
          message: 'Curve Graduated: Token ini sudah menyelesaikan bonding curve dan telah graduate ke Uniswap v4.',
        };
      }
      return {
        type: 'revert',
        message: `Transaksi revert: ${revertError.data.errorName}`,
      };
    }
  }

  // 3. String-based fallback detection
  if (message.includes('SlippageExceeded')) {
    return {
      type: 'slippage',
      message: 'Slippage Exceeded: Pergerakan harga melebihi batas toleransi slippage Anda.',
    };
  }

  if (message.includes('CurveGraduated')) {
    return {
      type: 'graduated',
      message: 'Curve Graduated: Token ini sudah graduate dan tidak lagi dijual di curve.',
    };
  }

  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return {
      type: 'insufficient',
      message: 'Saldo ETH tidak mencukupi untuk jumlah pembelian dan gas fee transaksi.',
    };
  }

  return {
    type: 'revert',
    message: error.shortMessage || error.message || 'Transaksi gagal dieksekusi di smart contract.',
  };
}
