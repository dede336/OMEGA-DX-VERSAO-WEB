import React, { forwardRef, useSyncExternalStore } from 'react';
import {
  Text as NativeText, TextInput as NativeTextInput, Alert as NativeAlert,
  type TextProps, type TextInputProps,
} from 'react-native';
import {
  getDisplayLanguage, subscribeDisplayLanguage, localizeText,
} from '@/utils/displayLocalization';

/** Adjacent JSX strings and interpolated numbers form one message/template. */
export function localizeChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') return localizeText(children);
  if (!Array.isArray(children)) return children;
  const result: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flush = () => {
    if (!run.length) return;
    const source = run.join('');
    const localized = localizeText(source);
    if (localized !== source) result.push(localized);
    else result.push(...run.map(child => typeof child === 'string' ? localizeText(child) : child));
    run = [];
  };
  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') run.push(child);
    else { flush(); result.push(Array.isArray(child) ? localizeChildren(child) : child); }
  }
  flush();
  return result;
}
export const Text = forwardRef<React.ComponentRef<typeof NativeText>, TextProps & { localize?: boolean }>(
  function LocalizedText({ children, localize = true, accessibilityLabel, accessibilityHint, ...props }, ref) {
    useSyncExternalStore(subscribeDisplayLanguage, getDisplayLanguage, getDisplayLanguage);
    return <NativeText {...props} ref={ref}
      accessibilityLabel={localize && accessibilityLabel ? localizeText(accessibilityLabel) : accessibilityLabel}
      accessibilityHint={localize && accessibilityHint ? localizeText(accessibilityHint) : accessibilityHint}>
      {localize ? localizeChildren(children) : children}
    </NativeText>;
  },
);
export const TextInput = forwardRef<React.ComponentRef<typeof NativeTextInput>, TextInputProps>(
  function LocalizedTextInput({ placeholder, accessibilityLabel, accessibilityHint, ...props }, ref) {
    useSyncExternalStore(subscribeDisplayLanguage, getDisplayLanguage, getDisplayLanguage);
    // value/defaultValue and onChangeText are deliberately passed through unchanged.
    return <NativeTextInput {...props} ref={ref}
      placeholder={placeholder ? localizeText(placeholder) : placeholder}
      accessibilityLabel={accessibilityLabel ? localizeText(accessibilityLabel) : accessibilityLabel}
      accessibilityHint={accessibilityHint ? localizeText(accessibilityHint) : accessibilityHint} />;
  },
);
export const Alert: typeof NativeAlert = {
  ...NativeAlert,
  alert(title, message, buttons, options) {
    NativeAlert.alert(localizeText(title), message ? localizeText(message) : message,
      buttons?.map(button => ({ ...button, text: button.text ? localizeText(button.text) : button.text })), options);
  },
  prompt(title, message, callbackOrButtons, type, defaultValue, keyboardType, options) {
    NativeAlert.prompt(localizeText(title), message ? localizeText(message) : message,
      Array.isArray(callbackOrButtons)
        ? callbackOrButtons.map(button => ({ ...button, text: button.text ? localizeText(button.text) : button.text }))
        : callbackOrButtons,
      type, defaultValue, keyboardType, options);
  },
};
