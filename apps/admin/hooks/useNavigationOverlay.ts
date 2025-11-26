"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useLoading } from "@/context/LoadingContext";

type MaybePromise<T> = T | Promise<T>;

const isPromise = <T,>(value: MaybePromise<T>): value is Promise<T> => {
  return !!value && typeof (value as Promise<T>).then === "function";
};

type RouterInstance = ReturnType<typeof useRouter>;
type PushOptions = Parameters<RouterInstance["push"]>[1];
type ReplaceOptions = Parameters<RouterInstance["replace"]>[1];

export function useNavigationOverlay() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const { t } = useTranslation();

  const runWithOverlay = useCallback(
    <T,>(action: () => MaybePromise<T>) => {
      showLoading(t("common.message.loading", { defaultValue: "กำลังโหลด..." }));
      try {
        const result = action();
        if (isPromise(result)) {
          return result.catch((error) => {
            hideLoading();
            throw error;
          });
        }
        return result;
      } catch (error) {
        hideLoading();
        throw error;
      }
    },
    [showLoading, hideLoading, t],
  );

  const pushWithOverlay = useCallback(
    (href: string, options?: PushOptions) => {
      return runWithOverlay(() => router.push(href, options));
    },
    [router, runWithOverlay],
  );

  const replaceWithOverlay = useCallback(
    (href: string, options?: ReplaceOptions) => {
      return runWithOverlay(() => router.replace(href, options));
    },
    [router, runWithOverlay],
  );

  return {
    pushWithOverlay,
    replaceWithOverlay,
  };
}

