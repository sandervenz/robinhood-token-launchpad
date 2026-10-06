import { Abi, Address } from 'viem';
import launchFactoryAbiJson from '@/lib/abis/LaunchFactory.json';
import bondingCurveAbiJson from '@/lib/abis/BondingCurve.json';
import launcherTokenAbiJson from '@/lib/abis/LauncherToken.json';

export const LAUNCH_FACTORY_ADDRESS: Address = '0x533cE670f1372cb402D49866608b92e7bc2b4493';
export const MULTICALL3_ADDRESS: Address = '0xcA11bde05977b3631167028862bE2a173976CA11';
export const FACTORY_DEPLOY_BLOCK = BigInt(129157568);

export const LAUNCH_FACTORY_ABI = launchFactoryAbiJson as unknown as Abi;
export const BONDING_CURVE_ABI = bondingCurveAbiJson as unknown as Abi;
export const LAUNCHER_TOKEN_ABI = launcherTokenAbiJson as unknown as Abi;
