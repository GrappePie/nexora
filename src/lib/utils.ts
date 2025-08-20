// Utility helpers for className merging
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasRole(
  roles: string[] | undefined,
  required: string | string[],
): boolean {
  const list = Array.isArray(required) ? required : [required];
  return Array.isArray(roles) && list.some((r) => roles.includes(r));
}

