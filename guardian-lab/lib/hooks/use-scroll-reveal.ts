"use client";

import { type RefObject, useEffect, useRef } from "react";

type Options = {
  selector: string;
  revealedAttribute: string;
  reducedMotion: boolean;
  observeChanges?: boolean;
};

export function useScrollReveal<T extends HTMLElement>(
  rootRef: RefObject<T | null>,
  { selector, revealedAttribute, reducedMotion, observeChanges = false }: Options,
) {
  const revealed = useRef(new WeakSet<HTMLElement>());
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || typeof IntersectionObserver === "undefined") return;
    const waiting = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
          const element = entry.target;
          if (element.closest('[aria-busy="true"], [data-motion-skip]')) {
            waiting.delete(element);
            observer.unobserve(element);
            continue;
          }
          revealed.current.add(element);
          element.setAttribute(revealedAttribute, "true");
          waiting.delete(element);
          observer.unobserve(element);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -28px 0px" },
    );
    function register(element: HTMLElement, initial: boolean) {
      if (
        revealed.current.has(element) ||
        waiting.has(element) ||
        element.parentElement?.closest(selector) ||
        element.closest('[aria-busy="true"], [data-motion-skip]')
      )
        return;
      const rect = element.getBoundingClientRect();
      if (initial && rect.bottom > 0 && rect.top < window.innerHeight) {
        revealed.current.add(element);
        return;
      }
      waiting.add(element);
      observer.observe(element);
    }
    for (const element of root.querySelectorAll<HTMLElement>(selector)) register(element, true);
    const mutations =
      observeChanges && typeof MutationObserver !== "undefined"
        ? new MutationObserver((records) => {
            for (const record of records) {
              if (record.type === "attributes" && record.target instanceof HTMLElement) {
                const parent = record.target.closest<HTMLElement>(selector);
                if (parent && root.contains(parent)) register(parent, false);
                for (const element of record.target.querySelectorAll<HTMLElement>(selector))
                  register(element, false);
                continue;
              }
              for (const node of record.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                const parent = node.closest<HTMLElement>(selector);
                if (parent && root.contains(parent)) register(parent, false);
                for (const element of node.querySelectorAll<HTMLElement>(selector))
                  register(element, false);
              }
              for (const node of record.removedNodes) {
                if (!(node instanceof HTMLElement)) continue;
                for (const element of waiting) {
                  if ((node === element || node.contains(element)) && !root.contains(element)) {
                    observer.unobserve(element);
                    waiting.delete(element);
                  }
                }
              }
            }
          })
        : null;
    mutations?.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-busy"],
    });
    return () => {
      observer.disconnect();
      mutations?.disconnect();
      waiting.clear();
      for (const element of root.querySelectorAll(selector))
        element.removeAttribute(revealedAttribute);
    };
  }, [rootRef, selector, revealedAttribute, reducedMotion, observeChanges]);
}
