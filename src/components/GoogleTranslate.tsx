import { useEffect } from "react";

interface GoogleTranslateElementConstructor {
  new (
    options: {
      pageLanguage: string;
      includedLanguages: string;
      autoDisplay: boolean;
      layout: unknown;
    },
    elementId: string,
  ): unknown;
  InlineLayout: {
    SIMPLE: unknown;
  };
}

interface GoogleNamespace {
  translate?: {
    TranslateElement: GoogleTranslateElementConstructor;
  };
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: GoogleNamespace;
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "it",
          includedLanguages: "it,en,fr,de",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element",
      );
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className="google-translate-wrapper">
      <div id="google_translate_element" />
    </div>
  );
}
