const SUB_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

function toSubscript(num: number): string {
  return num
    .toString()
    .split('')
    .map((ch) => SUB_DIGITS[parseInt(ch, 10)] || ch)
    .join('');
}

/**
 * Format spot price (quoteReserve / tokenReserve)
 * Menampilkan format ramah pembaca untuk angka sangat kecil (misal 0.0₅1234)
 * Menjamin tidak pernah menampilkan 0.00 jika nilai > 0
 */
export function formatSpotPrice(quoteReserve: bigint, tokenReserve: bigint): string {
  if (tokenReserve === BigInt(0)) {
    return 'Graduated';
  }
  if (quoteReserve === BigInt(0)) {
    return '0';
  }

  // Harga = quoteReserve / tokenReserve dalam ETH per token
  // Hitung menggunakan floating point berpresisi tinggi
  const quote = Number(quoteReserve);
  const token = Number(tokenReserve);
  const price = quote / token;

  if (price === 0) {
    return '< 0.0₁₈1';
  }

  // Jika harga >= 0.001
  if (price >= 0.001) {
    return price.toFixed(6);
  }

  // Ubah ke representasi string desimal biasa (bukan scientific)
  const fullStr = price.toFixed(20);
  const match = fullStr.match(/^0\.(0+)([1-9]\d*)/);

  if (match) {
    const zeroCount = match[1].length;
    const sigDigits = match[2].slice(0, 4); // Ambil 4 angka signifikan

    if (zeroCount >= 4) {
      return `0.0${toSubscript(zeroCount)}${sigDigits}`;
    } else {
      return price.toFixed(zeroCount + 4);
    }
  }

  return price.toExponential(4);
}

/**
 * Hitung progress graduation dengan BigInt basis poin
 */
export function calculateGraduationProgress(
  realQuoteReserve: bigint,
  graduationThreshold: bigint,
  phase: number
): { bps: bigint; percent: number } {
  // Jika sudah phase 2 (graduated), 100%
  if (phase === 2) {
    return { bps: BigInt(10000), percent: 100 };
  }

  if (graduationThreshold <= BigInt(0)) {
    return { bps: BigInt(0), percent: 0 };
  }

  let bps = (realQuoteReserve * BigInt(10000)) / graduationThreshold;
  if (bps > BigInt(10000)) {
    bps = BigInt(10000);
  }

  const percent = Math.min(100, Math.max(0, Number(bps) / 100));
  return { bps, percent };
}

/**
 * Rumus kurva bonding untuk estimasi pembelian token
 * fee = quoteIn * feeBps / 10000
 * creatorTax = quoteIn * creatorTaxBps / 10000
 * net = quoteIn - fee - creatorTax
 * tokensOut = net * tokenReserve / (quoteReserve + net)
 */
export function calculateCurveBuyQuote({
  quoteIn,
  quoteReserve,
  tokenReserve,
  feeBps = BigInt(100),
  creatorTaxBps = BigInt(0),
  slippageBps = BigInt(100), // Default 1% (100 bps)
}: {
  quoteIn: bigint;
  quoteReserve: bigint;
  tokenReserve: bigint;
  feeBps?: bigint;
  creatorTaxBps?: bigint;
  slippageBps?: bigint;
}): {
  fee: bigint;
  creatorTax: bigint;
  net: bigint;
  tokensOut: bigint;
  minTokensOut: bigint;
} {
  if (quoteIn <= BigInt(0) || tokenReserve <= BigInt(0)) {
    return {
      fee: BigInt(0),
      creatorTax: BigInt(0),
      net: BigInt(0),
      tokensOut: BigInt(0),
      minTokensOut: BigInt(0),
    };
  }

  const fee = (quoteIn * feeBps) / BigInt(10000);
  const creatorTax = (quoteIn * creatorTaxBps) / BigInt(10000);
  const net = quoteIn - fee - creatorTax;

  if (net <= BigInt(0)) {
    return {
      fee,
      creatorTax,
      net: BigInt(0),
      tokensOut: BigInt(0),
      minTokensOut: BigInt(0),
    };
  }

  const tokensOut = (net * tokenReserve) / (quoteReserve + net);
  const minTokensOut = (tokensOut * (BigInt(10000) - slippageBps)) / BigInt(10000);

  return {
    fee,
    creatorTax,
    net,
    tokensOut,
    minTokensOut,
  };
}
