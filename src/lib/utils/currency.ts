/**
 * Currency formatting utilities for Leuzien (IDR).
 */

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number): string {
  return IDR.format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}
