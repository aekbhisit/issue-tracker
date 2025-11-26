"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useLoading } from "@/context/LoadingContext";

const isSameOriginLink = (anchor: HTMLAnchorElement) => {
  if (!anchor.href) return false
  try {
    const url = new URL(anchor.href)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

const isDifferentLocation = (target?: string | URL | null) => {
  if (!target) return false
  try {
    const current = new URL(window.location.href)
    const resolved =
      typeof target === "string"
        ? new URL(target, window.location.href)
        : target instanceof URL
          ? target
          : new URL(String(target), window.location.href)
    return resolved.href !== current.href
  } catch {
    return false
  }
}

export function usePageLoadLoading() {
  const { showLoading, hideLoading } = useLoading();
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString();

  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedInitialLoad = useRef(false);

  const clearOverlayTimeout = useCallback(() => {
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }
  }, []);

  const showOverlay = useCallback(() => {
    clearOverlayTimeout();
    overlayTimeoutRef.current = setTimeout(() => {
      showLoading(t("common.message.loading", { defaultValue: "กำลังโหลด..." }));
    }, 60);
  }, [showLoading, t, clearOverlayTimeout]);

  const hideOverlay = useCallback(() => {
    clearOverlayTimeout();
    hideLoading();
  }, [hideLoading, clearOverlayTimeout]);

  useEffect(() => {
    // Initial page load
    showOverlay();

    const handleLoad = () => {
      setTimeout(() => {
        hideOverlay();
        hasCompletedInitialLoad.current = true;
      }, 200);
    };

    const handleBeforeUnload = () => {
      showOverlay();
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showOverlay, hideOverlay]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const anchor = event.target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (
        anchor.hasAttribute("data-overlay-skip") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (!isSameOriginLink(anchor)) {
        return;
      }

      if (hasCompletedInitialLoad.current && isDifferentLocation(anchor.href)) {
        showOverlay();
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [showOverlay]);

  useEffect(() => {
    // Imperative navigation via history API (router.push/replace)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistoryMethod = (
      original: typeof window.history.pushState,
    ): typeof window.history.pushState => {
      return function wrappedHistoryMethod(this: History, ...args) {
        const targetUrl = args[2]
        if (hasCompletedInitialLoad.current && isDifferentLocation(targetUrl)) {
          showOverlay();
        }
        return original.apply(this, args);
      };
    };

    window.history.pushState = wrapHistoryMethod(originalPushState);
    window.history.replaceState = wrapHistoryMethod(originalReplaceState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [showOverlay]);

  useEffect(() => {
    // Hide overlay when route actually changes (includes sidebar clicks & router.push)
    if (hasCompletedInitialLoad.current) {
      hideOverlay();
    }
  }, [pathname, searchKey, hideOverlay]);
}
