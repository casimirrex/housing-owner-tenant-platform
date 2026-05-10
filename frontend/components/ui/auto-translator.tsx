"use client";

import { useEffect } from "react";
import { lookupTranslation, AUTO_TRANSLATE_MAP } from "@/lib/i18n/auto-translate-dictionary";
import { useLocaleStore } from "@/store/locale-store";
import type { SupportedLocale } from "@/lib/i18n/dictionary";

/**
 * Tier 3 — runtime DOM translator.
 *
 * Walks the rendered DOM and replaces any text node whose trimmed content
 * exactly matches a key in AUTO_TRANSLATE_MAP with the locale's
 * translation. Reacts to:
 *   1. Locale change (re-walk the whole document).
 *   2. New nodes added by React via MutationObserver.
 *   3. React updates to existing text (e.g. React Query data arriving).
 *
 * Critical safeguards:
 *   - Skip <script>, <style>, <noscript>, <code>, <pre>, <textarea>.
 *   - Skip elements with `data-no-translate` (escape hatch for code blocks,
 *     IDs, addresses, etc).
 *   - Track our own writes in a WeakSet so the MutationObserver can ignore
 *     them — otherwise we'd loop on every translation.
 *   - Only EXACT trimmed match — never translates user-generated content
 *     because no listing title / locality / name string lives in our
 *     dictionary.
 *   - On English locale: restore originals so the user can flip back.
 *
 * Why this approach: hand-wrapping every JSX text node in t() across 30+
 * pages is days of work. A whitelisted-content DOM translator covers the
 * same ground in one component, with the dictionary as the only thing
 * that grows over time.
 */
export function AutoTranslator() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    if (typeof document === "undefined") return;

    /** Cache of node → its original (English) text, set the first time we
     *  see the node. Used both to translate to the active locale and to
     *  restore on switch back to English. */
    const originals = new WeakMap<Text, string>();

    /** WeakSet of text nodes we are about to write to. The MutationObserver
     *  swallows the resulting characterData mutation so we don't loop. */
    const ourWrites = new WeakSet<Text>();

    const writeNodeValue = (node: Text, value: string) => {
      if (node.nodeValue === value) return;
      ourWrites.add(node);
      node.nodeValue = value;
    };

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (!parent) return;
      if (parent.closest("[data-no-translate]")) return;
      const tag = parent.tagName;
      if (
        tag === "SCRIPT" ||
        tag === "STYLE" ||
        tag === "NOSCRIPT" ||
        tag === "CODE" ||
        tag === "PRE" ||
        tag === "TEXTAREA"
      ) {
        return;
      }

      const current = node.nodeValue ?? "";
      // Cache the very first observation as the English original.
      if (!originals.has(node)) {
        originals.set(node, current);
      }
      const original = originals.get(node) ?? current;

      if (locale === "en") {
        writeNodeValue(node, original);
        return;
      }

      const translated = lookupTranslation(original, locale);
      if (translated) {
        writeNodeValue(node, translated);
      } else {
        // No translation — make sure we're showing English (might have
        // been translated to a different locale before the switch).
        writeNodeValue(node, original);
      }
    };

    /** Translate or restore <input>/<textarea> placeholders. */
    const handlePlaceholders = (root: Element | Document) => {
      const scope = root instanceof Document ? root.body : root;
      if (!scope) return;

      const els = scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[placeholder], textarea[placeholder]"
      );
      els.forEach((el) => {
        if (el.closest("[data-no-translate]")) return;
        if (el.dataset.originalPlaceholder === undefined) {
          el.dataset.originalPlaceholder = el.placeholder;
        }
        const original = el.dataset.originalPlaceholder ?? el.placeholder;
        if (locale === "en") {
          if (el.placeholder !== original) el.placeholder = original;
          return;
        }
        const translated = lookupTranslation(original, locale);
        const next = translated ?? original;
        if (el.placeholder !== next) el.placeholder = next;
      });
    };

    const walk = (root: Node) => {
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: () => NodeFilter.FILTER_ACCEPT
      });
      let current = tw.nextNode();
      while (current) {
        translateTextNode(current as Text);
        current = tw.nextNode();
      }
      if (root instanceof Element) {
        handlePlaceholders(root);
      } else if (root.nodeType === Node.DOCUMENT_NODE) {
        handlePlaceholders(root as Document);
      }
    };

    // Initial sweep (post-hydration).
    walk(document.body);
    handlePlaceholders(document);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          const node = m.target as Text;
          // Ignore our own write — already translated.
          if (ourWrites.has(node)) {
            ourWrites.delete(node);
            continue;
          }
          // React touched it — treat as a fresh original and re-translate.
          originals.delete(node);
          translateTextNode(node);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              translateTextNode(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              walk(node);
            }
          });
        } else if (m.type === "attributes" && m.attributeName === "placeholder") {
          if (m.target instanceof Element) {
            handlePlaceholders(m.target.parentElement ?? document.body);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder"]
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}

/** Dev sanity: count of dictionary entries. Not used in production. */
export function dictionaryEntryCount() {
  return Object.keys(AUTO_TRANSLATE_MAP).length;
}

export type { SupportedLocale };
