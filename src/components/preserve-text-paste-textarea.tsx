"use client";

import type { TextareaHTMLAttributes } from "react";

function textFromWordHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const blocks = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"]);
  let text = "";

  function visit(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || "";
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    if (node.tagName === "BR") {
      text += "\n";
      return;
    }

    const isListItem = node.tagName === "LI";
    const isBlock = blocks.has(node.tagName) || isListItem;
    if (isBlock && text && !text.endsWith("\n")) text += "\n";
    if (isListItem) text += "• ";
    node.childNodes.forEach(visit);
    if (isBlock && !text.endsWith("\n")) text += "\n";
  }

  document.body.childNodes.forEach(visit);
  return text;
}

function normalize(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function PreserveTextPasteTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      onPaste={(event) => {
        props.onPaste?.(event);
        if (event.defaultPrevented) return;

        const html = event.clipboardData.getData("text/html");
        const pastedText = normalize(html ? textFromWordHtml(html) : event.clipboardData.getData("text/plain"));
        if (!pastedText) return;

        event.preventDefault();
        const field = event.currentTarget;
        field.setRangeText(pastedText, field.selectionStart, field.selectionEnd, "end");
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }}
    />
  );
}
