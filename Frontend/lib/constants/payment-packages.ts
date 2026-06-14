export const PAYMENT_PACKAGES = [
  { id: 'pkg_25', diamonds: 25, stars: 50 },
  { id: 'pkg_50', diamonds: 50, stars: 75 },
  { id: 'pkg_100', diamonds: 100, stars: 100 },
  { id: 'pkg_200', diamonds: 200, stars: 150 },
  { id: 'pkg_400', diamonds: 400, stars: 200 },
  { id: 'pkg_800', diamonds: 800, stars: 300 },
] as const;

export type PaymentPackageId = (typeof PAYMENT_PACKAGES)[number]['id'];

export function getPaymentPackage(packageId: string) {
  return PAYMENT_PACKAGES.find((pkg) => pkg.id === packageId) ?? null;
}
