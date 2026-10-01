import { Alert as RNAlert, Platform } from 'react-native';

/**
 * Drop-in replacement for React Native's Alert.
 * react-native-web's Alert.alert is a no-op, so on web we fall back to the
 * browser's alert/confirm dialogs and still run the button callbacks.
 */
const webAlert = (title, message, buttons) => {
  const text = [title, message].filter(Boolean).join('\n\n');
  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }
  const cancel = buttons.find((b) => b.style === 'cancel');
  const actions = buttons.filter((b) => b !== cancel);

  if (actions.length === 0) {
    window.alert(text);
    cancel?.onPress?.();
  } else if (buttons.length === 1) {
    window.alert(text);
    actions[0].onPress?.();
  } else if (window.confirm(text)) {
    // Confirm runs the main (last non-cancel) action
    actions[actions.length - 1].onPress?.();
  } else {
    cancel?.onPress?.();
  }
};

export const Alert = {
  alert: (title, message, buttons, options) => {
    if (Platform.OS === 'web') webAlert(title, message, buttons);
    else RNAlert.alert(title, message, buttons, options);
  },
};

export default Alert;
