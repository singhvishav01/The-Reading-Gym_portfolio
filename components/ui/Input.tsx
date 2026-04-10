import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Radii, FontSize, Spacing } from '../../lib/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, ...rest }, ref) => {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          ref={ref}
          style={[styles.input, error ? styles.inputError : null, style]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.accent}
          {...rest}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);
Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: FontSize.md,
    height: 50,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
